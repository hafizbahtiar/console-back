import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AuthModule } from './modules/auth/auth.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { UploadModule } from './modules/upload/upload.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RedisModule } from './modules/redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';
import { AdminModule } from './modules/admin/admin.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { getProcessType, isApiProcess, isWorkerProcess, isSchedulerProcess } from './utils/process-type.util';

// Load .env file manually before ConfigModule (ensures it's available)
// ConfigModule will also load it, but this ensures it's available for the load function
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLocalPath, override: false });
dotenv.config({ path: envPath, override: false });

// Determine process type for conditional module loading
const processType = getProcessType();

// Build imports array conditionally based on process type
const buildImports = () => {
  const imports: any[] = [
    // Configuration (always needed)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
      expandVariables: true,
      validate: (config: Record<string, unknown>) => {
        // Import validate function dynamically to avoid circular dependencies
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { validate } = require('./config/env.validation');
        return validate(process.env as Record<string, unknown>);
      },
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Database (always needed)
    DatabaseModule,

    // Redis (needed for queues and caching)
    RedisModule,
  ];

  // Queue System - only load in API and Worker processes
  if (isApiProcess() || isWorkerProcess()) {
    imports.push(QueueModule);
  }

  // Scheduler - only load in API and Scheduler processes
  if (isApiProcess() || isSchedulerProcess()) {
    imports.push(SchedulerModule);
    // AdminModule is needed in scheduler process for CronJobTrackerService
    // Also needed in API process for admin endpoints
    imports.push(AdminModule);
  }

  // Common Services (always needed)
  imports.push(CommonModule);

  // Rate Limiting - only needed for API server
  if (isApiProcess()) {
    imports.push(
      ThrottlerModule.forRootAsync({
        imports: [ConfigModule, RedisModule],
        inject: [ConfigService, 'REDIS_CLIENT'],
        useFactory: (configService: ConfigService, redisClient: any) => {
          const { ThrottlerRedisStorage } = require('./common/storage/throttler-redis.storage');
          const storage = new ThrottlerRedisStorage(redisClient);

          return {
            throttlers: [
              {
                ttl: 60000, // 1 minute
                limit: 10, // 10 requests per minute
              },
            ],
            storage,
          };
        },
      }),
    );
  }

  // Feature Modules - only load in API process
  if (isApiProcess()) {
    imports.push(
      UsersModule,
      AccountsModule,
      SessionsModule,
      AuthModule,
      PortfolioModule,
      UploadModule,
      SettingsModule,
      NotificationsModule,
      // AdminModule already loaded above for both API and Scheduler processes
      WebSocketModule,
    );
  }

  return imports;
};

@Module({
  imports: buildImports(),
  controllers: isApiProcess() ? [AppController] : [],
  providers: [
    AppService,
    // Rate limiting guard - only for API process
    ...(isApiProcess()
      ? [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ]
      : []),
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);

  constructor() {
    this.logger.log(`📋 AppModule initialized for process type: ${processType}`);

    if (isApiProcess()) {
      this.logger.log('✅ API server modules loaded');
    }
    if (isWorkerProcess()) {
      this.logger.log('✅ Worker modules loaded (queue processors active)');
    }
    if (isSchedulerProcess()) {
      this.logger.log('✅ Scheduler modules loaded (cron jobs active)');
    }
  }
}

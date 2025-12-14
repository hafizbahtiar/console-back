import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Config } from './config/config.interface';
import { getProcessType, isApiProcess } from './utils/process-type.util';
import { getHelmetConfig } from './config/helmet.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Global app reference for services (set after creation)

/**
 * API Server Entry Point
 * 
 * This process handles:
 * - HTTP API endpoints
 * - WebSocket connections
 * - Request handling
 * 
 * Run with: PROCESS_TYPE=api node dist/main.js (or default)
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Verify this is the API process
  if (!isApiProcess()) {
    logger.error(`❌ This entry point is for API server only. Current process type: ${getProcessType()}`);
    logger.error('   Use worker.main.ts for workers or scheduler.main.ts for schedulers');
    process.exit(1);
  }

  logger.log(`📋 Process type: ${getProcessType()}`);

  logger.log('🚀 Starting application...');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  globalThis.globalApp = app;

  const configService = app.get(ConfigService<Config>);

  // Configure CORS EARLY - before routes are registered
  const corsConfig = configService.get('cors', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const allowedOrigins = corsConfig?.origin || [];

  // Configure CORS with optimized settings
  app.enableCors({
    origin: allowedOrigins,
    credentials: corsConfig?.credentials ?? true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: corsConfig?.preflightMaxAge || 86400,
    optionsSuccessStatus: 204,
  });

  logger.log(`🌐 CORS configured for ${Array.isArray(allowedOrigins) ? allowedOrigins.length : 1} origin(s)`);
  if (nodeEnv === 'development' && Array.isArray(allowedOrigins)) {
    logger.debug(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  }

  // Set global prefix BEFORE initializing (so routes are registered with the prefix)
  app.setGlobalPrefix('api/v1');

  // Initialize the app to run all onModuleInit hooks (ensures services like BullBoardService are setup)
  await app.init();

  // Configure WebSocket adapter (Socket.IO)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Wait for MongooseModule's connection (configured in database.module.ts)
  // MongooseModule connects lazily, so we need to trigger it
  const mongoose = await import('mongoose');
  const connection = mongoose.default.connection;
  const configUri = configService.get('mongodb.uri', { infer: true });

  if (!configUri) {
    throw new Error('MONGODB_URI is not defined in configuration');
  }

  // Wait for connection if not already connected
  // connectionFactory in database.module.ts handles logging
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  let currentState = connection.readyState;

  if (currentState !== 1) {
    logger.log('⏳ Waiting for database connection...');

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        connection.removeAllListeners('connected');
        connection.removeAllListeners('error');
        const state = connectionStates[connection.readyState] || 'unknown';
        reject(
          new Error(
            `Database connection timeout after 30 seconds. Current state: ${state} (${connection.readyState}). ` +
            `Please check if MongoDB is running.`,
          ),
        );
      }, 30000);

      // Set up listeners FIRST before triggering connection
      connection.once('connected', () => {
        clearTimeout(timeout);
        connection.removeAllListeners('error');
        logger.log(`✅ Database connection ready: ${connection.name}`);
        resolve();
      });

      connection.once('error', (error) => {
        clearTimeout(timeout);
        connection.removeAllListeners('connected');
        logger.error(`❌ Database connection error: ${error.message}`);
        reject(error);
      });

      // Force connection if disconnected (MongooseModule configured it, we just trigger it)
      if (currentState === 0) {
        // Use the same URI that MongooseModule configured
        mongoose.default.connect(configUri).catch((err) => {
          // Connection error will be caught by the 'error' event listener above
          logger.error(`Connection attempt failed: ${err.message}`);
        });
      }
    });
  } else {
    logger.log(`✅ Database already connected: ${connection.name}`);
  }

  // Validate origins in production
  if (nodeEnv === 'production' && (!allowedOrigins || (Array.isArray(allowedOrigins) && allowedOrigins.length === 0))) {
    logger.warn(
      '⚠️  WARNING: No CORS origins configured in production. Set CORS_ORIGIN environment variable.',
    );
  }

  // Security Headers - After CORS
  // Configure Helmet with environment-specific settings
  const helmetConfig = getHelmetConfig(configService);
  app.use(helmet(helmetConfig));

  logger.log(`🛡️  Security headers configured (${nodeEnv} environment)`);

  // Bull Board router is handled by NestJS controller route @All('queues/*')
  // The authentication is handled by JwtAuthGuard which supports query parameters
  // No need to mount as Express middleware since NestJS routes handle it

  // Global Exception Filter - Must be registered before other middleware
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTOs
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Validation errors will be caught and formatted by HttpExceptionFilter
    }),
  );

  // Serve static files from uploads directory
  const uploadConfig = configService.get('upload', { infer: true });
  if (uploadConfig?.storagePath) {
    const uploadsPath = join(process.cwd(), uploadConfig.storagePath);
    app.useStaticAssets(uploadsPath, {
      prefix: '/api/v1/uploads/',
    });
    logger.log(`📁 Serving static files from: ${uploadsPath}`);
  }

  const port = configService.get('port', { infer: true }) || 8000;  // Set to 8000 to match frontend
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
  logger.log(`📊 Queue Dashboard: http://localhost:${port}/api/v1/admin/queues (requires authentication)`);
  logger.log(`🔌 WebSocket server ready (Socket.IO)`);
}

bootstrap();

import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from '../config/config.interface';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Config>) => {
        const logger = new Logger('DatabaseModule');

        // Get URI from config service (from configuration.ts)
        const uri = configService.get('mongodb.uri', { infer: true });

        // Also check process.env directly as fallback
        const envUri = process.env.MONGODB_URI;
        const finalUri = uri || envUri;

        if (!finalUri) {
          throw new Error(
            'MONGODB_URI is not defined in environment variables',
          );
        }

        logger.log('🔄 Connecting to MongoDB...');

        return {
          uri: finalUri,
          // Connection options
          retryWrites: true,
          w: 'majority',
          // Connection pool options
          maxPoolSize: 10,
          minPoolSize: 2,
          // Timeout options
          serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000, // Connection timeout
          // Other options
          autoIndex: true, // Don't build indexes in production
          autoCreate: true, // Auto create collections
          // Connection event listeners
          connectionFactory: (connection) => {
            const dbLogger = new Logger('MongoDB');

            connection.on('connected', () => {
              dbLogger.log(
                `✅ Successfully connected to MongoDB: ${connection.name}`,
              );
            });

            connection.on('error', (error) => {
              dbLogger.error(
                `❌ MongoDB connection error: ${error.message}`,
                error.stack,
              );
            });

            connection.on('disconnected', () => {
              dbLogger.warn('⚠️  MongoDB disconnected');
            });

            connection.on('reconnected', () => {
              dbLogger.log(`🔄 MongoDB reconnected: ${connection.name}`);
            });

            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

import { plainToInstance } from 'class-transformer';
import {
    IsEnum,
    IsNumber,
    IsString,
    Min,
    Max,
    validateSync,
    IsOptional,
    IsIn,
} from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsNumber()
    @Min(1)
    @Max(65535)
    @IsOptional()
    PORT?: number;

    @IsEnum(Environment)
    @IsOptional()
    NODE_ENV?: Environment;

    @IsString()
    @IsOptional()
    MONGODB_URI?: string;

    @IsString()
    @IsOptional()
    JWT_ACCESS_SECRET?: string;

    @IsString()
    @IsOptional()
    JWT_REFRESH_SECRET?: string;

    @IsString()
    @IsOptional()
    JWT_ACCESS_TOKEN_EXPIRATION?: string;

    @IsString()
    @IsOptional()
    JWT_REFRESH_TOKEN_EXPIRATION?: string;

    @IsString()
    @IsOptional()
    CORS_ORIGIN?: string;

    @IsNumber()
    @Min(1024)
    @IsOptional()
    ARGON2_MEMORY_COST?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    ARGON2_TIME_COST?: number;

    @IsNumber()
    @Min(1)
    @Max(16)
    @IsOptional()
    ARGON2_PARALLELISM?: number;

    @IsNumber()
    @Min(1024)
    @IsOptional()
    MAX_FILE_SIZE?: number;

    @IsNumber()
    @Min(1024)
    @IsOptional()
    MAX_IMAGE_SIZE?: number;

    @IsString()
    @IsOptional()
    UPLOAD_STORAGE_PATH?: string;

    @IsString()
    @IsOptional()
    UPLOAD_PUBLIC_URL?: string;

    // OCR Configuration
    @IsString()
    @IsOptional()
    @IsIn(['true', 'false'])
    OCR_ENABLED?: string;

    @IsString()
    @IsOptional()
    OCR_LANGUAGE?: string;

    @IsNumber()
    @Min(500)
    @Max(5000)
    @IsOptional()
    OCR_RESIZE_WIDTH?: number;

    @IsString()
    @IsOptional()
    @IsIn(['true', 'false'])
    OCR_GRAYSCALE?: string;

    @IsString()
    @IsOptional()
    @IsIn(['true', 'false'])
    OCR_NORMALIZE?: string;

    @IsString()
    @IsOptional()
    @IsIn(['true', 'false'])
    OCR_SHARPEN?: string;

    @IsNumber()
    @Min(0)
    @Max(255)
    @IsOptional()
    OCR_THRESHOLD?: number;

    // CORS Configuration (CORS_ORIGIN already defined above)
    @IsString()
    @IsOptional()
    CORS_CREDENTIALS?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    CORS_PREFLIGHT_MAX_AGE?: number;

    // Redis Configuration
    @IsString()
    @IsOptional()
    REDIS_HOST?: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    @IsOptional()
    REDIS_PORT?: number;

    @IsString()
    @IsOptional()
    REDIS_PASSWORD?: string;

    @IsNumber()
    @Min(0)
    @Max(15)
    @IsOptional()
    REDIS_DB?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    REDIS_RETRY_DELAY?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    REDIS_MAX_RETRIES?: number;

    @IsString()
    @IsOptional()
    REDIS_ENABLE_READY_CHECK?: string;

    @IsString()
    @IsOptional()
    REDIS_ENABLE_OFFLINE_QUEUE?: string;

    // WebSocket Configuration
    @IsNumber()
    @Min(1)
    @IsOptional()
    WS_RATE_LIMIT_PER_MINUTE?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    WS_RATE_LIMIT_PER_HOUR?: number;

    // Scheduler Configuration
    @IsString()
    @IsOptional()
    SCHEDULER_SAMPLE_JOB_ENABLED?: string;

    @IsString()
    @IsOptional()
    SCHEDULER_SESSION_CLEANUP_ENABLED?: string;

    @IsString()
    @IsOptional()
    SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD?: number;

    @IsString()
    @IsOptional()
    SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED?: string;

    @IsString()
    @IsOptional()
    SCHEDULER_DATABASE_MAINTENANCE_ENABLED?: string;

    // PM2 Configuration
    @IsString()
    @IsIn(['api', 'worker', 'scheduler'])
    @IsOptional()
    PROCESS_TYPE?: string;

    // Bull Board Configuration
    @IsString()
    @IsOptional()
    BULL_BOARD_USERNAME?: string;

    @IsString()
    @IsOptional()
    BULL_BOARD_PASSWORD?: string;
}

export function validate(config: Record<string, unknown>) {
    // Only validate required fields in production
    const isProduction = config.NODE_ENV === 'production';

    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: !isProduction, // Skip missing in dev, enforce in prod
        skipNullProperties: true,
        skipUndefinedProperties: true,
    });

    if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
            const property = error.property;
            const constraints = Object.values(error.constraints || {}).join(', ');
            return `${property}: ${constraints}`;
        });
        throw new Error(
            `Environment validation failed:\n${errorMessages.join('\n')}`,
        );
    }

    // Additional production checks
    if (isProduction) {
        const requiredFields = [
            'MONGODB_URI',
            'JWT_ACCESS_SECRET',
            'JWT_REFRESH_SECRET',
        ];
        const missingFields = requiredFields.filter(
            (field) =>
                !config[field] ||
                (typeof config[field] === 'string' && config[field].trim() === ''),
        );

        if (missingFields.length > 0) {
            throw new Error(
                `Missing required environment variables in production: ${missingFields.join(', ')}`,
            );
        }
    }

    return validatedConfig;
}

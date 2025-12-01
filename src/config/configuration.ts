export default () => {
    // Validate required environment variables
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
    ];
    const missingVars = requiredEnvVars.filter(
        (varName) => !process.env[varName],
    );

    if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}`,
        );
    }

    return {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
        mongodb: {
            uri:
                process.env.MONGODB_URI ||
                (process.env.NODE_ENV === 'production'
                    ? (() => {
                        throw new Error('MONGODB_URI is required in production');
                    })()
                    : 'mongodb://localhost:27017/console'),
        },
        jwt: {
            accessSecret:
                process.env.JWT_ACCESS_SECRET ||
                (process.env.NODE_ENV === 'production'
                    ? (() => {
                        throw new Error('JWT_ACCESS_SECRET is required in production');
                    })()
                    : 'your-access-secret-key-change-in-production'),
            refreshSecret:
                process.env.JWT_REFRESH_SECRET ||
                (process.env.NODE_ENV === 'production'
                    ? (() => {
                        throw new Error('JWT_REFRESH_SECRET is required in production');
                    })()
                    : 'your-refresh-secret-key-change-in-production'),
            accessExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
            refreshExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
        },
        cors: {
            origin: (() => {
                const corsOrigin = process.env.CORS_ORIGIN;
                if (!corsOrigin) {
                    // Default origins based on environment
                    if (process.env.NODE_ENV === 'production') {
                        return []; // Production should explicitly set CORS_ORIGIN
                    }
                    // Development defaults
                    return ['http://localhost:3000', 'http://localhost:3001'];
                }
                // Support comma-separated origins
                if (corsOrigin.includes(',')) {
                    return corsOrigin.split(',').map((origin) => origin.trim());
                }
                return corsOrigin;
            })(),
            credentials: process.env.CORS_CREDENTIALS !== 'false', // Default: true
            preflightMaxAge: parseInt(process.env.CORS_PREFLIGHT_MAX_AGE || '86400', 10), // 24 hours default
        },
        argon2: {
            memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
            timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
            parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
        },
        email: {
            from: process.env.EMAIL_FROM || 'noreply@console.app',
            smtp: process.env.SMTP_HOST
                ? {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    user: process.env.SMTP_USER || '',
                    password: process.env.SMTP_PASSWORD || '',
                }
                : undefined,
        },
        frontend: {
            url: process.env.FRONTEND_URL || 'http://localhost:3000',
        },
        upload: {
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
            maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10), // 5MB default
            allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            allowedDocumentTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
            ],
            storagePath: process.env.UPLOAD_STORAGE_PATH || 'uploads',
            publicUrl: process.env.UPLOAD_PUBLIC_URL || 'http://localhost:8000/api/v1/uploads',
        },
        location: {
            enabled: process.env.LOCATION_ENABLED !== 'false', // Default: true
            apiUrl: process.env.LOCATION_API_URL || 'http://ip-api.com/json',
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0', 10),
            retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
            maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
            enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
            enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
        },
        scheduler: {
            sampleJob: {
                enabled: process.env.SCHEDULER_SAMPLE_JOB_ENABLED !== 'false', // Default: true
            },
            sessionCleanup: {
                enabled: process.env.SCHEDULER_SESSION_CLEANUP_ENABLED !== 'false', // Default: true
            },
            emailQueueMonitoring: {
                enabled: process.env.SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED !== 'false', // Default: true
                warningThreshold: parseInt(process.env.SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD || '100', 10),
            },
            accountDeletionTokenCleanup: {
                enabled: process.env.SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED !== 'false', // Default: true
            },
            databaseMaintenance: {
                enabled: process.env.SCHEDULER_DATABASE_MAINTENANCE_ENABLED === 'true', // Default: false
            },
        },
    };
};

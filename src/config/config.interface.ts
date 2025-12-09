export interface Config {
    port: number;
    nodeEnv: string;
    mongodb: {
        uri: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiration: string;
        refreshExpiration: string;
    };
    cors: {
        origin: string | string[];
        credentials: boolean;
        preflightMaxAge?: number;
    };
    argon2: {
        memoryCost: number;
        timeCost: number;
        parallelism: number;
    };
    email?: {
        from: string;
        smtp?: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            password: string;
        };
    };
    frontend?: {
        url: string;
    };
    upload?: {
        maxFileSize: number;
        maxImageSize: number;
        allowedImageTypes: string[];
        allowedDocumentTypes: string[];
        storagePath: string;
        publicUrl: string;
    };
    location?: {
        enabled: boolean;
        apiUrl?: string;
    };
    redis?: {
        host: string;
        port: number;
        password?: string;
        db?: number;
        retryDelayOnFailover?: number;
        maxRetriesPerRequest?: number;
        enableReadyCheck?: boolean;
        enableOfflineQueue?: boolean;
    };
    scheduler?: {
        sampleJob?: {
            enabled?: boolean;
        };
        sessionCleanup?: {
            enabled?: boolean;
        };
        emailQueueMonitoring?: {
            enabled?: boolean;
            warningThreshold?: number;
        };
        accountDeletionTokenCleanup?: {
            enabled?: boolean;
        };
        databaseMaintenance?: {
            enabled?: boolean;
        };
        recurringTransactionGeneration?: {
            enabled?: boolean;
        };
    };
    ocr?: {
        enabled: boolean;
        language: string;
        preprocessing?: {
            resizeWidth?: number;
            grayscale?: boolean;
            normalize?: boolean;
            sharpen?: boolean;
            threshold?: number;
        };
    };
}

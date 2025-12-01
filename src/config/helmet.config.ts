import { ConfigService } from '@nestjs/config';
import type { Config } from './config.interface';

/**
 * Helmet Configuration
 * 
 * Provides environment-specific security headers configuration.
 */
export function getHelmetConfig(configService: ConfigService<Config>) {
    const nodeEnv = configService.get('nodeEnv', { infer: true });
    const frontendConfig = configService.get('frontend', { infer: true });
    const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
    const corsOrigin = configService.get('cors.origin', { infer: true });

    // Parse CORS origins for CSP
    const allowedOrigins: string[] = Array.isArray(corsOrigin)
        ? corsOrigin
        : (typeof corsOrigin === 'string' && corsOrigin.includes(',')
            ? corsOrigin.split(',').map(o => o.trim()).filter(Boolean)
            : (corsOrigin ? [corsOrigin] : []));

    // Base CSP directives
    const cspDirectives: Record<string, string[]> = {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some libraries, consider removing in production
            "'unsafe-eval'", // Required for some dev tools, remove in production if possible
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for inline styles
        ],
        imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https:', // Allow images from HTTPS sources
        ],
        fontSrc: [
            "'self'",
            'data:',
        ],
        connectSrc: [
            "'self'",
            ...allowedOrigins,
            'ws:', // WebSocket connections
            'wss:', // Secure WebSocket connections
        ],
        frameSrc: [
            "'self'",
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
    };

    // Add upgradeInsecureRequests as a boolean directive (not in array)
    const cspOptions: any = {
        directives: cspDirectives,
        reportOnly: nodeEnv === 'development', // Report only in development, enforce in production
    };

    // Add upgradeInsecureRequests directive (special handling)
    if (nodeEnv === 'production') {
        cspOptions.directives.upgradeInsecureRequests = [];
    }

    // Production CSP - stricter
    if (nodeEnv === 'production') {
        // Remove unsafe-inline and unsafe-eval in production if possible
        // Note: You may need to adjust these based on your frontend requirements
        cspDirectives.scriptSrc = [
            "'self'",
            // Remove 'unsafe-inline' and 'unsafe-eval' if your frontend doesn't need them
            // Consider using nonces or hashes instead
        ];
    }

    return {
        // Content Security Policy
        contentSecurityPolicy: {
            directives: cspDirectives,
            reportOnly: nodeEnv === 'development', // Report only in development, enforce in production
        },

        // Cross-Origin Embedder Policy
        crossOriginEmbedderPolicy: nodeEnv === 'production',

        // Cross-Origin Opener Policy
        crossOriginOpenerPolicy: {
            policy: 'same-origin' as const,
        },

        // Cross-Origin Resource Policy
        crossOriginResourcePolicy: {
            policy: 'cross-origin' as const,
        },

        // DNS Prefetch Control
        dnsPrefetchControl: true,

        // Expect-CT (deprecated but some browsers still use it)
        expectCt: {
            maxAge: 86400, // 24 hours
            enforce: nodeEnv === 'production',
        },

        // Frameguard
        frameguard: {
            action: 'deny' as const,
        },

        // Hide Powered-By
        hidePoweredBy: true,

        // HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: nodeEnv === 'production',
        },

        // IE No Open
        ieNoOpen: true,

        // No Sniff
        noSniff: true,

        // Origin Agent Cluster
        originAgentCluster: true,

        // Permissions Policy (formerly Feature Policy)
        permissionsPolicy: {
            features: {
                accelerometer: ["'none'"],
                ambientLightSensor: ["'none'"],
                autoplay: ["'self'"],
                battery: ["'none'"],
                camera: ["'none'"],
                crossOriginIsolated: ["'self'"],
                displayCapture: ["'none'"],
                documentDomain: ["'self'"],
                encryptedMedia: ["'self'"],
                executionWhileNotRendered: ["'none'"],
                executionWhileOutOfViewport: ["'none'"],
                fullscreen: ["'self'"],
                geolocation: ["'none'"],
                gyroscope: ["'none'"],
                keyboardMap: ["'none'"],
                magnetometer: ["'none'"],
                microphone: ["'none'"],
                midi: ["'none'"],
                navigationOverride: ["'self'"],
                payment: ["'none'"],
                pictureInPicture: ["'self'"],
                publickeyCredentials: ["'self'"],
                screenWakeLock: ["'none'"],
                syncXhr: ["'none'"],
                usb: ["'none'"],
                webShare: ["'self'"],
                xrSpatialTracking: ["'none'"],
            },
        },

        // Referrer Policy
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin' as const,
        },

        // XSS Protection (legacy, but still useful)
        xssFilter: true,
    };
}


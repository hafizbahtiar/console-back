/**
 * PM2 Ecosystem Configuration
 * 
 * Manages multiple processes:
 * - API Server (cluster mode in prod, fork in dev)
 * - Worker Process (fork mode, single instance)
 * - Scheduler Process (fork mode, single instance)
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production    # Start all processes in production mode
 *   pm2 start ecosystem.config.js --env development   # Start all processes in development mode
 *   pm2 start ecosystem.config.js --only console-api --env production    # Start only API in production
 *   pm2 start ecosystem.config.js --only console-api --env development   # Start only API in development
 *   pm2 stop all                            # Stop all processes
 *   pm2 restart all                         # Restart all processes
 *   pm2 logs                                # View all logs
 *   pm2 monit                               # Monitor all processes
 */

module.exports = {
    apps: [
        {
            name: 'console-api',
            script: './dist/main.js',
            // Production configuration (cluster mode)
            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'api',
                PORT: 5600,
                instances: 'max',
                exec_mode: 'cluster',
                watch: false,
            },
            // Development configuration (fork mode)
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'api',
                PORT: 8000,
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Default to development if no env specified
            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'api',
                PORT: 8000,
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Logging configuration with rotation
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_file: './logs/api-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            rotateModule: true,
            rotateInterval: '0 0 * * *', // Daily at midnight
            max_size: '100M',
            // Restart policy with exponential backoff (initial delay 100ms)
            autorestart: true,
            max_restarts: 10,
            min_uptime: '30s',
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,
            // Memory limits
            max_memory_restart: '1G',
            // Advanced options
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
        },
        {
            name: 'console-worker',
            script: './dist/worker.main.js',
            // Production configuration
            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'worker',
                instances: 1,
                exec_mode: 'fork',
                watch: false,
            },
            // Development configuration
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'worker',
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Default to development
            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'worker',
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Logging configuration with rotation
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_file: './logs/worker-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            rotateModule: true,
            rotateInterval: '0 0 * * *',
            max_size: '100M',
            // Restart policy with exponential backoff (initial delay 100ms)
            autorestart: true,
            max_restarts: 10,
            min_uptime: '30s',
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,
            // Memory limits
            max_memory_restart: '1G',
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
            // Advanced options
            kill_timeout: 5000,
        },
        {
            name: 'console-scheduler',
            script: './dist/scheduler.main.js',
            // Production configuration
            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'scheduler',
                instances: 1,
                exec_mode: 'fork',
                watch: false,
            },
            // Development configuration
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'scheduler',
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Default to development
            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'scheduler',
                instances: 1,
                exec_mode: 'fork',
                watch: true,
            },
            // Logging configuration with rotation
            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log',
            log_file: './logs/scheduler-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            rotateModule: true,
            rotateInterval: '0 0 * * *',
            max_size: '100M',
            // Restart policy with exponential backoff (initial delay 100ms)
            autorestart: true,
            max_restarts: 10,
            min_uptime: '30s',
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,
            // Memory limits
            max_memory_restart: '512M',
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
            // Advanced options
            kill_timeout: 5000,
        },
    ],
};


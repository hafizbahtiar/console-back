/**
 * PM2 Ecosystem Configuration
 * 
 * Manages multiple processes:
 * - API Server (cluster mode, multiple instances)
 * - Worker Process (fork mode, single instance)
 * - Scheduler Process (fork mode, single instance)
 * 
 * Usage:
 *   pm2 start ecosystem.config.js          # Start all processes
 *   pm2 start ecosystem.config.js --only api    # Start only API
 *   pm2 start ecosystem.config.js --only worker # Start only worker
 *   pm2 start ecosystem.config.js --only scheduler # Start only scheduler
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
            instances: 'max', // Use all available CPU cores
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'api',
                PORT: 8000,
            },
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'api',
                PORT: 8000,
            },
            // Logging configuration
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_file: './logs/api-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart policy
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Memory limits
            max_memory_restart: '1G',

            // Watch mode (development only)
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],

            // Advanced options
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        },
        {
            name: 'console-worker',
            script: './dist/worker.main.js',
            instances: 1, // Single instance for workers
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'worker',
            },
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'worker',
            },
            // Logging configuration
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_file: './logs/worker-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart policy
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Memory limits
            max_memory_restart: '1G',

            // Watch mode (development only)
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],

            // Advanced options
            kill_timeout: 5000,
        },
        {
            name: 'console-scheduler',
            script: './dist/scheduler.main.js',
            instances: 1, // Single instance for scheduler
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'scheduler',
            },
            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'scheduler',
            },
            // Logging configuration
            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log',
            log_file: './logs/scheduler-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart policy
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Memory limits
            max_memory_restart: '512M',

            // Watch mode (development only)
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],

            // Advanced options
            kill_timeout: 5000,
        },
    ],
};


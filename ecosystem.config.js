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
            exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
            instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
            watch: false,

            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'api',
                PORT: 5600,
            },

            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'api',
                PORT: 8000,
            },

            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'api',
                PORT: 8000,
            },

            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_file: './logs/api-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            autorestart: true,
            max_restarts: 10,
            min_uptime: '30s',
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,

            max_memory_restart: '1G',
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
            ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
        },
        {
            name: 'console-worker',
            script: './dist/worker.main.js',
            exec_mode: 'fork',
            instances: 1,
            watch: false,

            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'worker',
            },

            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'worker',
            },

            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'worker',
            },

            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_file: './logs/worker-combined.log',
            time: true,
            merge_logs: true,

            autorestart: true,
            max_memory_restart: '1G',
            kill_timeout: 5000,
        },
        {
            name: 'console-scheduler',
            script: './dist/scheduler.main.js',
            exec_mode: 'fork',
            instances: 1,
            watch: false,

            env_production: {
                NODE_ENV: 'production',
                PROCESS_TYPE: 'scheduler',
            },

            env_development: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'scheduler',
            },

            env: {
                NODE_ENV: 'development',
                PROCESS_TYPE: 'scheduler',
            },

            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log',
            log_file: './logs/scheduler-combined.log',
            time: true,
            merge_logs: true,

            autorestart: true,
            max_memory_restart: '512M',
            kill_timeout: 5000,
        },
    ],
};

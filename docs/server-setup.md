# Server Setup Guide - Backend (NestJS)

## Overview

This guide explains how to set up the Console Backend, a production-ready NestJS application with multi-process architecture, queue system, WebSocket support, and scheduled jobs.

## Architecture

The backend uses a **multi-process architecture** managed by PM2:

1. **API Server** (`main.ts`) - Handles HTTP requests, WebSocket connections, and serves the REST API
2. **Worker Process** (`worker.main.ts`) - Processes background jobs from Bull queues (email sending, etc.)
3. **Scheduler Process** (`scheduler.main.ts`) - Runs cron jobs for maintenance tasks (session cleanup, etc.)

### Process Separation

- **API Process**: Loads all feature modules (Auth, Portfolio, Settings, etc.), WebSocket gateway, and admin endpoints
- **Worker Process**: Only loads queue processors (no HTTP server, no feature modules)
- **Scheduler Process**: Only loads cron jobs (no HTTP server, no feature modules)

This separation ensures optimal resource usage and scalability.

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher) - Required for database
- **Redis** (v6 or higher) - Required for queues and caching
- **PM2** (optional, for production process management)
- **Caddy** (optional, for reverse proxy)

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root. See `.env.example` for all available variables.

**Required Variables:**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/console

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Server
NODE_ENV=production
PORT=8000

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
REDIS_DB=0

# CORS
CORS_ORIGIN=https://console.hafizbahtiar.com

# File Uploads
UPLOAD_PUBLIC_URL=https://console.hafizbahtiar.com/api/v1/uploads
UPLOAD_STORAGE_PATH=uploads

# Email (optional, for production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@console.app
```

### 3. Build the Project

```bash
npm run build
```

## Running the Application

### Development Mode

**Single Process (API only):**
```bash
npm run start:dev
```

**Multi-Process (with PM2):**
```bash
# Start all processes
npm run pm2:start

# Or start individually
pm2 start ecosystem.config.js --only api
pm2 start ecosystem.config.js --only worker
pm2 start ecosystem.config.js --only scheduler
```

### Production Mode

**Using PM2 (Recommended):**
```bash
# Build first
npm run build

# Start all processes
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all
```

**Manual Start (for testing):**
```bash
# API Server
PROCESS_TYPE=api npm run start:prod

# Worker (in separate terminal)
npm run start:worker

# Scheduler (in separate terminal)
npm run start:scheduler
```

## Caddy Reverse Proxy Configuration

If using Caddy as a reverse proxy, create or update your Caddyfile:

```caddy
console.hafizbahtiar.com {
    encode gzip

    # Backend API routes - all /api/* requests go to NestJS
    handle_path /api* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # WebSocket connections (Socket.IO) - proxy to backend
    handle_path /socket.io* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # All other routes - proxy to Next.js frontend
    handle {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "no-referrer-when-downgrade"
    }
}
```

**Key Points:**
- `handle_path /api*` forwards all requests starting with `/api` to the NestJS backend
- `handle_path /socket.io*` handles WebSocket connections
- `handle` catches everything else and routes to the Next.js frontend
- This ensures all URLs (including images) stay under the same domain

### Reload Caddy

```bash
sudo caddy reload
# or
caddy reload
```

## Process Management with PM2

### Ecosystem Configuration

The `ecosystem.config.js` file defines three processes:

1. **console-api** - API server (cluster mode, uses all CPU cores)
2. **console-worker** - Worker process (single instance, processes queues)
3. **console-scheduler** - Scheduler process (single instance, runs cron jobs)

### PM2 Commands

```bash
# Start all processes
pm2 start ecosystem.config.js

# Start specific process
pm2 start ecosystem.config.js --only api
pm2 start ecosystem.config.js --only worker
pm2 start ecosystem.config.js --only scheduler

# Stop all
pm2 stop all

# Restart all
pm2 restart all

# View logs
pm2 logs                    # All processes
pm2 logs console-api        # Specific process
pm2 logs console-worker
pm2 logs console-scheduler

# Monitor
pm2 monit

# Status
pm2 status

# Delete all
pm2 delete all
```

### Log Files

Logs are stored in the `logs/` directory:
- `api-combined.log`, `api-error.log`, `api-out.log`
- `worker-combined.log`, `worker-error.log`, `worker-out.log`
- `scheduler-combined.log`, `scheduler-error.log`, `scheduler-out.log`

## API Endpoints

### Base URL
All API endpoints are prefixed with `/api/v1`

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/change-password` - Change password (protected)

### Portfolio Management
- `GET /api/v1/portfolio/*` - Portfolio CRUD endpoints (protected)
- `GET /api/v1/public/portfolio/*` - Public portfolio endpoints (no auth)

### Settings
- `GET /api/v1/settings/preferences` - Get user preferences
- `PATCH /api/v1/settings/preferences` - Update preferences
- `GET /api/v1/sessions` - Get active sessions
- `DELETE /api/v1/sessions/:id` - Revoke session

### Admin
- `GET /api/v1/admin/metrics` - System metrics (protected, admin only)
- `GET /api/v1/admin/queues/ui` - Bull Board queue dashboard
- `GET /api/v1/admin/queues/stats` - Queue statistics

### Upload
- `POST /api/v1/upload/image` - Upload single image
- `POST /api/v1/upload/images` - Upload multiple images
- `POST /api/v1/upload/document` - Upload document
- `POST /api/v1/upload/avatar` - Upload avatar
- `POST /api/v1/upload/resume` - Upload resume

## WebSocket

The backend supports WebSocket connections via Socket.IO:

- **Connection URL**: `ws://localhost:8000` (or your domain)
- **Authentication**: JWT token required (via query param, auth header, or handshake auth)
- **Namespace**: `/` (default)
- **Events**: See `modules/websocket/gateways/chat.gateway.ts` for available events

## Queue System

The backend uses **Bull** with **Redis** for background job processing:

- **Email Queue**: Processes email sending jobs
- **Queue Dashboard**: Accessible at `/api/v1/admin/queues/ui` (requires authentication)

## Scheduled Jobs (Cron)

The scheduler process runs the following cron jobs:

- **Session Cleanup**: Removes expired sessions (runs hourly)
- **Email Queue Monitoring**: Monitors queue health (runs every 10 minutes)
- **Account Deletion Token Cleanup**: Removes expired tokens (runs daily at midnight)
- **Database Maintenance**: Optional weekly maintenance (disabled by default)

All cron jobs can be enabled/disabled via environment variables.

## Verifying the Setup

1. **Check API Server:**
   ```bash
   curl http://localhost:8000/api/v1
   ```

2. **Check Process Status:**
   ```bash
   pm2 status
   ```

3. **Check Logs:**
   ```bash
   pm2 logs
   ```

4. **Check Queue Dashboard:**
   - Visit `http://localhost:8000/api/v1/admin/queues/ui`
   - Requires authentication

5. **Check MongoDB Connection:**
   - Check logs for "Database connection ready" message

6. **Check Redis Connection:**
   - Check logs for Redis connection status
   - Or visit `/api/v1/health/redis` (if implemented)

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `CORS_ORIGIN` includes your frontend domain
- Check that CORS is configured correctly in `main.ts`

**Image URLs Wrong:**
- Check `UPLOAD_PUBLIC_URL` is set correctly
- Should match your domain: `https://console.hafizbahtiar.com/api/v1/uploads`

**Connection Refused:**
- Verify backend is running on port 8000
- Check PM2 status: `pm2 status`

**502 Bad Gateway:**
- Check Caddy can reach localhost:8000
- Verify API process is running: `pm2 logs console-api`

**Queue Jobs Not Processing:**
- Verify worker process is running: `pm2 logs console-worker`
- Check Redis connection: `redis-cli ping`
- Check queue dashboard for failed jobs

**Cron Jobs Not Running:**
- Verify scheduler process is running: `pm2 logs console-scheduler`
- Check cron job configuration in environment variables
- Check scheduler service logs

**Database Connection Issues:**
- Verify MongoDB is running: `mongosh` or `mongo`
- Check `MONGODB_URI` is correct
- Check database connection logs

**Redis Connection Issues:**
- Verify Redis is running: `redis-cli ping`
- Check Redis configuration in `.env`
- Check Redis connection logs

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Configure `CORS_ORIGIN` with production domain
- [ ] Set `UPLOAD_PUBLIC_URL` with production domain
- [ ] Configure SMTP for email sending
- [ ] Set up MongoDB with authentication
- [ ] Set up Redis with authentication (if needed)
- [ ] Configure PM2 for auto-restart
- [ ] Set up log rotation
- [ ] Configure reverse proxy (Caddy/Nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Review security headers (Helmet config)
- [ ] Test all endpoints
- [ ] Test queue processing
- [ ] Test cron jobs
- [ ] Test WebSocket connections


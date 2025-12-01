<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Console Backend - A comprehensive NestJS application with multi-process architecture, queue system, WebSocket support, and scheduled jobs.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with refresh tokens
- 📊 **Queue System** - Bull queue with Redis for background job processing
- 🔌 **WebSocket** - Real-time communication with Socket.IO
- ⏰ **Scheduled Jobs** - Cron jobs for maintenance tasks
- 🚀 **PM2 Process Management** - Multi-process architecture (API, Worker, Scheduler)
- 📁 **File Upload** - Image and document upload with optimization
- 🎨 **Portfolio Management** - Complete CRUD for portfolio items
- ⚙️ **Settings Management** - User preferences and account settings
- 📧 **Email System** - Queue-based email sending with templates
- 🛡️ **Security** - Helmet, CORS, rate limiting, and validation

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (v6 or higher) - Required for queues and caching
- PM2 (optional, for production process management)

## Project setup

```bash
# Install dependencies
$ npm install

# Copy environment variables
$ cp .env.example .env

# Update .env with your configuration
# Required: MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

## Compile and run the project

```bash
# Build the project
$ npm run build

# Development (single process)
$ npm run start:dev

# Production (single process)
$ npm run start:prod

# Start specific process types
$ PROCESS_TYPE=api npm run start:prod
$ PROCESS_TYPE=worker npm run start:prod
$ PROCESS_TYPE=scheduler npm run start:prod
```

## PM2 Setup Instructions

This application uses PM2 for process management in production, supporting three process types:

- **API Server** - Handles HTTP requests and WebSocket connections
- **Worker** - Processes background jobs from queues
- **Scheduler** - Executes cron jobs

### Installation

```bash
# Install PM2 globally (if not already installed)
$ npm install -g pm2

# Or use as dev dependency (already included)
$ npm install
```

### Configuration

The `ecosystem.config.js` file defines three processes:

1. **console-api** - API server (cluster mode, uses all CPU cores)
2. **console-worker** - Worker process (single instance)
3. **console-scheduler** - Scheduler process (single instance)

### Usage

```bash
# Start all processes
$ npm run pm2:start
# or
$ pm2 start ecosystem.config.js

# Start specific process
$ pm2 start ecosystem.config.js --only console-api
$ pm2 start ecosystem.config.js --only console-worker
$ pm2 start ecosystem.config.js --only console-scheduler

# Stop all processes
$ npm run pm2:stop
# or
$ pm2 stop ecosystem.config.js

# Restart all processes
$ npm run pm2:restart
# or
$ pm2 restart ecosystem.config.js

# View logs
$ npm run pm2:logs
# or
$ pm2 logs

# Monitor processes
$ npm run pm2:monit
# or
$ pm2 monit

# Delete all processes
$ npm run pm2:delete
# or
$ pm2 delete ecosystem.config.js

# Save PM2 process list (for auto-start on reboot)
$ pm2 save

# Setup PM2 startup script (Linux/Mac)
$ pm2 startup
```

### Process Types

Each process type loads only the modules it needs:

- **API Process** (`PROCESS_TYPE=api`):
  - HTTP server
  - WebSocket server
  - All feature modules (Auth, Portfolio, Settings, etc.)
  - Rate limiting
  - Bull Board dashboard

- **Worker Process** (`PROCESS_TYPE=worker`):
  - Queue processors only
  - No HTTP server
  - Processes jobs from Redis queues

- **Scheduler Process** (`PROCESS_TYPE=scheduler`):
  - Cron jobs only
  - No HTTP server
  - Executes scheduled tasks

### Environment Variables

Set `PROCESS_TYPE` in your `.env` file or in `ecosystem.config.js`:

```env
PROCESS_TYPE=api  # or 'worker' or 'scheduler'
```

## Redis Setup Instructions

Redis is required for:

- Queue system (Bull queues)
- Caching (optional)
- Session storage (optional)

### Installation

**macOS (Homebrew):**

```bash
$ brew install redis
$ brew services start redis
```

**Linux (Ubuntu/Debian):**

```bash
$ sudo apt-get update
$ sudo apt-get install redis-server
$ sudo systemctl start redis
$ sudo systemctl enable redis
```

**Docker:**

```bash
$ docker run -d -p 6379:6379 --name redis redis:latest
```

### Configuration

Update your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional, leave empty if no password
REDIS_DB=0              # Database number (0-15)
REDIS_RETRY_DELAY=100    # Retry delay in ms
REDIS_MAX_RETRIES=3      # Maximum retry attempts
REDIS_ENABLE_READY_CHECK=true
REDIS_ENABLE_OFFLINE_QUEUE=true
```

### Testing Connection

```bash
# Test Redis connection
$ redis-cli ping
# Should return: PONG
```

## Queue System Documentation

The application uses Bull queues with Redis for background job processing.

### Available Queues

- **Email Queue** - Processes email sending jobs

### Adding Jobs to Queue

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueNames } from './modules/queue/constants/queue-names.constant';

@Injectable()
export class MyService {
  constructor(
    @InjectQueue(QueueNames.EMAIL)
    private readonly emailQueue: Queue,
  ) {}

  async sendEmail(data: EmailJobData) {
    // Add job to queue
    await this.emailQueue.add('send-email', data, {
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: true, // Remove completed jobs
      removeOnFail: false, // Keep failed jobs for inspection
    });
  }
}
```

### Queue Monitoring

Access the Bull Board dashboard at:

```
http://localhost:8000/api/v1/admin/queues/ui
```

**Note:** Requires authentication (JWT token) and owner role.

### Queue Configuration

Queues are configured in `src/modules/queue/queue.module.ts`. Each queue:

- Connects to Redis
- Has configurable retry settings
- Supports job prioritization
- Tracks job progress

### Creating New Queues

1. Add queue name to `src/modules/queue/constants/queue-names.constant.ts`:

```typescript
export enum QueueNames {
  EMAIL = 'email',
  MY_NEW_QUEUE = 'my-new-queue', // Add here
}
```

2. Register queue in `src/modules/queue/queue.module.ts`:

```typescript
BullModule.registerQueue({
  name: QueueNames.MY_NEW_QUEUE,
}),
```

3. Create processor in `src/modules/queue/processors/`:

```typescript
@Processor(QueueNames.MY_NEW_QUEUE)
export class MyNewQueueProcessor {
  @Process('my-job')
  async handleMyJob(job: Job<MyJobData>) {
    // Process job
  }
}
```

4. Register processor in queue module

## WebSocket Usage Examples

The application includes WebSocket support using Socket.IO with a sample chat gateway.

### Server-Side (Gateway)

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { WebSocketEventType } from './interfaces/websocket-events.interface';

@WebSocketGateway({
  namespace: '/chat',
})
export class ChatGateway {
  @SubscribeMessage(WebSocketEventType.MESSAGE)
  handleMessage(@MessageBody() data: { message: string; room?: string }) {
    // Handle message
    return { event: 'message', data: { message: data.message } };
  }
}
```

### Client-Side (JavaScript/TypeScript)

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:8000/chat', {
  auth: {
    token: 'your-jwt-access-token', // Required for authentication
  },
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

// Send a message
socket.emit('message', {
  message: 'Hello, World!',
  room: 'general', // Optional room name
});

// Listen for messages
socket.on('message', (data) => {
  console.log('Received message:', data);
});

// Join a room
socket.emit('joinRoom', { room: 'general' });

// Leave a room
socket.emit('leaveRoom', { room: 'general' });

// Typing indicator
socket.emit('typing', {
  isTyping: true,
  room: 'general',
});

// Listen for typing indicators
socket.on('typing', (data) => {
  console.log(`${data.email} is typing...`);
});

// Get online users
socket.emit('getOnlineUsers');
socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
});

// Disconnect
socket.disconnect();
```

### Authentication

WebSocket connections require JWT authentication. The token can be provided via:

1. **Handshake auth** (recommended):

```typescript
const socket = io('http://localhost:8000/chat', {
  auth: {
    token: 'your-jwt-access-token',
  },
});
```

2. **Query parameter**:

```typescript
const socket = io('http://localhost:8000/chat?token=your-jwt-access-token');
```

3. **Authorization header** (if supported by client):

```typescript
const socket = io('http://localhost:8000/chat', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-access-token',
  },
});
```

### Rate Limiting

WebSocket connections are rate-limited:

- Default: 30 messages per minute
- Default: 500 messages per hour

Configure in `.env`:

```env
WS_RATE_LIMIT_PER_MINUTE=30
WS_RATE_LIMIT_PER_HOUR=500
```

### Available Events

**Client to Server:**

- `message` - Send a chat message
- `joinRoom` - Join a room
- `leaveRoom` - Leave a room
- `typing` - Send typing indicator
- `getOnlineUsers` - Get list of online users
- `getMessageHistory` - Get message history for a room

**Server to Client:**

- `message` - Receive a chat message
- `onlineUsers` - List of online users
- `presenceUpdate` - User presence update
- `typing` - Typing indicator from another user
- `userJoined` - User joined the chat
- `userLeft` - User left the chat
- `userJoinedRoom` - User joined a room
- `userLeftRoom` - User left a room
- `messageHistory` - Message history for a room
- `error` - Error response

## Cron Job Configuration Guide

The application uses `@nestjs/schedule` for cron jobs.

### Available Cron Jobs

1. **Session Cleanup** - Removes expired sessions
   - Enabled by default
   - Runs daily at 2 AM
   - Configure: `SCHEDULER_SESSION_CLEANUP_ENABLED=true`

2. **Email Queue Monitoring** - Monitors email queue for issues
   - Enabled by default
   - Runs every 5 minutes
   - Warning threshold: 100 pending jobs
   - Configure: `SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED=true`
   - Configure: `SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD=100`

3. **Account Deletion Token Cleanup** - Removes expired deletion tokens
   - Enabled by default
   - Runs daily at 3 AM
   - Configure: `SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED=true`

4. **Database Maintenance** - Optional database maintenance tasks
   - Disabled by default
   - Runs weekly on Sunday at 1 AM
   - Configure: `SCHEDULER_DATABASE_MAINTENANCE_ENABLED=true`

5. **Sample Job** - Example cron job (disabled by default)
   - Configure: `SCHEDULER_SAMPLE_JOB_ENABLED=false`

### Configuration

Enable/disable cron jobs via environment variables in `.env`:

```env
# Enable/disable individual cron jobs
SCHEDULER_SESSION_CLEANUP_ENABLED=true
SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED=true
SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD=100
SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED=true
SCHEDULER_DATABASE_MAINTENANCE_ENABLED=false
SCHEDULER_SAMPLE_JOB_ENABLED=false
```

### Creating New Cron Jobs

1. Create a service with `@Injectable()` decorator:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MyCronService {
  private readonly logger = new Logger(MyCronService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleMyCronJob() {
    this.logger.log('Running my cron job');
    // Your logic here
  }

  // Or use custom cron expression
  @Cron('0 2 * * *') // Every day at 2 AM
  handleDailyJob() {
    this.logger.log('Running daily job');
  }
}
```

2. Register service in `SchedulerModule`:

```typescript
@Module({
  providers: [MyCronService],
})
export class SchedulerModule {}
```

### Cron Expression Format

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── Day of week (0-7, 0 or 7 is Sunday)
│ │ │ │ └──── Month (1-12)
│ │ │ └────── Day of month (1-31)
│ │ └──────── Hour (0-23)
│ └────────── Minute (0-59)
└──────────── Second (0-59, optional)
```

**Common Expressions:**

- `@every(5m)` - Every 5 minutes
- `0 0 * * *` - Every day at midnight
- `0 2 * * *` - Every day at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight

### Process Type

Cron jobs only run in the **scheduler process**. Ensure `PROCESS_TYPE=scheduler` is set when running the scheduler.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

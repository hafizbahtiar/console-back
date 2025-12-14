import { Injectable, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueNames } from '../../queue/constants/queue-names.constant';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Global app reference (set in main.ts)
declare global {
  var globalApp: NestExpressApplication | undefined;
}

/**
 * Bull Board Service
 * 
 * Configures and provides Bull Board dashboard for queue monitoring.
 */
@Injectable()
export class BullBoardService implements OnModuleInit, OnApplicationBootstrap {
    private readonly logger = new Logger(BullBoardService.name);
    private bullBoardAdapter: ExpressAdapter;

    constructor(
        @InjectQueue(QueueNames.EMAIL)
        private readonly emailQueue: Queue,
    ) {}

    onModuleInit() {
        this.setupBullBoard();
    }

    onApplicationBootstrap() {
        // Router is now mounted in main.ts with authentication middleware
        // No need to mount here anymore
        this.logger.log('✅ Bull Board service ready (router will be mounted in main.ts with auth)');
    }

    /**
     * Setup Bull Board dashboard
     */
    private setupBullBoard() {
        // Create Express adapter for Bull Board
        this.bullBoardAdapter = new ExpressAdapter();
        this.bullBoardAdapter.setBasePath('/api/v1/admin/queues');

        // Register all queues
        const queues = [
            new BullAdapter(this.emailQueue),
            // Add more queues here as they are created
        ];

        // Create Bull Board instance
        createBullBoard({
            queues,
            serverAdapter: this.bullBoardAdapter,
        });

        this.logger.log('✅ Bull Board dashboard configured at /api/v1/admin/queues');
    }

    /**
     * Get Bull Board Express router
     * 
     * The router is mounted in main.ts with authentication middleware
     */
    getRouter() {
        return this.bullBoardAdapter.getRouter();
    }
}


import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueNames } from '../../queue/constants/queue-names.constant';

/**
 * Bull Board Service
 * 
 * Configures and provides Bull Board dashboard for queue monitoring.
 */
@Injectable()
export class BullBoardService implements OnModuleInit {
    private readonly logger = new Logger(BullBoardService.name);
    private bullBoardAdapter: ExpressAdapter;

    constructor(
        @InjectQueue(QueueNames.EMAIL)
        private readonly emailQueue: Queue,
    ) {}

    onModuleInit() {
        this.setupBullBoard();
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
     */
    getRouter() {
        return this.bullBoardAdapter.getRouter();
    }
}


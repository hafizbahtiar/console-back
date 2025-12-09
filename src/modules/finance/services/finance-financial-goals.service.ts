import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FinancialGoal, FinancialGoalDocument, GoalCategory, Milestone } from '../schemas/finance-financial-goal.schema';
import { CreateFinancialGoalDto } from '../dto/financial-goals/create-financial-goal.dto';
import { UpdateFinancialGoalDto } from '../dto/financial-goals/update-financial-goal.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';

export interface FinancialGoalFilters {
    category?: GoalCategory;
    achieved?: boolean;
    targetDate?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface FinancialGoalSortOptions {
    field?: 'name' | 'targetAmount' | 'currentAmount' | 'targetDate' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
}

export interface FinancialGoalProgress {
    goalId: string;
    targetAmount: number;
    currentAmount: number;
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    isOnTrack: boolean;
    achievedMilestones: number;
    totalMilestones: number;
}

@Injectable()
export class FinanceFinancialGoalsService {
    constructor(
        @InjectModel(FinancialGoal.name) private financialGoalModel: Model<FinancialGoalDocument>,
    ) { }

    async create(userId: string, createFinancialGoalDto: CreateFinancialGoalDto): Promise<FinancialGoalDocument> {
        // Validate target date
        const targetDate = new Date(createFinancialGoalDto.targetDate);
        if (isNaN(targetDate.getTime())) {
            throw new BadRequestException('Invalid target date format');
        }

        if (targetDate < new Date()) {
            throw new BadRequestException('Target date cannot be in the past');
        }

        // Validate milestones
        if (createFinancialGoalDto.milestones) {
            const sortedMilestones = [...createFinancialGoalDto.milestones].sort((a, b) => a.amount - b.amount);
            const lastMilestone = sortedMilestones[sortedMilestones.length - 1];
            if (lastMilestone && lastMilestone.amount > createFinancialGoalDto.targetAmount) {
                throw new BadRequestException('Milestone amount cannot exceed target amount');
            }
        }

        const goal = new this.financialGoalModel({
            userId: new Types.ObjectId(userId),
            ...createFinancialGoalDto,
            targetDate,
            currentAmount: createFinancialGoalDto.currentAmount || 0,
            milestones: createFinancialGoalDto.milestones || [],
            achieved: false,
        });

        const savedGoal = await goal.save();

        // Check and update milestones
        await this.checkAndUpdateMilestones(userId, savedGoal._id.toString());

        return savedGoal;
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 20,
        filters?: FinancialGoalFilters,
        sortOptions?: FinancialGoalSortOptions,
    ): Promise<{ goals: FinancialGoalDocument[]; total: number; page: number; limit: number }> {
        const query: any = { userId: new Types.ObjectId(userId) };

        if (filters?.category) {
            query.category = filters.category;
        }

        if (filters?.achieved !== undefined) {
            query.achieved = filters.achieved;
        }

        if (filters?.targetDate) {
            query.targetDate = new Date(filters.targetDate);
        }

        if (filters?.startDate || filters?.endDate) {
            query.targetDate = {};
            if (filters.startDate) {
                query.targetDate.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.targetDate.$lte = new Date(filters.endDate);
            }
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const sort: any = {};
        if (sortOptions?.field) {
            sort[sortOptions.field] = sortOptions.order === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = -1;
        }

        const skip = (page - 1) * limit;

        const [goals, total] = await Promise.all([
            this.financialGoalModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
            this.financialGoalModel.countDocuments(query).exec(),
        ]);

        return { goals, total, page, limit };
    }

    async findOne(userId: string, goalId: string): Promise<FinancialGoalDocument> {
        const goal = await this.financialGoalModel.findOne({
            _id: new Types.ObjectId(goalId),
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!goal) {
            throw new NotFoundException('Financial goal not found');
        }

        return goal;
    }

    async update(userId: string, goalId: string, updateFinancialGoalDto: UpdateFinancialGoalDto): Promise<FinancialGoalDocument> {
        const goal = await this.findOne(userId, goalId);

        // Validate target date if provided
        if (updateFinancialGoalDto.targetDate) {
            const targetDate = new Date(updateFinancialGoalDto.targetDate);
            if (isNaN(targetDate.getTime())) {
                throw new BadRequestException('Invalid target date format');
            }
            if (targetDate < new Date()) {
                throw new BadRequestException('Target date cannot be in the past');
            }
        }

        // Validate milestones if provided
        if (updateFinancialGoalDto.milestones) {
            const targetAmount = updateFinancialGoalDto.targetAmount || goal.targetAmount;
            const sortedMilestones = [...updateFinancialGoalDto.milestones].sort((a, b) => (a.amount || 0) - (b.amount || 0));
            const lastMilestone = sortedMilestones[sortedMilestones.length - 1];
            if (lastMilestone && lastMilestone.amount && lastMilestone.amount > targetAmount) {
                throw new BadRequestException('Milestone amount cannot exceed target amount');
            }
        }

        // Update currentAmount if provided
        if (updateFinancialGoalDto.currentAmount !== undefined) {
            goal.currentAmount = updateFinancialGoalDto.currentAmount;
        }

        // Update other fields
        Object.assign(goal, {
            ...updateFinancialGoalDto,
            targetDate: updateFinancialGoalDto.targetDate ? new Date(updateFinancialGoalDto.targetDate) : goal.targetDate,
        });

        // If currentAmount reaches or exceeds targetAmount, mark as achieved
        if (goal.currentAmount >= goal.targetAmount && !goal.achieved) {
            goal.achieved = true;
            goal.achievedAt = new Date();
        } else if (goal.currentAmount < goal.targetAmount && goal.achieved) {
            goal.achieved = false;
            goal.achievedAt = undefined;
        }

        const savedGoal = await goal.save();

        // Check and update milestones
        await this.checkAndUpdateMilestones(userId, goalId);

        return savedGoal;
    }

    async remove(userId: string, goalId: string): Promise<void> {
        const goal = await this.findOne(userId, goalId);
        // Soft delete
        (goal as any).deletedAt = new Date();
        await goal.save();
    }

    async bulkDelete(userId: string, goalIds: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.financialGoalModel, userId, goalIds);
    }

    /**
     * Calculate goal progress
     */
    async calculateGoalProgress(userId: string, goalId: string): Promise<FinancialGoalProgress> {
        const goal = await this.findOne(userId, goalId);

        const progressPercentage = goal.targetAmount > 0
            ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            : 0;

        const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

        const now = new Date();
        const targetDate = new Date(goal.targetDate);
        const daysRemaining = Math.max(Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);

        // Calculate if on track (current progress should match or exceed expected progress based on time)
        const createdAt = (goal as any).createdAt || new Date();
        const totalDays = Math.ceil((targetDate.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const expectedProgress = totalDays > 0 ? (daysRemaining / totalDays) * 100 : 0;
        const isOnTrack = progressPercentage >= (100 - expectedProgress) || goal.achieved;

        // Count achieved milestones
        const achievedMilestones = goal.milestones.filter((m) => m.achieved).length;
        const totalMilestones = goal.milestones.length;

        return {
            goalId: goal._id.toString(),
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            progressPercentage,
            remainingAmount,
            daysRemaining,
            isOnTrack,
            achievedMilestones,
            totalMilestones,
        };
    }

    /**
     * Get all goals with their progress
     */
    async findAllWithProgress(userId: string, filters?: FinancialGoalFilters): Promise<Array<FinancialGoalDocument & { progress: FinancialGoalProgress }>> {
        const { goals } = await this.findAll(userId, 1, 1000, filters);

        const goalsWithProgress = await Promise.all(
            goals.map(async (goal) => {
                const progress = await this.calculateGoalProgress(userId, goal._id.toString());
                return { ...goal.toObject(), progress };
            }),
        );

        return goalsWithProgress as Array<FinancialGoalDocument & { progress: FinancialGoalProgress }>;
    }

    /**
     * Add amount to goal (for tracking savings)
     */
    async addAmount(userId: string, goalId: string, amount: number): Promise<FinancialGoalDocument> {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        const goal = await this.findOne(userId, goalId);

        if (goal.achieved) {
            throw new BadRequestException('Cannot add amount to an already achieved goal');
        }

        goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);

        // Check if goal is achieved
        if (goal.currentAmount >= goal.targetAmount && !goal.achieved) {
            goal.achieved = true;
            goal.achievedAt = new Date();
        }

        const savedGoal = await goal.save();

        // Check and update milestones
        await this.checkAndUpdateMilestones(userId, goalId);

        return savedGoal;
    }

    /**
     * Subtract amount from goal
     */
    async subtractAmount(userId: string, goalId: string, amount: number): Promise<FinancialGoalDocument> {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        const goal = await this.findOne(userId, goalId);

        goal.currentAmount = Math.max(goal.currentAmount - amount, 0);

        // If currentAmount drops below targetAmount, unmark as achieved
        if (goal.currentAmount < goal.targetAmount && goal.achieved) {
            goal.achieved = false;
            goal.achievedAt = undefined;
        }

        const savedGoal = await goal.save();

        // Check and update milestones
        await this.checkAndUpdateMilestones(userId, goalId);

        return savedGoal;
    }

    /**
     * Check and update milestones based on current amount
     */
    private async checkAndUpdateMilestones(userId: string, goalId: string): Promise<void> {
        const goal = await this.findOne(userId, goalId);

        let updated = false;
        for (const milestone of goal.milestones) {
            if (!milestone.achieved && goal.currentAmount >= milestone.amount) {
                milestone.achieved = true;
                milestone.achievedAt = new Date();
                updated = true;
            }
        }

        if (updated) {
            await goal.save();
        }
    }

    /**
     * Get goals that have achieved milestones (for celebrations)
     */
    async getGoalsWithAchievedMilestones(userId: string): Promise<Array<{ goal: FinancialGoalDocument; recentMilestones: Milestone[] }>> {
        const { goals } = await this.findAll(userId, 1, 1000);

        const goalsWithMilestones: Array<{ goal: FinancialGoalDocument; recentMilestones: Milestone[] }> = [];

        for (const goal of goals) {
            const recentMilestones = goal.milestones.filter((m) => {
                if (!m.achieved || !m.achievedAt) return false;
                // Milestones achieved in the last 7 days
                const daysSinceAchieved = Math.floor(
                    (new Date().getTime() - new Date(m.achievedAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysSinceAchieved <= 7;
            });

            if (recentMilestones.length > 0) {
                goalsWithMilestones.push({ goal, recentMilestones });
            }
        }

        return goalsWithMilestones;
    }
}


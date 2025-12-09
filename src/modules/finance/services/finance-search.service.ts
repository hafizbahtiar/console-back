import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/finance-transaction.schema';

/**
 * Finance Search Service
 * 
 * Provides search-related functionality including:
 * - Search suggestions based on transaction history
 * - Search analytics (popular searches, patterns)
 */
@Injectable()
export class FinanceSearchService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    ) { }

    /**
     * Get search suggestions based on transaction history
     * 
     * Returns suggestions from:
     * - Transaction descriptions (most common)
     * - Notes
     * - References
     * - Tags
     * - Payment methods
     * 
     * @param userId - User ID
     * @param query - Search query (optional, for filtering suggestions)
     * @param limit - Maximum number of suggestions to return
     * @returns Array of search suggestions
     */
    async getSearchSuggestions(
        userId: string,
        query?: string,
        limit: number = 10,
    ): Promise<Array<{
        text: string;
        type: 'description' | 'note' | 'reference' | 'tag' | 'paymentMethod';
        count: number;
    }>> {
        const userQuery = { userId: new Types.ObjectId(userId) };
        const suggestions: Map<string, { type: string; count: number }> = new Map();

        // Get suggestions from descriptions
        const descriptionAgg = await this.transactionModel.aggregate([
            { $match: userQuery },
            {
                $group: {
                    _id: '$description',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit * 2 },
        ]).exec();

        descriptionAgg.forEach((item) => {
            if (item._id && item._id.trim()) {
                const text = item._id.trim();
                if (!query || text.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.set(text, { type: 'description', count: item.count });
                }
            }
        });

        // Get suggestions from notes
        const notesAgg = await this.transactionModel.aggregate([
            { $match: { ...userQuery, notes: { $exists: true, $ne: null, $not: { $eq: '' } } } },
            {
                $group: {
                    _id: '$notes',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        notesAgg.forEach((item) => {
            if (item._id && item._id.trim()) {
                const text = item._id.trim();
                if (!query || text.toLowerCase().includes(query.toLowerCase())) {
                    if (!suggestions.has(text)) {
                        suggestions.set(text, { type: 'note', count: item.count });
                    }
                }
            }
        });

        // Get suggestions from references
        const referenceAgg = await this.transactionModel.aggregate([
            { $match: { ...userQuery, reference: { $exists: true, $ne: null, $not: { $eq: '' } } } },
            {
                $group: {
                    _id: '$reference',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        referenceAgg.forEach((item) => {
            if (item._id && item._id.trim()) {
                const text = item._id.trim();
                if (!query || text.toLowerCase().includes(query.toLowerCase())) {
                    if (!suggestions.has(text)) {
                        suggestions.set(text, { type: 'reference', count: item.count });
                    }
                }
            }
        });

        // Get suggestions from tags
        const tagsAgg = await this.transactionModel.aggregate([
            { $match: { ...userQuery, tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        tagsAgg.forEach((item) => {
            if (item._id && item._id.trim()) {
                const text = item._id.trim();
                if (!query || text.toLowerCase().includes(query.toLowerCase())) {
                    if (!suggestions.has(text)) {
                        suggestions.set(text, { type: 'tag', count: item.count });
                    }
                }
            }
        });

        // Get suggestions from payment methods
        const paymentMethodAgg = await this.transactionModel.aggregate([
            { $match: { ...userQuery, paymentMethod: { $exists: true, $ne: null, $not: { $eq: '' } } } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        paymentMethodAgg.forEach((item) => {
            if (item._id && item._id.trim()) {
                const text = item._id.trim();
                if (!query || text.toLowerCase().includes(query.toLowerCase())) {
                    if (!suggestions.has(text)) {
                        suggestions.set(text, { type: 'paymentMethod', count: item.count });
                    }
                }
            }
        });

        // Convert to array, sort by count, and limit
        return Array.from(suggestions.entries())
            .map(([text, data]) => ({
                text,
                type: data.type as 'description' | 'note' | 'reference' | 'tag' | 'paymentMethod',
                count: data.count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get search analytics
     * 
     * Returns analytics about search patterns:
     * - Most common search terms (from descriptions, notes, references)
     * - Popular tags
     * - Popular payment methods
     * 
     * @param userId - User ID
     * @param limit - Maximum number of results per category
     * @returns Search analytics data
     */
    async getSearchAnalytics(
        userId: string,
        limit: number = 10,
    ): Promise<{
        popularDescriptions: Array<{ text: string; count: number }>;
        popularTags: Array<{ text: string; count: number }>;
        popularPaymentMethods: Array<{ text: string; count: number }>;
    }> {
        const userQuery = { userId: new Types.ObjectId(userId) };

        // Get popular descriptions
        const popularDescriptions = await this.transactionModel.aggregate([
            { $match: userQuery },
            {
                $group: {
                    _id: '$description',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        // Get popular tags
        const popularTags = await this.transactionModel.aggregate([
            { $match: { ...userQuery, tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        // Get popular payment methods
        const popularPaymentMethods = await this.transactionModel.aggregate([
            { $match: { ...userQuery, paymentMethod: { $exists: true, $ne: null, $not: { $eq: '' } } } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();

        return {
            popularDescriptions: popularDescriptions
                .filter((item) => item._id && item._id.trim())
                .map((item) => ({ text: item._id.trim(), count: item.count })),
            popularTags: popularTags
                .filter((item) => item._id && item._id.trim())
                .map((item) => ({ text: item._id.trim(), count: item.count })),
            popularPaymentMethods: popularPaymentMethods
                .filter((item) => item._id && item._id.trim())
                .map((item) => ({ text: item._id.trim(), count: item.count })),
        };
    }
}


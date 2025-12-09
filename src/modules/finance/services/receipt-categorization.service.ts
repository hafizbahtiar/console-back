import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MerchantCategory, MerchantCategoryDocument } from '../schemas/finance-merchant-category.schema';
import { Transaction, TransactionDocument } from '../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { ReceiptOcrData } from './receipt-ocr.service';

export interface CategorySuggestion {
    categoryId: string;
    categoryName: string;
    confidence: number;
    source: 'merchant_mapping' | 'transaction_history' | 'keyword_matching';
}

@Injectable()
export class ReceiptCategorizationService {
    private readonly logger = new Logger(ReceiptCategorizationService.name);

    // Common keywords for category matching
    private readonly categoryKeywords: Record<string, string[]> = {
        // Groceries
        'groceries': ['grocery', 'supermarket', 'food', 'market', 'walmart', 'target', 'kroger', 'safeway', 'whole foods'],
        // Restaurants
        'restaurant': ['restaurant', 'cafe', 'dining', 'food', 'pizza', 'burger', 'mcdonald', 'starbucks', 'subway'],
        // Gas
        'gas': ['gas', 'fuel', 'petrol', 'shell', 'bp', 'exxon', 'chevron', 'mobil'],
        // Pharmacy
        'pharmacy': ['pharmacy', 'drug', 'cvs', 'walgreens', 'rite aid'],
        // Retail
        'retail': ['store', 'shop', 'retail', 'mall', 'outlet'],
        // Utilities
        'utilities': ['electric', 'water', 'gas', 'utility', 'power'],
        // Transportation
        'transportation': ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'transit'],
    };

    constructor(
        @InjectModel(MerchantCategory.name) private merchantCategoryModel: Model<MerchantCategoryDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
    ) { }

    /**
     * Normalize merchant name for matching
     * - Convert to lowercase
     * - Trim whitespace
     * - Remove special characters (keep alphanumeric and spaces)
     * - Remove extra spaces
     */
    private normalizeMerchantName(merchantName: string): string {
        return merchantName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }

    /**
     * Suggest category for a receipt based on OCR data
     */
    async suggestCategory(userId: string, receiptOcrData: ReceiptOcrData): Promise<CategorySuggestion | null> {
        if (!receiptOcrData.merchantName?.value) {
            return null;
        }

        const merchantName = String(receiptOcrData.merchantName.value);
        const normalizedMerchantName = this.normalizeMerchantName(merchantName);

        this.logger.log(`Suggesting category for merchant: ${merchantName} (normalized: ${normalizedMerchantName})`);

        // Strategy 1: Check merchant category database (highest priority)
        const merchantMapping = await this.findMerchantMapping(userId, normalizedMerchantName);
        if (merchantMapping) {
            const category = await this.getCategoryById(userId, merchantMapping.categoryId.toString());
            if (category) {
                this.logger.log(`Found merchant mapping: ${merchantName} -> ${category.name} (confidence: ${merchantMapping.confidence})`);
                return {
                    categoryId: merchantMapping.categoryId.toString(),
                    categoryName: category.name,
                    confidence: merchantMapping.confidence,
                    source: 'merchant_mapping',
                };
            }
        }

        // Strategy 2: Check transaction history (medium priority)
        const historyMatch = await this.findCategoryFromHistory(userId, normalizedMerchantName);
        if (historyMatch) {
            this.logger.log(`Found category from history: ${merchantName} -> ${historyMatch.categoryName} (confidence: ${historyMatch.confidence})`);
            return historyMatch;
        }

        // Strategy 3: Keyword matching (lowest priority, lower confidence)
        const keywordMatch = await this.findCategoryFromKeywords(userId, receiptOcrData);
        if (keywordMatch) {
            this.logger.log(`Found category from keywords: ${merchantName} -> ${keywordMatch.categoryName} (confidence: ${keywordMatch.confidence})`);
            return keywordMatch;
        }

        this.logger.log(`No category suggestion found for merchant: ${merchantName}`);
        return null;
    }

    /**
     * Find merchant mapping in database
     */
    private async findMerchantMapping(userId: string, normalizedMerchantName: string): Promise<MerchantCategoryDocument | null> {
        return this.merchantCategoryModel
            .findOne({
                userId: new Types.ObjectId(userId),
                merchantName: normalizedMerchantName,
            })
            .exec();
    }

    /**
     * Find category from transaction history
     * Looks for transactions with similar merchant names in description
     */
    private async findCategoryFromHistory(userId: string, normalizedMerchantName: string): Promise<CategorySuggestion | null> {
        // Search for transactions where description contains the merchant name
        const transactions = await this.transactionModel
            .find({
                userId: new Types.ObjectId(userId),
                categoryId: { $exists: true, $ne: null },
                description: { $regex: normalizedMerchantName, $options: 'i' },
            })
            .limit(10)
            .sort({ date: -1 }) // Most recent first
            .exec();

        if (transactions.length === 0) {
            return null;
        }

        // Count category occurrences
        const categoryCounts = new Map<string, number>();
        for (const transaction of transactions) {
            if (transaction.categoryId) {
                const categoryId = transaction.categoryId.toString();
                categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
            }
        }

        // Find most common category
        let mostCommonCategoryId: string | null = null;
        let maxCount = 0;
        for (const [categoryId, count] of categoryCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonCategoryId = categoryId;
            }
        }

        if (!mostCommonCategoryId) {
            return null;
        }

        // Calculate confidence based on match count and recency
        const confidence = Math.min(0.7, 0.4 + (maxCount / transactions.length) * 0.3);

        const category = await this.getCategoryById(userId, mostCommonCategoryId);
        if (!category) {
            return null;
        }

        return {
            categoryId: mostCommonCategoryId,
            categoryName: category.name,
            confidence,
            source: 'transaction_history',
        };
    }

    /**
     * Find category from keywords in receipt items
     */
    private async findCategoryFromKeywords(userId: string, receiptOcrData: ReceiptOcrData): Promise<CategorySuggestion | null> {
        // Extract keywords from merchant name and items
        const keywords: string[] = [];

        if (receiptOcrData.merchantName?.value) {
            const merchantName = String(receiptOcrData.merchantName.value).toLowerCase();
            keywords.push(...merchantName.split(/\s+/));
        }

        if (receiptOcrData.items) {
            for (const item of receiptOcrData.items) {
                const itemText = item.description.toLowerCase();
                keywords.push(...itemText.split(/\s+/));
            }
        }

        // Match keywords against category keywords
        const categoryMatches = new Map<string, number>();
        for (const keyword of keywords) {
            for (const [categoryKeyword, keywordList] of Object.entries(this.categoryKeywords)) {
                if (keywordList.some(k => keyword.includes(k) || k.includes(keyword))) {
                    categoryMatches.set(categoryKeyword, (categoryMatches.get(categoryKeyword) || 0) + 1);
                }
            }
        }

        if (categoryMatches.size === 0) {
            return null;
        }

        // Find best matching category keyword
        let bestMatch: string | null = null;
        let maxMatches = 0;
        for (const [categoryKeyword, matchCount] of categoryMatches.entries()) {
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
                bestMatch = categoryKeyword;
            }
        }

        if (!bestMatch) {
            return null;
        }

        // Try to find a user category that matches the keyword
        // This is a simplified approach - in production, you might want a more sophisticated mapping
        const userCategories = await this.getAllCategories(userId);
        const matchingCategory = userCategories.find(cat =>
            cat.name.toLowerCase().includes(bestMatch) ||
            bestMatch.includes(cat.name.toLowerCase())
        );

        if (!matchingCategory) {
            return null;
        }

        // Low confidence for keyword matching
        const confidence = Math.min(0.5, 0.3 + (maxMatches / keywords.length) * 0.2);

        return {
            categoryId: matchingCategory.id,
            categoryName: matchingCategory.name,
            confidence,
            source: 'keyword_matching',
        };
    }

    /**
     * Get category by ID (checks both expense and income categories)
     */
    async getCategoryById(userId: string, categoryId: string): Promise<{ id: string; name: string } | null> {
        const expenseCategory = await this.expenseCategoryModel
            .findOne({
                _id: new Types.ObjectId(categoryId),
                userId: new Types.ObjectId(userId),
            })
            .exec();

        if (expenseCategory) {
            return { id: expenseCategory._id.toString(), name: expenseCategory.name };
        }

        const incomeCategory = await this.incomeCategoryModel
            .findOne({
                _id: new Types.ObjectId(categoryId),
                userId: new Types.ObjectId(userId),
            })
            .exec();

        if (incomeCategory) {
            return { id: incomeCategory._id.toString(), name: incomeCategory.name };
        }

        return null;
    }

    /**
     * Get all categories for a user (both expense and income)
     */
    private async getAllCategories(userId: string): Promise<Array<{ id: string; name: string }>> {
        const expenseCategories = await this.expenseCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .exec();

        const incomeCategories = await this.incomeCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .exec();

        return [
            ...expenseCategories.map(cat => ({ id: cat._id.toString(), name: cat.name })),
            ...incomeCategories.map(cat => ({ id: cat._id.toString(), name: cat.name })),
        ];
    }

    /**
     * Update or create merchant-to-category mapping
     */
    async updateMerchantMapping(
        userId: string,
        merchantName: string,
        categoryId: string,
    ): Promise<MerchantCategoryDocument> {
        const normalizedMerchantName = this.normalizeMerchantName(merchantName);

        // Find existing mapping
        let merchantMapping = await this.merchantCategoryModel
            .findOne({
                userId: new Types.ObjectId(userId),
                merchantName: normalizedMerchantName,
            })
            .exec();

        if (merchantMapping) {
            // Update existing mapping
            merchantMapping.matchCount += 1;
            merchantMapping.lastUsedAt = new Date();
            // Increase confidence based on match count (capped at 0.95)
            merchantMapping.confidence = Math.min(0.95, 0.5 + (merchantMapping.matchCount * 0.05));
            return merchantMapping.save();
        } else {
            // Create new mapping
            merchantMapping = new this.merchantCategoryModel({
                userId: new Types.ObjectId(userId),
                merchantName: normalizedMerchantName,
                categoryId: new Types.ObjectId(categoryId),
                matchCount: 1,
                confidence: 0.5, // Initial confidence
                lastUsedAt: new Date(),
            });
            return merchantMapping.save();
        }
    }

    /**
     * Get all merchant category mappings for a user
     */
    async getMerchantMappings(
        userId: string,
        limit: number = 50,
    ): Promise<Array<{
        id: string;
        merchantName: string;
        categoryId: string;
        categoryName: string;
        matchCount: number;
        confidence: number;
        lastUsedAt: Date;
    }>> {
        const mappings = await this.merchantCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ confidence: -1, lastUsedAt: -1 })
            .limit(limit)
            .exec();

        // Populate category names
        const result = await Promise.all(
            mappings.map(async (mapping) => {
                const category = await this.getCategoryById(userId, mapping.categoryId.toString());
                return {
                    id: mapping._id.toString(),
                    merchantName: mapping.merchantName,
                    categoryId: mapping.categoryId.toString(),
                    categoryName: category?.name || 'Unknown',
                    matchCount: mapping.matchCount,
                    confidence: mapping.confidence,
                    lastUsedAt: mapping.lastUsedAt,
                };
            })
        );

        return result;
    }

    /**
     * Create a new merchant category mapping
     */
    async create(userId: string, merchantName: string, categoryId: string): Promise<MerchantCategoryDocument> {
        // Validate category exists and belongs to user
        const category = await this.getCategoryById(userId, categoryId);
        if (!category) {
            throw new BadRequestException('Category not found or does not belong to you');
        }

        const normalizedMerchantName = this.normalizeMerchantName(merchantName);

        // Check if mapping already exists
        const existing = await this.merchantCategoryModel
            .findOne({
                userId: new Types.ObjectId(userId),
                merchantName: normalizedMerchantName,
            })
            .exec();

        if (existing) {
            throw new BadRequestException('Merchant category mapping already exists');
        }

        const merchantMapping = new this.merchantCategoryModel({
            userId: new Types.ObjectId(userId),
            merchantName: normalizedMerchantName,
            categoryId: new Types.ObjectId(categoryId),
            matchCount: 1,
            confidence: 0.5,
            lastUsedAt: new Date(),
        });

        return merchantMapping.save();
    }

    /**
     * Get all merchant category mappings for a user (with full document details)
     */
    async findAll(userId: string): Promise<MerchantCategoryDocument[]> {
        return this.merchantCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ confidence: -1, lastUsedAt: -1 })
            .exec();
    }

    /**
     * Get a single merchant category mapping by ID
     */
    async findOne(userId: string, id: string): Promise<MerchantCategoryDocument> {
        const mapping = await this.merchantCategoryModel.findById(id).exec();
        if (!mapping) {
            throw new NotFoundException('Merchant category mapping not found');
        }

        if (mapping.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own merchant category mappings');
        }

        return mapping;
    }

    /**
     * Update a merchant category mapping
     */
    async update(
        userId: string,
        id: string,
        merchantName?: string,
        categoryId?: string,
    ): Promise<MerchantCategoryDocument> {
        const mapping = await this.findOne(userId, id);

        if (categoryId) {
            // Validate category exists and belongs to user
            const category = await this.getCategoryById(userId, categoryId);
            if (!category) {
                throw new BadRequestException('Category not found or does not belong to you');
            }
            mapping.categoryId = new Types.ObjectId(categoryId);
        }

        if (merchantName) {
            const normalizedMerchantName = this.normalizeMerchantName(merchantName);
            // Check if another mapping with this name exists
            const existing = await this.merchantCategoryModel
                .findOne({
                    userId: new Types.ObjectId(userId),
                    merchantName: normalizedMerchantName,
                    _id: { $ne: new Types.ObjectId(id) },
                })
                .exec();

            if (existing) {
                throw new BadRequestException('Merchant category mapping with this name already exists');
            }
            mapping.merchantName = normalizedMerchantName;
        }

        return mapping.save();
    }

    /**
     * Delete a merchant category mapping (soft delete)
     */
    async remove(userId: string, id: string): Promise<void> {
        const mapping = await this.findOne(userId, id);
        // Soft delete
        (mapping as any).deletedAt = new Date();
        await mapping.save();
    }
}


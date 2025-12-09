import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { TransactionTemplate, TransactionTemplateDocument } from '../schemas/finance-transaction-template.schema';
import { CreateTransactionDto } from '../dto/transactions/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/transactions/update-transaction.dto';
import { CreateTransactionTemplateDto } from '../dto/transaction-templates/create-transaction-template.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';
import { FileUploadService } from '../../upload/services/file-upload.service';
import { UploadedFile } from '../../upload/interfaces/file-upload-options.interface';
import { ReceiptOcrService, ReceiptOcrData } from './receipt-ocr.service';
import { ReceiptCategorizationService } from './receipt-categorization.service';
import { ExchangeRateService } from './exchange-rate.service';
import { getDefaultCurrency } from '../common/currency-codes';
import { CurrencyPreferencesService } from '../../settings/services/currency-preferences.service';

export interface TransactionFilters {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    tags?: string[];
    paymentMethod?: string;
    currency?: string; // Filter by currency code
}

export interface TransactionSortOptions {
    field?: 'date' | 'amount' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
}

@Injectable()
export class FinanceTransactionsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
        @InjectModel(TransactionTemplate.name) private transactionTemplateModel: Model<TransactionTemplateDocument>,
        private readonly fileUploadService: FileUploadService,
        private readonly receiptOcrService: ReceiptOcrService,
        private readonly receiptCategorizationService: ReceiptCategorizationService,
        private readonly exchangeRateService: ExchangeRateService,
        private readonly currencyPreferencesService: CurrencyPreferencesService,
    ) { }

    async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
        // Validate date
        const transactionDate = new Date(createTransactionDto.date);
        if (isNaN(transactionDate.getTime())) {
            throw new BadRequestException('Invalid date format');
        }

        // Validate category relationship if categoryId is provided
        if (createTransactionDto.categoryId) {
            await this.validateCategoryRelationship(
                userId,
                createTransactionDto.categoryId,
                createTransactionDto.type,
            );
        }

        // Round amount to 2 decimal places for financial precision
        const amount = Math.round(createTransactionDto.amount * 100) / 100;

        // Get user's base currency preference
        let userBaseCurrency: string;
        try {
            const currencyPrefs = await this.currencyPreferencesService.getCurrencyPreferences(userId);
            userBaseCurrency = currencyPrefs.baseCurrency.toUpperCase();
        } catch (error) {
            // Fallback to default if user preferences not found
            userBaseCurrency = getDefaultCurrency();
        }

        // Set transaction currency (default to user's base currency if not provided)
        const currency = (createTransactionDto.currency || userBaseCurrency).toUpperCase();
        
        // Set base currency (use user's preference or provided value)
        const baseCurrency = (createTransactionDto.baseCurrency || userBaseCurrency).toUpperCase();

        // Calculate exchange rate and base amount if currency differs from base currency
        let exchangeRate: number | undefined;
        let baseAmount: number | undefined;

        if (currency !== baseCurrency) {
            // Get exchange rate from transaction currency to base currency
            exchangeRate = await this.exchangeRateService.getExchangeRate(currency, baseCurrency, transactionDate);
            baseAmount = await this.exchangeRateService.convertAmount(amount, currency, baseCurrency, transactionDate);
        } else {
            // Same currency: exchange rate is 1.0, base amount equals amount
            exchangeRate = 1.0;
            baseAmount = amount;
        }

        // Use provided exchange rate if explicitly set (allows manual override)
        if (createTransactionDto.exchangeRate !== undefined && createTransactionDto.exchangeRate !== null) {
            exchangeRate = createTransactionDto.exchangeRate;
            baseAmount = amount * exchangeRate;
            baseAmount = Math.round(baseAmount * 100) / 100; // Round to 2 decimal places
        }

        // Use provided base amount if explicitly set (allows manual override)
        if (createTransactionDto.baseAmount !== undefined && createTransactionDto.baseAmount !== null) {
            baseAmount = createTransactionDto.baseAmount;
        }

        const transaction = new this.transactionModel({
            ...createTransactionDto,
            amount,
            currency,
            baseCurrency,
            exchangeRate,
            baseAmount,
            userId: new Types.ObjectId(userId),
            date: transactionDate,
            categoryId: createTransactionDto.categoryId ? new Types.ObjectId(createTransactionDto.categoryId) : undefined,
        });
        return transaction.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        filters?: TransactionFilters,
        sortOptions?: TransactionSortOptions,
    ): Promise<{ transactions: TransactionDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const query: any = { userId: new Types.ObjectId(userId) };

        // Apply filters
        if (filters) {
            if (filters.type) {
                query.type = filters.type;
            }

            if (filters.categoryId) {
                query.categoryId = new Types.ObjectId(filters.categoryId);
            }

            if (filters.startDate || filters.endDate) {
                query.date = {};
                if (filters.startDate) {
                    query.date.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.date.$lte = new Date(filters.endDate);
                }
            }

            if (filters.search) {
                query.$or = [
                    { description: { $regex: filters.search, $options: 'i' } },
                    { notes: { $regex: filters.search, $options: 'i' } },
                    { reference: { $regex: filters.search, $options: 'i' } },
                ];
            }

            if (filters.tags && filters.tags.length > 0) {
                query.tags = { $in: filters.tags };
            }

            if (filters.paymentMethod) {
                query.paymentMethod = filters.paymentMethod;
            }

            if (filters.currency) {
                query.currency = filters.currency.toUpperCase();
            }
        }

        // Build sort
        const sortField = sortOptions?.field || 'date';
        const sortOrder = sortOptions?.order === 'asc' ? 1 : -1;
        const sort: any = { [sortField]: sortOrder };

        // If sorting by date, add secondary sort by createdAt for consistency
        if (sortField === 'date') {
            sort.createdAt = -1;
        }

        const [transactions, total] = await Promise.all([
            this.transactionModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.transactionModel.countDocuments(query).exec(),
        ]);

        return {
            transactions,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<TransactionDocument> {
        const transaction = await this.transactionModel.findById(id).exec();
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own transactions');
        }

        return transaction;
    }

    async update(userId: string, id: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDocument> {
        const transaction = await this.findOne(userId, id);

        // Convert date string to Date object if provided
        const updateData: any = { ...updateTransactionDto };
        if (updateTransactionDto.date) {
            const transactionDate = new Date(updateTransactionDto.date);
            if (isNaN(transactionDate.getTime())) {
                throw new BadRequestException('Invalid date format');
            }
            updateData.date = transactionDate;
        }

        // Round amount to 2 decimal places if provided
        if (updateTransactionDto.amount !== undefined) {
            updateData.amount = Math.round(updateTransactionDto.amount * 100) / 100;
        }

        // Uppercase currency codes if provided
        if (updateTransactionDto.currency !== undefined) {
            updateData.currency = updateTransactionDto.currency.toUpperCase();
        }
        if (updateTransactionDto.baseCurrency !== undefined) {
            updateData.baseCurrency = updateTransactionDto.baseCurrency.toUpperCase();
        }

        // Validate category relationship if categoryId is being updated
        if (updateTransactionDto.categoryId !== undefined) {
            if (updateTransactionDto.categoryId && updateTransactionDto.categoryId !== '') {
                // Validate the new category
                const transactionType = updateTransactionDto.type || transaction.type;
                await this.validateCategoryRelationship(
                    userId,
                    updateTransactionDto.categoryId,
                    transactionType,
                );
                updateData.categoryId = new Types.ObjectId(updateTransactionDto.categoryId);
            } else {
                // Remove category
                updateData.categoryId = undefined;
            }
        } else if (updateTransactionDto.type && transaction.categoryId) {
            // If type is being changed, validate that existing category matches new type
            await this.validateCategoryRelationship(
                userId,
                transaction.categoryId.toString(),
                updateTransactionDto.type,
            );
        }

        Object.assign(transaction, updateData);
        return transaction.save();
    }

    /**
     * Validate category relationship
     * Ensures category exists, belongs to user, and matches transaction type
     */
    private async validateCategoryRelationship(
        userId: string,
        categoryId: string,
        transactionType: TransactionType,
    ): Promise<void> {
        if (!categoryId) {
            return; // Category is optional
        }

        let category: ExpenseCategoryDocument | IncomeCategoryDocument | null = null;

        if (transactionType === TransactionType.EXPENSE) {
            category = await this.expenseCategoryModel.findOne({
                _id: new Types.ObjectId(categoryId),
                userId: new Types.ObjectId(userId),
            }).exec();

            if (!category) {
                throw new BadRequestException(
                    'Expense category not found or does not belong to you. Please select a valid expense category.',
                );
            }
        } else if (transactionType === TransactionType.INCOME) {
            category = await this.incomeCategoryModel.findOne({
                _id: new Types.ObjectId(categoryId),
                userId: new Types.ObjectId(userId),
            }).exec();

            if (!category) {
                throw new BadRequestException(
                    'Income category not found or does not belong to you. Please select a valid income category.',
                );
            }
        } else {
            throw new BadRequestException('Invalid transaction type');
        }
    }

    async remove(userId: string, id: string): Promise<void> {
        const transaction = await this.findOne(userId, id);
        // Soft delete
        (transaction as any).deletedAt = new Date();
        await transaction.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.transactionModel, userId, ids);
    }

    async restore(userId: string, id: string): Promise<TransactionDocument> {
        const transaction = await this.transactionModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            deletedAt: { $ne: null },
        }).exec();

        if (!transaction) {
            throw new NotFoundException('Deleted transaction not found');
        }

        (transaction as any).deletedAt = null;
        return transaction.save();
    }

    /**
     * Get transaction statistics
     */
    async getStatistics(
        userId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netAmount: number;
        transactionCount: number;
    }> {
        const query: any = { userId: new Types.ObjectId(userId) };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const [incomeResult, expenseResult, countResult] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]).exec(),
            this.transactionModel.countDocuments(query).exec(),
        ]);

        const totalIncome = incomeResult[0]?.total || 0;
        const totalExpenses = expenseResult[0]?.total || 0;
        const netAmount = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            netAmount,
            transactionCount: countResult,
        };
    }

    /**
     * Save a transaction as a template
     * Creates a new transaction template from an existing transaction
     */
    async saveAsTemplate(
        userId: string,
        transactionId: string,
        templateName: string,
        templateCategory?: string,
    ): Promise<TransactionTemplateDocument> {
        const transaction = await this.findOne(userId, transactionId);

        // Create template from transaction
        const template = new this.transactionTemplateModel({
            name: templateName,
            amount: transaction.amount,
            description: transaction.description,
            type: transaction.type,
            categoryId: transaction.categoryId,
            notes: transaction.notes,
            tags: transaction.tags || [],
            paymentMethod: transaction.paymentMethod,
            reference: transaction.reference,
            category: templateCategory,
            userId: new Types.ObjectId(userId),
            usageCount: 0,
        });

        return template.save();
    }

    /**
     * Create a transaction from a template
     * Also increments the template's usage count
     */
    async createFromTemplate(
        userId: string,
        templateId: string,
        date: string,
    ): Promise<TransactionDocument> {
        const template = await this.transactionTemplateModel.findById(templateId).exec();
        if (!template) {
            throw new NotFoundException('Transaction template not found');
        }

        if (template.userId.toString() !== userId) {
            throw new ForbiddenException('You can only use your own transaction templates');
        }

        // Validate date
        const transactionDate = new Date(date);
        if (isNaN(transactionDate.getTime())) {
            throw new BadRequestException('Invalid date format');
        }

        // Create transaction from template
        const createTransactionDto: CreateTransactionDto = {
            amount: template.amount,
            date,
            description: template.description,
            type: template.type,
            categoryId: template.categoryId?.toString(),
            notes: template.notes,
            tags: template.tags || [],
            paymentMethod: template.paymentMethod,
            reference: template.reference,
            currency: getDefaultCurrency(), // Default to MYR for template-generated transactions
        };

        // Create the transaction
        const transaction = await this.create(userId, createTransactionDto);

        // Increment template usage
        template.usageCount = (template.usageCount || 0) + 1;
        template.lastUsedAt = new Date();
        await template.save();

        return transaction;
    }

    /**
     * Duplicate a transaction
     * Creates a copy of an existing transaction with optional date adjustment
     */
    async duplicate(
        userId: string,
        transactionId: string,
        dateAdjustment?: number, // Number of days to add/subtract from original date
    ): Promise<TransactionDocument> {
        const originalTransaction = await this.findOne(userId, transactionId);

        // Calculate new date if adjustment provided
        let newDate = new Date(originalTransaction.date);
        if (dateAdjustment !== undefined && dateAdjustment !== 0) {
            newDate = new Date(newDate.getTime() + dateAdjustment * 24 * 60 * 60 * 1000);
        }

        // Create duplicate transaction
        const duplicateTransaction = new this.transactionModel({
            userId: new Types.ObjectId(userId),
            amount: originalTransaction.amount,
            date: newDate,
            description: originalTransaction.description,
            type: originalTransaction.type,
            categoryId: originalTransaction.categoryId,
            notes: originalTransaction.notes,
            tags: originalTransaction.tags || [],
            paymentMethod: originalTransaction.paymentMethod,
            reference: originalTransaction.reference,
            // Note: recurringTransactionId is not copied - duplicates are independent
        });

        return duplicateTransaction.save();
    }

    /**
     * Bulk duplicate transactions
     * Creates copies of multiple transactions with optional date adjustment
     */
    async bulkDuplicate(
        userId: string,
        transactionIds: string[],
        dateAdjustment?: number,
    ): Promise<{ duplicatedCount: number; failedIds: string[]; transactions: TransactionDocument[] }> {
        const duplicatedTransactions: TransactionDocument[] = [];
        const failedIds: string[] = [];

        for (const id of transactionIds) {
            try {
                const duplicated = await this.duplicate(userId, id, dateAdjustment);
                duplicatedTransactions.push(duplicated);
            } catch (error) {
                failedIds.push(id);
            }
        }

        return {
            duplicatedCount: duplicatedTransactions.length,
            failedIds,
            transactions: duplicatedTransactions,
        };
    }

    /**
     * Upload receipt for a transaction
     */
    async uploadReceipt(
        userId: string,
        transactionId: string,
        file: Express.Multer.File,
    ): Promise<TransactionDocument> {
        const transaction = await this.findOne(userId, transactionId);

        // Validate file type (only images and PDFs)
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.',
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size exceeds maximum limit of 10MB');
        }

        // Upload file
        const uploadedFile: UploadedFile = await this.fileUploadService.uploadFile(file, {
            destination: 'receipts',
            allowedMimeTypes,
            maxSize,
        });

        // Update transaction with receipt information
        transaction.receiptUrl = uploadedFile.url;
        transaction.receiptFilename = uploadedFile.originalName;
        transaction.receiptMimetype = uploadedFile.mimetype;
        transaction.receiptSize = uploadedFile.size;
        transaction.receiptUploadedAt = new Date();

        return transaction.save();
    }

    /**
     * Delete receipt from a transaction
     */
    async deleteReceipt(userId: string, transactionId: string): Promise<TransactionDocument> {
        const transaction = await this.findOne(userId, transactionId);

        if (!transaction.receiptUrl) {
            throw new NotFoundException('No receipt found for this transaction');
        }

        // Delete file from storage
        try {
            // Extract file path from URL and delete
            // Note: This assumes the URL structure matches the file path
            // Adjust based on your file storage implementation
            if (transaction.receiptUrl) {
                // The FileUploadService doesn't have a delete method yet,
                // but we can add it or handle deletion here
                // For now, we'll just clear the receipt fields
            }
        } catch (error) {
            // Log error but continue with clearing receipt fields
            console.error('Error deleting receipt file:', error);
        }

        // Clear receipt fields
        transaction.receiptUrl = undefined;
        transaction.receiptFilename = undefined;
        transaction.receiptMimetype = undefined;
        transaction.receiptSize = undefined;
        transaction.receiptUploadedAt = undefined;

        return transaction.save();
    }

    /**
     * Get receipt download URL (returns the receipt URL)
     */
    async getReceiptUrl(userId: string, transactionId: string): Promise<string> {
        const transaction = await this.findOne(userId, transactionId);

        if (!transaction.receiptUrl) {
            throw new NotFoundException('No receipt found for this transaction');
        }

        return transaction.receiptUrl;
    }

    /**
     * Extract receipt data using OCR
     * Downloads the receipt image, runs OCR, and stores extracted data (not applied)
     */
    async extractReceiptOcr(userId: string, transactionId: string): Promise<ReceiptOcrData> {
        // 1. Get transaction (verify ownership)
        const transaction = await this.findOne(userId, transactionId);

        // 2. Check if receipt exists
        if (!transaction.receiptUrl) {
            throw new NotFoundException('No receipt found for this transaction');
        }

        // 3. Extract data using OCR
        const receiptOcrData = await this.receiptOcrService.extractReceiptData(transaction.receiptUrl);

        // 4. Suggest category based on OCR data
        const categorySuggestion = await this.receiptCategorizationService.suggestCategory(userId, receiptOcrData);
        if (categorySuggestion) {
            transaction.suggestedCategoryId = new Types.ObjectId(categorySuggestion.categoryId);
            transaction.suggestedCategoryConfidence = categorySuggestion.confidence;
        }

        // 5. Convert ReceiptOcrData format to schema format
        const ocrDataForStorage = this.convertOcrDataToSchemaFormat(receiptOcrData);

        // 6. Store extracted data (as draft, not applied)
        transaction.receiptOcrData = ocrDataForStorage;
        await transaction.save();

        // 7. Return extracted data for user review
        return receiptOcrData;
    }

    /**
     * Get current OCR data for a transaction
     */
    async getReceiptOcr(userId: string, transactionId: string): Promise<ReceiptOcrData | null> {
        const transaction = await this.findOne(userId, transactionId);

        if (!transaction.receiptOcrData) {
            return null;
        }

        // Convert schema format back to ReceiptOcrData format
        return this.convertSchemaFormatToOcrData(transaction.receiptOcrData);
    }

    /**
     * Apply OCR data to transaction fields (after user review)
     * @param userId - User ID
     * @param transactionId - Transaction ID
     * @param ocrData - User-corrected OCR data (optional, uses stored data if not provided)
     * @param fieldsToApply - Array of field names to apply (optional, applies all if not provided)
     */
    async applyOcrData(
        userId: string,
        transactionId: string,
        ocrData?: Partial<ReceiptOcrData>,
        fieldsToApply?: string[],
    ): Promise<TransactionDocument> {
        // 1. Get transaction
        const transaction = await this.findOne(userId, transactionId);

        // 2. Get OCR data (use provided or stored)
        let dataToApply: ReceiptOcrData;
        if (ocrData) {
            // Merge provided data with stored data
            const storedData = transaction.receiptOcrData
                ? this.convertSchemaFormatToOcrData(transaction.receiptOcrData)
                : null;
            dataToApply = { ...storedData, ...ocrData } as ReceiptOcrData;
        } else if (transaction.receiptOcrData) {
            dataToApply = this.convertSchemaFormatToOcrData(transaction.receiptOcrData);
        } else {
            throw new NotFoundException('No OCR data found for this transaction');
        }

        // 3. Determine which fields to apply
        const fields = fieldsToApply || ['amount', 'date', 'description', 'categoryId', 'paymentMethod'];

        // 4. Apply fields to transaction
        if (fields.includes('amount') && dataToApply.totalAmount?.value !== undefined) {
            const amount = typeof dataToApply.totalAmount.value === 'number'
                ? dataToApply.totalAmount.value
                : parseFloat(String(dataToApply.totalAmount.value));
            if (!isNaN(amount) && amount > 0) {
                transaction.amount = Math.round(amount * 100) / 100;
            }
        }

        if (fields.includes('date') && dataToApply.date?.value) {
            const dateValue = dataToApply.date.value;
            if (typeof dateValue === 'string') {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    transaction.date = date;
                }
            }
        }

        if (fields.includes('description') && dataToApply.merchantName?.value) {
            const merchantName = String(dataToApply.merchantName.value);
            if (merchantName.trim()) {
                transaction.description = merchantName.trim();
            }
        }

        if (fields.includes('categoryId') && transaction.suggestedCategoryId) {
            // Validate category relationship
            await this.validateCategoryRelationship(
                userId,
                transaction.suggestedCategoryId.toString(),
                transaction.type,
            );
            transaction.categoryId = transaction.suggestedCategoryId;

            // Learn from user selection: Update merchant mapping
            if (dataToApply.merchantName?.value) {
                const merchantName = String(dataToApply.merchantName.value);
                try {
                    await this.receiptCategorizationService.updateMerchantMapping(
                        userId,
                        merchantName,
                        transaction.suggestedCategoryId.toString(),
                    );
                } catch (error) {
                    // Log error but don't fail the transaction update
                    // This is a learning mechanism, so failures shouldn't block the main operation
                    console.error('Failed to update merchant mapping:', error);
                }
            }
        }

        if (fields.includes('paymentMethod') && dataToApply.paymentMethod?.value) {
            const paymentMethod = String(dataToApply.paymentMethod.value);
            if (paymentMethod.trim()) {
                transaction.paymentMethod = paymentMethod.trim();
            }
        }

        // 5. Mark OCR as applied
        transaction.ocrApplied = true;
        transaction.ocrAppliedAt = new Date();

        // 6. Save and return
        return transaction.save();
    }

    /**
     * Discard OCR data without applying it
     */
    async discardOcrData(userId: string, transactionId: string): Promise<TransactionDocument> {
        const transaction = await this.findOne(userId, transactionId);

        // Clear OCR data
        transaction.receiptOcrData = undefined;
        transaction.suggestedCategoryId = undefined;
        transaction.suggestedCategoryConfidence = undefined;
        transaction.ocrApplied = false;
        transaction.ocrAppliedAt = undefined;

        return transaction.save();
    }

    /**
     * Convert ReceiptOcrData (with ReceiptOcrField) to schema format (plain values)
     */
    private convertOcrDataToSchemaFormat(ocrData: ReceiptOcrData): Transaction['receiptOcrData'] {
        return {
            merchantName: ocrData.merchantName?.value ? String(ocrData.merchantName.value) : undefined,
            merchantAddress: ocrData.merchantAddress?.value ? String(ocrData.merchantAddress.value) : undefined,
            date: ocrData.date?.value
                ? (typeof ocrData.date.value === 'string' ? new Date(ocrData.date.value) : ocrData.date.value as Date)
                : undefined,
            totalAmount: ocrData.totalAmount?.value
                ? (typeof ocrData.totalAmount.value === 'number'
                    ? ocrData.totalAmount.value
                    : parseFloat(String(ocrData.totalAmount.value)))
                : undefined,
            taxAmount: ocrData.taxAmount?.value
                ? (typeof ocrData.taxAmount.value === 'number'
                    ? ocrData.taxAmount.value
                    : parseFloat(String(ocrData.taxAmount.value)))
                : undefined,
            subtotal: ocrData.subtotal?.value
                ? (typeof ocrData.subtotal.value === 'number'
                    ? ocrData.subtotal.value
                    : parseFloat(String(ocrData.subtotal.value)))
                : undefined,
            items: ocrData.items?.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            })),
            paymentMethod: ocrData.paymentMethod?.value ? String(ocrData.paymentMethod.value) : undefined,
            receiptNumber: ocrData.receiptNumber?.value ? String(ocrData.receiptNumber.value) : undefined,
            confidence: ocrData.overallConfidence,
        };
    }

    /**
     * Convert schema format (plain values) back to ReceiptOcrData format (with ReceiptOcrField)
     */
    private convertSchemaFormatToOcrData(schemaData: NonNullable<Transaction['receiptOcrData']>): ReceiptOcrData {
        return {
            merchantName: schemaData.merchantName
                ? { value: schemaData.merchantName, confidence: schemaData.confidence || 0.75 }
                : undefined,
            merchantAddress: schemaData.merchantAddress
                ? { value: schemaData.merchantAddress, confidence: schemaData.confidence || 0.70 }
                : undefined,
            date: schemaData.date
                ? { value: schemaData.date instanceof Date ? schemaData.date.toISOString().split('T')[0] : String(schemaData.date), confidence: schemaData.confidence || 0.80 }
                : undefined,
            totalAmount: schemaData.totalAmount !== undefined
                ? { value: schemaData.totalAmount, confidence: schemaData.confidence || 0.85 }
                : undefined,
            taxAmount: schemaData.taxAmount !== undefined
                ? { value: schemaData.taxAmount, confidence: schemaData.confidence || 0.75 }
                : undefined,
            subtotal: schemaData.subtotal !== undefined
                ? { value: schemaData.subtotal, confidence: schemaData.confidence || 0.75 }
                : undefined,
            items: schemaData.items?.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                confidence: schemaData.confidence || 0.70,
            })),
            paymentMethod: schemaData.paymentMethod
                ? { value: schemaData.paymentMethod, confidence: schemaData.confidence || 0.70 }
                : undefined,
            receiptNumber: schemaData.receiptNumber
                ? { value: schemaData.receiptNumber, confidence: schemaData.confidence || 0.70 }
                : undefined,
            overallConfidence: schemaData.confidence || 0,
        };
    }
}


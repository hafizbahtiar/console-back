import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { ImportHistory, ImportHistoryDocument } from '../schemas/finance-import-history.schema';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import { isValidCurrencyCode, getDefaultCurrency } from '../common/currency-codes';

export interface ColumnMapping {
    date?: string;
    type?: string;
    amount?: string;
    description?: string;
    category?: string;
    notes?: string;
    tags?: string;
    paymentMethod?: string;
    reference?: string;
    currency?: string; // Optional currency column mapping
}

export interface ImportPreview {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; errors: string[] }>;
    sample: any[];
}

export interface ImportResult {
    importedCount: number;
    failedCount: number;
    errors: string[];
}

@Injectable()
export class FinanceImportService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
        @InjectModel(ImportHistory.name) private importHistoryModel: Model<ImportHistoryDocument>,
    ) { }

    /**
     * Parse CSV file and return preview
     */
    async previewCsvImport(
        fileBuffer: Buffer,
        columnMapping: ColumnMapping,
    ): Promise<ImportPreview> {
        try {
            const records = parse(fileBuffer.toString('utf-8'), {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            return this.validateAndPreview(records, columnMapping);
        } catch (error) {
            throw new BadRequestException(`Failed to parse CSV file: ${error.message}`);
        }
    }

    /**
     * Parse Excel file and return preview
     */
    async previewExcelImport(
        fileBuffer: Buffer,
        columnMapping: ColumnMapping,
    ): Promise<ImportPreview> {
        try {
            const workbook = new ExcelJS.Workbook();
            // ExcelJS accepts Buffer, ArrayBuffer, or Stream
            await workbook.xlsx.load(fileBuffer as any);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new BadRequestException('Excel file must contain at least one worksheet');
            }

            const records: any[] = [];
            const headers: string[] = [];

            // Read headers from first row
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[colNumber - 1] = cell.value?.toString() || '';
            });

            // Read data rows
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const row = worksheet.getRow(rowNumber);
                const record: any = {};

                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) {
                        record[header] = cell.value?.toString() || '';
                    }
                });

                // Only add non-empty rows
                if (Object.keys(record).length > 0) {
                    records.push(record);
                }
            }

            return this.validateAndPreview(records, columnMapping);
        } catch (error) {
            throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
        }
    }

    /**
     * Validate and preview import data
     */
    private validateAndPreview(records: any[], columnMapping: ColumnMapping): ImportPreview {
        const errors: Array<{ row: number; errors: string[] }> = [];
        const validRows: any[] = [];
        let validCount = 0;

        records.forEach((record, index) => {
            const rowErrors: string[] = [];
            const rowNumber = index + 2; // +2 because index is 0-based and we skip header

            // Validate required fields
            if (!columnMapping.date || !record[columnMapping.date]) {
                rowErrors.push('Date is required');
            } else {
                const date = new Date(record[columnMapping.date]);
                if (isNaN(date.getTime())) {
                    rowErrors.push(`Invalid date format: ${record[columnMapping.date]}`);
                }
            }

            if (!columnMapping.type || !record[columnMapping.type]) {
                rowErrors.push('Type is required');
            } else {
                const type = record[columnMapping.type].toLowerCase();
                if (type !== 'expense' && type !== 'income') {
                    rowErrors.push(`Type must be 'expense' or 'income', got: ${type}`);
                }
            }

            if (!columnMapping.amount || !record[columnMapping.amount]) {
                rowErrors.push('Amount is required');
            } else {
                const amount = parseFloat(record[columnMapping.amount]);
                if (isNaN(amount) || amount <= 0) {
                    rowErrors.push(`Invalid amount: ${record[columnMapping.amount]}`);
                }
            }

            if (!columnMapping.description || !record[columnMapping.description]) {
                rowErrors.push('Description is required');
            }

            // Validate currency if provided
            if (columnMapping.currency && record[columnMapping.currency]) {
                const currencyValue = record[columnMapping.currency].toString().trim().toUpperCase();
                if (!isValidCurrencyCode(currencyValue)) {
                    rowErrors.push(`Invalid currency code: ${record[columnMapping.currency]}. Must be a valid ISO 4217 code (e.g., MYR, USD, EUR)`);
                }
            }

            if (rowErrors.length === 0) {
                validCount++;
                if (validRows.length < 5) {
                    // Store sample of valid rows
                    validRows.push(this.mapRecordToTransaction(record, columnMapping));
                }
            } else {
                errors.push({ row: rowNumber, errors: rowErrors });
            }
        });

        return {
            totalRows: records.length,
            validRows: validCount,
            invalidRows: records.length - validCount,
            errors: errors.slice(0, 10), // Limit to first 10 errors
            sample: validRows,
        };
    }

    /**
     * Map CSV/Excel record to transaction DTO
     */
    private mapRecordToTransaction(record: any, columnMapping: ColumnMapping): any {
        // Handle currency: validate if provided, otherwise use default (MYR)
        let currency: string | undefined;
        if (columnMapping.currency && record[columnMapping.currency]) {
            const currencyValue = record[columnMapping.currency].toString().trim().toUpperCase();
            if (isValidCurrencyCode(currencyValue)) {
                currency = currencyValue;
            } else {
                // Invalid currency code - will use default
                currency = undefined;
            }
        }
        // If no currency provided or invalid, default to MYR
        if (!currency) {
            currency = getDefaultCurrency();
        }

        const transaction: any = {
            date: new Date(record[columnMapping.date!]).toISOString(),
            type: record[columnMapping.type!].toLowerCase() as TransactionType,
            amount: parseFloat(record[columnMapping.amount!]),
            description: record[columnMapping.description!] || '',
            currency: currency,
        };

        if (columnMapping.notes && record[columnMapping.notes]) {
            transaction.notes = record[columnMapping.notes];
        }

        if (columnMapping.tags && record[columnMapping.tags]) {
            transaction.tags = record[columnMapping.tags]
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0);
        }

        if (columnMapping.paymentMethod && record[columnMapping.paymentMethod]) {
            transaction.paymentMethod = record[columnMapping.paymentMethod];
        }

        if (columnMapping.reference && record[columnMapping.reference]) {
            transaction.reference = record[columnMapping.reference];
        }

        // Category will be resolved during import
        if (columnMapping.category && record[columnMapping.category]) {
            transaction.categoryName = record[columnMapping.category];
        }

        return transaction;
    }

    /**
     * Import transactions from CSV/Excel
     */
    async importTransactions(
        userId: string,
        fileBuffer: Buffer,
        filename: string,
        fileType: string,
        columnMapping: ColumnMapping,
    ): Promise<ImportResult> {
        // Create import history record
        const importHistory = new this.importHistoryModel({
            userId: new Types.ObjectId(userId),
            filename,
            fileType,
            status: 'processing',
            columnMapping,
        });
        await importHistory.save();

        try {
            let records: any[];

            // Parse file based on type
            if (fileType === 'csv' || filename.endsWith('.csv')) {
                records = parse(fileBuffer.toString('utf-8'), {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                });
            } else if (fileType === 'xlsx' || filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                const workbook = new ExcelJS.Workbook();
                // ExcelJS accepts Buffer, ArrayBuffer, or Stream
                await workbook.xlsx.load(fileBuffer as any);
                const worksheet = workbook.worksheets[0];
                const headers: string[] = [];

                worksheet.getRow(1).eachCell((cell, colNumber) => {
                    headers[colNumber - 1] = cell.value?.toString() || '';
                });

                records = [];
                for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                    const row = worksheet.getRow(rowNumber);
                    const record: any = {};

                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber - 1];
                        if (header) {
                            record[header] = cell.value?.toString() || '';
                        }
                    });

                    if (Object.keys(record).length > 0) {
                        records.push(record);
                    }
                }
            } else {
                throw new BadRequestException(`Unsupported file type: ${fileType}`);
            }

            // Get category maps
            const [expenseCategories, incomeCategories] = await Promise.all([
                this.expenseCategoryModel.find({ userId: new Types.ObjectId(userId) }).exec(),
                this.incomeCategoryModel.find({ userId: new Types.ObjectId(userId) }).exec(),
            ]);

            const categoryMap = new Map<string, string>();
            expenseCategories.forEach((cat) => {
                categoryMap.set(cat.name.toLowerCase(), cat._id.toString());
            });
            incomeCategories.forEach((cat) => {
                categoryMap.set(cat.name.toLowerCase(), cat._id.toString());
            });

            // Import transactions
            let importedCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                try {
                    const transactionData = this.mapRecordToTransaction(record, columnMapping);

                    // Resolve category
                    if (transactionData.categoryName) {
                        const categoryId = categoryMap.get(transactionData.categoryName.toLowerCase());
                        if (categoryId) {
                            transactionData.categoryId = categoryId;
                        }
                        delete transactionData.categoryName;
                    }

                    // Create transaction
                    const transaction = new this.transactionModel({
                        userId: new Types.ObjectId(userId),
                        ...transactionData,
                    });

                    await transaction.save();
                    importedCount++;
                } catch (error) {
                    failedCount++;
                    errors.push(`Row ${i + 2}: ${error.message}`);
                }
            }

            // Update import history
            importHistory.totalRows = records.length;
            importHistory.importedCount = importedCount;
            importHistory.failedCount = failedCount;
            importHistory.set('errors', errors.slice(0, 100)); // Limit to 100 errors
            importHistory.status = 'completed';
            importHistory.completedAt = new Date();
            await importHistory.save();

            return {
                importedCount,
                failedCount,
                errors: errors.slice(0, 10), // Return first 10 errors
            };
        } catch (error) {
            importHistory.status = 'failed';
            importHistory.set('errors', [error.message]);
            importHistory.completedAt = new Date();
            await importHistory.save();

            throw error;
        }
    }

    /**
     * Get import history for user
     */
    async getImportHistory(userId: string, limit: number = 50): Promise<ImportHistoryDocument[]> {
        return this.importHistoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    /**
     * Get import history by ID
     */
    async getImportHistoryById(userId: string, importId: string): Promise<ImportHistoryDocument> {
        const importHistory = await this.importHistoryModel
            .findOne({
                _id: new Types.ObjectId(importId),
                userId: new Types.ObjectId(userId),
            })
            .exec();

        if (!importHistory) {
            throw new BadRequestException('Import history not found');
        }

        return importHistory;
    }
}


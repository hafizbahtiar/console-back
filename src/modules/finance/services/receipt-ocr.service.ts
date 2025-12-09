import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker, Worker } from 'tesseract.js';
import sharp from 'sharp';
import { Config } from '../../../config/config.interface';

export interface ReceiptOcrField {
    value: string | number | Date | null;
    confidence: number; // 0-1
}

export interface ReceiptOcrData {
    merchantName?: ReceiptOcrField;
    merchantAddress?: ReceiptOcrField;
    date?: ReceiptOcrField;
    totalAmount?: ReceiptOcrField;
    taxAmount?: ReceiptOcrField;
    subtotal?: ReceiptOcrField;
    items?: Array<{
        description: string;
        quantity?: number;
        price?: number;
        total?: number;
        confidence: number;
    }>;
    paymentMethod?: ReceiptOcrField;
    receiptNumber?: ReceiptOcrField;
    overallConfidence: number;
}

@Injectable()
export class ReceiptOcrService {
    private readonly logger = new Logger(ReceiptOcrService.name);
    private readonly ocrConfig: NonNullable<Config['ocr']>;
    private worker: Worker | null = null;

    constructor(private configService: ConfigService<Config>) {
        const config = this.configService.get('ocr', { infer: true });
        this.ocrConfig = config || {
            enabled: true,
            language: 'eng',
            preprocessing: {
                resizeWidth: 2000,
                grayscale: true,
                normalize: true,
                sharpen: true,
                threshold: 128,
            },
        };
    }

    /**
     * Initialize Tesseract worker
     * Should be called before first use
     */
    async initializeWorker(): Promise<void> {
        if (this.worker) {
            return; // Already initialized
        }

        try {
            this.logger.log('Initializing Tesseract OCR worker...');
            this.worker = await createWorker(this.ocrConfig.language);
            this.logger.log('Tesseract OCR worker initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Tesseract worker:', error);
            throw new InternalServerErrorException('Failed to initialize OCR service');
        }
    }

    /**
     * Terminate Tesseract worker
     * Should be called on application shutdown
     */
    async terminateWorker(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.logger.log('Tesseract OCR worker terminated');
        }
    }

    /**
     * Download image from URL
     */
    private async downloadImage(imageUrl: string): Promise<Buffer> {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new BadRequestException(`Failed to download image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            this.logger.error('Failed to download image:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to download image from URL');
        }
    }

    /**
     * Preprocess image for better OCR accuracy
     */
    private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
        try {
            let pipeline = sharp(imageBuffer);

            // Convert to grayscale if enabled
            if (this.ocrConfig.preprocessing?.grayscale) {
                pipeline = pipeline.greyscale();
            }

            // Normalize contrast if enabled
            if (this.ocrConfig.preprocessing?.normalize) {
                pipeline = pipeline.normalize();
            }

            // Sharpen if enabled
            if (this.ocrConfig.preprocessing?.sharpen) {
                pipeline = pipeline.sharpen();
            }

            // Resize if width specified
            if (this.ocrConfig.preprocessing?.resizeWidth) {
                pipeline = pipeline.resize(this.ocrConfig.preprocessing.resizeWidth, null, {
                    withoutEnlargement: true,
                    fit: 'inside',
                });
            }

            // Apply threshold (binarization) if specified
            if (this.ocrConfig.preprocessing?.threshold) {
                pipeline = pipeline.threshold(this.ocrConfig.preprocessing.threshold);
            }

            return await pipeline.toBuffer();
        } catch (error) {
            this.logger.error('Failed to preprocess image:', error);
            throw new InternalServerErrorException('Failed to preprocess image for OCR');
        }
    }

    /**
     * Run Tesseract OCR on image
     */
    private async runOcr(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
        if (!this.ocrConfig.enabled) {
            throw new BadRequestException('OCR is disabled');
        }

        // Initialize worker if not already initialized
        if (!this.worker) {
            await this.initializeWorker();
        }

        if (!this.worker) {
            throw new InternalServerErrorException('Failed to initialize OCR worker');
        }

        try {
            this.logger.log('Running OCR on image...');
            const { data } = await this.worker.recognize(imageBuffer);
            
            return {
                text: data.text,
                confidence: data.confidence / 100, // Convert to 0-1 scale
            };
        } catch (error) {
            this.logger.error('OCR processing failed:', error);
            throw new InternalServerErrorException('OCR processing failed');
        }
    }

    /**
     * Extract receipt data from image URL
     */
    async extractReceiptData(imageUrl: string): Promise<ReceiptOcrData> {
        try {
            // 1. Download image
            this.logger.log(`Downloading image from: ${imageUrl}`);
            const imageBuffer = await this.downloadImage(imageUrl);

            // 2. Preprocess image
            this.logger.log('Preprocessing image for OCR...');
            const processedImage = await this.preprocessImage(imageBuffer);

            // 3. Run OCR
            this.logger.log('Running OCR...');
            const { text, confidence } = await this.runOcr(processedImage);
            this.logger.log(`OCR completed. Confidence: ${(confidence * 100).toFixed(2)}%`);

            // 4. Parse receipt text
            this.logger.log('Parsing receipt text...');
            const receiptData = this.parseReceiptText(text);
            receiptData.overallConfidence = confidence;

            this.logger.log('Receipt data extracted successfully');
            return receiptData;
        } catch (error) {
            this.logger.error('Failed to extract receipt data:', error);
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to extract receipt data');
        }
    }

    /**
     * Parse OCR text into structured receipt data
     */
    private parseReceiptText(text: string): ReceiptOcrData {
        const lines = text.split('\n').filter(line => line.trim());
        const receiptData: ReceiptOcrData = {
            items: [],
            overallConfidence: 0,
        };

        // Extract merchant name (usually first significant line)
        receiptData.merchantName = this.extractMerchantName(lines);

        // Extract date
        receiptData.date = this.extractDate(lines);

        // Extract amounts
        receiptData.totalAmount = this.extractTotalAmount(lines);
        receiptData.taxAmount = this.extractTaxAmount(lines);
        receiptData.subtotal = this.extractSubtotal(lines);

        // Extract items
        receiptData.items = this.extractItems(lines);

        // Extract payment method
        receiptData.paymentMethod = this.extractPaymentMethod(lines);

        return receiptData;
    }

    /**
     * Extract merchant name from receipt lines
     */
    private extractMerchantName(lines: string[]): ReceiptOcrField {
        // Merchant name is usually:
        // - First or second line with significant text
        // - Often in ALL CAPS or Title Case
        // - Before date/address
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.length > 3 && line.length < 50 && !this.looksLikeDate(line) && !this.looksLikeAmount(line)) {
                return {
                    value: line,
                    confidence: 0.75, // Moderate confidence, user should verify
                };
            }
        }
        return { value: null, confidence: 0 };
    }

    /**
     * Extract date from receipt lines
     */
    private extractDate(lines: string[]): ReceiptOcrField {
        const datePatterns = [
            /\d{1,2}\/\d{1,2}\/\d{4}/,      // MM/DD/YYYY or DD/MM/YYYY
            /\d{4}-\d{2}-\d{2}/,            // YYYY-MM-DD
            /\d{1,2}-\d{1,2}-\d{4}/,        // DD-MM-YYYY
            /\d{1,2}\.\d{1,2}\.\d{4}/,      // DD.MM.YYYY
        ];

        for (const line of lines) {
            for (const pattern of datePatterns) {
                const match = line.match(pattern);
                if (match) {
                    try {
                        const date = new Date(match[0]);
                        if (!isNaN(date.getTime())) {
                            return {
                                value: date.toISOString().split('T')[0], // Return as string
                                confidence: 0.80,
                            };
                        }
                    } catch (error) {
                        // Invalid date, continue
                    }
                }
            }
        }
        return { value: null, confidence: 0 };
    }

    /**
     * Extract total amount from receipt lines
     */
    private extractTotalAmount(lines: string[]): ReceiptOcrField {
        const totalKeywords = ['TOTAL', 'AMOUNT DUE', 'GRAND TOTAL', 'TOTAL DUE', 'BALANCE DUE'];
        
        // Search from bottom to top (total is usually at bottom)
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
            const line = lines[i].toUpperCase();
            for (const keyword of totalKeywords) {
                if (line.includes(keyword)) {
                    const amount = this.extractAmountFromLine(lines[i]);
                    if (amount !== null) {
                        return {
                            value: amount,
                            confidence: 0.85,
                        };
                    }
                }
            }
        }

        // Fallback: find largest number at bottom of receipt
        const bottomLines = lines.slice(-10);
        const largestAmount = this.findLargestAmount(bottomLines);
        if (largestAmount !== null) {
            return {
                value: largestAmount,
                confidence: 0.60, // Lower confidence for fallback
            };
        }

        return { value: null, confidence: 0 };
    }

    /**
     * Extract tax amount from receipt lines
     */
    private extractTaxAmount(lines: string[]): ReceiptOcrField {
        const taxKeywords = ['TAX', 'VAT', 'GST', 'SALES TAX'];
        
        for (const line of lines) {
            const upperLine = line.toUpperCase();
            for (const keyword of taxKeywords) {
                if (upperLine.includes(keyword)) {
                    const amount = this.extractAmountFromLine(line);
                    if (amount !== null) {
                        return {
                            value: amount,
                            confidence: 0.75,
                        };
                    }
                }
            }
        }
        return { value: null, confidence: 0 };
    }

    /**
     * Extract subtotal from receipt lines
     */
    private extractSubtotal(lines: string[]): ReceiptOcrField {
        const subtotalKeywords = ['SUBTOTAL', 'SUB-TOTAL', 'SUB TOTAL'];
        
        for (const line of lines) {
            const upperLine = line.toUpperCase();
            for (const keyword of subtotalKeywords) {
                if (upperLine.includes(keyword)) {
                    const amount = this.extractAmountFromLine(line);
                    if (amount !== null) {
                        return {
                            value: amount,
                            confidence: 0.75,
                        };
                    }
                }
            }
        }
        return { value: null, confidence: 0 };
    }

    /**
     * Extract items from receipt lines
     */
    private extractItems(lines: string[]): Array<{
        description: string;
        quantity?: number;
        price?: number;
        total?: number;
        confidence: number;
    }> {
        const items: Array<{
            description: string;
            quantity?: number;
            price?: number;
            total?: number;
            confidence: number;
        }> = [];

        // Items are usually in the middle section (skip first 2-3 lines and last 5-10 lines)
        const itemLines = lines.slice(2, -5);
        
        for (const line of itemLines) {
            const item = this.parseItemLine(line);
            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    /**
     * Extract payment method from receipt lines
     */
    private extractPaymentMethod(lines: string[]): ReceiptOcrField {
        const paymentKeywords = ['CASH', 'CREDIT', 'DEBIT', 'CARD', 'PAYPAL', 'VENMO'];
        
        for (const line of lines) {
            const upperLine = line.toUpperCase();
            for (const keyword of paymentKeywords) {
                if (upperLine.includes(keyword)) {
                    return {
                        value: keyword,
                        confidence: 0.70,
                    };
                }
            }
        }
        return { value: null, confidence: 0 };
    }

    /**
     * Extract amount from a line (currency format)
     */
    private extractAmountFromLine(line: string): number | null {
        // Match currency patterns: $123.45, 123.45, $ 123.45, etc.
        const amountPatterns = [
            /\$?\s*(\d+\.\d{2})/,  // $123.45 or 123.45
            /\$?\s*(\d+,\d{3}\.\d{2})/, // $1,234.56
        ];

        for (const pattern of amountPatterns) {
            const match = line.match(pattern);
            if (match) {
                const amountStr = match[1].replace(/,/g, '');
                const amount = parseFloat(amountStr);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }
        return null;
    }

    /**
     * Find largest amount in lines (fallback for total)
     */
    private findLargestAmount(lines: string[]): number | null {
        let largest: number | null = null;
        for (const line of lines) {
            const amount = this.extractAmountFromLine(line);
            if (amount !== null && (largest === null || amount > largest)) {
                largest = amount;
            }
        }
        return largest;
    }

    /**
     * Parse a single line as an item
     */
    private parseItemLine(line: string): {
        description: string;
        quantity?: number;
        price?: number;
        total?: number;
        confidence: number;
    } | null {
        const trimmed = line.trim();
        if (trimmed.length < 3) {
            return null;
        }

        // Try to extract price (usually at end of line)
        const parts = trimmed.split(/\s+/);
        const lastPart = parts[parts.length - 1];
        const price = this.extractAmountFromLine(lastPart);

        if (price !== null) {
            // Has a price, likely an item
            const description = parts.slice(0, -1).join(' ');
            return {
                description: description || trimmed,
                price,
                confidence: 0.70,
            };
        }

        // No price found, might still be an item description
        if (trimmed.length > 5 && !this.looksLikeDate(trimmed) && !this.looksLikeAmount(trimmed)) {
            return {
                description: trimmed,
                confidence: 0.50, // Lower confidence
            };
        }

        return null;
    }

    /**
     * Check if a string looks like a date
     */
    private looksLikeDate(str: string): boolean {
        return /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(str);
    }

    /**
     * Check if a string looks like an amount
     */
    private looksLikeAmount(str: string): boolean {
        return /\$?\s*\d+\.\d{2}/.test(str);
    }
}


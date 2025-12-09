import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { ConvertCurrencyDto } from '../dto/currency/convert-currency.dto';
import { ConvertCurrencyResponseDto, ExchangeRateResponseDto } from '../dto/currency/exchange-rate-response.dto';
import { successResponse } from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';
import { plainToInstance } from 'class-transformer';
import { isValidCurrencyCode } from '../common/currency-codes';
import { BadRequestException } from '@nestjs/common';

/**
 * Finance Currency Controller
 * 
 * Handles currency conversion and exchange rate endpoints.
 * All endpoints require owner role.
 */
@Controller('finance/currency')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
export class FinanceCurrencyController {
    constructor(
        private readonly exchangeRateService: ExchangeRateService,
    ) {}

    /**
     * Convert Currency
     * POST /api/v1/finance/currency/convert
     * Converts an amount from one currency to another
     */
    @Post('convert')
    @HttpCode(HttpStatus.OK)
    async convertCurrency(
        @GetUser() user: any,
        @Body() convertDto: ConvertCurrencyDto,
    ): Promise<SuccessResponse<ConvertCurrencyResponseDto>> {
        // Normalize currency codes
        const fromCurrency = convertDto.fromCurrency.toUpperCase();
        const toCurrency = convertDto.toCurrency.toUpperCase();

        // Validate currency codes
        if (!isValidCurrencyCode(fromCurrency)) {
            throw new BadRequestException(`Invalid from currency code: ${fromCurrency}`);
        }
        if (!isValidCurrencyCode(toCurrency)) {
            throw new BadRequestException(`Invalid to currency code: ${toCurrency}`);
        }

        // Parse date if provided
        let date: Date | undefined;
        if (convertDto.date) {
            date = new Date(convertDto.date);
            if (isNaN(date.getTime())) {
                throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
            }
        }

        // Get exchange rate
        const exchangeRate = await this.exchangeRateService.getExchangeRate(
            fromCurrency,
            toCurrency,
            date,
        );

        // Convert amount
        const convertedAmount = await this.exchangeRateService.convertAmount(
            convertDto.amount,
            fromCurrency,
            toCurrency,
            date,
        );

        const response = plainToInstance(ConvertCurrencyResponseDto, {
            amount: convertDto.amount,
            fromCurrency,
            toCurrency,
            convertedAmount,
            exchangeRate,
            date: convertDto.date,
        }, {
            excludeExtraneousValues: true,
        });

        return successResponse(response, 'Currency converted successfully');
    }

    /**
     * Get Exchange Rates
     * GET /api/v1/finance/currency/rates
     * Returns current exchange rates for specified currencies
     */
    @Get('rates')
    @HttpCode(HttpStatus.OK)
    async getExchangeRates(
        @GetUser() user: any,
        @Query('from') fromCurrency?: string,
        @Query('to') toCurrency?: string,
        @Query('date') date?: string,
    ): Promise<SuccessResponse<ExchangeRateResponseDto | ExchangeRateResponseDto[]>> {
        // If both from and to are provided, return single rate
        if (fromCurrency && toCurrency) {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();

            // Validate currency codes
            if (!isValidCurrencyCode(from)) {
                throw new BadRequestException(`Invalid from currency code: ${from}`);
            }
            if (!isValidCurrencyCode(to)) {
                throw new BadRequestException(`Invalid to currency code: ${to}`);
            }

            // Parse date if provided
            let rateDate: Date | undefined;
            if (date) {
                rateDate = new Date(date);
                if (isNaN(rateDate.getTime())) {
                    throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
                }
            }

            const exchangeRate = await this.exchangeRateService.getExchangeRate(from, to, rateDate);

            const response = plainToInstance(ExchangeRateResponseDto, {
                fromCurrency: from,
                toCurrency: to,
                rate: exchangeRate,
                date: date,
                timestamp: new Date(),
            }, {
                excludeExtraneousValues: true,
            });

            return successResponse(response, 'Exchange rate retrieved successfully');
        }

        // If only from is provided, return rates to common currencies
        if (fromCurrency) {
            const from = fromCurrency.toUpperCase();
            if (!isValidCurrencyCode(from)) {
                throw new BadRequestException(`Invalid from currency code: ${from}`);
            }

            // Common currencies to convert to
            const commonCurrencies = ['MYR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CNY', 'HKD', 'THB'];

            const rates = await Promise.all(
                commonCurrencies
                    .filter((curr) => curr !== from)
                    .map(async (to) => {
                        const rate = await this.exchangeRateService.getExchangeRate(from, to);
                        return {
                            fromCurrency: from,
                            toCurrency: to,
                            rate,
                            timestamp: new Date(),
                        };
                    })
            );

            const response = plainToInstance(ExchangeRateResponseDto, rates, {
                excludeExtraneousValues: true,
            });

            return successResponse(response, 'Exchange rates retrieved successfully');
        }

        // If no parameters, return error
        throw new BadRequestException('Please provide at least a "from" currency code');
    }

    /**
     * Get Historical Exchange Rates
     * GET /api/v1/finance/currency/rates/history
     * Returns historical exchange rates for a date range
     */
    @Get('rates/history')
    @HttpCode(HttpStatus.OK)
    async getHistoricalExchangeRates(
        @GetUser() user: any,
        @Query('from') fromCurrency: string,
        @Query('to') toCurrency: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate?: string,
    ): Promise<SuccessResponse<ExchangeRateResponseDto[]>> {
        // Validate required parameters
        if (!fromCurrency || !toCurrency || !startDate) {
            throw new BadRequestException('from, to, and startDate are required');
        }

        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();

        // Validate currency codes
        if (!isValidCurrencyCode(from)) {
            throw new BadRequestException(`Invalid from currency code: ${from}`);
        }
        if (!isValidCurrencyCode(to)) {
            throw new BadRequestException(`Invalid to currency code: ${to}`);
        }

        // Parse dates
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD');
        }

        const end = endDate ? new Date(endDate) : new Date();
        if (isNaN(end.getTime())) {
            throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD');
        }

        if (start > end) {
            throw new BadRequestException('startDate must be before or equal to endDate');
        }

        // Limit to 90 days to prevent excessive API calls
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            throw new BadRequestException('Date range cannot exceed 90 days');
        }

        // Get rates for each day in the range
        const rates: ExchangeRateResponseDto[] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const rate = await this.exchangeRateService.getExchangeRate(
                from,
                to,
                new Date(currentDate),
            );

            rates.push({
                fromCurrency: from,
                toCurrency: to,
                rate,
                date: currentDate.toISOString().split('T')[0],
                timestamp: new Date(),
            });

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const response = plainToInstance(ExchangeRateResponseDto, rates, {
            excludeExtraneousValues: true,
        });

        return successResponse(response, 'Historical exchange rates retrieved successfully');
    }
}


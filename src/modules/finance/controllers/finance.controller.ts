import {
    Controller,
    Get,
    Query,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { FinanceAnalyticsService } from '../services/finance-analytics.service';
import { successResponse } from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';
import { convertToCsv } from '../../../common/utils/csv.util';
import { convertToExcel } from '../../../common/utils/excel.util';
import { convertToPdf } from '../../../common/utils/pdf.util';
import { TransactionType } from '../schemas/finance-transaction.schema';
import { plainToInstance } from 'class-transformer';
import { DashboardResponseDto } from '../dto/analytics/dashboard-response.dto';
import { IncomeExpensesResponseDto } from '../dto/analytics/income-expenses-response.dto';
import { CategoryBreakdownResponseDto } from '../dto/analytics/category-breakdown-response.dto';
import { TrendsResponseDto } from '../dto/analytics/trends-response.dto';
import { CategoryTrendsResponseDto } from '../dto/analytics/category-trends-response.dto';
import { MonthOverMonthComparisonResponseDto, YearOverYearComparisonResponseDto } from '../dto/analytics/comparison-response.dto';
import { ForecastResponseDto } from '../dto/analytics/forecast-response.dto';
import { HeatmapResponseDto } from '../dto/analytics/heatmap-response.dto';
import { SpendingPatternsResponseDto } from '../dto/analytics/patterns-response.dto';
import { CalendarResponseDto } from '../dto/analytics/calendar-response.dto';

/**
 * Finance Controller
 * 
 * Owner-only endpoints for managing financial transactions, categories, and analytics.
 * All endpoints require owner role.
 */
@Controller('finance')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 150, ttl: 60000 } }) // 150 requests per minute for finance endpoints (accounts for React Strict Mode)
export class FinanceController {
    constructor(private readonly financeAnalyticsService: FinanceAnalyticsService) { }

    /**
     * Finance Dashboard
     * GET /api/v1/finance/dashboard
     * Returns finance dashboard overview
     */
    @Get('dashboard')
    @HttpCode(HttpStatus.OK)
    async getDashboard(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
    ): Promise<SuccessResponse<DashboardResponseDto>> {
        const limitNum = limit ? parseInt(limit, 10) : 5;
        const dashboard = await this.financeAnalyticsService.getDashboard(
            user.userId,
            startDate,
            endDate,
            limitNum,
        );
        const dashboardDto = plainToInstance(DashboardResponseDto, dashboard, {
            excludeExtraneousValues: true,
        });
        return successResponse(dashboardDto, 'Finance dashboard data retrieved successfully');
    }

    /**
     * Income vs Expenses
     * GET /api/v1/finance/analytics/income-expenses
     * Returns income vs expenses comparison
     */
    @Get('analytics/income-expenses')
    @HttpCode(HttpStatus.OK)
    async getIncomeVsExpenses(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<IncomeExpensesResponseDto>> {
        const data = await this.financeAnalyticsService.getIncomeVsExpenses(
            user.userId,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(IncomeExpensesResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Income vs expenses data retrieved successfully');
    }

    /**
     * Category Breakdown
     * GET /api/v1/finance/analytics/categories
     * Returns category breakdown with percentages
     */
    @Get('analytics/categories')
    @HttpCode(HttpStatus.OK)
    async getCategoryBreakdown(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<CategoryBreakdownResponseDto>> {
        const data = await this.financeAnalyticsService.getCategoryBreakdown(
            user.userId,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(CategoryBreakdownResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Category breakdown retrieved successfully');
    }

    /**
     * Trends (Monthly/Yearly)
     * GET /api/v1/finance/analytics/trends
     * Returns monthly or yearly trends
     */
    @Get('analytics/trends')
    @HttpCode(HttpStatus.OK)
    async getTrends(
        @GetUser() user: any,
        @Query('period') period: 'monthly' | 'yearly' = 'monthly',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<SuccessResponse<TrendsResponseDto>> {
        const data = await this.financeAnalyticsService.getTrends(
            user.userId,
            period,
            startDate,
            endDate,
        );
        const dataDto = plainToInstance(TrendsResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Trends data retrieved successfully');
    }

    /**
     * Export Transactions
     * GET /api/v1/finance/export
     * Exports transactions as CSV, JSON, Excel, or PDF
     */
    @Get('export')
    @HttpCode(HttpStatus.OK)
    async exportTransactions(
        @GetUser() user: any,
        @Res() res: Response,
        @Query('format') format: 'csv' | 'json' | 'xlsx' | 'pdf' = 'csv',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('type') type?: TransactionType,
        @Query('currency') currency?: string,
    ): Promise<void> {
        const transactions = await this.financeAnalyticsService.exportTransactions(
            user.userId,
            startDate,
            endDate,
            type,
            currency,
        );

        const dateStr = new Date().toISOString().split('T')[0];
        let filename: string;
        let contentType: string;

        switch (format) {
            case 'csv':
                filename = `transactions-${dateStr}.csv`;
                contentType = 'text/csv';
                const csvContent = convertToCsv(transactions);
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.send(csvContent);
                return;

            case 'json':
                filename = `transactions-${dateStr}.json`;
                contentType = 'application/json';
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.json(transactions);
                return;

            case 'xlsx':
                filename = `transactions-${dateStr}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                const excelBuffer = await convertToExcel(transactions);
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.send(excelBuffer);
                return;

            case 'pdf':
                filename = `transactions-${dateStr}.pdf`;
                contentType = 'application/pdf';
                const pdfBuffer = await convertToPdf(transactions);
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.send(pdfBuffer);
                return;

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Category Trends Over Time
     * GET /api/v1/finance/analytics/category-trends
     * Returns category trends over time with daily, weekly, or monthly aggregation
     */
    @Get('analytics/category-trends')
    @HttpCode(HttpStatus.OK)
    async getCategoryTrends(
        @GetUser() user: any,
        @Query('categoryId') categoryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('aggregation') aggregation: 'daily' | 'weekly' | 'monthly' = 'monthly',
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<CategoryTrendsResponseDto>> {
        const data = await this.financeAnalyticsService.getCategoryTrends(
            user.userId,
            categoryId,
            startDate,
            endDate,
            aggregation,
            currency,
        );
        const dataDto = plainToInstance(CategoryTrendsResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Category trends retrieved successfully');
    }

    /**
     * Month-over-Month Comparison
     * GET /api/v1/finance/analytics/comparison/mom
     * Returns month-over-month comparison with percentage changes
     */
    @Get('analytics/comparison/mom')
    @HttpCode(HttpStatus.OK)
    async getMonthOverMonthComparison(
        @GetUser() user: any,
        @Query('categoryId') categoryId?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<MonthOverMonthComparisonResponseDto>> {
        const data = await this.financeAnalyticsService.getMonthOverMonthComparison(
            user.userId,
            categoryId,
            currency,
        );
        const dataDto = plainToInstance(MonthOverMonthComparisonResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Month-over-month comparison retrieved successfully');
    }

    /**
     * Year-over-Year Comparison
     * GET /api/v1/finance/analytics/comparison/yoy
     * Returns year-over-year comparison with monthly breakdown
     */
    @Get('analytics/comparison/yoy')
    @HttpCode(HttpStatus.OK)
    async getYearOverYearComparison(
        @GetUser() user: any,
        @Query('categoryId') categoryId?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<YearOverYearComparisonResponseDto>> {
        const data = await this.financeAnalyticsService.getYearOverYearComparison(
            user.userId,
            categoryId,
            currency,
        );
        const dataDto = plainToInstance(YearOverYearComparisonResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Year-over-year comparison retrieved successfully');
    }

    /**
     * Forecast Data
     * GET /api/v1/finance/analytics/forecast
     * Returns forecast data with confidence intervals
     */
    @Get('analytics/forecast')
    @HttpCode(HttpStatus.OK)
    async getForecast(
        @GetUser() user: any,
        @Query('period') period: '1month' | '3months' | '6months' | '1year' = '3months',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<ForecastResponseDto>> {
        const data = await this.financeAnalyticsService.getForecast(
            user.userId,
            period,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(ForecastResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Forecast data retrieved successfully');
    }

    /**
     * Heatmap Calendar Data
     * GET /api/v1/finance/analytics/heatmap
     * Returns daily transaction data for calendar heatmap visualization
     */
    @Get('analytics/heatmap')
    @HttpCode(HttpStatus.OK)
    async getHeatmapData(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<HeatmapResponseDto>> {
        const data = await this.financeAnalyticsService.getHeatmapData(
            user.userId,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(HeatmapResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Heatmap data retrieved successfully');
    }

    /**
     * Spending Patterns
     * GET /api/v1/finance/analytics/patterns
     * Returns spending patterns and anomalies
     */
    @Get('analytics/patterns')
    @HttpCode(HttpStatus.OK)
    async getSpendingPatterns(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<SpendingPatternsResponseDto>> {
        const data = await this.financeAnalyticsService.getSpendingPatterns(
            user.userId,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(SpendingPatternsResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Spending patterns retrieved successfully');
    }

    /**
     * Calendar Data
     * GET /api/v1/finance/analytics/calendar
     * Returns daily transaction aggregation for calendar view
     * Optimized for high-performance queries with MongoDB aggregation
     */
    @Get('analytics/calendar')
    @HttpCode(HttpStatus.OK)
    async getCalendarData(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('currency') currency?: string,
    ): Promise<SuccessResponse<CalendarResponseDto>> {
        const data = await this.financeAnalyticsService.getCalendarData(
            user.userId,
            startDate,
            endDate,
            currency,
        );
        const dataDto = plainToInstance(CalendarResponseDto, data, {
            excludeExtraneousValues: true,
        });
        return successResponse(dataDto, 'Calendar data retrieved successfully');
    }

    /**
     * Daily Totals
     * GET /api/v1/finance/analytics/calendar/daily-totals
     * Returns daily totals (income, expenses, net) for a date range
     * Optimized endpoint for calendar view
     */
    @Get('analytics/calendar/daily-totals')
    @HttpCode(HttpStatus.OK)
    async getDailyTotals(
        @GetUser() user: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<SuccessResponse<Array<{
        date: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }>>> {
        const data = await this.financeAnalyticsService.getDailyTotals(
            user.userId,
            startDate,
            endDate,
        );
        return successResponse(data, 'Daily totals retrieved successfully');
    }
}


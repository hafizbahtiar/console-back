import { Injectable } from '@nestjs/common';
import { TransactionType } from '../schemas/finance-transaction.schema';
import { FinanceAnalyticsDashboardService } from './analytics/finance-analytics-dashboard.service';
import { FinanceAnalyticsTrendsService } from './analytics/finance-analytics-trends.service';
import { FinanceAnalyticsComparisonService } from './analytics/finance-analytics-comparison.service';
import { FinanceAnalyticsForecastService } from './analytics/finance-analytics-forecast.service';
import { FinanceAnalyticsHeatmapService } from './analytics/finance-analytics-heatmap.service';
import { FinanceAnalyticsPatternsService } from './analytics/finance-analytics-patterns.service';
import { FinanceAnalyticsCalendarService } from './analytics/finance-analytics-calendar.service';

/**
 * Main Finance Analytics Service
 * 
 * Aggregates all analytics services and provides a unified interface.
 * This service acts as a facade for all analytics functionality.
 */
@Injectable()
export class FinanceAnalyticsService {
    constructor(
        private readonly dashboardService: FinanceAnalyticsDashboardService,
        private readonly trendsService: FinanceAnalyticsTrendsService,
        private readonly comparisonService: FinanceAnalyticsComparisonService,
        private readonly forecastService: FinanceAnalyticsForecastService,
        private readonly heatmapService: FinanceAnalyticsHeatmapService,
        private readonly patternsService: FinanceAnalyticsPatternsService,
        private readonly calendarService: FinanceAnalyticsCalendarService,
    ) { }

    // Dashboard methods
    async getDashboard(userId: string, startDate?: string, endDate?: string, limit: number = 5, currency?: string) {
        return this.dashboardService.getDashboard(userId, startDate, endDate, limit, currency);
    }

    async getIncomeVsExpenses(userId: string, startDate?: string, endDate?: string, currency?: string) {
        return this.dashboardService.getIncomeVsExpenses(userId, startDate, endDate, currency);
    }

    async getCategoryBreakdown(userId: string, startDate?: string, endDate?: string, currency?: string) {
        return this.dashboardService.getCategoryBreakdown(userId, startDate, endDate, currency);
    }

    async exportTransactions(userId: string, startDate?: string, endDate?: string, type?: TransactionType, currency?: string) {
        return this.dashboardService.exportTransactions(userId, startDate, endDate, type, currency);
    }

    // Trends methods
    async getTrends(userId: string, period: 'monthly' | 'yearly', startDate?: string, endDate?: string, currency?: string) {
        return this.trendsService.getTrends(userId, period, startDate, endDate, currency);
    }

    async getCategoryTrends(
        userId: string,
        categoryId?: string,
        startDate?: string,
        endDate?: string,
        aggregation: 'daily' | 'weekly' | 'monthly' = 'monthly',
        currency?: string,
    ) {
        return this.trendsService.getCategoryTrends(userId, categoryId, startDate, endDate, aggregation, currency);
    }

    // Comparison methods
    async getMonthOverMonthComparison(userId: string, categoryId?: string, currency?: string) {
        return this.comparisonService.getMonthOverMonthComparison(userId, categoryId, currency);
    }

    async getYearOverYearComparison(userId: string, categoryId?: string, currency?: string) {
        return this.comparisonService.getYearOverYearComparison(userId, categoryId, currency);
    }

    // Forecast methods
    async getForecast(
        userId: string,
        period: '1month' | '3months' | '6months' | '1year' = '3months',
        startDate?: string,
        endDate?: string,
        currency?: string,
    ) {
        return this.forecastService.getForecast(userId, period, startDate, endDate, currency);
    }

    // Heatmap methods
    async getHeatmapData(userId: string, startDate?: string, endDate?: string, currency?: string) {
        return this.heatmapService.getHeatmapData(userId, startDate, endDate, currency);
    }

    // Patterns methods
    async getSpendingPatterns(userId: string, startDate?: string, endDate?: string, currency?: string) {
        return this.patternsService.getSpendingPatterns(userId, startDate, endDate, currency);
    }

    // Calendar methods
    async getCalendarData(userId: string, startDate?: string, endDate?: string, currency?: string) {
        return this.calendarService.getCalendarData(userId, startDate, endDate, currency);
    }

    async getDailyTotals(userId: string, startDate: string, endDate: string) {
        return this.calendarService.getDailyTotals(userId, startDate, endDate);
    }
}

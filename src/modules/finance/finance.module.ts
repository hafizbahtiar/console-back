import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';

// Auth Module (for JWT guards)
import { AuthModule } from '../auth/auth.module';
// Upload Module (for file uploads - receipts)
import { UploadModule } from '../upload/upload.module';

// Schemas
import { Transaction, TransactionSchema } from './schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategorySchema } from './schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategorySchema } from './schemas/finance-income-category.schema';
import { RecurringTransaction, RecurringTransactionSchema } from './schemas/finance-recurring-transaction.schema';
import { TransactionTemplate, TransactionTemplateSchema } from './schemas/finance-transaction-template.schema';
import { ImportHistory, ImportHistorySchema } from './schemas/finance-import-history.schema';
import { Budget, BudgetSchema } from './schemas/finance-budget.schema';
import { FinancialGoal, FinancialGoalSchema } from './schemas/finance-financial-goal.schema';
import { FilterPreset, FilterPresetSchema } from './schemas/finance-filter-preset.schema';
import { MerchantCategory, MerchantCategorySchema } from './schemas/finance-merchant-category.schema';

// Controllers
import { FinanceController } from './controllers/finance.controller';
import { FinanceTransactionsController } from './controllers/finance-transactions.controller';
import { FinanceExpenseCategoriesController } from './controllers/finance-expense-categories.controller';
import { FinanceIncomeCategoriesController } from './controllers/finance-income-categories.controller';
import { FinanceRecurringTransactionsController } from './controllers/finance-recurring-transactions.controller';
import { FinanceTransactionTemplatesController } from './controllers/finance-transaction-templates.controller';
import { FinanceImportController } from './controllers/finance-import.controller';
import { FinanceBudgetsController } from './controllers/finance-budgets.controller';
import { FinanceFinancialGoalsController } from './controllers/finance-financial-goals.controller';
import { FinanceFilterPresetsController } from './controllers/finance-filter-presets.controller';
import { FinanceMerchantCategoriesController } from './controllers/finance-merchant-categories.controller';
import { FinanceCurrencyController } from './controllers/finance-currency.controller';

// Services
import { FinanceTransactionsService } from './services/finance-transactions.service';
import { FinanceExpenseCategoriesService } from './services/finance-expense-categories.service';
import { FinanceIncomeCategoriesService } from './services/finance-income-categories.service';
import { FinanceAnalyticsService } from './services/finance-analytics.service';
import { FinanceRecurringTransactionsService } from './services/finance-recurring-transactions.service';
import { FinanceTransactionTemplatesService } from './services/finance-transaction-templates.service';
import { FinanceImportService } from './services/finance-import.service';
import { FinanceBudgetsService } from './services/finance-budgets.service';
import { FinanceFinancialGoalsService } from './services/finance-financial-goals.service';
import { FinanceFilterPresetsService } from './services/finance-filter-presets.service';
import { FinanceSearchService } from './services/finance-search.service';
import { ReceiptOcrService } from './services/receipt-ocr.service';
import { ReceiptCategorizationService } from './services/receipt-categorization.service';
// Analytics Services
import { FinanceAnalyticsBaseService } from './services/analytics/finance-analytics-base.service';
import { FinanceAnalyticsDashboardService } from './services/analytics/finance-analytics-dashboard.service';
import { FinanceAnalyticsTrendsService } from './services/analytics/finance-analytics-trends.service';
import { FinanceAnalyticsComparisonService } from './services/analytics/finance-analytics-comparison.service';
import { FinanceAnalyticsForecastService } from './services/analytics/finance-analytics-forecast.service';
import { FinanceAnalyticsHeatmapService } from './services/analytics/finance-analytics-heatmap.service';
import { FinanceAnalyticsPatternsService } from './services/analytics/finance-analytics-patterns.service';
import { FinanceAnalyticsCalendarService } from './services/analytics/finance-analytics-calendar.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { SettingsModule } from '../settings/settings.module';

/**
 * Finance Module
 * 
 * Owner-only module for managing financial transactions, categories, and analytics.
 * 
 * Note: All endpoints require owner role. This is enforced using OwnerOnlyGuard.
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
            { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
            { name: IncomeCategory.name, schema: IncomeCategorySchema },
            { name: RecurringTransaction.name, schema: RecurringTransactionSchema },
            { name: TransactionTemplate.name, schema: TransactionTemplateSchema },
            { name: ImportHistory.name, schema: ImportHistorySchema },
            { name: Budget.name, schema: BudgetSchema },
            { name: FinancialGoal.name, schema: FinancialGoalSchema },
            { name: FilterPreset.name, schema: FilterPresetSchema },
            { name: MerchantCategory.name, schema: MerchantCategorySchema },
        ]),
        // Note: FinanceAnalyticsService and FinanceTransactionsService need access to all finance models
        PassportModule,
        AuthModule,
        UploadModule, // For file uploads (receipts)
        SettingsModule, // For currency preferences
        // Rate limiting for finance endpoints
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1 minute
                limit: 300, // more generous limit for finance endpoints (accounts for React Strict Mode)
            },
        ]),
    ],
    controllers: [
        FinanceController,
        FinanceTransactionsController,
        FinanceExpenseCategoriesController,
        FinanceIncomeCategoriesController,
        FinanceRecurringTransactionsController,
        FinanceTransactionTemplatesController,
        FinanceImportController,
        FinanceBudgetsController,
        FinanceFinancialGoalsController,
        FinanceFilterPresetsController,
        FinanceMerchantCategoriesController,
        FinanceCurrencyController,
    ],
    providers: [
        FinanceTransactionsService,
        FinanceExpenseCategoriesService,
        FinanceIncomeCategoriesService,
        // Analytics Services
        FinanceAnalyticsBaseService,
        FinanceAnalyticsDashboardService,
        FinanceAnalyticsTrendsService,
        FinanceAnalyticsComparisonService,
        FinanceAnalyticsForecastService,
        FinanceAnalyticsHeatmapService,
        FinanceAnalyticsPatternsService,
        FinanceAnalyticsCalendarService,
        FinanceAnalyticsService, // Main facade service (must be last)
        FinanceRecurringTransactionsService,
        FinanceTransactionTemplatesService,
        FinanceImportService,
        FinanceBudgetsService,
        FinanceFinancialGoalsService,
        FinanceFilterPresetsService,
        FinanceSearchService,
        ReceiptOcrService,
        ReceiptCategorizationService,
        ExchangeRateService,
    ],
    exports: [
        FinanceTransactionsService,
        FinanceExpenseCategoriesService,
        FinanceIncomeCategoriesService,
        FinanceAnalyticsService,
        FinanceRecurringTransactionsService,
        FinanceTransactionTemplatesService,
        FinanceImportService,
        FinanceBudgetsService,
        FinanceFinancialGoalsService,
        FinanceFilterPresetsService,
        FinanceSearchService,
        ReceiptOcrService,
        ReceiptCategorizationService,
        ExchangeRateService,
    ],
})
export class FinanceModule { }


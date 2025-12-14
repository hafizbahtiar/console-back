# Finance Module

## Overview

The Finance Module provides comprehensive financial management functionality for the Console application. It is an owner-only module that enables users to track income and expenses, manage budgets, set financial goals, analyze spending patterns, and import transaction data. The module includes advanced features like receipt OCR processing, currency conversion, and sophisticated analytics with forecasting capabilities.

## Features

### 1. Transaction Management
- **Income & Expense Tracking**: Record and categorize all financial transactions
- **Multi-Currency Support**: Support for 26+ currencies with automatic conversion
- **Receipt Management**: Upload, extract, and manage receipt images and PDFs
- **OCR Processing**: Automatic receipt data extraction using Tesseract.js
- **Transaction Templates**: Save frequently used transactions as templates
- **Bulk Operations**: Bulk delete, duplicate, and manage transactions
- **Advanced Search**: Full-text search with suggestions and analytics

### 2. Category Management
- **Expense Categories**: Create and manage expense categories
- **Income Categories**: Create and manage income categories  
- **Merchant Categories**: Automatic merchant categorization
- **Smart Categorization**: AI-powered category suggestions based on merchant data

### 3. Budget Management
- **Budget Creation**: Set monthly and yearly budgets for categories
- **Budget Tracking**: Monitor spending against budget limits
- **Alert System**: Configurable warning and critical thresholds    
- **Budget Rollover**: Option to carry forward unused budget amounts

### 4. Financial Goals
- **Goal Setting**: Create short-term and long-term financial goals
- **Progress Tracking**: Monitor goal completion with visual indicators
- **Target Dates**: Set target dates for goal achievement

### 5. Analytics & Reporting
- **Dashboard Overview**: Comprehensive financial dashboard with key metrics
- **Income vs Expenses**: Detailed comparison of income and expense trends
- **Category Breakdown**: Spending analysis by category with percentages
- **Trend Analysis**: Monthly and yearly spending/income trends
- **Comparative Analysis**: Month-over-month and year-over-year comparisons
- **Forecasting**: AI-powered financial forecasting with confidence intervals
- **Spending Patterns**: Pattern detection and anomaly identification
- **Calendar Heatmap**: Visual representation of daily transaction activity
- **Export Capabilities**: Export data in CSV, JSON, Excel, and PDF formats

### 6. Recurring Transactions
- **Automated Entries**: Set up recurring income and expense transactions
- **Flexible Scheduling**: Support for various recurrence patterns
- **Manual Override**: Ability to modify individual recurring entries

### 7. Data Import
- **CSV/Excel Import**: Import transactions from bank statements and other sources
- **Column Mapping**: Flexible mapping of import columns to transaction fields
- **Preview & Validate**: Preview imports before committing to database
- **Import History**: Track and manage import operations

### 8. Currency Management
- **Exchange Rate Service**: Real-time currency conversion rates
- **Base Currency**: User-configurable base currency for all calculations
- **Automatic Conversion**: Convert all transactions to base currency for reporting

## Module Structure

```
src/modules/finance/
├── finance.module.ts              # Main module configuration
├── controllers/                   # API endpoints
│   ├── finance.controller.ts      # Main analytics and export endpoints
│   ├── finance-transactions.controller.ts  # Transaction CRUD operations
│   ├── finance-expense-categories.controller.ts  # Expense categories
│   ├── finance-income-categories.controller.ts   # Income categories
│   ├── finance-recurring-transactions.controller.ts  # Recurring transactions
│   ├── finance-transaction-templates.controller.ts  # Transaction templates
│   ├── finance-import.controller.ts  # Data import functionality
│   ├── finance-budgets.controller.ts  # Budget management
│   ├── finance-financial-goals.controller.ts  # Financial goals
│   ├── finance-filter-presets.controller.ts  # Filter presets
│   ├── finance-merchant-categories.controller.ts  # Merchant categories
│   └── finance-currency.controller.ts  # Currency conversion
├── services/                      # Business logic
│   ├── finance-transactions.service.ts  # Transaction operations
│   ├── finance-analytics.service.ts     # Main analytics facade
│   ├── finance-budgets.service.ts       # Budget management
│   ├── finance-financial-goals.service.ts  # Goal tracking
│   ├── finance-import.service.ts        # Data import
│   ├── finance-search.service.ts        # Search functionality
│   ├── receipt-ocr.service.ts           # OCR processing
│   ├── receipt-categorization.service.ts  # Smart categorization
│   ├── exchange-rate.service.ts         # Currency conversion
│   └── analytics/                        # Analytics services
│       ├── finance-analytics-base.service.ts
│       ├── finance-analytics-dashboard.service.ts
│       ├── finance-analytics-trends.service.ts
│       ├── finance-analytics-comparison.service.ts
│       ├── finance-analytics-forecast.service.ts
│       ├── finance-analytics-heatmap.service.ts
│       ├── finance-analytics-patterns.service.ts
│       └── finance-analytics-calendar.service.ts
├── schemas/                       # Database schemas
│   ├── finance-transaction.schema.ts
│   ├── finance-expense-category.schema.ts
│   ├── finance-income-category.schema.ts
│   ├── finance-recurring-transaction.schema.ts
│   ├── finance-transaction-template.schema.ts
│   ├── finance-import-history.schema.ts
│   ├── finance-budget.schema.ts
│   ├── finance-financial-goal.schema.ts
│   ├── finance-filter-preset.schema.ts
│   └── finance-merchant-category.schema.ts
├── dto/                          # Data Transfer Objects
│   ├── analytics/               # Analytics response DTOs
│   ├── budgets/                 # Budget management DTOs
│   ├── currency/                # Currency conversion DTOs
│   ├── expense-categories/      # Expense category DTOs
│   ├── income-categories/       # Income category DTOs
│   ├── recurring-transactions/  # Recurring transaction DTOs
│   ├── transaction-templates/  # Template DTOs
│   ├── transactions/            # Transaction DTOs
│   ├── import/                  # Import functionality DTOs
│   ├── filter-presets/          # Filter preset DTOs
│   ├── merchant-categories/     # Merchant category DTOs
│   └── search/                  # Search functionality DTOs
├── common/                      # Shared utilities
│   └── currency-codes.ts        # Supported currency codes
└── README.md                    # This documentation
```

## Key Components

### Core Entities

#### Transaction
Central transaction entity with comprehensive fields:
- `amount`: Transaction amount with currency support
- `currency`: ISO 4217 currency code
- `exchangeRate`: Exchange rate at transaction time
- `baseAmount`: Amount converted to base currency
- `type`: 'income' or 'expense'
- `categoryId`: Reference to category
- `date`: Transaction date
- `description`: Transaction description
- `tags`: Array of tags for organization
- `paymentMethod`: Payment method used
- `receiptUrl`: URL to receipt file
- `receiptOcrData`: Extracted data from OCR processing

#### Budget
Budget management with alert thresholds:
- `name`: Budget name
- `categoryId`: Optional category association
- `amount`: Budget amount
- `period`: 'monthly' or 'yearly'
- `startDate`/`endDate`: Budget period
- `alertThresholds`: Warning, critical, and exceeded thresholds
- `rolloverEnabled`: Whether unused budget carries forward

#### FinancialGoal
Goal tracking entity:
- `name`: Goal name
- `targetAmount`: Target amount to save
- `currentAmount`: Current progress
- `targetDate`: Target completion date
- `description`: Goal description

### Analytics Services

#### FinanceAnalyticsService
Main facade service that coordinates all analytics functionality:
- Dashboard overview and key metrics
- Income vs expense analysis
- Category breakdown and trends
- Export functionality

#### Specialized Analytics Services
- **Dashboard Service**: Overview metrics and summaries
- **Trends Service**: Monthly and yearly trend analysis
- **Comparison Service**: Period-over-period comparisons
- **Forecast Service**: AI-powered financial forecasting
- **Heatmap Service**: Calendar visualization data
- **Patterns Service**: Spending pattern detection
- **Calendar Service**: Daily transaction aggregation

### OCR Processing

#### ReceiptOcrService
Advanced OCR processing using Tesseract.js:
- Image preprocessing (resize, grayscale, sharpen)
- Text extraction from receipts
- Data parsing and confidence scoring
- Support for multiple receipt formats

#### ReceiptCategorizationService
AI-powered categorization:
- Merchant name recognition
- Category suggestions based on merchant data
- Learning from user overrides
- Merchant-to-category mapping

## API Endpoints

### Authentication & Authorization
All endpoints require:
- **JWT Authentication**: `JwtAuthGuard`
- **Owner Role**: `OwnerOnlyGuard`
- **Rate Limiting**: 150 requests/minute (accounts for React Strict Mode)

### Transaction Management

#### Basic CRUD Operations
```
GET    /finance/transactions              # List transactions with filtering
POST   /finance/transactions              # Create new transaction
GET    /finance/transactions/:id          # Get specific transaction
PATCH  /finance/transactions/:id          # Update transaction
DELETE /finance/transactions/:id          # Delete transaction
POST   /finance/transactions/bulk-delete  # Bulk delete transactions
```

#### Advanced Features
```
POST   /finance/transactions/:id/save-as-template      # Save as template
POST   /finance/transactions/from-template/:templateId  # Create from template
POST   /finance/transactions/:id/duplicate             # Duplicate transaction
POST   /finance/transactions/bulk-duplicate            # Bulk duplicate

# Receipt Management
POST   /finance/transactions/:id/receipt               # Upload receipt
GET    /finance/transactions/:id/receipt               # Get receipt URL
DELETE /finance/transactions/:id/receipt               # Delete receipt

# OCR Processing
POST   /finance/transactions/:id/receipt/extract       # Extract OCR data
GET    /finance/transactions/:id/receipt/ocr           # Get OCR data
PATCH  /finance/transactions/:id/apply-ocr             # Apply OCR data
DELETE /finance/transactions/:id/receipt/ocr           # Discard OCR data

# Search & Analytics
GET    /finance/transactions/search/suggestions        # Search suggestions
GET    /finance/transactions/search/analytics          # Search analytics
GET    /finance/transactions/statistics                # Transaction statistics
```

### Analytics & Reporting
```
GET    /finance/dashboard                              # Financial dashboard
GET    /finance/analytics/income-expenses              # Income vs expenses
GET    /finance/analytics/categories                   # Category breakdown
GET    /finance/analytics/trends                       # Monthly/yearly trends
GET    /finance/analytics/category-trends              # Category trends over time
GET    /finance/analytics/comparison/mom               # Month-over-month comparison
GET    /finance/analytics/comparison/yoy               # Year-over-year comparison
GET    /finance/analytics/forecast                     # Financial forecasting
GET    /finance/analytics/heatmap                      # Calendar heatmap data
GET    /finance/analytics/patterns                     # Spending patterns
GET    /finance/analytics/calendar                     # Calendar view data
GET    /finance/analytics/calendar/daily-totals        # Daily totals
GET    /finance/export                                 # Export transactions
```

### Category Management
```
# Expense Categories
GET    /finance/expense-categories                     # List expense categories
POST   /finance/expense-categories                     # Create expense category
GET    /finance/expense-categories/:id                 # Get expense category
PATCH  /finance/expense-categories/:id                 # Update expense category
DELETE /finance/expense-categories/:id                 # Delete expense category
POST   /finance/expense-categories/bulk-delete        # Bulk delete

# Income Categories
GET    /finance/income-categories                      # List income categories
POST   /finance/income-categories                      # Create income category
GET    /finance/income-categories/:id                  # Get income category
PATCH  /finance/income-categories/:id                  # Update income category
DELETE /finance/income-categories/:id                  # Delete income category
POST   /finance/income-categories/bulk-delete         # Bulk delete

# Merchant Categories
GET    /finance/merchant-categories                    # List merchant categories
POST   /finance/merchant-categories                    # Create merchant category
GET    /finance/merchant-categories/:id                # Get merchant category
PATCH  /finance/merchant-categories/:id                # Update merchant category
DELETE /finance/merchant-categories/:id                # Delete merchant category
```

### Budget Management
```
GET    /finance/budgets                                # List budgets
POST   /finance/budgets                                # Create budget
GET    /finance/budgets/:id                            # Get budget
PATCH  /finance/budgets/:id                            # Update budget
DELETE /finance/budgets/:id                            # Delete budget
POST   /finance/budgets/bulk-delete                   # Bulk delete budgets
```

### Financial Goals
```
GET    /finance/financial-goals                        # List goals
POST   /finance/financial-goals                        # Create goal
GET    /finance/financial-goals/:id                    # Get goal
PATCH  /finance/financial-goals/:id                    # Update goal
DELETE /finance/financial-goals/:id                    # Delete goal
POST   /finance/financial-goals/bulk-delete           # Bulk delete goals
```

### Recurring Transactions
```
GET    /finance/recurring-transactions                 # List recurring transactions
POST   /finance/recurring-transactions                 # Create recurring transaction
GET    /finance/recurring-transactions/:id             # Get recurring transaction
PATCH  /finance/recurring-transactions/:id             # Update recurring transaction
DELETE /finance/recurring-transactions/:id             # Delete recurring transaction
```

### Data Import
```
POST   /finance/import/preview                         # Preview import
POST   /finance/import                                 # Import transactions
GET    /finance/import/history                         # Import history
GET    /finance/import/history/:id                     # Get import details
```

### Currency Management
```
GET    /finance/currency/rates                         # Get exchange rates
POST   /finance/currency/convert                       # Convert currency
```

## Supported Currencies

The module supports 26+ currencies including:
- **MYR** (Malaysian Ringgit) - Default currency
- **USD** (US Dollar)
- **EUR** (Euro)
- **GBP** (British Pound)
- **SGD** (Singapore Dollar)
- **AUD** (Australian Dollar)
- **JPY** (Japanese Yen)
- **CNY** (Chinese Yuan)
- **And 18+ more currencies**

## Database Schema

### Core Schemas
- **Transaction**: Financial transactions with multi-currency support
- **ExpenseCategory**: Expense categorization
- **IncomeCategory**: Income categorization
- **Budget**: Budget planning and tracking
- **FinancialGoal**: Goal setting and progress tracking
- **RecurringTransaction**: Automated recurring entries
- **TransactionTemplate**: Reusable transaction templates
- **ImportHistory**: Import operation tracking
- **FilterPreset**: Saved search filters
- **MerchantCategory**: Merchant-based categorization

### Common Features
- All schemas support soft deletion
- Comprehensive indexing for performance
- Timestamps for creation and updates
- Proper relationships and references

## Development Notes

- **Owner-Only Module**: All endpoints require owner role authentication
- **Multi-Currency Support**: Automatic currency conversion to base currency
- **OCR Processing**: Tesseract.js for receipt data extraction
- **Analytics Engine**: MongoDB aggregation for complex financial analysis
- **Soft Deletion**: All entities support soft delete functionality
- **Rate Limiting**: Configurable throttling for different endpoint types
- **File Uploads**: Multer integration for receipt file handling
- **Search**: Full-text search with MongoDB text indexes

## Security Considerations

- **Role-Based Access**: Owner-only access to all financial data
- **Input Validation**: Comprehensive validation for all financial inputs
- **File Upload Security**: Secure handling of receipt files
- **Data Isolation**: Users can only access their own financial data
- **Rate Limiting**: Protection against abuse and API misuse
- **OCR Data Privacy**: Secure processing of receipt images

## Performance Optimizations

- **Database Indexing**: Optimized indexes for common query patterns
- **Aggregation Pipelines**: Efficient MongoDB aggregations for analytics
- **Caching**: Exchange rate caching to reduce external API calls
- **Pagination**: Efficient data pagination for large datasets
- **Bulk Operations**: Optimized bulk operations for better performance

## Future Enhancements

- **Bank Integration**: Direct bank account synchronization
- **Investment Tracking**: Support for investment portfolio management
- **Tax Calculations**: Automated tax calculation and reporting
- **Advanced Forecasting**: Machine learning-based financial predictions
- **Multi-Tenant Support**: Organization-level financial management
- **Mobile App API**: Optimized endpoints for mobile applications
- **Real-time Notifications**: Budget alerts and goal milestone notifications
- **Advanced Reporting**: Custom report generation and scheduling
- **Budget Automation**: Smart budget adjustments based on spending patterns

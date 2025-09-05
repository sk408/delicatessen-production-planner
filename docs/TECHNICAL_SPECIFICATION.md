# Technical Specification - Delicatessen Production Planner Web App

## Architecture Overview

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and optimized builds)
- **Styling**: Tailwind CSS + Headless UI components
- **State Management**: Zustand (lightweight, TypeScript-friendly)
- **Data Processing**: Web Workers for heavy computations
- **Charts/Visualization**: Chart.js with react-chartjs-2
- **File Processing**: PapaParse for CSV, SheetJS for XLSX
- **Date Handling**: date-fns (tree-shakeable, modern)
- **Testing**: Vitest + React Testing Library
- **Deployment**: GitHub Pages with GitHub Actions

### Key Design Principles
1. **Performance First**: Web Workers for CPU-intensive tasks
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Responsive Design**: Mobile-first approach with Tailwind
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Professional UI**: Clean, business-appropriate interface
6. **Offline Capable**: All processing done client-side

## Data Models

### Core Types

```typescript
// Raw CSV data structure
interface RawSalesData {
  deptNum: string;
  fiscalYear: number;
  memberNetSalesAmt: number;
  memberNetSalesAmtLY: number;
  majorGroupCatCode: string;
  memberNetSalesUnits: number;
  memberNetSalesUnitsLY: number;
  item: string; // "12345 ITEM DESCRIPTION"
  fiscalPeriod: number;
  fiscalWeek: number;
  fiscalDay: number;
}

// Processed sales data
interface ProcessedSalesData {
  itemNumber: string;
  itemDescription: string;
  calendarDate: Date;
  fiscalDate: FiscalDate;
  currentYearUnits: number;
  lastYearUnits: number;
  twoYearsAgoUnits?: number;
  variance: number;
  variancePercent: number;
}

// Fiscal calendar conversion
interface FiscalDate {
  fiscalYear: number;
  fiscalPeriod: number;
  fiscalWeek: number;
  fiscalDay: number;
}

// Holiday configuration
interface Holiday {
  id: string;
  name: string;
  type: 'fixed' | 'floating' | 'relative';
  month?: number; // for fixed holidays
  day?: number; // for fixed holidays
  rule?: string; // for floating holidays (e.g., "fourth Thursday in November")
  daysBefore: number;
  daysAfter: number;
  salesMultiplier: number;
  description: string;
}

// Item configuration
interface ItemConfig {
  itemNumber: string;
  itemDescription: string;
  productivity: number; // units per hour
  shelfLife: number; // days
  minBatchSize: number;
  maxDaysAhead: number;
  defaultGrowthRate: number;
  isActive: boolean;
  category?: string;
}

// Production plan output
interface ProductionPlan {
  date: Date;
  items: ProductionPlanItem[];
  summary: ProductionSummary;
  metadata: PlanMetadata;
}

interface ProductionPlanItem {
  itemNumber: string;
  itemDescription: string;
  // Current inventory
  oldStockStart: number;
  oldStockEnd: number;
  stockAge: number;
  newStockEnd: number;
  // Forecasting
  lastYearUnits: number;
  dateFactor: number;
  dateFactorReasons: string[];
  // Batch planning
  multiDayDemand: number;
  todayNeed: number;
  batchSize: number;
  produceToday: number;
  hoursNeeded: number;
  batchReasoning: string;
  // Configuration
  productivity: number;
  shelfLife: number;
  growthRate: number;
}

interface ProductionSummary {
  totalItems: number;
  totalUnitsToProducе: number;
  totalHoursNeeded: number;
  itemsWithCarryover: number;
  expiredItems: number;
  batchEfficiencyScore: number;
}

interface PlanMetadata {
  generatedAt: Date;
  dataSource: string[];
  holidaysConsidered: Holiday[];
  planningHorizon: number; // days
  fiscalYearStart: Date;
}
```

### State Management

```typescript
// Main application state
interface AppState {
  // CSV Data Management
  uploadedFiles: UploadedFile[];
  processedData: ProcessedSalesData[];
  dataStatus: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  
  // Configuration
  holidays: Holiday[];
  itemConfigs: Record<string, ItemConfig>;
  globalSettings: GlobalSettings;
  
  // Planning
  selectedDateRange: DateRange;
  selectedItems: string[];
  currentPlan: ProductionPlan | null;
  
  // UI State
  activeStep: number;
  isLoading: boolean;
  errors: AppError[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'pending' | 'processed' | 'error';
  recordCount?: number;
  dateRange?: DateRange;
  errors?: string[];
}

interface GlobalSettings {
  fiscalYearStart: { month: number; day: number };
  defaultProductivity: number;
  defaultShelfLife: number;
  defaultMinBatchSize: number;
  defaultMaxDaysAhead: number;
  defaultGrowthRate: number;
  currency: string;
  timezone: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface AppError {
  id: string;
  type: 'validation' | 'processing' | 'export' | 'network';
  message: string;
  details?: any;
  timestamp: Date;
}
```

## Core Algorithms

### 1. Fiscal Calendar Conversion

```typescript
class FiscalCalendar {
  private fiscalYearStart: Date;
  
  constructor(fiscalYearStart: { month: number; day: number }) {
    this.fiscalYearStart = new Date(2024, fiscalYearStart.month - 1, fiscalYearStart.day);
  }
  
  convertToCalendarDate(fiscalYear: number, period: number, week: number, day: number): Date {
    // Implementation for converting fiscal dates to calendar dates
    // Handles leap years and fiscal year boundaries
  }
  
  getCorrespondingDateLastYear(date: Date): Date {
    // Find the equivalent date from the previous year
    // Accounts for holiday shifts and calendar differences
  }
}
```

### 2. Holiday Detection Engine

```typescript
class HolidayEngine {
  private holidays: Holiday[];
  
  constructor(holidays: Holiday[]) {
    this.holidays = holidays;
  }
  
  getHolidaysForYear(year: number): HolidayInstance[] {
    // Calculate actual dates for floating holidays
    // Return all holidays with their calculated dates
  }
  
  getHolidayImpactFactor(date: Date, holidays: HolidayInstance[]): HolidayImpact {
    // Calculate combined impact of nearby holidays
    // Returns multiplier and explanation
  }
  
  private calculateFloatingHoliday(rule: string, year: number): Date {
    // Parse rules like "fourth Thursday in November"
    // Return calculated date
  }
}
```

### 3. Demand Forecasting

```typescript
class DemandForecaster {
  private holidayEngine: HolidayEngine;
  private seasonalFactors: Record<number, number>;
  private dayOfWeekFactors: Record<number, number>;
  
  forecastDemand(
    item: ProcessedSalesData[],
    targetDate: Date,
    growthRate: number
  ): ForecastResult {
    // 1. Get base demand (historical average)
    // 2. Apply seasonal adjustments
    // 3. Apply day-of-week patterns
    // 4. Apply holiday proximity effects
    // 5. Apply growth rate
    // 6. Return forecast with confidence interval
  }
  
  forecastMultiDay(
    item: ProcessedSalesData[],
    startDate: Date,
    days: number,
    growthRate: number
  ): MultiDayForecast {
    // Forecast demand for multiple consecutive days
    // Used for batch planning optimization
  }
}
```

### 4. Batch Optimization

```typescript
class BatchOptimizer {
  optimizeBatchSize(
    multiDayDemand: MultiDayForecast,
    currentStock: number,
    config: ItemConfig
  ): BatchDecision {
    // 1. Calculate net demand (demand - current stock)
    // 2. Generate batch size options
    // 3. Score each option (efficiency vs waste risk)
    // 4. Select optimal batch size
    // 5. Return decision with reasoning
  }
  
  private generateBatchOptions(
    netDemand: number,
    config: ItemConfig
  ): BatchOption[] {
    // Generate multiple batch size options:
    // - Minimum batch size
    // - Exact demand
    // - Shelf-life constrained maximum
    // - Economic batch quantity
  }
  
  private scoreBatchOption(
    option: BatchOption,
    demand: MultiDayForecast,
    config: ItemConfig
  ): BatchScore {
    // Score based on:
    // - Production efficiency (setup cost amortization)
    // - Waste risk (expiration probability)
    // - Storage costs
    // - Labor utilization
  }
}
```

## Component Architecture

### Page Components

```typescript
// Main application shell
function App() {
  // Router setup and global state providers
}

// Multi-step workflow pages
function DataUploadPage() {
  // CSV file upload and validation
}

function ConfigurationPage() {
  // Holiday and item configuration
}

function PlanningPage() {
  // Date selection and item filtering
}

function ResultsPage() {
  // Production plan display and export
}
```

### Feature Components

```typescript
// CSV Upload and Management
function CsvUploader() {
  // Drag & drop file upload with validation
}

function DataPreview() {
  // Table view of uploaded data with statistics
}

function FileManager() {
  // Manage multiple uploaded files
}

// Configuration
function HolidayManager() {
  // Add/edit/delete holidays with calendar preview
}

function ItemConfigEditor() {
  // Bulk edit item configurations with filtering
}

function GlobalSettingsPanel() {
  // Application-wide settings
}

// Planning Interface
function DateRangePicker() {
  // Calendar-based date selection with fiscal period overlay
}

function ItemSelector() {
  // Filterable, sortable item list with volume indicators
}

function PlanPreview() {
  // Live preview of production plan as selections change
}

// Results and Export
function ProductionPlanTable() {
  // Detailed production plan with sorting and filtering
}

function PlanSummary() {
  // Key metrics and efficiency indicators
}

function ExportOptions() {
  // XLSX and Google Sheets export with template selection
}
```

### Common UI Components

```typescript
// Form Components
function FormField() {
  // Standardized form field with validation
}

function NumberInput() {
  // Numeric input with formatting and validation
}

function DatePicker() {
  // Calendar date picker with fiscal date display
}

// Data Display
function DataTable<T>() {
  // Generic sortable, filterable table component
}

function MetricCard() {
  // Display key metrics with trend indicators
}

function Chart() {
  // Wrapper around Chart.js with consistent styling
}

// Navigation
function ProgressSteps() {
  // Multi-step workflow indicator
}

function Breadcrumbs() {
  // Navigation breadcrumbs
}

// Feedback
function Toast() {
  // Success/error notifications
}

function LoadingSpinner() {
  // Loading states with progress indication
}

function ErrorBoundary() {
  // Error handling and recovery
}
```

## Data Processing Pipeline

### 1. CSV Upload and Validation

```typescript
class CsvProcessor {
  async processFile(file: File): Promise<ProcessingResult> {
    // 1. Parse CSV with PapaParse
    // 2. Validate column structure
    // 3. Validate data types and ranges
    // 4. Extract item information
    // 5. Convert fiscal dates to calendar dates
    // 6. Detect data quality issues
    // 7. Return processed data with validation report
  }
  
  private validateCsvStructure(data: any[][]): ValidationResult {
    // Check for required columns
    // Validate data types
    // Check for missing values
    // Detect duplicate records
  }
  
  private extractItemInfo(itemString: string): ItemInfo {
    // Parse "12345 ITEM DESCRIPTION" format
    // Handle edge cases and malformed data
  }
}
```

### 2. Multi-Year Data Aggregation

```typescript
class DataAggregator {
  aggregateMultiYearData(datasets: ProcessedSalesData[][]): AggregatedData {
    // 1. Align data by calendar dates across years
    // 2. Calculate year-over-year trends
    // 3. Identify seasonal patterns
    // 4. Detect holiday impact patterns
    // 5. Generate confidence scores for forecasts
  }
  
  private alignDataByDate(datasets: ProcessedSalesData[][]): AlignedData {
    // Match equivalent dates across different years
    // Handle leap years and calendar shifts
    // Fill missing data with interpolation
  }
}
```

### 3. Real-time Plan Generation

```typescript
class PlanGenerator {
  async generatePlan(
    data: ProcessedSalesData[],
    dateRange: DateRange,
    selectedItems: string[],
    config: PlanningConfig
  ): Promise<ProductionPlan> {
    // Run in Web Worker for performance
    // 1. Filter data by date range and items
    // 2. Generate forecasts for each item/date
    // 3. Optimize batch sizes
    // 4. Calculate inventory flows (FIFO)
    // 5. Determine production requirements
    // 6. Generate summary statistics
  }
}
```

## Export System

### XLSX Export

```typescript
class XlsxExporter {
  exportProductionPlan(plan: ProductionPlan, template: ExportTemplate): Blob {
    // 1. Create workbook with multiple sheets
    // 2. Apply professional formatting
    // 3. Add charts and summary tables
    // 4. Include metadata and generation info
    // 5. Return XLSX blob for download
  }
  
  private formatProductionSheet(items: ProductionPlanItem[]): WorkSheet {
    // Create main production planning sheet
    // Apply conditional formatting for priorities
    // Add formulas for real-time calculations
  }
  
  private createSummarySheet(summary: ProductionSummary): WorkSheet {
    // Create executive summary with key metrics
    // Add charts showing production distribution
    // Include efficiency indicators
  }
}
```

### Google Sheets Integration

```typescript
class GoogleSheetsExporter {
  async exportToGoogleSheets(
    plan: ProductionPlan,
    template: ExportTemplate
  ): Promise<string> {
    // 1. Authenticate with Google API
    // 2. Create new spreadsheet
    // 3. Apply formatting and formulas
    // 4. Set sharing permissions
    // 5. Return shareable URL
  }
  
  private setupGoogleAuth(): Promise<gapi.auth2.AuthResponse> {
    // Handle OAuth flow for Google Sheets API
    // Manage token refresh and persistence
  }
}
```

## Performance Optimization

### Web Workers

```typescript
// Main thread - UI remains responsive
class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  
  async processData(data: any[], operation: string): Promise<any> {
    // Offload heavy computations to Web Workers
    // Handle worker lifecycle and error recovery
  }
}

// Worker thread - Heavy computations
self.addEventListener('message', (event) => {
  const { operation, data } = event.data;
  
  switch (operation) {
    case 'PROCESS_CSV':
      // Parse and validate CSV data
      break;
    case 'GENERATE_FORECAST':
      // Run forecasting algorithms
      break;
    case 'OPTIMIZE_BATCHES':
      // Calculate optimal batch sizes
      break;
  }
});
```

### Memory Management

```typescript
class DataManager {
  private cache: Map<string, any> = new Map();
  private readonly MAX_CACHE_SIZE = 100; // MB
  
  cacheData(key: string, data: any): void {
    // Implement LRU cache with size limits
    // Automatically clean up old data
  }
  
  private estimateDataSize(data: any): number {
    // Estimate memory usage of data structures
    // Used for cache management decisions
  }
}
```

## Testing Strategy

### Unit Tests
- Core algorithms (forecasting, batch optimization)
- Data processing functions
- Utility functions
- Individual components

### Integration Tests
- CSV processing pipeline
- Multi-step workflow
- Export functionality
- Error handling

### Performance Tests
- Large dataset processing
- Memory usage monitoring
- Web Worker communication
- Export generation speed

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Focus management

## Deployment Architecture

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'papaparse', 'xlsx']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
```

## Security Considerations

### Client-Side Security
- Input validation and sanitization
- XSS prevention in dynamic content
- Secure handling of uploaded files
- Content Security Policy headers

### Data Privacy
- All processing done client-side
- No data transmitted to external servers
- Optional Google Sheets integration with explicit consent
- Clear data retention policies

### API Security
- Google API key management
- OAuth flow security
- Rate limiting and error handling
- Secure token storage

## Accessibility Features

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Color contrast requirements
- Screen reader optimization

### Progressive Enhancement
- Works without JavaScript (basic functionality)
- Graceful degradation for older browsers
- Responsive design for all screen sizes
- Print-friendly layouts

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills and Fallbacks
- Web Workers fallback for older browsers
- File API polyfills
- CSS Grid fallbacks
- JavaScript feature detection

## Documentation Plan

### User Documentation
- Getting started guide
- Feature overview with screenshots
- CSV format specifications
- Configuration best practices
- Troubleshooting guide

### Developer Documentation
- API reference
- Component documentation
- Contributing guidelines
- Build and deployment instructions
- Architecture decision records

This technical specification provides a comprehensive foundation for building a professional, scalable, and maintainable delicatessen production planning web application.



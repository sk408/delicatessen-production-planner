# Implementation Guide - Delicatessen Production Planner

This guide provides step-by-step instructions for implementing the complete web application based on the technical specification.

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Project Setup and Configuration
- [x] Initialize Vite + React + TypeScript project
- [x] Configure Tailwind CSS with custom design system
- [x] Set up ESLint, Prettier, and TypeScript strict mode
- [x] Configure GitHub Actions for CI/CD
- [x] Set up testing framework (Vitest + React Testing Library)

### 1.2 Type System Foundation
- [x] Define comprehensive TypeScript interfaces
- [x] Create utility types for state management
- [x] Set up strict type checking configuration

### 1.3 Core Utilities and Libraries
```typescript
// src/lib/fiscal-calendar.ts - Fiscal date conversion
export class FiscalCalendar {
  constructor(fiscalYearStart: { month: number; day: number }) {}
  convertToCalendarDate(fiscalYear: number, period: number, week: number, day: number): Date {}
  getCorrespondingDateLastYear(date: Date): Date {}
}

// src/lib/csv-parser.ts - CSV processing with validation
export class CsvProcessor {
  async processFile(file: File): Promise<ProcessingResult> {}
  private validateCsvStructure(data: any[][]): ValidationResult {}
  private extractItemInfo(itemString: string): ItemInfo {}
}

// src/utils/date-helpers.ts - Date utility functions
export const formatDate = (date: Date, format: string): string => {}
export const parseDate = (dateString: string): Date => {}
export const isLeapYear = (year: number): boolean => {}
```

## Phase 2: Data Processing Engine (Week 2)

### 2.1 Holiday Detection System
```typescript
// src/lib/holiday-engine.ts
export class HolidayEngine {
  constructor(holidays: Holiday[]) {}
  
  getHolidaysForYear(year: number): HolidayInstance[] {
    // Calculate actual dates for floating holidays
    return this.holidays.map(holiday => ({
      holiday,
      date: this.calculateHolidayDate(holiday, year),
      year
    }));
  }
  
  getHolidayImpactFactor(date: Date, holidays: HolidayInstance[]): HolidayImpact {
    // Calculate combined impact of nearby holidays
    const affectedHolidays = this.findNearbyHolidays(date, holidays);
    const factor = this.calculateCombinedImpact(affectedHolidays);
    return { factor, affectedHolidays, explanation: this.generateExplanation(affectedHolidays) };
  }
  
  private calculateFloatingHoliday(rule: string, year: number): Date {
    // Parse rules like "fourth Thursday in November"
    // Implementation for complex holiday calculations
  }
}
```

### 2.2 Forecasting Algorithms
```typescript
// src/lib/forecasting.ts
export class DemandForecaster {
  constructor(
    private holidayEngine: HolidayEngine,
    private seasonalFactors: Record<number, number>,
    private dayOfWeekFactors: Record<number, number>
  ) {}
  
  forecastDemand(
    historicalData: ProcessedSalesData[],
    targetDate: Date,
    growthRate: number
  ): ForecastResult {
    // 1. Calculate base demand from historical average
    const baseDemand = this.calculateBaseDemand(historicalData, targetDate);
    
    // 2. Apply seasonal adjustments
    const seasonalFactor = this.getSeasonalFactor(targetDate);
    
    // 3. Apply day-of-week patterns
    const dayOfWeekFactor = this.getDayOfWeekFactor(targetDate);
    
    // 4. Apply holiday proximity effects
    const holidayFactor = this.holidayEngine.getHolidayImpactFactor(targetDate, []);
    
    // 5. Apply growth rate
    const finalForecast = baseDemand * seasonalFactor * dayOfWeekFactor * holidayFactor.factor * (1 + growthRate);
    
    return {
      forecast: finalForecast,
      confidence: this.calculateConfidence(historicalData, targetDate),
      factors: { seasonal: seasonalFactor, dayOfWeek: dayOfWeekFactor, holiday: holidayFactor.factor, growth: growthRate }
    };
  }
}
```

### 2.3 Batch Optimization Engine
```typescript
// src/lib/batch-optimizer.ts
export class BatchOptimizer {
  optimizeBatchSize(
    multiDayDemand: MultiDayDemand,
    currentStock: number,
    config: ItemConfig
  ): BatchDecision {
    const netDemand = Math.max(0, multiDayDemand.totalDemand - currentStock);
    
    if (netDemand <= 0) {
      return {
        recommendedBatchSize: 0,
        produceToday: 0,
        hoursNeeded: 0,
        reasoning: `Sufficient stock (${currentStock}) covers ${multiDayDemand.daysAhead}-day demand`,
        options: [],
        selectedOption: null,
        efficiencyScore: 1.0,
        wasteRiskScore: 0.0
      };
    }
    
    const options = this.generateBatchOptions(netDemand, config);
    const scoredOptions = options.map(option => ({
      ...option,
      score: this.scoreBatchOption(option, multiDayDemand, config)
    }));
    
    const bestOption = scoredOptions.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return {
      recommendedBatchSize: bestOption.size,
      produceToday: Math.max(config.minBatchSize, bestOption.size),
      hoursNeeded: bestOption.size / config.productivity,
      reasoning: bestOption.reasoning,
      options: scoredOptions,
      selectedOption: bestOption,
      efficiencyScore: bestOption.efficiency,
      wasteRiskScore: bestOption.wasteRisk
    };
  }
}
```

## Phase 3: User Interface Components (Week 3)

### 3.1 Layout and Navigation
```typescript
// src/components/layout/AppLayout.tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Logo />
          <h1 className="text-xl font-semibold text-gray-900">
            Production Planner
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

### 3.2 CSV Upload and Management
```typescript
// src/components/csv/CsvUploader.tsx
export function CsvUploader({ onUpload }: { onUpload: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
    onDrop: onUpload
  });
  
  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
      )}
    >
      <input {...getInputProps()} />
      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive ? 'Drop CSV files here...' : 'Drag & drop CSV files here, or click to select'}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Supports multiple files for multi-year analysis
      </p>
    </div>
  );
}

// src/components/csv/DataPreview.tsx
export function DataPreview({ data, onValidate }: DataPreviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{data.length} records</Badge>
          <Button onClick={onValidate} size="sm">
            Validate Data
          </Button>
        </div>
      </div>
      
      <DataTable
        data={data.slice(0, 100)} // Preview first 100 rows
        columns={[
          { key: 'itemNumber', title: 'Item #', width: 100 },
          { key: 'itemDescription', title: 'Description', width: 200 },
          { key: 'calendarDate', title: 'Date', width: 120, render: (date) => formatDate(date) },
          { key: 'currentYearUnits', title: 'Current Units', width: 120, render: (units) => formatNumber(units) },
          { key: 'lastYearUnits', title: 'LY Units', width: 120, render: (units) => formatNumber(units) }
        ]}
        selectable
        onSelect={setSelectedRows}
      />
    </div>
  );
}
```

### 3.3 Planning Interface
```typescript
// src/components/planning/ItemSelector.tsx
export function ItemSelector({ items, selectedItems, onSelectionChange }: ItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'name' | 'category'>('volume');
  const [filters, setFilters] = useState<ItemFilters>({});
  
  const filteredItems = useMemo(() => {
    return items
      .filter(item => 
        item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemNumber.includes(searchTerm)
      )
      .filter(item => !filters.category || item.category === filters.category)
      .sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.lastYearUnits - a.lastYearUnits;
          case 'name':
            return a.itemDescription.localeCompare(b.itemDescription);
          case 'category':
            return (a.category || '').localeCompare(b.category || '');
          default:
            return 0;
        }
      });
  }, [items, searchTerm, sortBy, filters]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Select Items</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange(new Set(filteredItems.slice(0, 10).map(item => item.itemNumber)))}
          >
            Select Top 10
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange(new Set())}
          >
            Clear All
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <SearchInput
          placeholder="Search items..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="flex-1"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Sort by Volume</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {filteredItems.map(item => (
          <ItemCard
            key={item.itemNumber}
            item={item}
            selected={selectedItems.has(item.itemNumber)}
            onToggle={(selected) => {
              const newSelection = new Set(selectedItems);
              if (selected) {
                newSelection.add(item.itemNumber);
              } else {
                newSelection.delete(item.itemNumber);
              }
              onSelectionChange(newSelection);
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

## Phase 4: Production Planning Logic (Week 4)

### 4.1 Plan Generation
```typescript
// src/lib/plan-generator.ts
export class PlanGenerator {
  constructor(
    private forecaster: DemandForecaster,
    private batchOptimizer: BatchOptimizer,
    private fiscalCalendar: FiscalCalendar
  ) {}
  
  async generatePlan(
    data: ProcessedSalesData[],
    dateRange: DateRange,
    selectedItems: string[],
    config: PlanningConfig
  ): Promise<ProductionPlan> {
    // Filter data by date range and selected items
    const filteredData = this.filterData(data, dateRange, selectedItems);
    
    // Group data by item
    const itemGroups = this.groupDataByItem(filteredData);
    
    // Generate plan items
    const planItems: ProductionPlanItem[] = [];
    
    for (const [itemNumber, itemData] of itemGroups) {
      const itemConfig = config.itemConfigs[itemNumber];
      if (!itemConfig?.isActive) continue;
      
      // Generate multi-day demand forecast
      const multiDayDemand = await this.forecaster.forecastMultiDay(
        itemData,
        dateRange.start,
        itemConfig.maxDaysAhead,
        itemConfig.defaultGrowthRate
      );
      
      // Calculate current inventory (simplified - would need previous day's data)
      const currentStock = 0;
      
      // Optimize batch size
      const batchDecision = this.batchOptimizer.optimizeBatchSize(
        multiDayDemand,
        currentStock,
        itemConfig
      );
      
      // Create plan item
      planItems.push({
        itemNumber,
        itemDescription: itemData[0]?.itemDescription || '',
        oldStockStart: 0,
        oldStockEnd: 0,
        stockAge: 0,
        newStockEnd: batchDecision.produceToday,
        isExpired: false,
        lastYearUnits: this.calculateAverageUnits(itemData),
        dateFactor: 1.0, // Would be calculated by forecaster
        dateFactorReasons: [],
        seasonalFactor: 1.0,
        holidayFactor: 1.0,
        dayOfWeekFactor: 1.0,
        multiDayDemand,
        todayNeed: multiDayDemand.dailyForecasts[0]?.adjustedDemand || 0,
        batchDecision,
        productivity: itemConfig.productivity,
        shelfLife: itemConfig.shelfLife,
        growthRate: itemConfig.defaultGrowthRate,
        minBatchSize: itemConfig.minBatchSize,
        maxDaysAhead: itemConfig.maxDaysAhead
      });
    }
    
    // Generate summary
    const summary = this.generateSummary(planItems);
    
    // Create metadata
    const metadata: PlanMetadata = {
      generatedAt: new Date(),
      dataSource: config.dataSources,
      holidaysConsidered: config.holidays,
      planningHorizon: config.defaultMaxDaysAhead,
      fiscalYearStart: new Date(2024, 8, 2), // Sept 2, 2024
      version: '1.0.0',
      settings: config.globalSettings
    };
    
    return {
      date: dateRange.start,
      items: planItems,
      summary,
      metadata
    };
  }
}
```

### 4.2 Results Display
```typescript
// src/components/results/ProductionPlanTable.tsx
export function ProductionPlanTable({ plan }: { plan: ProductionPlan }) {
  const [sortBy, setSortBy] = useState<keyof ProductionPlanItem>('batchDecision.produceToday');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const sortedItems = useMemo(() => {
    return [...plan.items].sort((a, b) => {
      const aValue = getNestedValue(a, sortBy);
      const bValue = getNestedValue(b, sortBy);
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }
      
      return String(aValue).localeCompare(String(bValue)) * multiplier;
    });
  }, [plan.items, sortBy, sortDirection]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Production Plan</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {plan.items.length} items
          </Badge>
          <Badge variant="outline">
            {plan.summary.totalHoursNeeded.toFixed(1)} hours
          </Badge>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                title="Item"
                sortKey="itemDescription"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <SortableHeader
                title="Today's Need"
                sortKey="todayNeed"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <SortableHeader
                title="3-Day Demand"
                sortKey="multiDayDemand.totalDemand"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <SortableHeader
                title="Batch Size"
                sortKey="batchDecision.recommendedBatchSize"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <SortableHeader
                title="Produce Today"
                sortKey="batchDecision.produceToday"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <SortableHeader
                title="Hours"
                sortKey="batchDecision.hoursNeeded"
                currentSort={sortBy}
                direction={sortDirection}
                onSort={(key, dir) => { setSortBy(key); setSortDirection(dir); }}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reasoning
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => (
              <ProductionPlanRow key={item.itemNumber} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Phase 5: Export System (Week 5)

### 5.1 XLSX Export
```typescript
// src/lib/export-engine.ts
import * as XLSX from 'xlsx';

export class XlsxExporter {
  exportProductionPlan(plan: ProductionPlan, template: ExportTemplate): Blob {
    const workbook = XLSX.utils.book_new();
    
    // Main production sheet
    const productionSheet = this.createProductionSheet(plan.items, template);
    XLSX.utils.book_append_sheet(workbook, productionSheet, 'Production Plan');
    
    // Summary sheet
    const summarySheet = this.createSummarySheet(plan.summary, plan.metadata);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Charts sheet (if enabled)
    if (template.includeCharts) {
      const chartsSheet = this.createChartsSheet(plan.items);
      XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts');
    }
    
    // Convert to blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  
  private createProductionSheet(items: ProductionPlanItem[], template: ExportTemplate): XLSX.WorkSheet {
    // Prepare data for export
    const data = items.map(item => ({
      'Item Number': item.itemNumber,
      'Description': item.itemDescription,
      'Today\'s Need': item.todayNeed,
      '3-Day Demand': item.multiDayDemand.totalDemand,
      'Batch Size': item.batchDecision.recommendedBatchSize,
      'Produce Today': item.batchDecision.produceToday,
      'Hours Needed': item.batchDecision.hoursNeeded,
      'Efficiency Score': item.batchDecision.efficiencyScore,
      'Waste Risk': item.batchDecision.wasteRiskScore,
      'Reasoning': item.batchDecision.reasoning
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Apply formatting
    this.applyWorksheetFormatting(worksheet, template.styling);
    
    return worksheet;
  }
  
  private applyWorksheetFormatting(worksheet: XLSX.WorkSheet, styling: TemplateStyling): void {
    // Apply cell formatting, colors, borders, etc.
    // This would include conditional formatting for priorities, number formatting, etc.
  }
}
```

### 5.2 Google Sheets Integration
```typescript
// src/lib/google-sheets-exporter.ts
export class GoogleSheetsExporter {
  private gapi: any;
  
  async initialize(): Promise<void> {
    // Load Google API client
    await this.loadGoogleAPI();
    await this.initializeAuth();
  }
  
  async exportToGoogleSheets(plan: ProductionPlan, template: ExportTemplate): Promise<string> {
    // 1. Create new spreadsheet
    const spreadsheet = await this.createSpreadsheet(`Production Plan - ${formatDate(plan.date)}`);
    
    // 2. Add data to sheets
    await this.addProductionData(spreadsheet.spreadsheetId, plan.items);
    await this.addSummaryData(spreadsheet.spreadsheetId, plan.summary);
    
    // 3. Apply formatting
    await this.applyFormatting(spreadsheet.spreadsheetId, template);
    
    // 4. Set sharing permissions
    await this.setSharing(spreadsheet.spreadsheetId);
    
    return spreadsheet.spreadsheetUrl;
  }
  
  private async createSpreadsheet(title: string): Promise<any> {
    const response = await this.gapi.client.sheets.spreadsheets.create({
      properties: { title },
      sheets: [
        { properties: { title: 'Production Plan' } },
        { properties: { title: 'Summary' } },
        { properties: { title: 'Charts' } }
      ]
    });
    
    return response.result;
  }
}
```

## Phase 6: Testing and Optimization (Week 6)

### 6.1 Unit Tests
```typescript
// src/lib/__tests__/batch-optimizer.test.ts
import { describe, it, expect } from 'vitest';
import { BatchOptimizer } from '../batch-optimizer';

describe('BatchOptimizer', () => {
  const optimizer = new BatchOptimizer();
  
  it('should recommend no production when sufficient stock exists', () => {
    const multiDayDemand = {
      totalDemand: 20,
      dailyForecasts: [],
      daysAhead: 3,
      confidenceScore: 0.8
    };
    
    const result = optimizer.optimizeBatchSize(multiDayDemand, 25, {
      minBatchSize: 10,
      shelfLife: 3,
      productivity: 5
    });
    
    expect(result.produceToday).toBe(0);
    expect(result.reasoning).toContain('Sufficient stock');
  });
  
  it('should recommend minimum batch size when demand is low', () => {
    const multiDayDemand = {
      totalDemand: 8,
      dailyForecasts: [],
      daysAhead: 3,
      confidenceScore: 0.8
    };
    
    const result = optimizer.optimizeBatchSize(multiDayDemand, 0, {
      minBatchSize: 15,
      shelfLife: 3,
      productivity: 5
    });
    
    expect(result.produceToday).toBe(15);
    expect(result.reasoning).toContain('Min batch');
  });
});
```

### 6.2 Integration Tests
```typescript
// src/components/__tests__/CsvUploader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CsvUploader } from '../csv/CsvUploader';

describe('CsvUploader', () => {
  it('should handle file drop correctly', async () => {
    const onUpload = vi.fn();
    render(<CsvUploader onUpload={onUpload} />);
    
    const file = new File(['item,units\n12345 TEST ITEM,10'], 'test.csv', { type: 'text/csv' });
    const dropzone = screen.getByText(/drag & drop/i);
    
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    
    expect(onUpload).toHaveBeenCalledWith([file]);
  });
});
```

### 6.3 Performance Optimization
```typescript
// src/workers/data-processor.worker.ts
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;
  
  try {
    switch (type) {
      case 'PROCESS_CSV':
        const result = await processCsvData(payload);
        self.postMessage({ id, success: true, data: result });
        break;
        
      case 'GENERATE_FORECAST':
        const forecast = await generateForecast(payload);
        self.postMessage({ id, success: true, data: forecast });
        break;
        
      case 'OPTIMIZE_BATCHES':
        const batches = await optimizeBatches(payload);
        self.postMessage({ id, success: true, data: batches });
        break;
        
      default:
        throw new Error(`Unknown operation: ${type}`);
    }
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
});

async function processCsvData(csvContent: string): Promise<ProcessedSalesData[]> {
  // Heavy CSV processing logic here
  // This runs in a separate thread, keeping the UI responsive
}
```

## Deployment and Production Readiness

### Production Build Configuration
```typescript
// vite.config.ts production optimizations
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'papaparse', 'xlsx'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
});
```

### Performance Monitoring
```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    processingTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    errorRate: 0,
    userInteractions: 0
  };
  
  measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return operation().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }
  
  private recordMetric(name: string, duration: number): void {
    // Record performance metrics for monitoring
    console.log(`${name}: ${duration.toFixed(2)}ms`);
  }
}
```

### Error Boundary and Recovery
```typescript
// src/components/common/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    // Send error to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Implementation Timeline

### Week 1: Foundation
- Project setup and configuration
- Type system and core utilities
- Basic UI components and layout

### Week 2: Data Processing
- CSV parsing and validation
- Holiday detection engine
- Forecasting algorithms

### Week 3: User Interface
- Complete UI component library
- File upload and management
- Planning interface

### Week 4: Core Logic
- Batch optimization engine
- Production plan generation
- Results display and interaction

### Week 5: Export System
- XLSX export functionality
- Google Sheets integration
- Template system

### Week 6: Testing & Polish
- Comprehensive test suite
- Performance optimization
- Documentation and deployment

## Success Metrics

### Technical Metrics
- **Performance**: < 2s load time, < 1s CSV processing for 10k records
- **Reliability**: < 1% error rate, 99.9% uptime
- **Compatibility**: Works in 95%+ of target browsers
- **Accessibility**: WCAG 2.1 AA compliance

### User Experience Metrics
- **Usability**: Users can complete full workflow in < 10 minutes
- **Accuracy**: Production recommendations within 5% of optimal
- **Efficiency**: 50%+ reduction in manual planning time
- **Adoption**: 80%+ user satisfaction in feedback surveys

This implementation guide provides a comprehensive roadmap for building a professional, scalable delicatessen production planning application that meets all the specified requirements.



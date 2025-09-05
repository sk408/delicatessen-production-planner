// Core data types for the production planner application

// Raw CSV data structure as imported from files
export interface RawSalesData {
  deptNum: string;
  fiscalYear: number;
  memberNetSalesAmt: number;
  memberNetSalesAmtLY: number;
  majorGroupCatCode: string;
  memberNetSalesUnits: number;
  memberNetSalesUnitsLY: number;
  item: string; // Format: "12345 ITEM DESCRIPTION"
  fiscalPeriod: number;
  fiscalWeek: number;
  fiscalDay: number;
}

// Processed sales data after parsing and validation
export interface ProcessedSalesData {
  itemNumber: string;
  itemDescription: string;
  calendarDate: Date;
  fiscalDate: FiscalDate;
  currentYearUnits: number;
  lastYearUnits: number;
  twoYearsAgoUnits?: number;
  variance: number;
  variancePercent: number;
  dataSource: string; // Which CSV file this came from
}

// Fiscal calendar date representation
export interface FiscalDate {
  fiscalYear: number;
  fiscalPeriod: number;
  fiscalWeek: number;
  fiscalDay: number;
}

// Holiday configuration and management
export interface Holiday {
  id: string;
  name: string;
  type: 'fixed' | 'floating' | 'relative';
  month?: number; // 1-12 for fixed holidays
  day?: number; // 1-31 for fixed holidays
  rule?: string; // For floating holidays (e.g., "fourth Thursday in November")
  daysBefore: number;
  daysAfter: number;
  salesMultiplier: number;
  description: string;
  country?: string;
  isActive: boolean;
}

// Calculated holiday instance for a specific year
export interface HolidayInstance {
  holiday: Holiday;
  date: Date;
  year: number;
}

// Holiday impact analysis result
export interface HolidayImpact {
  factor: number;
  affectedHolidays: Array<{
    holiday: Holiday;
    distance: number;
    impact: number;
  }>;
  explanation: string;
}

// Item configuration and settings
export interface ItemConfig {
  itemNumber: string;
  itemDescription: string;
  productivity: number; // units per hour
  shelfLife: number; // days
  minBatchSize: number;
  maxDaysAhead: number;
  defaultGrowthRate: number;
  isActive: boolean;
  category?: string;
  notes?: string;
}

// Production plan for a specific date
export interface ProductionPlan {
  date: Date;
  items: ProductionPlanItem[];
  summary: ProductionSummary;
  metadata: PlanMetadata;
}

// Individual item in a production plan
export interface ProductionPlanItem {
  itemNumber: string;
  itemDescription: string;
  
  // Current inventory status
  oldStockStart: number;
  oldStockEnd: number;
  stockAge: number;
  newStockEnd: number;
  isExpired: boolean;
  
  // Historical data
  lastYearUnits: number;
  twoYearsAgoUnits?: number;
  
  // Forecasting
  dateFactor: number;
  dateFactorReasons: string[];
  seasonalFactor: number;
  holidayFactor: number;
  dayOfWeekFactor: number;
  
  // Batch planning
  multiDayDemand: MultiDayDemand;
  todayNeed: number;
  batchDecision: BatchDecision;
  
  // Configuration
  productivity: number;
  shelfLife: number;
  growthRate: number;
  minBatchSize: number;
  maxDaysAhead: number;
}

// Multi-day demand forecast
export interface MultiDayDemand {
  totalDemand: number;
  dailyForecasts: DailyForecast[];
  daysAhead: number;
  confidenceScore: number;
}

// Single day forecast within multi-day analysis
export interface DailyForecast {
  date: Date;
  baseDemand: number;
  adjustedDemand: number;
  dateFactor: number;
  confidence: number;
  factors: ForecastFactors;
}

// Factors that influence a forecast
export interface ForecastFactors {
  seasonal: number;
  dayOfWeek: number;
  holiday: number;
  trend: number;
  growth: number;
}

// Batch size optimization decision
export interface BatchDecision {
  recommendedBatchSize: number;
  produceToday: number;
  hoursNeeded: number;
  reasoning: string;
  options: BatchOption[];
  selectedOption: BatchOption;
  efficiencyScore: number;
  wasteRiskScore: number;
}

// Individual batch size option
export interface BatchOption {
  size: number;
  efficiency: number;
  wasteRisk: number;
  cost: number;
  reasoning: string;
  score: number;
}

// Production plan summary statistics
export interface ProductionSummary {
  totalItems: number;
  activeItems: number;
  totalUnitsToProducе: number;
  totalHoursNeeded: number;
  itemsWithCarryover: number;
  expiredItems: number;
  batchEfficiencyScore: number;
  estimatedCost: number;
  wasteRiskScore: number;
}

// Metadata about how the plan was generated
export interface PlanMetadata {
  generatedAt: Date;
  dataSource: string[];
  holidaysConsidered: Holiday[];
  planningHorizon: number; // days
  fiscalYearStart: Date;
  version: string;
  settings: GlobalSettings;
}

// Application-wide settings
export interface GlobalSettings {
  fiscalYearStart: { month: number; day: number };
  defaultProductivity: number;
  defaultShelfLife: number;
  defaultMinBatchSize: number;
  defaultMaxDaysAhead: number;
  defaultGrowthRate: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

// Date range selection
export interface DateRange {
  start: Date;
  end: Date;
}

// File upload and management
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'processed' | 'error';
  recordCount?: number;
  dateRange?: DateRange;
  errors?: ValidationError[];
  metadata?: FileMetadata;
}

// File metadata extracted during processing
export interface FileMetadata {
  columns: string[];
  rowCount: number;
  fiscalYears: number[];
  itemCount: number;
  dateRange: DateRange;
  dataQuality: DataQualityReport;
}

// Data quality assessment
export interface DataQualityReport {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  issues: DataQualityIssue[];
  recommendations: string[];
}

// Individual data quality issue
export interface DataQualityIssue {
  type: 'missing_data' | 'invalid_format' | 'outlier' | 'inconsistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRows: number;
  suggestion: string;
}

// Validation error during file processing
export interface ValidationError {
  row: number;
  column: string;
  value: any;
  expected: string;
  message: string;
}

// Processing result from CSV upload
export interface ProcessingResult {
  success: boolean;
  data: ProcessedSalesData[];
  errors: ValidationError[];
  warnings: string[];
  metadata: FileMetadata;
  processingTime: number;
}

// Application error types
export interface AppError {
  id: string;
  type: 'validation' | 'processing' | 'export' | 'network' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
  stack?: string;
}

// Export configuration and options
export interface ExportConfig {
  format: 'xlsx' | 'csv' | 'google-sheets';
  template: ExportTemplate;
  includeCharts: boolean;
  includeSummary: boolean;
  includeMetadata: boolean;
  customFields?: Record<string, any>;
}

// Export template definition
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  layout: TemplateLayout;
  styling: TemplateStyling;
  sections: TemplateSection[];
}

// Template layout configuration
export interface TemplateLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'letter' | 'legal';
  margins: { top: number; right: number; bottom: number; left: number };
  headerHeight: number;
  footerHeight: number;
}

// Template styling options
export interface TemplateStyling {
  fontFamily: string;
  fontSize: number;
  headerColor: string;
  alternateRowColor: string;
  borderStyle: 'none' | 'thin' | 'medium' | 'thick';
  logoUrl?: string;
}

// Template section definition
export interface TemplateSection {
  id: string;
  type: 'header' | 'summary' | 'data' | 'chart' | 'footer';
  title: string;
  columns: TemplateColumn[];
  sortBy?: string;
  groupBy?: string;
  filters?: TemplateFilter[];
}

// Template column definition
export interface TemplateColumn {
  key: string;
  title: string;
  width: number;
  format: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  alignment: 'left' | 'center' | 'right';
  visible: boolean;
}

// Template filter definition
export interface TemplateFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// Chart configuration for exports
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  xAxis: string;
  yAxis: string;
  data: ChartDataPoint[];
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
}

// Chart data point
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
}

// UI state management
export interface UIState {
  activeStep: number;
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
  sidebarOpen: boolean;
  modalOpen: string | null;
  selectedItems: Set<string>;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, any>;
  view: 'table' | 'grid' | 'chart';
}

// Notification system
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  timestamp: Date;
  read: boolean;
}

// Notification action button
export interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'danger';
}

// Theme configuration
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
}

// User preferences
export interface UserPreferences {
  theme: ThemeConfig;
  dateFormat: string;
  numberFormat: string;
  timezone: string;
  language: string;
  defaultView: 'table' | 'grid' | 'chart';
  itemsPerPage: number;
  autoSave: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

// Performance monitoring
export interface PerformanceMetrics {
  loadTime: number;
  processingTime: number;
  memoryUsage: number;
  renderTime: number;
  errorRate: number;
  userInteractions: number;
}

// Analytics event
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
}

// Feature flags
export interface FeatureFlags {
  enableGoogleSheets: boolean;
  enableAdvancedForecasting: boolean;
  enableBatchOptimization: boolean;
  enableRealTimeUpdates: boolean;
  enableAnalytics: boolean;
  enableExperimentalFeatures: boolean;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

// Search and filter parameters
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  dateRange?: DateRange;
  categories?: string[];
}

// Component props interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
}

export interface ErrorProps extends BaseComponentProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: AppError;
  pagination?: PaginationParams;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSelect?: (selectedItems: T[]) => void;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Event handler types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// State management types
export type StateUpdater<T> = T | ((prev: T) => T);
export type StateSelector<T, R> = (state: T) => R;

// Worker message types
export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: Date;
}

export interface WorkerResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  progress?: number;
  timestamp: Date;
}

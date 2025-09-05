import * as XLSX from 'xlsx';
import { formatDate, formatNumber, formatHours, formatPercentage } from '../utils/format-helpers';
import type { ProductionPlan, ExportTemplate } from '../types/index';

/**
 * Export Engine for Production Plans
 * Handles XLSX and CSV export functionality
 */
export class ExportEngine {

  /**
   * Export production plan to XLSX format
   */
  exportToXLSX(plan: ProductionPlan, filename?: string): Blob {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Main production sheet
      const productionSheet = this.createProductionSheet(plan);
      XLSX.utils.book_append_sheet(workbook, productionSheet, 'Production Plan');
      
      // Summary sheet
      const summarySheet = this.createSummarySheet(plan);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Metadata sheet
      const metadataSheet = this.createMetadataSheet(plan);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      
      // Convert to blob
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
    } catch (error) {
      console.error('Error exporting to XLSX:', error);
      throw new Error(`Failed to export XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export production plan to CSV format
   */
  exportToCSV(plan: ProductionPlan): Blob {
    try {
      const headers = [
        'Item Number',
        'Description',
        'Today Need',
        '3-Day Demand', 
        'Batch Size',
        'Produce Today',
        'Hours Needed',
        'Efficiency Score',
        'Waste Risk',
        'Reasoning'
      ];
      
      const rows = plan.items.map(item => [
        item.itemNumber,
        item.itemDescription,
        formatNumber(item.todayNeed),
        formatNumber(item.multiDayDemand.totalDemand),
        formatNumber(item.batchDecision.recommendedBatchSize),
        formatNumber(item.batchDecision.produceToday),
        formatHours(item.batchDecision.hoursNeeded),
        formatPercentage(item.batchDecision.efficiencyScore),
        formatPercentage(item.batchDecision.wasteRiskScore),
        item.batchDecision.reasoning
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create main production planning worksheet
   */
  private createProductionSheet(plan: ProductionPlan): XLSX.WorkSheet {
    // Prepare data for export
    const data = plan.items.map(item => ({
      'Item #': item.itemNumber,
      'Description': item.itemDescription,
      'Old Stock': item.oldStockStart,
      'Stock Age': item.stockAge,
      'LY Units': item.lastYearUnits,
      'Date Factor': item.dateFactor,
      '3-Day Demand': item.multiDayDemand.totalDemand,
      'Today Need': item.todayNeed,
      'Batch Size': item.batchDecision.recommendedBatchSize,
      'Produce Today': item.batchDecision.produceToday,
      'Hours Needed': item.batchDecision.hoursNeeded,
      'Efficiency': item.batchDecision.efficiencyScore,
      'Waste Risk': item.batchDecision.wasteRiskScore,
      'Reasoning': item.batchDecision.reasoning
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add title and date
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Production Plan - ${formatDate(plan.date)}`],
      ['Generated: ' + formatDate(plan.metadata.generatedAt, 'MM/dd/yyyy HH:mm')],
      [] // Empty row
    ], { origin: 'A1' });
    
    // Adjust the data range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    range.s.r += 3; // Start data 3 rows down
    worksheet['!ref'] = XLSX.utils.encode_range(range);
    
    return worksheet;
  }

  /**
   * Create summary worksheet
   */
  private createSummarySheet(plan: ProductionPlan): XLSX.WorkSheet {
    const summaryData = [
      ['Production Summary', ''],
      ['Date', formatDate(plan.date)],
      ['Generated', formatDate(plan.metadata.generatedAt, 'MM/dd/yyyy HH:mm')],
      ['', ''],
      ['Metrics', 'Value'],
      ['Total Items', plan.summary.totalItems],
      ['Active Items', plan.summary.activeItems],
      ['Total Units to Produce', plan.summary.totalUnitsToProducе],
      ['Total Hours Needed', formatNumber(plan.summary.totalHoursNeeded, 1)],
      ['Items with Carryover', plan.summary.itemsWithCarryover],
      ['Expired Items', plan.summary.expiredItems],
      ['Batch Efficiency Score', formatPercentage(plan.summary.batchEfficiencyScore)],
      ['Estimated Cost', `$${formatNumber(plan.summary.estimatedCost, 2)}`],
      ['Waste Risk Score', formatPercentage(plan.summary.wasteRiskScore)]
    ];
    
    return XLSX.utils.aoa_to_sheet(summaryData);
  }

  /**
   * Create metadata worksheet
   */
  private createMetadataSheet(plan: ProductionPlan): XLSX.WorkSheet {
    const metadataData = [
      ['Plan Metadata', ''],
      ['Generated At', formatDate(plan.metadata.generatedAt, 'MM/dd/yyyy HH:mm:ss')],
      ['Version', plan.metadata.version],
      ['Planning Horizon (days)', plan.metadata.planningHorizon],
      ['Fiscal Year Start', formatDate(plan.metadata.fiscalYearStart)],
      ['', ''],
      ['Data Sources', ''],
      ...plan.metadata.dataSource.map(source => ['', source]),
      ['', ''],
      ['Holidays Considered', ''],
      ...plan.metadata.holidaysConsidered.map(holiday => ['', holiday.name]),
      ['', ''],
      ['Settings', ''],
      ['Default Productivity', plan.metadata.settings.defaultProductivity],
      ['Default Shelf Life', plan.metadata.settings.defaultShelfLife],
      ['Default Min Batch Size', plan.metadata.settings.defaultMinBatchSize],
      ['Default Max Days Ahead', plan.metadata.settings.defaultMaxDaysAhead],
      ['Default Growth Rate', formatPercentage(plan.metadata.settings.defaultGrowthRate)],
      ['Currency', plan.metadata.settings.currency],
      ['Timezone', plan.metadata.settings.timezone]
    ];
    
    return XLSX.utils.aoa_to_sheet(metadataData);
  }

  /**
   * Generate filename for export
   */
  generateFilename(plan: ProductionPlan, format: 'xlsx' | 'csv'): string {
    const dateStr = formatDate(plan.date, 'yyyy-MM-dd');
    const timestamp = formatDate(plan.metadata.generatedAt, 'HHmm');
    return `production-plan-${dateStr}-${timestamp}.${format}`;
  }

  /**
   * Download file to user's device
   */
  downloadFile(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export and download XLSX file
   */
  async exportAndDownloadXLSX(plan: ProductionPlan): Promise<void> {
    const blob = this.exportToXLSX(plan);
    const filename = this.generateFilename(plan, 'xlsx');
    this.downloadFile(blob, filename);
  }

  /**
   * Export and download CSV file
   */
  async exportAndDownloadCSV(plan: ProductionPlan): Promise<void> {
    const blob = this.exportToCSV(plan);
    const filename = this.generateFilename(plan, 'csv');
    this.downloadFile(blob, filename);
  }

  /**
   * Validate plan before export
   */
  private validatePlan(plan: ProductionPlan): void {
    if (!plan || !plan.items || plan.items.length === 0) {
      throw new Error('No items in production plan to export');
    }
    
    if (!plan.date || !plan.metadata || !plan.summary) {
      throw new Error('Invalid production plan structure');
    }
  }

  /**
   * Get export preview data (for UI display)
   */
  getExportPreview(plan: ProductionPlan): {
    totalItems: number;
    activeItems: number;
    estimatedFileSize: string;
    dataQuality: 'good' | 'fair' | 'poor';
  } {
    this.validatePlan(plan);
    
    const activeItems = plan.items.filter(item => item.batchDecision.produceToday > 0).length;
    
    // Estimate file size (rough calculation)
    const estimatedRows = plan.items.length + 20; // Items + headers + metadata
    const estimatedSize = estimatedRows * 200; // ~200 bytes per row
    const sizeStr = estimatedSize > 1024 * 1024 
      ? `${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`
      : estimatedSize > 1024
      ? `${(estimatedSize / 1024).toFixed(1)} KB`
      : `${estimatedSize} bytes`;
    
    // Assess data quality
    const itemsWithData = plan.items.filter(item => item.lastYearUnits > 0).length;
    const dataQualityRatio = plan.items.length > 0 ? itemsWithData / plan.items.length : 0;
    
    const dataQuality = dataQualityRatio > 0.8 ? 'good' : 
                       dataQualityRatio > 0.5 ? 'fair' : 'poor';
    
    return {
      totalItems: plan.items.length,
      activeItems,
      estimatedFileSize: sizeStr,
      dataQuality
    };
  }
}



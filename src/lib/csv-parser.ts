import Papa from 'papaparse';
import { FiscalCalendar } from './fiscal-calendar';
import { parseItemString, formatItemNumber } from '@utils/format-helpers';
import type { 
  RawSalesData, 
  ProcessedSalesData, 
  ProcessingResult, 
  ValidationError,
  FileMetadata,
  DataQualityReport,
  DataQualityIssue
} from '@types/index';

/**
 * CSV Parser and Validator for sales data
 */
export class CsvProcessor {
  private fiscalCalendar: FiscalCalendar;

  constructor() {
    // Initialize with fiscal year starting Sept 2
    this.fiscalCalendar = new FiscalCalendar({ month: 9, day: 2 });
  }

  /**
   * Process a CSV file and return validated data
   */
  async processFile(file: File): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    try {
      // Parse CSV file
      const rawData = await this.parseCsv(file);
      
      // Validate structure
      const structureValidation = this.validateCsvStructure(rawData);
      if (!structureValidation.isValid) {
        return {
          success: false,
          data: [],
          errors: structureValidation.errors,
          warnings: [],
          metadata: this.createEmptyMetadata(),
          processingTime: performance.now() - startTime
        };
      }

      // Process and validate data
      const { processedData, errors, warnings } = this.processRawData(rawData, file.name);
      
      // Generate metadata
      const metadata = this.generateMetadata(rawData, processedData, file);
      
      return {
        success: errors.length === 0,
        data: processedData,
        errors,
        warnings,
        metadata,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          column: 'file',
          value: file.name,
          expected: 'valid CSV file',
          message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        warnings: [],
        metadata: this.createEmptyMetadata(),
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Parse CSV file using PapaParse
   */
  private parseCsv(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          } else {
            resolve(results.data as any[][]);
          }
        },
        error: (error) => {
          reject(error);
        },
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });
    });
  }

  /**
   * Validate CSV structure and required columns
   */
  private validateCsvStructure(data: any[][]): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!data || data.length < 2) {
      errors.push({
        row: 0,
        column: 'file',
        value: data?.length || 0,
        expected: 'at least 2 rows (header + data)',
        message: 'File must contain header row and at least one data row'
      });
      return { isValid: false, errors };
    }

    const headers = data[0];
    const requiredColumns = [
      'Dept Num',
      'Fiscal Year',
      'Member Net Sales Amt',
      'Member Net Sales Amt LY',
      'Major Group Cat Code',
      'Member Net Sales Units',
      'Member Net Sales Units LY',
      'Item',
      'Fiscal Period',
      'Fiscal Week',
      'Fiscal Day'
    ];

    // Check for required columns
    const missingColumns = requiredColumns.filter(col => 
      !headers.some((header: string) => header.trim().toLowerCase() === col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      errors.push({
        row: 1,
        column: 'headers',
        value: headers.join(', '),
        expected: requiredColumns.join(', '),
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Process raw CSV data into structured format
   */
  private processRawData(rawData: any[][], fileName: string): {
    processedData: ProcessedSalesData[];
    errors: ValidationError[];
    warnings: string[];
  } {
    const processedData: ProcessedSalesData[] = [];
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (rawData.length < 2) return { processedData, errors, warnings };

    const headers = rawData[0].map((h: string) => h.trim());
    const getColumnIndex = (columnName: string) => 
      headers.findIndex(h => h.toLowerCase() === columnName.toLowerCase());

    // Get column indices
    const columnIndices = {
      deptNum: getColumnIndex('Dept Num'),
      fiscalYear: getColumnIndex('Fiscal Year'),
      memberNetSalesAmt: getColumnIndex('Member Net Sales Amt'),
      memberNetSalesAmtLY: getColumnIndex('Member Net Sales Amt LY'),
      majorGroupCatCode: getColumnIndex('Major Group Cat Code'),
      memberNetSalesUnits: getColumnIndex('Member Net Sales Units'),
      memberNetSalesUnitsLY: getColumnIndex('Member Net Sales Units LY'),
      item: getColumnIndex('Item'),
      fiscalPeriod: getColumnIndex('Fiscal Period'),
      fiscalWeek: getColumnIndex('Fiscal Week'),
      fiscalDay: getColumnIndex('Fiscal Day')
    };

    // Process each data row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        const rawRecord: RawSalesData = {
          deptNum: row[columnIndices.deptNum]?.toString().trim() || '',
          fiscalYear: parseInt(row[columnIndices.fiscalYear]) || 0,
          memberNetSalesAmt: parseFloat(row[columnIndices.memberNetSalesAmt]) || 0,
          memberNetSalesAmtLY: parseFloat(row[columnIndices.memberNetSalesAmtLY]) || 0,
          majorGroupCatCode: row[columnIndices.majorGroupCatCode]?.toString().trim() || '',
          memberNetSalesUnits: parseFloat(row[columnIndices.memberNetSalesUnits]) || 0,
          memberNetSalesUnitsLY: parseFloat(row[columnIndices.memberNetSalesUnitsLY]) || 0,
          item: row[columnIndices.item]?.toString().trim() || '',
          fiscalPeriod: parseInt(row[columnIndices.fiscalPeriod]) || 0,
          fiscalWeek: parseInt(row[columnIndices.fiscalWeek]) || 0,
          fiscalDay: parseInt(row[columnIndices.fiscalDay]) || 0
        };

        // Validate record
        const recordErrors = this.validateRecord(rawRecord, i + 1);
        if (recordErrors.length > 0) {
          errors.push(...recordErrors);
          continue;
        }

        // Convert to processed format
        const processedRecord = this.convertToProcessedData(rawRecord, fileName);
        processedData.push(processedRecord);

      } catch (error) {
        errors.push({
          row: i + 1,
          column: 'row',
          value: row.join(', '),
          expected: 'valid data row',
          message: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Generate warnings for data quality issues
    if (processedData.length < rawData.length - 1) {
      warnings.push(`${rawData.length - 1 - processedData.length} rows were skipped due to validation errors`);
    }

    return { processedData, errors, warnings };
  }

  /**
   * Validate individual record
   */
  private validateRecord(record: RawSalesData, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate fiscal year
    if (!record.fiscalYear || record.fiscalYear < 2020 || record.fiscalYear > 2030) {
      errors.push({
        row: rowNumber,
        column: 'Fiscal Year',
        value: record.fiscalYear,
        expected: 'year between 2020-2030',
        message: 'Invalid fiscal year'
      });
    }

    // Validate fiscal period
    if (!record.fiscalPeriod || record.fiscalPeriod < 1 || record.fiscalPeriod > 13) {
      errors.push({
        row: rowNumber,
        column: 'Fiscal Period',
        value: record.fiscalPeriod,
        expected: 'period between 1-13',
        message: 'Invalid fiscal period'
      });
    }

    // Validate fiscal week
    if (!record.fiscalWeek || record.fiscalWeek < 1 || record.fiscalWeek > 4) {
      errors.push({
        row: rowNumber,
        column: 'Fiscal Week',
        value: record.fiscalWeek,
        expected: 'week between 1-4',
        message: 'Invalid fiscal week'
      });
    }

    // Validate fiscal day
    if (!record.fiscalDay || record.fiscalDay < 1 || record.fiscalDay > 7) {
      errors.push({
        row: rowNumber,
        column: 'Fiscal Day',
        value: record.fiscalDay,
        expected: 'day between 1-7',
        message: 'Invalid fiscal day'
      });
    }

    // Validate item format
    if (!record.item || !record.item.match(/^\d+\s+.+/)) {
      errors.push({
        row: rowNumber,
        column: 'Item',
        value: record.item,
        expected: 'format: "12345 ITEM DESCRIPTION"',
        message: 'Invalid item format'
      });
    }

    return errors;
  }

  /**
   * Convert raw data to processed format
   */
  private convertToProcessedData(raw: RawSalesData, dataSource: string): ProcessedSalesData {
    const { itemNumber, description } = parseItemString(raw.item);
    
    // Convert fiscal date to calendar date
    const calendarDate = this.fiscalCalendar.convertToCalendarDate(
      raw.fiscalYear,
      raw.fiscalPeriod,
      raw.fiscalWeek,
      raw.fiscalDay
    );

    const fiscalDate = {
      fiscalYear: raw.fiscalYear,
      fiscalPeriod: raw.fiscalPeriod,
      fiscalWeek: raw.fiscalWeek,
      fiscalDay: raw.fiscalDay
    };

    const variance = raw.memberNetSalesUnits - raw.memberNetSalesUnitsLY;
    const variancePercent = raw.memberNetSalesUnitsLY > 0 
      ? variance / raw.memberNetSalesUnitsLY 
      : 0;

    return {
      itemNumber: formatItemNumber(itemNumber),
      itemDescription: description,
      calendarDate,
      fiscalDate,
      currentYearUnits: raw.memberNetSalesUnits,
      lastYearUnits: raw.memberNetSalesUnitsLY,
      variance,
      variancePercent,
      dataSource
    };
  }

  /**
   * Generate file metadata
   */
  private generateMetadata(rawData: any[][], processedData: ProcessedSalesData[], file: File): FileMetadata {
    const dates = processedData.map(d => d.calendarDate);
    const fiscalYears = [...new Set(processedData.map(d => d.fiscalDate.fiscalYear))];
    const items = [...new Set(processedData.map(d => d.itemNumber))];

    return {
      columns: rawData[0] || [],
      rowCount: rawData.length - 1,
      fiscalYears,
      itemCount: items.length,
      dateRange: {
        start: new Date(Math.min(...dates.map(d => d.getTime()))),
        end: new Date(Math.max(...dates.map(d => d.getTime())))
      },
      dataQuality: this.assessDataQuality(processedData)
    };
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(data: ProcessedSalesData[]): DataQualityReport {
    const issues: DataQualityIssue[] = [];
    let completeness = 1.0;
    let accuracy = 1.0;
    let consistency = 1.0;

    // Check for missing descriptions
    const missingDescriptions = data.filter(d => !d.itemDescription).length;
    if (missingDescriptions > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        description: `${missingDescriptions} items missing descriptions`,
        affectedRows: missingDescriptions,
        suggestion: 'Review item master data for complete descriptions'
      });
      completeness -= (missingDescriptions / data.length) * 0.1;
    }

    // Check for zero sales
    const zeroSales = data.filter(d => d.currentYearUnits === 0 && d.lastYearUnits === 0).length;
    if (zeroSales > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'low',
        description: `${zeroSales} records with zero sales in both years`,
        affectedRows: zeroSales,
        suggestion: 'Consider filtering out inactive items'
      });
    }

    // Check for outliers (sales > 10x previous year)
    const outliers = data.filter(d => 
      d.lastYearUnits > 0 && d.currentYearUnits > d.lastYearUnits * 10
    ).length;
    
    if (outliers > 0) {
      issues.push({
        type: 'outlier',
        severity: 'medium',
        description: `${outliers} records with unusually high sales increases`,
        affectedRows: outliers,
        suggestion: 'Review data for potential entry errors'
      });
      accuracy -= (outliers / data.length) * 0.05;
    }

    return {
      completeness: Math.max(0, completeness),
      accuracy: Math.max(0, accuracy),
      consistency: Math.max(0, consistency),
      issues,
      recommendations: this.generateRecommendations(issues)
    };
  }

  /**
   * Generate recommendations based on data quality issues
   */
  private generateRecommendations(issues: DataQualityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'missing_data')) {
      recommendations.push('Consider cleaning up master data to improve completeness');
    }

    if (issues.some(i => i.type === 'outlier')) {
      recommendations.push('Review outlier records for data entry errors');
    }

    if (issues.some(i => i.severity === 'high')) {
      recommendations.push('Address high-severity issues before proceeding with analysis');
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality looks good - ready for analysis');
    }

    return recommendations;
  }

  /**
   * Create empty metadata for error cases
   */
  private createEmptyMetadata(): FileMetadata {
    return {
      columns: [],
      rowCount: 0,
      fiscalYears: [],
      itemCount: 0,
      dateRange: {
        start: new Date(),
        end: new Date()
      },
      dataQuality: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        recommendations: []
      }
    };
  }
}

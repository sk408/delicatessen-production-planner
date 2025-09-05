import { DemandForecaster } from './forecasting';
import { BatchOptimizer } from './batch-optimizer';
import { HolidayEngine } from './holiday-engine';
import { FiscalCalendar } from './fiscal-calendar';
import type {
  ProcessedSalesData,
  DateRange,
  ProductionPlan,
  ProductionPlanItem,
  ProductionSummary,
  PlanMetadata,
  ItemConfig,
  GlobalSettings,
  Holiday
} from '../types/index';

/**
 * Production Plan Generator
 * Orchestrates the entire planning process
 */
export class PlanGenerator {
  private forecaster: DemandForecaster;
  private batchOptimizer: BatchOptimizer;
  private holidayEngine: HolidayEngine;
  private fiscalCalendar: FiscalCalendar;

  constructor(
    holidays: Holiday[] = [],
    globalSettings: GlobalSettings
  ) {
    this.forecaster = new DemandForecaster(holidays);
    this.batchOptimizer = new BatchOptimizer();
    this.holidayEngine = new HolidayEngine(holidays);
    this.fiscalCalendar = new FiscalCalendar(globalSettings.fiscalYearStart);
  }

  /**
   * Generate a complete production plan
   */
  async generatePlan(
    data: ProcessedSalesData[],
    dateRange: DateRange,
    selectedItems: string[],
    itemConfigs: Record<string, ItemConfig>,
    globalSettings: GlobalSettings,
    holidays: Holiday[]
  ): Promise<ProductionPlan> {
    try {
      // Filter data by date range and selected items
      const filteredData = this.filterData(data, dateRange, selectedItems);
      
      // Group data by item
      const itemGroups = this.groupDataByItem(filteredData);
      
      // Generate plan items for each selected item
      const planItems: ProductionPlanItem[] = [];
      
      for (const itemNumber of selectedItems) {
        const itemData = itemGroups.get(itemNumber) || [];
        const itemConfig = itemConfigs[itemNumber];
        
        if (!itemConfig?.isActive) continue;
        
        const planItem = await this.generatePlanItem(
          itemNumber,
          itemData,
          itemConfig,
          dateRange.start,
          globalSettings
        );
        
        if (planItem) {
          planItems.push(planItem);
        }
      }
      
      // Generate summary
      const summary = this.generateSummary(planItems);
      
      // Create metadata
      const metadata = this.generateMetadata(
        data,
        dateRange,
        selectedItems,
        holidays,
        globalSettings
      );
      
      return {
        date: dateRange.start,
        items: planItems,
        summary,
        metadata
      };
      
    } catch (error) {
      console.error('Error generating production plan:', error);
      throw new Error(`Failed to generate production plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate plan item for a specific item
   */
  private async generatePlanItem(
    itemNumber: string,
    itemData: ProcessedSalesData[],
    config: ItemConfig,
    planDate: Date,
    globalSettings: GlobalSettings
  ): Promise<ProductionPlanItem | null> {
    try {
      if (itemData.length === 0) {
        return this.createEmptyPlanItem(itemNumber, config, planDate);
      }

      // Get the most recent item description
      const itemDescription = itemData[0]?.itemDescription || config.itemDescription;
      
      // Calculate current inventory (simplified - in real app would come from previous day)
      const currentStock = 0; // This would be calculated from previous day's plan
      const oldStockStart = 0;
      const stockAge = 0;
      
      // Get historical data for forecasting
      const lastYearUnits = this.getAverageUnits(itemData, 'lastYearUnits');
      const twoYearsAgoUnits = this.getAverageUnits(itemData, 'twoYearsAgoUnits');
      
      // Generate multi-day demand forecast
      const multiDayDemand = this.forecaster.forecastMultiDay(
        itemData,
        planDate,
        config.maxDaysAhead,
        config.defaultGrowthRate,
        itemNumber
      );
      
      // Get today's specific forecast
      const todayForecast = this.forecaster.forecastDemand(
        itemData,
        planDate,
        config.defaultGrowthRate,
        itemNumber
      );
      
      // Calculate date factors
      const holidayImpact = this.holidayEngine.getHolidayImpactFactor(planDate);
      const dateFactorReasons = [holidayImpact.explanation];
      
      // Optimize batch size
      const batchDecision = this.batchOptimizer.optimizeBatchSize(
        multiDayDemand,
        currentStock,
        config
      );
      
      // Calculate inventory flows (FIFO logic)
      const isExpired = stockAge > config.shelfLife;
      const oldStockEnd = isExpired ? 0 : Math.max(0, oldStockStart - Math.min(0, oldStockStart));
      const newStockEnd = Math.max(0, batchDecision.produceToday - Math.max(0, 0 - oldStockStart));
      
      return {
        itemNumber,
        itemDescription,
        
        // Current inventory status
        oldStockStart,
        oldStockEnd,
        stockAge,
        newStockEnd,
        isExpired,
        
        // Historical data
        lastYearUnits,
        twoYearsAgoUnits,
        
        // Forecasting
        dateFactor: todayForecast.factors.holiday * todayForecast.factors.seasonal * todayForecast.factors.dayOfWeek,
        dateFactorReasons,
        seasonalFactor: todayForecast.factors.seasonal,
        holidayFactor: todayForecast.factors.holiday,
        dayOfWeekFactor: todayForecast.factors.dayOfWeek,
        
        // Batch planning
        multiDayDemand,
        todayNeed: todayForecast.forecast,
        batchDecision,
        
        // Configuration
        productivity: config.productivity,
        shelfLife: config.shelfLife,
        growthRate: config.defaultGrowthRate,
        minBatchSize: config.minBatchSize,
        maxDaysAhead: config.maxDaysAhead
      };
      
    } catch (error) {
      console.error(`Error generating plan item for ${itemNumber}:`, error);
      return null;
    }
  }

  /**
   * Filter data by date range and selected items
   */
  private filterData(
    data: ProcessedSalesData[],
    dateRange: DateRange,
    selectedItems: string[]
  ): ProcessedSalesData[] {
    return data.filter(record => 
      selectedItems.includes(record.itemNumber) &&
      record.calendarDate >= dateRange.start &&
      record.calendarDate <= dateRange.end
    );
  }

  /**
   * Group data by item number
   */
  private groupDataByItem(data: ProcessedSalesData[]): Map<string, ProcessedSalesData[]> {
    const groups = new Map<string, ProcessedSalesData[]>();
    
    data.forEach(record => {
      const existing = groups.get(record.itemNumber) || [];
      existing.push(record);
      groups.set(record.itemNumber, existing);
    });
    
    return groups;
  }

  /**
   * Get average units for a specific field
   */
  private getAverageUnits(
    itemData: ProcessedSalesData[], 
    field: 'currentYearUnits' | 'lastYearUnits' | 'twoYearsAgoUnits'
  ): number {
    if (itemData.length === 0) return 0;
    
    const values = itemData
      .map(d => d[field])
      .filter((value): value is number => typeof value === 'number' && !isNaN(value));
    
    if (values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Create empty plan item for items with no data
   */
  private createEmptyPlanItem(
    itemNumber: string,
    config: ItemConfig,
    planDate: Date
  ): ProductionPlanItem {
    const emptyMultiDayDemand = {
      totalDemand: 0,
      dailyForecasts: [],
      daysAhead: config.maxDaysAhead,
      confidenceScore: 0
    };
    
    const emptyBatchDecision = {
      recommendedBatchSize: 0,
      produceToday: 0,
      hoursNeeded: 0,
      reasoning: 'No historical data available',
      options: [],
      selectedOption: {
        size: 0,
        efficiency: 0,
        wasteRisk: 0,
        cost: 0,
        reasoning: 'No data',
        score: 0
      },
      efficiencyScore: 0,
      wasteRiskScore: 0
    };
    
    return {
      itemNumber,
      itemDescription: config.itemDescription,
      
      // Current inventory status
      oldStockStart: 0,
      oldStockEnd: 0,
      stockAge: 0,
      newStockEnd: 0,
      isExpired: false,
      
      // Historical data
      lastYearUnits: 0,
      twoYearsAgoUnits: 0,
      
      // Forecasting
      dateFactor: 1.0,
      dateFactorReasons: ['No historical data available'],
      seasonalFactor: 1.0,
      holidayFactor: 1.0,
      dayOfWeekFactor: 1.0,
      
      // Batch planning
      multiDayDemand: emptyMultiDayDemand,
      todayNeed: 0,
      batchDecision: emptyBatchDecision,
      
      // Configuration
      productivity: config.productivity,
      shelfLife: config.shelfLife,
      growthRate: config.defaultGrowthRate,
      minBatchSize: config.minBatchSize,
      maxDaysAhead: config.maxDaysAhead
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(items: ProductionPlanItem[]): ProductionSummary {
    const activeItems = items.filter(item => item.batchDecision.produceToday > 0);
    const totalUnits = items.reduce((sum, item) => sum + item.batchDecision.produceToday, 0);
    const totalHours = items.reduce((sum, item) => sum + item.batchDecision.hoursNeeded, 0);
    const itemsWithCarryover = items.filter(item => item.oldStockStart > 0).length;
    const expiredItems = items.filter(item => item.isExpired).length;
    
    // Calculate efficiency scores
    const efficiencyScores = items
      .filter(item => item.batchDecision.efficiencyScore > 0)
      .map(item => item.batchDecision.efficiencyScore);
    
    const batchEfficiencyScore = efficiencyScores.length > 0 
      ? efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length
      : 0;
    
    // Estimate costs (simplified)
    const estimatedCost = totalUnits * 2.5; // $2.50 per unit average
    
    // Calculate waste risk
    const wasteRiskScores = items.map(item => item.batchDecision.wasteRiskScore);
    const wasteRiskScore = wasteRiskScores.length > 0
      ? wasteRiskScores.reduce((sum, score) => sum + score, 0) / wasteRiskScores.length
      : 0;
    
    return {
      totalItems: items.length,
      activeItems: activeItems.length,
      totalUnitsToProducе: totalUnits,
      totalHoursNeeded: totalHours,
      itemsWithCarryover,
      expiredItems,
      batchEfficiencyScore,
      estimatedCost,
      wasteRiskScore
    };
  }

  /**
   * Generate plan metadata
   */
  private generateMetadata(
    data: ProcessedSalesData[],
    dateRange: DateRange,
    selectedItems: string[],
    holidays: Holiday[],
    globalSettings: GlobalSettings
  ): PlanMetadata {
    const dataSources = [...new Set(data.map(d => d.dataSource))];
    const planningHorizon = Math.max(
      ...selectedItems.map(itemNumber => 
        globalSettings.defaultMaxDaysAhead
      )
    );
    
    return {
      generatedAt: new Date(),
      dataSource: dataSources,
      holidaysConsidered: holidays.filter(h => h.isActive),
      planningHorizon,
      fiscalYearStart: this.fiscalCalendar.getFiscalYearStart(new Date().getFullYear() + 1),
      version: '1.0.0',
      settings: globalSettings
    };
  }

  /**
   * Update forecasting parameters
   */
  updateHolidays(holidays: Holiday[]): void {
    this.holidayEngine = new HolidayEngine(holidays);
    this.forecaster.updateHolidays(holidays);
  }

  /**
   * Update seasonal factors
   */
  updateSeasonalFactors(factors: Record<number, number>): void {
    this.forecaster.setSeasonalFactors(factors);
  }

  /**
   * Update day-of-week factors
   */
  updateDayOfWeekFactors(factors: Record<number, number>): void {
    this.forecaster.setDayOfWeekFactors(factors);
  }
}



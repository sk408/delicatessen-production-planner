import { HolidayEngine } from './holiday-engine';
import { getDayOfWeek, getMonthName } from '../utils/date-helpers';
import type { 
  ProcessedSalesData, 
  ForecastResult, 
  MultiDayForecast, 
  DailyForecast,
  ForecastFactors,
  Holiday
} from '../types/index';

/**
 * Advanced demand forecasting with intelligent date-based adjustments
 */
export class DemandForecaster {
  private holidayEngine: HolidayEngine;
  private seasonalFactors: Record<number, number>;
  private dayOfWeekFactors: Record<number, number>;

  constructor(holidays: Holiday[] = []) {
    this.holidayEngine = new HolidayEngine(holidays);
    this.seasonalFactors = this.getDefaultSeasonalFactors();
    this.dayOfWeekFactors = this.getDefaultDayOfWeekFactors();
  }

  /**
   * Forecast demand for a single date
   */
  forecastDemand(
    historicalData: ProcessedSalesData[],
    targetDate: Date,
    growthRate: number,
    itemNumber: string
  ): ForecastResult {
    try {
      // Filter data for this specific item
      const itemData = historicalData.filter(d => d.itemNumber === itemNumber);
      
      if (itemData.length === 0) {
        return this.createEmptyForecast(targetDate);
      }

      // Calculate base demand from historical data
      const baseDemand = this.calculateBaseDemand(itemData, targetDate);
      
      // Get adjustment factors
      const factors = this.calculateForecastFactors(targetDate, itemData);
      
      // Apply all factors
      const adjustedDemand = baseDemand * 
        (1 + growthRate) * 
        factors.seasonal * 
        factors.dayOfWeek * 
        factors.holiday * 
        factors.trend;

      // Calculate confidence based on data availability and consistency
      const confidence = this.calculateConfidence(itemData, targetDate, factors);

      return {
        forecast: Math.max(0, adjustedDemand),
        baseDemand,
        adjustedDemand,
        confidence,
        factors,
        explanation: this.generateForecastExplanation(baseDemand, adjustedDemand, factors),
        dataPoints: itemData.length,
        targetDate
      };
    } catch (error) {
      console.error('Error forecasting demand:', error);
      return this.createEmptyForecast(targetDate);
    }
  }

  /**
   * Forecast demand for multiple consecutive days
   */
  forecastMultiDay(
    historicalData: ProcessedSalesData[],
    startDate: Date,
    days: number,
    growthRate: number,
    itemNumber: string
  ): MultiDayForecast {
    const dailyForecasts: DailyForecast[] = [];
    let totalDemand = 0;
    let totalConfidence = 0;

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);

      const forecast = this.forecastDemand(historicalData, targetDate, growthRate, itemNumber);
      
      const dailyForecast: DailyForecast = {
        date: targetDate,
        baseDemand: forecast.baseDemand,
        adjustedDemand: forecast.adjustedDemand,
        dateFactor: this.calculateDateFactor(forecast.factors),
        confidence: forecast.confidence,
        factors: forecast.factors
      };

      dailyForecasts.push(dailyForecast);
      totalDemand += forecast.adjustedDemand;
      totalConfidence += forecast.confidence;
    }

    return {
      totalDemand: Math.round(totalDemand),
      dailyForecasts,
      daysAhead: days,
      confidenceScore: totalConfidence / days
    };
  }

  /**
   * Calculate base demand from historical data
   */
  private calculateBaseDemand(itemData: ProcessedSalesData[], targetDate: Date): number {
    if (itemData.length === 0) return 0;

    // Try different approaches in order of preference
    
    // 1. Same day of week from recent weeks
    const sameDayOfWeek = this.getSameDayOfWeekData(itemData, targetDate);
    if (sameDayOfWeek.length > 0) {
      return this.calculateWeightedAverage(sameDayOfWeek);
    }

    // 2. Recent data (last 30 days)
    const recentData = this.getRecentData(itemData, 30);
    if (recentData.length > 0) {
      return this.calculateWeightedAverage(recentData);
    }

    // 3. Same period last year
    const lastYearData = this.getSamePeriodLastYear(itemData, targetDate);
    if (lastYearData.length > 0) {
      return this.calculateWeightedAverage(lastYearData);
    }

    // 4. Overall average as fallback
    const totalUnits = itemData.reduce((sum, d) => sum + d.currentYearUnits, 0);
    return totalUnits / itemData.length;
  }

  /**
   * Get data for the same day of week
   */
  private getSameDayOfWeekData(itemData: ProcessedSalesData[], targetDate: Date): ProcessedSalesData[] {
    const targetDayOfWeek = targetDate.getDay();
    
    return itemData
      .filter(d => d.calendarDate.getDay() === targetDayOfWeek)
      .sort((a, b) => b.calendarDate.getTime() - a.calendarDate.getTime())
      .slice(0, 8); // Last 8 occurrences of this day of week
  }

  /**
   * Get recent data within specified days
   */
  private getRecentData(itemData: ProcessedSalesData[], days: number): ProcessedSalesData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return itemData
      .filter(d => d.calendarDate >= cutoffDate)
      .sort((a, b) => b.calendarDate.getTime() - a.calendarDate.getTime());
  }

  /**
   * Get data from same period last year
   */
  private getSamePeriodLastYear(itemData: ProcessedSalesData[], targetDate: Date): ProcessedSalesData[] {
    const lastYear = targetDate.getFullYear() - 1;
    const targetMonth = targetDate.getMonth();
    const targetWeek = Math.floor(targetDate.getDate() / 7);
    
    return itemData.filter(d => {
      const dataYear = d.calendarDate.getFullYear();
      const dataMonth = d.calendarDate.getMonth();
      const dataWeek = Math.floor(d.calendarDate.getDate() / 7);
      
      return dataYear === lastYear && 
             dataMonth === targetMonth && 
             Math.abs(dataWeek - targetWeek) <= 1;
    });
  }

  /**
   * Calculate weighted average (more recent data weighted higher)
   */
  private calculateWeightedAverage(data: ProcessedSalesData[]): number {
    if (data.length === 0) return 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    data.forEach((item, index) => {
      // Weight decreases with age, but recent data gets higher weight
      const weight = Math.pow(0.8, index);
      weightedSum += item.currentYearUnits * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate all forecast factors
   */
  private calculateForecastFactors(targetDate: Date, itemData: ProcessedSalesData[]): ForecastFactors {
    const seasonal = this.getSeasonalFactor(targetDate);
    const dayOfWeek = this.getDayOfWeekFactor(targetDate);
    const holiday = this.holidayEngine.getHolidayImpactFactor(targetDate).factor;
    const trend = this.calculateTrendFactor(itemData, targetDate);
    
    return {
      seasonal,
      dayOfWeek,
      holiday,
      trend,
      growth: 0 // Growth is applied separately
    };
  }

  /**
   * Get seasonal adjustment factor
   */
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth() + 1; // 1-based month
    return this.seasonalFactors[month] || 1.0;
  }

  /**
   * Get day-of-week adjustment factor
   */
  private getDayOfWeekFactor(date: Date): number {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    return this.dayOfWeekFactors[dayOfWeek] || 1.0;
  }

  /**
   * Calculate trend factor based on recent performance
   */
  private calculateTrendFactor(itemData: ProcessedSalesData[], targetDate: Date): number {
    if (itemData.length < 4) return 1.0;

    // Get recent 4 weeks of data
    const recentData = this.getRecentData(itemData, 28);
    if (recentData.length < 4) return 1.0;

    // Sort by date
    recentData.sort((a, b) => a.calendarDate.getTime() - b.calendarDate.getTime());

    // Calculate trend using linear regression
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    recentData.forEach((item, index) => {
      const x = index;
      const y = item.currentYearUnits;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    // Convert slope to trend factor
    if (avgY > 0) {
      const trendFactor = 1 + (slope / avgY);
      // Clamp to reasonable bounds
      return Math.max(0.5, Math.min(2.0, trendFactor));
    }

    return 1.0;
  }

  /**
   * Calculate overall date factor from individual factors
   */
  private calculateDateFactor(factors: ForecastFactors): number {
    return factors.seasonal * factors.dayOfWeek * factors.holiday * factors.trend;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    itemData: ProcessedSalesData[], 
    targetDate: Date, 
    factors: ForecastFactors
  ): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    const dataPoints = itemData.length;
    if (dataPoints >= 30) confidence += 0.3;
    else if (dataPoints >= 10) confidence += 0.2;
    else if (dataPoints >= 5) confidence += 0.1;

    // Recent data = higher confidence
    const recentData = this.getRecentData(itemData, 14);
    if (recentData.length >= 5) confidence += 0.1;

    // Same day of week data = higher confidence
    const sameDayData = this.getSameDayOfWeekData(itemData, targetDate);
    if (sameDayData.length >= 3) confidence += 0.1;

    // Stable factors = higher confidence
    const factorVariation = this.calculateFactorVariation(factors);
    if (factorVariation < 0.2) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate how much factors vary from normal
   */
  private calculateFactorVariation(factors: ForecastFactors): number {
    const deviations = [
      Math.abs(factors.seasonal - 1.0),
      Math.abs(factors.dayOfWeek - 1.0),
      Math.abs(factors.holiday - 1.0),
      Math.abs(factors.trend - 1.0)
    ];
    
    return deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
  }

  /**
   * Generate human-readable forecast explanation
   */
  private generateForecastExplanation(
    baseDemand: number, 
    adjustedDemand: number, 
    factors: ForecastFactors
  ): string {
    const explanations: string[] = [];
    
    if (Math.abs(factors.seasonal - 1.0) > 0.05) {
      const change = factors.seasonal > 1.0 ? 'increased' : 'decreased';
      explanations.push(`${change} for season`);
    }
    
    if (Math.abs(factors.dayOfWeek - 1.0) > 0.05) {
      const change = factors.dayOfWeek > 1.0 ? 'higher' : 'lower';
      explanations.push(`${change} for day of week`);
    }
    
    if (Math.abs(factors.holiday - 1.0) > 0.05) {
      const change = factors.holiday > 1.0 ? 'increased' : 'decreased';
      explanations.push(`${change} for holiday proximity`);
    }
    
    if (Math.abs(factors.trend - 1.0) > 0.05) {
      const change = factors.trend > 1.0 ? 'upward' : 'downward';
      explanations.push(`${change} trend`);
    }

    if (explanations.length === 0) {
      return 'Normal demand expected';
    }

    return `Adjusted for: ${explanations.join(', ')}`;
  }

  /**
   * Create empty forecast for error cases
   */
  private createEmptyForecast(targetDate: Date): ForecastResult {
    return {
      forecast: 0,
      baseDemand: 0,
      adjustedDemand: 0,
      confidence: 0,
      factors: {
        seasonal: 1.0,
        dayOfWeek: 1.0,
        holiday: 1.0,
        trend: 1.0,
        growth: 0
      },
      explanation: 'No historical data available',
      dataPoints: 0,
      targetDate
    };
  }

  /**
   * Get default seasonal factors (by month)
   */
  private getDefaultSeasonalFactors(): Record<number, number> {
    return {
      1: 0.8,   // January - post-holiday lull
      2: 0.9,   // February - still slow
      3: 1.0,   // March - normal
      4: 1.1,   // April - spring pickup
      5: 1.2,   // May - spring/early summer
      6: 1.1,   // June - summer
      7: 1.3,   // July - peak summer, holidays
      8: 1.2,   // August - still summer
      9: 1.0,   // September - back to school
      10: 1.1,  // October - fall, Halloween
      11: 1.4,  // November - Thanksgiving
      12: 1.3   // December - Christmas/New Year
    };
  }

  /**
   * Get default day-of-week factors
   */
  private getDefaultDayOfWeekFactors(): Record<number, number> {
    return {
      0: 0.7,   // Sunday - lower
      1: 0.9,   // Monday - slower start
      2: 1.0,   // Tuesday - normal
      3: 1.1,   // Wednesday - mid-week peak
      4: 1.2,   // Thursday - preparing for weekend
      5: 1.4,   // Friday - highest (weekend prep)
      6: 1.1    // Saturday - good but not peak
    };
  }

  /**
   * Update seasonal factors
   */
  setSeasonalFactors(factors: Record<number, number>): void {
    this.seasonalFactors = { ...factors };
  }

  /**
   * Update day-of-week factors
   */
  setDayOfWeekFactors(factors: Record<number, number>): void {
    this.dayOfWeekFactors = { ...factors };
  }

  /**
   * Update holiday configuration
   */
  updateHolidays(holidays: Holiday[]): void {
    this.holidayEngine = new HolidayEngine(holidays);
  }
}

// Additional types for forecast results
export interface ForecastResult {
  forecast: number;
  baseDemand: number;
  adjustedDemand: number;
  confidence: number;
  factors: ForecastFactors;
  explanation: string;
  dataPoints: number;
  targetDate: Date;
}



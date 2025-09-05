import type { 
  MultiDayDemand, 
  ItemConfig, 
  BatchDecision, 
  BatchOption 
} from '../types/index';

/**
 * Batch Size Optimization Engine
 * Balances production efficiency with waste risk
 */
export class BatchOptimizer {

  /**
   * Optimize batch size for an item considering multi-day demand and constraints
   */
  optimizeBatchSize(
    multiDayDemand: MultiDayDemand,
    currentStock: number,
    config: ItemConfig
  ): BatchDecision {
    try {
      const totalDemand = multiDayDemand.totalDemand || 0;
      const netDemand = Math.max(0, totalDemand - currentStock);

      // If we have sufficient stock, don't produce
      if (netDemand <= 0) {
        return {
          recommendedBatchSize: 0,
          produceToday: 0,
          hoursNeeded: 0,
          reasoning: `Sufficient stock (${Math.round(currentStock)} units) covers ${multiDayDemand.daysAhead}-day demand (${Math.round(totalDemand)} units)`,
          options: [],
          selectedOption: this.createBatchOption(0, 0, 0, 'No production needed'),
          efficiencyScore: 1.0,
          wasteRiskScore: 0.0
        };
      }

      // Generate batch options
      const options = this.generateBatchOptions(netDemand, totalDemand, config, multiDayDemand);
      
      // Score and select best option
      const scoredOptions = options.map(option => ({
        ...option,
        score: this.scoreBatchOption(option, multiDayDemand, config, currentStock)
      }));

      const bestOption = scoredOptions.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      const hoursNeeded = config.productivity > 0 ? bestOption.size / config.productivity : 0;

      return {
        recommendedBatchSize: bestOption.size,
        produceToday: bestOption.size,
        hoursNeeded,
        reasoning: bestOption.reasoning,
        options: scoredOptions,
        selectedOption: bestOption,
        efficiencyScore: bestOption.efficiency,
        wasteRiskScore: bestOption.wasteRisk
      };

    } catch (error) {
      console.error('Error optimizing batch size:', error);
      return this.createErrorBatchDecision(config);
    }
  }

  /**
   * Generate multiple batch size options to evaluate
   */
  private generateBatchOptions(
    netDemand: number, 
    totalDemand: number, 
    config: ItemConfig,
    multiDayDemand: MultiDayDemand
  ): BatchOption[] {
    const options: BatchOption[] = [];
    const minBatch = config.minBatchSize || 10;
    const shelfLife = config.shelfLife || 3;
    const daysAhead = multiDayDemand.daysAhead || 3;

    // Option 1: Minimum batch size
    if (minBatch > 0) {
      options.push(this.createBatchOption(
        minBatch,
        minBatch / Math.max(1, netDemand),
        this.calculateWasteRisk(minBatch, totalDemand, shelfLife, daysAhead),
        minBatch >= netDemand 
          ? `Min batch (${minBatch}) covers ${daysAhead}-day demand`
          : `Min batch (${minBatch}) - will need additional production soon`
      ));
    }

    // Option 2: Exact net demand
    if (netDemand > 0) {
      const exactSize = Math.ceil(netDemand);
      options.push(this.createBatchOption(
        exactSize,
        1.0, // Perfect efficiency for net demand
        this.calculateWasteRisk(exactSize, totalDemand, shelfLife, daysAhead),
        `Exact net demand (${exactSize}) for ${daysAhead} days`
      ));
    }

    // Option 3: Total demand (including current stock replacement)
    if (totalDemand > netDemand) {
      const totalSize = Math.ceil(totalDemand);
      options.push(this.createBatchOption(
        totalSize,
        totalSize / Math.max(1, netDemand),
        this.calculateWasteRisk(totalSize, totalDemand, shelfLife, daysAhead),
        `Total demand (${totalSize}) for ${daysAhead} days - covers all needs`
      ));
    }

    // Option 4: Shelf-life constrained maximum
    const maxSafeProduction = this.calculateShelfLifeConstrainedMax(
      totalDemand, 
      shelfLife, 
      daysAhead
    );
    
    if (maxSafeProduction > netDemand && maxSafeProduction !== totalDemand) {
      options.push(this.createBatchOption(
        maxSafeProduction,
        maxSafeProduction / Math.max(1, netDemand),
        this.calculateWasteRisk(maxSafeProduction, totalDemand, shelfLife, daysAhead),
        `Shelf-life optimized (${maxSafeProduction}) for ${shelfLife}-day shelf life`
      ));
    }

    // Option 5: Economic batch quantity (if significantly different)
    const economicBatch = this.calculateEconomicBatchQuantity(netDemand, config);
    if (economicBatch > minBatch && 
        economicBatch !== netDemand && 
        !options.some(o => Math.abs(o.size - economicBatch) < 2)) {
      
      options.push(this.createBatchOption(
        economicBatch,
        economicBatch / Math.max(1, netDemand),
        this.calculateWasteRisk(economicBatch, totalDemand, shelfLife, daysAhead),
        `Economic batch (${economicBatch}) balances setup costs and inventory`
      ));
    }

    return options.filter(option => option.size > 0);
  }

  /**
   * Create a batch option with calculated metrics
   */
  private createBatchOption(
    size: number, 
    efficiency: number, 
    wasteRisk: number, 
    reasoning: string
  ): BatchOption {
    return {
      size: Math.ceil(size),
      efficiency: Math.max(0, efficiency),
      wasteRisk: Math.max(0, Math.min(1, wasteRisk)),
      cost: this.calculateBatchCost(size),
      reasoning,
      score: 0 // Will be calculated later
    };
  }

  /**
   * Score a batch option considering multiple factors
   */
  private scoreBatchOption(
    option: BatchOption, 
    multiDayDemand: MultiDayDemand, 
    config: ItemConfig,
    currentStock: number
  ): number {
    // Base score starts at efficiency
    let score = option.efficiency;

    // Heavily penalize waste risk
    score -= option.wasteRisk * 3.0;

    // Bonus for meeting minimum batch requirements
    if (option.size >= (config.minBatchSize || 0)) {
      score += 0.2;
    }

    // Penalty for very small batches (setup cost inefficiency)
    if (option.size < (config.minBatchSize || 10) * 0.5) {
      score -= 0.3;
    }

    // Bonus for covering full demand period
    const totalDemand = multiDayDemand.totalDemand + currentStock;
    if (option.size >= totalDemand * 0.9) {
      score += 0.1;
    }

    // Consider confidence in demand forecast
    const confidenceBonus = multiDayDemand.confidenceScore * 0.1;
    score += confidenceBonus;

    // Penalize excessive overproduction
    const overproductionRatio = option.size / Math.max(1, multiDayDemand.totalDemand);
    if (overproductionRatio > 1.5) {
      score -= (overproductionRatio - 1.5) * 0.5;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate waste risk based on shelf life and demand pattern
   */
  private calculateWasteRisk(
    batchSize: number, 
    totalDemand: number, 
    shelfLife: number, 
    daysAhead: number
  ): number {
    if (batchSize <= totalDemand) return 0;

    const excess = batchSize - totalDemand;
    const excessRatio = excess / batchSize;

    // Risk increases if we're producing beyond what can be consumed in shelf life
    const consumptionRate = totalDemand / daysAhead;
    const daysToConsume = batchSize / Math.max(0.1, consumptionRate);
    
    if (daysToConsume > shelfLife) {
      const expirationRisk = (daysToConsume - shelfLife) / shelfLife;
      return Math.min(1.0, excessRatio + expirationRisk * 0.5);
    }

    return excessRatio * 0.3; // Lower risk if within shelf life
  }

  /**
   * Calculate shelf-life constrained maximum production
   */
  private calculateShelfLifeConstrainedMax(
    totalDemand: number, 
    shelfLife: number, 
    daysAhead: number
  ): number {
    // Don't produce more than can be consumed before expiration
    const dailyConsumption = totalDemand / daysAhead;
    const maxSafeProduction = dailyConsumption * Math.min(shelfLife, daysAhead + 1);
    
    return Math.ceil(Math.max(totalDemand, maxSafeProduction));
  }

  /**
   * Calculate economic batch quantity considering setup costs
   */
  private calculateEconomicBatchQuantity(demand: number, config: ItemConfig): number {
    // Simplified EOQ formula adaptation
    // In a real implementation, this would consider setup costs, holding costs, etc.
    const minBatch = config.minBatchSize || 10;
    const setupCostFactor = 2.0; // Assume setup cost makes larger batches more efficient
    
    const economicQuantity = Math.sqrt(demand * setupCostFactor);
    
    return Math.max(minBatch, Math.ceil(economicQuantity));
  }

  /**
   * Calculate estimated batch cost (simplified)
   */
  private calculateBatchCost(batchSize: number): number {
    // Simplified cost model: setup cost + variable cost
    const setupCost = 50; // Fixed setup cost
    const variableCost = batchSize * 2; // Cost per unit
    
    return setupCost + variableCost;
  }

  /**
   * Create error batch decision for fallback
   */
  private createErrorBatchDecision(config: ItemConfig): BatchDecision {
    const fallbackSize = config.minBatchSize || 10;
    const hoursNeeded = config.productivity > 0 ? fallbackSize / config.productivity : 0;

    return {
      recommendedBatchSize: fallbackSize,
      produceToday: fallbackSize,
      hoursNeeded,
      reasoning: 'Error in batch calculation - using minimum batch size',
      options: [this.createBatchOption(fallbackSize, 1.0, 0.1, 'Fallback option')],
      selectedOption: this.createBatchOption(fallbackSize, 1.0, 0.1, 'Fallback option'),
      efficiencyScore: 0.5,
      wasteRiskScore: 0.1
    };
  }

  /**
   * Analyze batch efficiency across multiple items
   */
  analyzeBatchEfficiency(decisions: BatchDecision[]): {
    averageEfficiency: number;
    averageWasteRisk: number;
    totalHours: number;
    recommendationsCount: number;
    insights: string[];
  } {
    if (decisions.length === 0) {
      return {
        averageEfficiency: 0,
        averageWasteRisk: 0,
        totalHours: 0,
        recommendationsCount: 0,
        insights: ['No batch decisions to analyze']
      };
    }

    const totalEfficiency = decisions.reduce((sum, d) => sum + d.efficiencyScore, 0);
    const totalWasteRisk = decisions.reduce((sum, d) => sum + d.wasteRiskScore, 0);
    const totalHours = decisions.reduce((sum, d) => sum + d.hoursNeeded, 0);
    const productionItems = decisions.filter(d => d.produceToday > 0).length;

    const averageEfficiency = totalEfficiency / decisions.length;
    const averageWasteRisk = totalWasteRisk / decisions.length;

    const insights: string[] = [];

    if (averageEfficiency > 0.8) {
      insights.push('High batch efficiency - good production optimization');
    } else if (averageEfficiency < 0.5) {
      insights.push('Low batch efficiency - consider adjusting minimum batch sizes');
    }

    if (averageWasteRisk > 0.3) {
      insights.push('High waste risk - consider shorter shelf life or smaller batches');
    } else if (averageWasteRisk < 0.1) {
      insights.push('Low waste risk - efficient batch sizing');
    }

    if (totalHours > 40) {
      insights.push(`High labor requirement (${totalHours.toFixed(1)} hours) - consider capacity planning`);
    }

    const noProductionItems = decisions.length - productionItems;
    if (noProductionItems > 0) {
      insights.push(`${noProductionItems} items have sufficient stock - good inventory management`);
    }

    return {
      averageEfficiency,
      averageWasteRisk,
      totalHours,
      recommendationsCount: productionItems,
      insights
    };
  }

  /**
   * Suggest batch size adjustments based on historical performance
   */
  suggestBatchAdjustments(
    historicalDecisions: BatchDecision[],
    actualWaste: Record<string, number>
  ): string[] {
    const suggestions: string[] = [];

    // Analyze waste patterns
    const highWasteDecisions = historicalDecisions.filter(d => d.wasteRiskScore > 0.3);
    if (highWasteDecisions.length > historicalDecisions.length * 0.3) {
      suggestions.push('Consider reducing batch sizes - high waste risk detected in 30%+ of decisions');
    }

    // Analyze efficiency patterns
    const lowEfficiencyDecisions = historicalDecisions.filter(d => d.efficiencyScore < 0.5);
    if (lowEfficiencyDecisions.length > historicalDecisions.length * 0.2) {
      suggestions.push('Consider increasing minimum batch sizes - low efficiency in 20%+ of decisions');
    }

    // Analyze actual waste if provided
    const wasteEntries = Object.entries(actualWaste);
    if (wasteEntries.length > 0) {
      const avgWaste = wasteEntries.reduce((sum, [, waste]) => sum + waste, 0) / wasteEntries.length;
      if (avgWaste > 0.15) {
        suggestions.push('Actual waste is high (>15%) - consider more conservative batch sizing');
      }
    }

    return suggestions.length > 0 ? suggestions : ['Batch sizing appears optimal based on current data'];
  }
}



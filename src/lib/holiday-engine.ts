import { addDays, format, getDay } from 'date-fns';
import type { Holiday, HolidayInstance, HolidayImpact } from '@types/index';

/**
 * Holiday Detection and Impact Analysis Engine
 * Handles complex holiday calculations for any year
 */
export class HolidayEngine {
  private holidays: Holiday[];

  constructor(holidays: Holiday[] = []) {
    this.holidays = holidays.length > 0 ? holidays : this.getDefaultHolidays();
  }

  /**
   * Get all holidays for a specific year
   */
  getHolidaysForYear(year: number): HolidayInstance[] {
    return this.holidays
      .filter(holiday => holiday.isActive)
      .map(holiday => ({
        holiday,
        date: this.calculateHolidayDate(holiday, year),
        year
      }))
      .filter(instance => instance.date !== null) as HolidayInstance[];
  }

  /**
   * Calculate holiday impact factor for a specific date
   */
  getHolidayImpactFactor(date: Date, year?: number): HolidayImpact {
    const targetYear = year || date.getFullYear();
    const holidays = this.getHolidaysForYear(targetYear);
    
    const affectedHolidays = this.findNearbyHolidays(date, holidays);
    const factor = this.calculateCombinedImpact(affectedHolidays);
    const explanation = this.generateImpactExplanation(affectedHolidays);

    return {
      factor,
      affectedHolidays,
      explanation
    };
  }

  /**
   * Calculate the actual date for a holiday in a specific year
   */
  private calculateHolidayDate(holiday: Holiday, year: number): Date | null {
    try {
      switch (holiday.type) {
        case 'fixed':
          if (holiday.month && holiday.day) {
            return new Date(year, holiday.month - 1, holiday.day);
          }
          break;

        case 'floating':
          return this.calculateFloatingHoliday(holiday, year);

        case 'relative':
          return this.calculateRelativeHoliday(holiday, year);
      }
    } catch (error) {
      console.error(`Error calculating date for holiday ${holiday.name}:`, error);
    }
    
    return null;
  }

  /**
   * Calculate floating holidays (e.g., "fourth Thursday in November")
   */
  private calculateFloatingHoliday(holiday: Holiday, year: number): Date | null {
    if (!holiday.rule || !holiday.month) return null;

    try {
      const rule = holiday.rule.toLowerCase();
      const month = holiday.month - 1; // JavaScript months are 0-based

      // Parse rules like "fourth Thursday in November"
      const match = rule.match(/^(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
      if (!match) return null;

      const [, occurrence, dayName] = match;
      const targetDayOfWeek = this.getDayOfWeekNumber(dayName);
      
      if (occurrence === 'last') {
        return this.getLastDayOfWeekInMonth(year, month, targetDayOfWeek);
      } else {
        const occurrenceNumber = this.getOccurrenceNumber(occurrence);
        return this.getNthDayOfWeekInMonth(year, month, targetDayOfWeek, occurrenceNumber);
      }
    } catch (error) {
      console.error(`Error calculating floating holiday ${holiday.name}:`, error);
      return null;
    }
  }

  /**
   * Calculate relative holidays (e.g., "Friday after fourth Thursday in November")
   */
  private calculateRelativeHoliday(holiday: Holiday, year: number): Date | null {
    // This would handle more complex rules like Easter-based holidays
    // For now, return null as we don't have specific relative holidays defined
    return null;
  }

  /**
   * Get day of week number (0 = Sunday, 6 = Saturday)
   */
  private getDayOfWeekNumber(dayName: string): number {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName.toLowerCase());
  }

  /**
   * Get occurrence number from text
   */
  private getOccurrenceNumber(occurrence: string): number {
    const occurrences: Record<string, number> = {
      'first': 1,
      'second': 2,
      'third': 3,
      'fourth': 4
    };
    return occurrences[occurrence] || 1;
  }

  /**
   * Get the Nth occurrence of a day of week in a month
   */
  private getNthDayOfWeekInMonth(year: number, month: number, dayOfWeek: number, occurrence: number): Date {
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = getDay(firstDay);
    
    // Calculate days to add to get to the first occurrence of the target day
    let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7;
    
    // Add weeks for subsequent occurrences
    daysToAdd += (occurrence - 1) * 7;
    
    return addDays(firstDay, daysToAdd);
  }

  /**
   * Get the last occurrence of a day of week in a month
   */
  private getLastDayOfWeekInMonth(year: number, month: number, dayOfWeek: number): Date {
    const lastDay = new Date(year, month + 1, 0); // Last day of the month
    const lastDayOfWeek = getDay(lastDay);
    
    // Calculate days to subtract to get to the last occurrence of the target day
    const daysToSubtract = (lastDayOfWeek - dayOfWeek + 7) % 7;
    
    return addDays(lastDay, -daysToSubtract);
  }

  /**
   * Find holidays that are near enough to impact the given date
   */
  private findNearbyHolidays(date: Date, holidays: HolidayInstance[]): Array<{
    holiday: Holiday;
    distance: number;
    impact: number;
  }> {
    const nearbyHolidays = [];

    for (const instance of holidays) {
      const daysDifference = Math.floor(
        (date.getTime() - instance.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if date falls within impact zone
      if (daysDifference >= -instance.holiday.daysAfter && 
          daysDifference <= instance.holiday.daysBefore) {
        
        // Calculate impact based on distance
        const maxDistance = Math.max(instance.holiday.daysBefore, instance.holiday.daysAfter);
        const distance = Math.abs(daysDifference);
        const proximityFactor = Math.max(0, 1 - (distance / maxDistance));
        const impact = instance.holiday.salesMultiplier * proximityFactor;

        nearbyHolidays.push({
          holiday: instance.holiday,
          distance: daysDifference,
          impact
        });
      }
    }

    return nearbyHolidays.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));
  }

  /**
   * Calculate combined impact of multiple holidays
   */
  private calculateCombinedImpact(affectedHolidays: Array<{ holiday: Holiday; distance: number; impact: number }>): number {
    if (affectedHolidays.length === 0) return 1.0;

    // For multiple holidays, we don't simply multiply - we use a more sophisticated approach
    let combinedFactor = 1.0;
    let totalWeight = 0;

    for (const { impact } of affectedHolidays) {
      const weight = Math.abs(impact - 1.0); // How much this holiday deviates from normal
      combinedFactor += (impact - 1.0) * weight;
      totalWeight += weight;
    }

    // Normalize by total weight to prevent excessive compounding
    if (totalWeight > 0) {
      combinedFactor = 1.0 + (combinedFactor - 1.0) / Math.sqrt(totalWeight);
    }

    // Clamp to reasonable bounds (0.1x to 5.0x normal sales)
    return Math.max(0.1, Math.min(5.0, combinedFactor));
  }

  /**
   * Generate human-readable explanation of holiday impact
   */
  private generateImpactExplanation(affectedHolidays: Array<{ holiday: Holiday; distance: number; impact: number }>): string {
    if (affectedHolidays.length === 0) {
      return 'No holiday impact';
    }

    const explanations = affectedHolidays.map(({ holiday, distance, impact }) => {
      const direction = distance < 0 ? 'before' : distance > 0 ? 'after' : 'on';
      const days = Math.abs(distance);
      const dayText = days === 0 ? '' : days === 1 ? '1 day' : `${days} days`;
      const impactText = impact > 1.1 ? 'increased' : impact < 0.9 ? 'decreased' : 'normal';
      
      if (days === 0) {
        return `${holiday.name} (${impactText} sales)`;
      } else {
        return `${dayText} ${direction} ${holiday.name} (${impactText} sales)`;
      }
    });

    return explanations.join(', ');
  }

  /**
   * Get default US holidays
   */
  private getDefaultHolidays(): Holiday[] {
    return [
      {
        id: 'new-years-day',
        name: 'New Year\'s Day',
        type: 'fixed',
        month: 1,
        day: 1,
        daysBefore: 2,
        daysAfter: 1,
        salesMultiplier: 0.7,
        description: 'New Year\'s Day - typically lower sales',
        isActive: true
      },
      {
        id: 'martin-luther-king-day',
        name: 'Martin Luther King Jr. Day',
        type: 'floating',
        month: 1,
        rule: 'third monday',
        daysBefore: 0,
        daysAfter: 0,
        salesMultiplier: 1.0,
        description: 'MLK Day - normal sales',
        isActive: true
      },
      {
        id: 'presidents-day',
        name: 'Presidents Day',
        type: 'floating',
        month: 2,
        rule: 'third monday',
        daysBefore: 0,
        daysAfter: 0,
        salesMultiplier: 1.1,
        description: 'Presidents Day - slightly increased sales',
        isActive: true
      },
      {
        id: 'memorial-day',
        name: 'Memorial Day',
        type: 'floating',
        month: 5,
        rule: 'last monday',
        daysBefore: 1,
        daysAfter: 0,
        salesMultiplier: 1.3,
        description: 'Memorial Day weekend - increased sales',
        isActive: true
      },
      {
        id: 'independence-day',
        name: 'Independence Day',
        type: 'fixed',
        month: 7,
        day: 4,
        daysBefore: 2,
        daysAfter: 1,
        salesMultiplier: 1.4,
        description: 'July 4th - significantly increased sales',
        isActive: true
      },
      {
        id: 'labor-day',
        name: 'Labor Day',
        type: 'floating',
        month: 9,
        rule: 'first monday',
        daysBefore: 1,
        daysAfter: 0,
        salesMultiplier: 1.2,
        description: 'Labor Day weekend - increased sales',
        isActive: true
      },
      {
        id: 'columbus-day',
        name: 'Columbus Day',
        type: 'floating',
        month: 10,
        rule: 'second monday',
        daysBefore: 0,
        daysAfter: 0,
        salesMultiplier: 1.0,
        description: 'Columbus Day - normal sales',
        isActive: false
      },
      {
        id: 'halloween',
        name: 'Halloween',
        type: 'fixed',
        month: 10,
        day: 31,
        daysBefore: 2,
        daysAfter: 0,
        salesMultiplier: 1.2,
        description: 'Halloween - increased party food sales',
        isActive: true
      },
      {
        id: 'thanksgiving',
        name: 'Thanksgiving',
        type: 'floating',
        month: 11,
        rule: 'fourth thursday',
        daysBefore: 3,
        daysAfter: 1,
        salesMultiplier: 1.8,
        description: 'Thanksgiving - very high sales',
        isActive: true
      },
      {
        id: 'black-friday',
        name: 'Black Friday',
        type: 'floating',
        month: 11,
        rule: 'fourth friday', // Day after Thanksgiving
        daysBefore: 0,
        daysAfter: 0,
        salesMultiplier: 0.8,
        description: 'Black Friday - reduced deli sales (people shopping)',
        isActive: true
      },
      {
        id: 'christmas-eve',
        name: 'Christmas Eve',
        type: 'fixed',
        month: 12,
        day: 24,
        daysBefore: 2,
        daysAfter: 0,
        salesMultiplier: 1.5,
        description: 'Christmas Eve - high party food sales',
        isActive: true
      },
      {
        id: 'christmas',
        name: 'Christmas Day',
        type: 'fixed',
        month: 12,
        day: 25,
        daysBefore: 0,
        daysAfter: 1,
        salesMultiplier: 0.3,
        description: 'Christmas Day - very low sales',
        isActive: true
      },
      {
        id: 'new-years-eve',
        name: 'New Year\'s Eve',
        type: 'fixed',
        month: 12,
        day: 31,
        daysBefore: 1,
        daysAfter: 0,
        salesMultiplier: 1.6,
        description: 'New Year\'s Eve - high party food sales',
        isActive: true
      }
    ];
  }

  /**
   * Add a new holiday
   */
  addHoliday(holiday: Holiday): void {
    this.holidays.push(holiday);
  }

  /**
   * Update an existing holiday
   */
  updateHoliday(id: string, updates: Partial<Holiday>): void {
    const index = this.holidays.findIndex(h => h.id === id);
    if (index >= 0) {
      this.holidays[index] = { ...this.holidays[index], ...updates };
    }
  }

  /**
   * Remove a holiday
   */
  removeHoliday(id: string): void {
    this.holidays = this.holidays.filter(h => h.id !== id);
  }

  /**
   * Get all holidays
   */
  getAllHolidays(): Holiday[] {
    return [...this.holidays];
  }

  /**
   * Validate holiday configuration
   */
  validateHoliday(holiday: Holiday): string[] {
    const errors: string[] = [];

    if (!holiday.name.trim()) {
      errors.push('Holiday name is required');
    }

    if (holiday.type === 'fixed') {
      if (!holiday.month || holiday.month < 1 || holiday.month > 12) {
        errors.push('Fixed holidays must have a valid month (1-12)');
      }
      if (!holiday.day || holiday.day < 1 || holiday.day > 31) {
        errors.push('Fixed holidays must have a valid day (1-31)');
      }
    }

    if (holiday.type === 'floating') {
      if (!holiday.month || holiday.month < 1 || holiday.month > 12) {
        errors.push('Floating holidays must have a valid month (1-12)');
      }
      if (!holiday.rule || !holiday.rule.trim()) {
        errors.push('Floating holidays must have a rule (e.g., "fourth thursday")');
      }
    }

    if (holiday.salesMultiplier < 0.1 || holiday.salesMultiplier > 5.0) {
      errors.push('Sales multiplier must be between 0.1 and 5.0');
    }

    if (holiday.daysBefore < 0 || holiday.daysBefore > 14) {
      errors.push('Days before must be between 0 and 14');
    }

    if (holiday.daysAfter < 0 || holiday.daysAfter > 14) {
      errors.push('Days after must be between 0 and 14');
    }

    return errors;
  }
}

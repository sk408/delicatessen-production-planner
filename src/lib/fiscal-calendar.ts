import { addDays, startOfDay } from 'date-fns';
import type { FiscalDate } from '@types/index';

/**
 * Fiscal Calendar conversion utilities
 * Handles conversion between fiscal dates and calendar dates
 */
export class FiscalCalendar {
  private fiscalYearStart: Date;

  constructor(fiscalYearStart: { month: number; day: number }) {
    // Create fiscal year start date for 2024 (Sept 2, 2024)
    this.fiscalYearStart = new Date(2024, fiscalYearStart.month - 1, fiscalYearStart.day);
  }

  /**
   * Convert fiscal date components to calendar date
   */
  convertToCalendarDate(
    fiscalYear: number,
    fiscalPeriod: number,
    fiscalWeek: number,
    fiscalDay: number
  ): Date {
    try {
      // Calculate the start of the fiscal year
      const fiscalYearStartDate = new Date(this.fiscalYearStart);
      fiscalYearStartDate.setFullYear(fiscalYear - 1); // FY2025 starts in 2024

      // Each fiscal period is approximately 4 weeks (28 days)
      // Each fiscal week is 7 days
      // Each fiscal day is 1 day

      const daysFromFiscalStart = 
        (fiscalPeriod - 1) * 28 + // Periods before current
        (fiscalWeek - 1) * 7 +    // Weeks before current
        (fiscalDay - 1);          // Days before current

      const calendarDate = addDays(fiscalYearStartDate, daysFromFiscalStart);
      return startOfDay(calendarDate);
    } catch (error) {
      console.error('Error converting fiscal date:', error);
      return new Date();
    }
  }

  /**
   * Convert calendar date to fiscal date components
   */
  convertToFiscalDate(calendarDate: Date): FiscalDate {
    try {
      const date = startOfDay(calendarDate);
      
      // Determine which fiscal year this date belongs to
      let fiscalYear = date.getFullYear();
      let fiscalYearStart = new Date(this.fiscalYearStart);
      fiscalYearStart.setFullYear(fiscalYear - 1);
      
      // If date is before fiscal year start, it belongs to previous fiscal year
      if (date < fiscalYearStart) {
        fiscalYear--;
        fiscalYearStart.setFullYear(fiscalYear - 1);
      }
      // If date is after next fiscal year start, it belongs to next fiscal year
      else {
        const nextFiscalYearStart = new Date(fiscalYearStart);
        nextFiscalYearStart.setFullYear(fiscalYear);
        if (date >= nextFiscalYearStart) {
          fiscalYear++;
          fiscalYearStart = nextFiscalYearStart;
        }
      }

      // Calculate days from fiscal year start
      const daysDifference = Math.floor(
        (date.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Convert to fiscal components
      const fiscalPeriod = Math.floor(daysDifference / 28) + 1;
      const remainingDays = daysDifference % 28;
      const fiscalWeek = Math.floor(remainingDays / 7) + 1;
      const fiscalDay = (remainingDays % 7) + 1;

      return {
        fiscalYear: fiscalYear + 1, // FY2025 starts in 2024
        fiscalPeriod: Math.max(1, Math.min(13, fiscalPeriod)),
        fiscalWeek: Math.max(1, Math.min(4, fiscalWeek)),
        fiscalDay: Math.max(1, Math.min(7, fiscalDay))
      };
    } catch (error) {
      console.error('Error converting calendar date:', error);
      return {
        fiscalYear: new Date().getFullYear() + 1,
        fiscalPeriod: 1,
        fiscalWeek: 1,
        fiscalDay: 1
      };
    }
  }

  /**
   * Get the corresponding date from last year for comparison
   */
  getCorrespondingDateLastYear(currentDate: Date): Date {
    try {
      const fiscalDate = this.convertToFiscalDate(currentDate);
      const lastYearFiscalDate = {
        ...fiscalDate,
        fiscalYear: fiscalDate.fiscalYear - 1
      };
      
      return this.convertToCalendarDate(
        lastYearFiscalDate.fiscalYear,
        lastYearFiscalDate.fiscalPeriod,
        lastYearFiscalDate.fiscalWeek,
        lastYearFiscalDate.fiscalDay
      );
    } catch (error) {
      console.error('Error getting corresponding date last year:', error);
      // Fallback: subtract 365 days (or 366 for leap year)
      const lastYear = new Date(currentDate);
      lastYear.setFullYear(currentDate.getFullYear() - 1);
      return lastYear;
    }
  }

  /**
   * Get fiscal year for a given calendar date
   */
  getFiscalYear(calendarDate: Date): number {
    return this.convertToFiscalDate(calendarDate).fiscalYear;
  }

  /**
   * Get the start date of a fiscal year
   */
  getFiscalYearStart(fiscalYear: number): Date {
    const startDate = new Date(this.fiscalYearStart);
    startDate.setFullYear(fiscalYear - 1); // FY2025 starts in 2024
    return startDate;
  }

  /**
   * Get the end date of a fiscal year
   */
  getFiscalYearEnd(fiscalYear: number): Date {
    const endDate = this.getFiscalYearStart(fiscalYear + 1);
    return addDays(endDate, -1);
  }

  /**
   * Check if a date falls within a specific fiscal year
   */
  isInFiscalYear(date: Date, fiscalYear: number): boolean {
    const start = this.getFiscalYearStart(fiscalYear);
    const end = this.getFiscalYearEnd(fiscalYear);
    return date >= start && date <= end;
  }

  /**
   * Format fiscal date for display
   */
  formatFiscalDate(fiscalDate: FiscalDate): string {
    return `FY${fiscalDate.fiscalYear} P${fiscalDate.fiscalPeriod} W${fiscalDate.fiscalWeek} D${fiscalDate.fiscalDay}`;
  }

  /**
   * Get all dates in a fiscal period
   */
  getFiscalPeriodDates(fiscalYear: number, fiscalPeriod: number): Date[] {
    const dates: Date[] = [];
    
    for (let week = 1; week <= 4; week++) {
      for (let day = 1; day <= 7; day++) {
        try {
          const date = this.convertToCalendarDate(fiscalYear, fiscalPeriod, week, day);
          dates.push(date);
        } catch (error) {
          // Skip invalid dates
          continue;
        }
      }
    }
    
    return dates;
  }

  /**
   * Get fiscal quarter for a fiscal period
   */
  getFiscalQuarter(fiscalPeriod: number): number {
    return Math.ceil(fiscalPeriod / 3);
  }

  /**
   * Validate fiscal date components
   */
  isValidFiscalDate(fiscalDate: FiscalDate): boolean {
    return (
      fiscalDate.fiscalYear >= 2020 &&
      fiscalDate.fiscalYear <= 2030 &&
      fiscalDate.fiscalPeriod >= 1 &&
      fiscalDate.fiscalPeriod <= 13 &&
      fiscalDate.fiscalWeek >= 1 &&
      fiscalDate.fiscalWeek <= 4 &&
      fiscalDate.fiscalDay >= 1 &&
      fiscalDate.fiscalDay <= 7
    );
  }
}

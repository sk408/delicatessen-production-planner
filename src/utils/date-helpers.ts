import { format, parse, isValid, addDays, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Date utility functions for the production planner
 */

export const formatDate = (date: Date, formatStr = 'MM/dd/yyyy'): string => {
  if (!isValid(date)) return '';
  return format(date, formatStr);
};

export const parseDate = (dateString: string, formatStr = 'MM/dd/yyyy'): Date => {
  const parsed = parse(dateString, formatStr, new Date());
  return isValid(parsed) ? parsed : new Date();
};

export const isLeapYear = (year: number): boolean => {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

export const addBusinessDays = (date: Date, days: number): Date => {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) { // Skip weekends
      addedDays++;
    }
  }
  
  return result;
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()] || '';
};

export const getMonthName = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()] || '';
};

export const createDateRange = (start: Date, end: Date) => ({
  start: startOfDay(start),
  end: endOfDay(end)
});

export const isDateInRange = (date: Date, range: { start: Date; end: Date }): boolean => {
  return date >= range.start && date <= range.end;
};

export const getDateDifference = (date1: Date, date2: Date): number => {
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
};

export const formatDateForDisplay = (date: Date): string => {
  return format(date, 'EEEE, MMMM do, yyyy');
};

export const formatDateForFilename = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getQuarter = (date: Date): number => {
  return Math.floor(date.getMonth() / 3) + 1;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

export const isPast = (date: Date): boolean => {
  return date < startOfDay(new Date());
};



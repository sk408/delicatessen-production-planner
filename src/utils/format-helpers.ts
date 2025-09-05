/**
 * Formatting utility functions for numbers, currency, and display values
 */

export const formatNumber = (value: number, decimals = 0): string => {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (value: number, currency = 'USD'): string => {
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  if (isNaN(value)) return '0%';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const formatItemNumber = (itemNumber: string): string => {
  if (!itemNumber) return '';
  // Ensure item number is properly formatted
  return itemNumber.toString().padStart(5, '0');
};

export const parseItemString = (itemString: string): { itemNumber: string; description: string } => {
  if (!itemString) return { itemNumber: '', description: '' };
  
  const match = itemString.match(/^(\d+)\s+(.+)$/);
  if (match) {
    return {
      itemNumber: formatItemNumber(match[1]),
      description: match[2].trim()
    };
  }
  
  return { itemNumber: itemString, description: '' };
};

export const formatUnits = (units: number): string => {
  if (isNaN(units)) return '0';
  if (units >= 1000000) return `${(units / 1000000).toFixed(1)}M`;
  if (units >= 1000) return `${(units / 1000).toFixed(1)}K`;
  return formatNumber(units);
};

export const formatHours = (hours: number): string => {
  if (isNaN(hours)) return '0.0h';
  return `${formatNumber(hours, 1)}h`;
};

export const formatEfficiencyScore = (score: number): string => {
  if (isNaN(score)) return 'N/A';
  if (score >= 0.9) return `${formatPercentage(score)} (Excellent)`;
  if (score >= 0.7) return `${formatPercentage(score)} (Good)`;
  if (score >= 0.5) return `${formatPercentage(score)} (Fair)`;
  return `${formatPercentage(score)} (Poor)`;
};

export const formatWasteRisk = (risk: number): string => {
  if (isNaN(risk)) return 'N/A';
  if (risk <= 0.1) return `${formatPercentage(risk)} (Low)`;
  if (risk <= 0.3) return `${formatPercentage(risk)} (Medium)`;
  return `${formatPercentage(risk)} (High)`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const formatVariance = (current: number, previous: number): {
  value: number;
  percentage: number;
  formatted: string;
  isPositive: boolean;
} => {
  if (isNaN(current) || isNaN(previous) || previous === 0) {
    return {
      value: 0,
      percentage: 0,
      formatted: 'N/A',
      isPositive: false
    };
  }
  
  const value = current - previous;
  const percentage = value / previous;
  const isPositive = value >= 0;
  
  return {
    value,
    percentage,
    formatted: `${isPositive ? '+' : ''}${formatNumber(value)} (${isPositive ? '+' : ''}${formatPercentage(percentage)})`,
    isPositive
  };
};



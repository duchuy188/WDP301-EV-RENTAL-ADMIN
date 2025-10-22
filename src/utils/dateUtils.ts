/**
 * Utility functions for date formatting and parsing
 */

/**
 * Parse date string from backend format (DD/MM/YYYY HH:mm:ss) to Date object
 * @param dateString - Date string in format "DD/MM/YYYY HH:mm:ss" or ISO string
 * @returns Date object or null if invalid
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Check if it's already an ISO string
    if (dateString.includes('T') || dateString.includes('Z')) {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Parse DD/MM/YYYY HH:mm:ss format
    const parts = dateString.split(' ');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      // Create date (month is 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      
      // Validate date
      if (isNaN(date.getTime())) return null;
      
      return date;
    }
    
    // Try parsing DD/MM/YYYY format without time
    const [day, month, year] = dateString.split('/').map(Number);
    if (day && month && year) {
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Last resort: try native Date parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Format date to Vietnamese locale date string (DD/MM/YYYY)
 * @param date - Date object, date string, or null
 * @returns Formatted date string or 'Invalid Date'
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Invalid Date';
  
  try {
    let dateObj: Date | null;
    
    if (typeof date === 'string') {
      dateObj = parseDateString(date);
    } else {
      dateObj = date;
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('vi-VN');
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'Invalid Date';
  }
}

/**
 * Format date to Vietnamese locale date and time string
 * @param date - Date object, date string, or null
 * @returns Formatted date time string or 'Invalid Date'
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'Invalid Date';
  
  try {
    let dateObj: Date | null;
    
    if (typeof date === 'string') {
      dateObj = parseDateString(date);
    } else {
      dateObj = date;
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleString('vi-VN');
  } catch (error) {
    console.error('Error formatting date time:', date, error);
    return 'Invalid Date';
  }
}

/**
 * Format number to Vietnamese currency (VND)
 * @param amount - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}


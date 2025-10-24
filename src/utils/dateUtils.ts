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
 * @returns Formatted date string or 'N/A'
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date || date === '') return 'N/A';
  
  try {
    let dateObj: Date | null;
    
    if (typeof date === 'string') {
      dateObj = parseDateString(date);
    } else {
      dateObj = date;
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date);
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'N/A';
  }
}

/**
 * Format date to Vietnamese locale date and time string
 * @param date - Date object, date string, or null
 * @returns Formatted date time string or 'N/A'
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date || date === '') return 'N/A';
  
  try {
    let dateObj: Date | null;
    
    if (typeof date === 'string') {
      dateObj = parseDateString(date);
    } else {
      dateObj = date;
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date time value:', date);
      return 'N/A';
    }
    
    return dateObj.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', date, error);
    return 'N/A';
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


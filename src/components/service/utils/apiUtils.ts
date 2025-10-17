import { BaseQueryParams } from '../type/apiTypes';
import { VehicleStatus } from '../type/vehicleTypes';

/**
 * Build query parameters object with default values
 * @param params - Optional query parameters
 * @param defaults - Default values for parameters
 * @returns Built parameters object
 */
export function buildQueryParams<T extends BaseQueryParams>(
  params?: Partial<T>,
  defaults: Partial<T> = {}
): T {
  return {
    page: 1,
    limit: 10,
    ...defaults,
    ...params,
  } as T;
}

/**
 * Build URL search params string from object
 * @param params - Parameters object
 * @returns URL search params string
 */
export function buildUrlSearchParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
}

/**
 * Check if error is a timeout error
 * @param error - Error object
 * @returns boolean
 */
export function isTimeoutError(error: any): boolean {
  return error.message?.includes('timeout') || error.code === 'ECONNABORTED';
}

/**
 * Check if error is a network error
 * @param error - Error object
 * @returns boolean
 */
export function isNetworkError(error: any): boolean {
  return error.message?.includes('Network Error') || !error.response;
}

/**
 * Delay execution for specified milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise<void>
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise<T>
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Don't retry for certain error types
      if (!isTimeoutError(error) && !isNetworkError(error)) {
        throw error;
      }

      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * Format vehicle status for display
 * @param status - Vehicle status
 * @returns Formatted status string
 */
export function formatVehicleStatus(status: VehicleStatus): string {
  const statusMap: Record<string, string> = {
    available: 'Sẵn sàng',
    rented: 'Đang thuê',
    maintenance: 'Bảo trì',
    broken: 'Hỏng'
  };
  return statusMap[status] || status;
}

/**
 * Get vehicle status color for UI
 * @param status - Vehicle status
 * @returns Color class or hex code
 */
export function getVehicleStatusColor(status: VehicleStatus): string {
  const colorMap: Record<string, string> = {
    available: 'text-green-600 bg-green-100',
    rented: 'text-blue-600 bg-blue-100',
    maintenance: 'text-yellow-600 bg-yellow-100',
    broken: 'text-red-600 bg-red-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Format battery level for display
 * @param batteryLevel - Battery percentage
 * @returns Formatted battery string with color indicator
 */
export function formatBatteryLevel(batteryLevel: number): { text: string; color: string } {
  if (batteryLevel >= 80) {
    return { text: `${batteryLevel}%`, color: 'text-green-600' };
  } else if (batteryLevel >= 50) {
    return { text: `${batteryLevel}%`, color: 'text-yellow-600' };
  } else if (batteryLevel >= 20) {
    return { text: `${batteryLevel}%`, color: 'text-orange-600' };
  } else {
    return { text: `${batteryLevel}%`, color: 'text-red-600' };
  }
}

/**
 * Validate vehicle license plate format
 * @param licensePlate - License plate string
 * @returns boolean
 */
export function isValidLicensePlate(licensePlate: string): boolean {
  // Vietnamese license plate format: XX-XXXX-XX or XX-X.XXXX-XX
  const pattern = /^[0-9]{2}[A-Z]-[0-9]{4,5}-[0-9]{2}$/;
  return pattern.test(licensePlate.replace(/\s/g, ''));
}

/**
 * Validate station phone number format
 * @param phone - Phone number string
 * @returns boolean
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Vietnamese phone number format
  const pattern = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  return pattern.test(phone.replace(/\s/g, ''));
}

/**
 * Validate email format
 * @param email - Email string
 * @returns boolean
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Format coordinates for display
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Formatted coordinates string
 */
export function formatCoordinates(latitude?: number, longitude?: number): string {
  if (latitude === undefined || longitude === undefined) {
    return 'Chưa có tọa độ';
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate CSV content from data array
 * @param data - Array of objects
 * @param headers - Custom headers mapping
 * @returns CSV string
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[], 
  headers?: Record<keyof T, string>
): string {
  if (data.length === 0) return '';

  const keys = Object.keys(data[0]) as (keyof T)[];
  const csvHeaders = keys.map(key => headers?.[key] || String(key));
  
  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Download file from blob
 * @param blob - File blob
 * @param filename - File name
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Debounce function to limit API calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit API calls
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}






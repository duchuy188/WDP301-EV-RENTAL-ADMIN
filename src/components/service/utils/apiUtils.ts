import { BaseQueryParams } from '../type/apiTypes';

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



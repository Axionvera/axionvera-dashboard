import { getFriendlyErrorMessage } from "./errorFormatting";

export interface ApiCallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  fallbackValue?: any;
}

export interface ApiError extends Error {
  isTimeout?: boolean;
  isNetworkError?: boolean;
  originalError?: Error;
}

/**
 * Creates a timeout promise that rejects after the specified duration
 */
export function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error: ApiError = new Error(`API call timed out after ${timeoutMs}ms`);
      error.isTimeout = true;
      reject(error);
    }, timeoutMs);
  });
}

/**
 * Wraps an async function with timeout and retry logic
 */
export function withApiResilience<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options: ApiCallOptions = {}
): T {
  const {
    timeout = 10000, // 10 seconds default timeout
    retries = 2,
    retryDelay = 1000, // 1 second default retry delay
    fallbackValue
  } = options;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create a race between the API call and the timeout
        const result = await Promise.race([
          apiFunction(...args),
          createTimeoutPromise(timeout)
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on timeout errors or if this is the last attempt
        const apiError = error as ApiError;
        if (apiError.isTimeout || attempt === retries) {
          break;
        }

        // Wait before retrying
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If we have a fallback value, return it instead of throwing
    if (fallbackValue !== undefined) {
      console.warn('API call failed, using fallback value:', lastError);
      return fallbackValue;
    }

    // Enhance the error with additional context
    const isTimeout = !!(lastError as ApiError).isTimeout;
    const isNetworkError = !!(lastError as ApiError).isNetworkError;
    const status = isTimeout ? 408 : (lastError as any).status;

    const friendlyMessage = getFriendlyErrorMessage(status, isNetworkError);

    const enhancedError: ApiError = new Error(friendlyMessage);
    enhancedError.originalError = lastError as Error;
    enhancedError.isNetworkError = isNetworkError;
    enhancedError.isTimeout = isTimeout;

    throw enhancedError;
  }) as T;
}

/**
 * Wraps any async function with basic error handling and logging
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorContext = context ? `[${context}]` : '';
      console.error(`${errorContext} API Error:`, error);
      
      // Re-throw the original error after logging
      throw error;
    }
  }) as T;
}

/**
 * Safe API wrapper that never throws, returns { data, error } object instead
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: ApiCallOptions = {}
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await withApiResilience(apiCall, options)();
    return { data };
  } catch (error) {
    return { error: error as ApiError };
  }
}

/**
 * Debounce function for API calls to prevent rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

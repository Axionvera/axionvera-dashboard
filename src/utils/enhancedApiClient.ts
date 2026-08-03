/**
 * Enhanced API client with centralized error handling and retry strategies
 */

import {
  AppError,
  ErrorCategory,
  NetworkError,
  TimeoutError,
  ServerError,
  toAppError,
  shouldRetryError,
  formatErrorForLogging,
  executeWithRetry,
  type RetryExecutorResult
} from '@/errors';

/**
 * Request configuration with recovery options
 */
export interface EnhancedRequestConfig extends RequestInit {
  timeout?: number;
  retryPolicy?: 'aggressive' | 'conservative' | 'none';
  fallbackData?: any;
  context?: string; // For logging/debugging
}

/**
 * Response wrapper with error handling
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  statusCode?: number;
  attempts: number;
  recoveryAttempted: boolean;
}

/**
 * Enhanced API client with automatic error categorization and retry logic
 */
export class EnhancedApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private retryPolicies: Record<string, ErrorCategory> = {};

  constructor(baseUrl: string = '', defaultTimeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Perform a fetch request with automatic retry and error handling
   */
  async request<T = any>(
    url: string,
    config: EnhancedRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retryPolicy = 'aggressive',
      fallbackData,
      context,
      ...fetchOptions
    } = config;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    if (retryPolicy === 'none') {
      return this.requestOnce<T>(fullUrl, fetchOptions, timeout, context);
    }

    // Use retry executor with appropriate policy
    const category = this.getErrorCategory(url, fetchOptions.method);
    const result = await executeWithRetry<T>(
      () => this.requestOnce<T>(fullUrl, fetchOptions, timeout, context).then(r => {
        if (!r.success && r.error) {
          throw r.error;
        }
        return r.data as T;
      }),
      category,
      {
        onRetry: (attempt, error, nextDelayMs) => {
          console.warn(
            `[${context || url}] Retry attempt ${attempt}`,
            `(next retry in ${nextDelayMs}ms)`,
            formatErrorForLogging(error)
          );
        },
        onFailure: (error) => {
          console.error(
            `[${context || url}] Request failed after retries`,
            formatErrorForLogging(error)
          );
        }
      }
    );

    // If success, return response
    if (result.success) {
      return {
        success: true,
        data: result.data,
        attempts: result.attempts,
        recoveryAttempted: result.attempts > 1
      };
    }

    // If fallback data available, use it
    if (fallbackData !== undefined) {
      console.warn(
        `[${context || url}] Using fallback data due to request failure`,
        formatErrorForLogging(result.error)
      );
      return {
        success: true,
        data: fallbackData,
        attempts: result.attempts,
        recoveryAttempted: true
      };
    }

    // Return error response
    return {
      success: false,
      error: result.error,
      statusCode: result.error?.statusCode,
      attempts: result.attempts,
      recoveryAttempted: result.attempts > 1
    };
  }

  /**
   * Single request attempt without retries
   */
  private async requestOnce<T = any>(
    url: string,
    fetchOptions: Omit<RequestInit, 'timeout'>,
    timeout: number,
    context?: string
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle successful responses
      if (response.ok) {
        let data: any = null;
        if (response.status !== 204) {
          try {
            data = await response.json();
          } catch (e) {
            // response was not JSON or was empty
          }
        }
        return {
          success: true,
          data: data as T,
          statusCode: response.status,
          attempts: 1,
          recoveryAttempted: false
        };
      }

      // Handle error responses
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON
      }

      const error = new ServerError(
        errorData?.message || response.statusText || 'Request failed',
        response.status,
        {
          userFacingMessage: this.getUserFacingMessage(response.status, errorData)
        }
      );

      return {
        success: false,
        error,
        statusCode: response.status,
        attempts: 1,
        recoveryAttempted: false
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Convert to AppError
      let appError: AppError;

      if (error.name === 'AbortError') {
        appError = new TimeoutError(
          `Request to ${context || url} timed out after ${timeout}ms`,
          { userFacingMessage: 'Request timed out. Please try again.' }
        );
      } else if (error instanceof TypeError) {
        appError = new NetworkError(
          error.message || 'Network connection failed',
          { userFacingMessage: 'Unable to connect. Please check your internet connection.' }
        );
      } else {
        appError = toAppError(error, context);
      }

      return {
        success: false,
        error: appError,
        attempts: 1,
        recoveryAttempted: false
      };
    }
  }

  /**
   * Determine error category based on URL and method
   */
  private getErrorCategory(url: string, method?: string): ErrorCategory {
    // Check if we have a cached category for this endpoint
    const cacheKey = `${method || 'GET'} ${url}`;
    if (this.retryPolicies[cacheKey]) {
      return this.retryPolicies[cacheKey];
    }

    // Default to network errors for most endpoints
    return ErrorCategory.NETWORK;
  }

  /**
   * Register custom error category for specific endpoint
   */
  registerEndpointCategory(method: string, url: string, category: ErrorCategory): void {
    const cacheKey = `${method} ${url}`;
    this.retryPolicies[cacheKey] = category;
  }

  /**
   * Get user-facing error message
   */
  private getUserFacingMessage(statusCode: number, errorData?: any): string {
    if (errorData?.userMessage) {
      return errorData.userMessage;
    }

    if (statusCode === 429) {
      return 'The service is receiving too many requests. Please wait a moment and try again.';
    }

    if (statusCode === 503) {
      return 'The service is temporarily unavailable. Please try again in a moment.';
    }

    if (statusCode >= 500) {
      return 'The server encountered an error. Please try again later.';
    }

    if (statusCode === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (statusCode === 404) {
      return 'The requested resource was not found.';
    }

    if (statusCode >= 400 && statusCode < 500) {
      return 'Your request could not be processed. Please check your input and try again.';
    }

    return 'An error occurred. Please try again.';
  }
}

/**
 * Global enhanced API client instance
 */
let globalClient: EnhancedApiClient;

/**
 * Get or create global API client
 */
export function getApiClient(baseUrl?: string): EnhancedApiClient {
  if (!globalClient) {
    globalClient = new EnhancedApiClient(baseUrl);
  }
  return globalClient;
}

/**
 * Simple wrapper functions for common HTTP methods
 */
export async function apiGet<T = any>(
  url: string,
  config?: EnhancedRequestConfig
): Promise<ApiResponse<T>> {
  return getApiClient().request<T>(url, {
    ...config,
    method: 'GET'
  });
}

export async function apiPost<T = any>(
  url: string,
  data?: any,
  config?: EnhancedRequestConfig
): Promise<ApiResponse<T>> {
  return getApiClient().request<T>(url, {
    ...config,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers
    }
  });
}

export async function apiPut<T = any>(
  url: string,
  data?: any,
  config?: EnhancedRequestConfig
): Promise<ApiResponse<T>> {
  return getApiClient().request<T>(url, {
    ...config,
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers
    }
  });
}

export async function apiDelete<T = any>(
  url: string,
  config?: EnhancedRequestConfig
): Promise<ApiResponse<T>> {
  return getApiClient().request<T>(url, {
    ...config,
    method: 'DELETE'
  });
}

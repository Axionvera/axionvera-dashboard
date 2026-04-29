import { SOROBAN_RPC_URL } from "./networkConfig";
import { getFriendlyErrorMessage } from "./errorFormatting";

/**
 * Custom error class for API failures
 */
export class ApiClientError extends Error {
  status?: number;
  statusText?: string;
  retryCount?: number;
  isNetworkError?: boolean;

  constructor(message: string, options: { 
    status?: number; 
    statusText?: string; 
    retryCount?: number;
    isNetworkError?: boolean;
  } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.retryCount = options.retryCount;
    this.isNetworkError = options.isNetworkError;
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  maxRetries?: number;
  baseDelay?: number;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 500;

/**
 * Internal helper for exponential backoff sleep
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch wrapper with interceptor-like logic for retries and error handling
 */
export async function apiClient<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    ...fetchOptions
  } = options;

  let lastError: ApiClientError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(id);

      // Handle successful response
      if (response.ok) {
        return await response.json();
      }

      // Intercept 429 (Too Many Requests) and 5xx (Server Errors) for retry
      const shouldRetry = response.status === 429 || (response.status >= 500 && response.status <= 599);
      
      if (shouldRetry && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`API request failed with status ${response.status}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // If we're here, either it's not a retryable error or we've exhausted retries
      throw new ApiClientError(
        getFriendlyErrorMessage(response.status),
        { 
          status: response.status, 
          statusText: response.statusText,
          retryCount: attempt 
        }
      );

    } catch (error: any) {
      clearTimeout(id);

      const isAbortError = error.name === 'AbortError';
      const isNetworkError = error.name === 'TypeError' || !error.status;

      // Handle retry for network errors/timeouts
      if ((isNetworkError || isAbortError) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`API request failed due to ${isAbortError ? 'timeout' : 'network error'}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Final error after retries
      const friendlyMessage = getFriendlyErrorMessage(
        isAbortError ? 408 : (error as ApiClientError).status,
        isNetworkError
      );

      lastError = new ApiClientError(friendlyMessage, {
        status: isAbortError ? 408 : (error as ApiClientError).status,
        isNetworkError,
        retryCount: attempt
      });
      
      throw lastError;
    }
  }

  throw lastError || new ApiClientError("Request failed after multiple attempts.");
}

/**
 * Specialized Soroban RPC client that uses the enhanced apiClient
 */
export const sorobanRpc = {
  post: <T = any>(method: string, params: any = []): Promise<T> => {
    return apiClient(SOROBAN_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method,
        params,
      }),
    });
  }
};

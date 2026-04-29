/**
 * Utility to format technical network/API errors into user-friendly messages.
 * These messages are designed to be displayed in toast notifications via useApiError.
 */
export const getFriendlyErrorMessage = (status?: number, isNetworkError?: boolean): string => {
  if (isNetworkError) {
    return "Unable to connect to the network. Please check your internet connection and try again.";
  }

  // 408 is Request Timeout (often used for client-side timeouts too)
  if (status === 408) {
    return "The request timed out. The network might be slow, please try again.";
  }

  if (status === 429) {
    return "The server is currently receiving too many requests. Please wait a moment and try again.";
  }

  if (status && status >= 500) {
    return "The Soroban RPC service is currently experiencing issues. Our team has been notified. Please try again later.";
  }

  return "An unexpected network error occurred while communicating with the Stellar network.";
};

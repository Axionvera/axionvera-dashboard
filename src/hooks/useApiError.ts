import { useState, useCallback } from 'react';
import { notify } from '@/utils/notifications';
import { mapSorobanErrorToMessage } from '@/utils/errorDictionary';

export interface ApiErrorState {
  error: Error | null;
  isLoading: boolean;
  hasError: boolean;
}

export interface UseApiErrorReturn extends ApiErrorState {
  setError: (error: Error | null) => void;
  clearError: () => void;
  executeWithErrorHandling: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

export function useApiError(): UseApiErrorReturn {
  const [state, setState] = useState<ApiErrorState>({
    error: null,
    isLoading: false,
    hasError: false
  });

  const setError = useCallback((error: Error | null) => {
    setState({
      error,
      isLoading: false,
      hasError: !!error
    });
  }, []);

  const clearError = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      hasError: false
    });
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, hasError: false }));
    
    try {
      const result = await fn();
      setState({ error: null, isLoading: false, hasError: false });
      return result;
    } catch (error) {
      const errorObj = error as Error;
      console.error('API Error in hook:', errorObj);

      const friendlyMessage = mapSorobanErrorToMessage(errorObj) ?? errorObj.message;
      notify.error('API Error', friendlyMessage);
      setState({
        error: errorObj,
        isLoading: false,
        hasError: true
      });
      return null;
    }
  }, []);

  return {
    ...state,
    setError,
    clearError,
    executeWithErrorHandling
  };
}

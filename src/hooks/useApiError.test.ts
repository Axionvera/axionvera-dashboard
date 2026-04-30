import { act, renderHook } from '@testing-library/react';
import { useApiError } from './useApiError';

jest.mock('@/utils/notifications', () => ({
  notify: {
    error: jest.fn(),
  },
}));

const { notify } = require('@/utils/notifications');

describe('useApiError', () => {
  beforeEach(() => {
    notify.error.mockClear();
  });

  it('should translate Soroban HostError to a friendly user message', async () => {
    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.executeWithErrorHandling(async () => {
        throw new Error('HostError: Error(WasmVm, InvalidAction)');
      });
    });

    expect(notify.error).toHaveBeenCalledWith('API Error', 'Invalid contract action. Please try again.');
    expect(result.current.hasError).toBe(true);
  });

  it('should fallback to a generic contract error message for unknown Soroban errors', async () => {
    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.executeWithErrorHandling(async () => {
        throw new Error('HostError: Error(WasmVm, UnhandledError)');
      });
    });

    expect(notify.error).toHaveBeenCalledWith(
      'API Error',
      'Transaction failed: An unexpected contract error occurred'
    );
    expect(result.current.hasError).toBe(true);
  });

  it('should preserve the original error message for non-contract errors', async () => {
    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.executeWithErrorHandling(async () => {
        throw new Error('Unexpected network failure');
      });
    });

    expect(notify.error).toHaveBeenCalledWith('API Error', 'Unexpected network failure');
    expect(result.current.hasError).toBe(true);
  });
});

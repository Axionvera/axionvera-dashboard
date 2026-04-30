import { 
  withApiResilience, 
  withErrorHandling, 
  safeApiCall, 
  debounce 
} from '../apiResilience';

describe('apiResilience utility', () => {
  describe('withApiResilience', () => {
    it('should return the result of a successful API call', async () => {
      const mockApi = jest.fn().mockResolvedValue('success');
      const resilientApi = withApiResilience(mockApi);
      const result = await resilientApi();
      expect(result).toBe('success');
      expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockApi = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const resilientApi = withApiResilience(mockApi, { retries: 2, retryDelay: 10 });
      const result = await resilientApi();
      
      expect(result).toBe('success');
      expect(mockApi).toHaveBeenCalledTimes(3);
    });

    it('should throw after all retries fail', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('Permanent Fail'));
      const resilientApi = withApiResilience(mockApi, { retries: 1, retryDelay: 10 });
      
      await expect(resilientApi()).rejects.toThrow(/Permanent Fail/);
      expect(mockApi).toHaveBeenCalledTimes(2);
    });

    it('should timeout if the call takes too long', async () => {
      const mockApi = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const resilientApi = withApiResilience(mockApi, { timeout: 10 });
      
      await expect(resilientApi()).rejects.toThrow(/timed out/);
    });

    it('should return fallback value if provided and all attempts fail', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('Fail'));
      const resilientApi = withApiResilience(mockApi, { 
        retries: 1, 
        retryDelay: 10, 
        fallbackValue: 'fallback' 
      });
      
      const result = await resilientApi();
      expect(result).toBe('fallback');
    });
  });

  describe('withErrorHandling', () => {
    it('should log error and re-throw', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockApi = jest.fn().mockRejectedValue(new Error('Test Error'));
      const handler = withErrorHandling(mockApi, 'TestContext');
      
      await expect(handler()).rejects.toThrow('Test Error');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'), expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('safeApiCall', () => {
    it('should return data on success', async () => {
      const mockApi = jest.fn().mockResolvedValue('data');
      const result = await safeApiCall(mockApi);
      expect(result).toEqual({ data: 'data' });
    });

    it('should return error on failure', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('oops'));
      const result = await safeApiCall(mockApi, { retries: 0 });
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 10);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });
  });
});

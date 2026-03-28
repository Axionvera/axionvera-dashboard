import { act, renderHook, waitFor } from '@testing-library/react';
import { useSidebar } from './useSidebar';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSidebar', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should default to open state when no saved state exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useSidebar());
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should load saved state from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    const { result } = renderHook(() => useSidebar());
    
    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebar-open');
  });

  it('should save state to localStorage when changed', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useSidebar());
    
    await waitFor(() => expect(result.current.isOpen).toBe(true));

    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isOpen).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
  });

  it('should provide toggle, open, and close functions', () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useSidebar());
    
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
  });

  it('should handle open and close functions correctly', async () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    const { result } = renderHook(() => useSidebar());

    await waitFor(() => expect(result.current.isOpen).toBe(false));

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-open', 'true');
    
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
  });
});

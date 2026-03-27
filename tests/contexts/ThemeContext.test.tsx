import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import userEvent from '@testing-library/user-event';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  let changeListener: ((e: any) => void) | null = null;
  return jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn((event, listener) => {
      if (event === 'change') changeListener = listener;
    }),
    removeEventListener: jest.fn((event, listener) => {
      if (event === 'change' && changeListener === listener) changeListener = null;
    }),
    dispatchEvent: jest.fn(),
    _triggerChange: (newMatches: boolean) => {
      if (changeListener) {
        changeListener({ matches: newMatches } as any);
      }
    }
  }));
};

const TestComponent = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
};

describe('ThemeContext', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    localStorage.clear();
    matchMediaMock = mockMatchMedia(false);
    window.matchMedia = matchMediaMock;
    document.documentElement.setAttribute('data-theme', '');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with system theme light if matches is false', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initializes with system theme dark if matches is true', () => {
    window.matchMedia = mockMatchMedia(true);
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
  });

  it('updates theme and localStorage when setTheme is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      screen.getByText('Set Dark').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('updates resolved theme when system preference changes', async () => {
    window.matchMedia = matchMediaMock;
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      matchMediaMock()._triggerChange(true);
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

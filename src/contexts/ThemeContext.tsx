import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @deprecated Use ThemeProvider from next-themes directly in _app.tsx.
 * This wrapper is kept for backward compatibility with the existing useTheme hook.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return (
    <ThemeContext.Provider
      value={{
        theme: theme as Theme,
        setTheme: (t: Theme) => setTheme(t),
        resolvedTheme: resolvedTheme as ResolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Create a fallback hook that always calls useNextTheme at the top level
function useNextThemeSafe() {
  try {
    return useNextTheme();
  } catch {
    return null;
  }
}

export function useTheme() {
  const nextTheme = useNextTheme();
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
    return nextTheme;
  // Always call hooks at the top level, never conditionally
  const context = useContext(ThemeContext);
  const nextTheme = useNextThemeSafe();
  
  // If we have context, use it
  if (context !== undefined) {
    return context;
  }
  
  // Fallback to next-themes directly if provider is missing
  if (nextTheme) {
    return nextTheme;
  }
  
  // If all else fails, throw an error
  throw new Error('useTheme must be used within a ThemeProvider');
}
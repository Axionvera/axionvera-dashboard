import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="bg-theme-bg-secondary text-theme-text-primary border border-theme-border-primary rounded px-2 py-1 text-sm focus:outline-none focus:border-theme-border-focus"
        aria-label="Select theme"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <div 
        className="w-4 h-4 rounded-full border border-theme-border-primary"
        style={{ backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
        title={`Resolved theme: ${resolvedTheme}`}
      />
    </div>
  );
}

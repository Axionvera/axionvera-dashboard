import { useEffect, useState, useRef } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar-open';

export function useSidebar() {
  // We default to true (open) to match expected dashboard behavior and unit tests.
  // We use a mount ref to prevent hydration mismatches and unnecessary localStorage writes on first load.
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const hasMounted = useRef(false);

  // Initialize from localStorage after mounting to avoid hydration mismatch
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (savedState !== null) {
        setIsOpen(JSON.parse(savedState));
      }
    } catch (error) {
      console.warn('Failed to parse sidebar state from localStorage:', error);
    }
    // Set mounted flag AFTER we've attempted to load from storage
    hasMounted.current = true;
  }, []);

  // Persist state changes after mount
  useEffect(() => {
    // Only save if we have finished mounting (to avoid overriding saved state with default during hydration)
    if (!hasMounted.current) return;

    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, toggle, open, close };
}
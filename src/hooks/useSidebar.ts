import { useEffect, useRef, useState } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar-open';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const hasMounted = useRef(false);

  // Initialize from localStorage after mounting to avoid hydration mismatch
  useEffect(() => {
    hasMounted.current = true;
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
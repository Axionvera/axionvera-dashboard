import { useEffect, useRef } from 'react';
import { recordRenderMetric, recordLifecycleEvent } from '../utils/profilerUtils';

interface ProfilerOptions {
  componentName: string;
  trackStateUpdates?: boolean;
}

export function useProfiler({ componentName, trackStateUpdates = true }: ProfilerOptions) {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());
  
  // Track render count and frequency
  renderCount.current += 1;
  const currentRenderTime = performance.now();
  const renderDuration = currentRenderTime - lastRenderTime.current;
  lastRenderTime.current = currentRenderTime;

  if (renderCount.current > 1) {
    recordRenderMetric(componentName, renderDuration);
  }

  useEffect(() => {
    // Mount
    const mountDuration = performance.now() - mountTime.current;
    recordLifecycleEvent(componentName, 'mount', mountDuration);

    return () => {
      // Unmount
      recordLifecycleEvent(componentName, 'unmount', performance.now());
    };
  }, [componentName]);

  // Optional: Wrap a state setter to record state-change-triggered renders.
  const trackState = <T,>(setState: (val: T) => void) => {
    return (val: T) => {
      if (trackStateUpdates) {
        recordLifecycleEvent(componentName, 'stateUpdate', performance.now());
      }
      setState(val);
    };
  };

  return {
    renderCount: renderCount.current,
    trackState
  };
}

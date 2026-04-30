import { useCallback } from 'react';

/**
 * Hook to trigger confetti celebration animation
 * This hook uses canvas-confetti to create a celebratory effect
 */
export function useConfetti() {
  const triggerConfetti = useCallback(async () => {
    try {
      // Dynamically import canvas-confetti to keep it optional
      const confetti = (await import('canvas-confetti')).default;

      // Get the canvas element or create one
      const canvasEl = document.querySelector('canvas[aria-hidden="true"]') as HTMLCanvasElement;

      if (canvasEl) {
        const myConfetti = confetti.create(canvasEl, { resize: true, useWorker: true });

        // Create celebratory confetti burst
        void myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
          scalar: 1.2,
          gravity: 0.8,
          decay: 0.95,
        });

        // Additional burst for more celebration
        setTimeout(() => {
          void myConfetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
            scalar: 0.8,
            gravity: 0.8,
            decay: 0.93,
          });
        }, 150);
      }
    } catch (error) {
      // Silently fail if confetti doesn't load - it's not critical
      console.debug('Confetti animation skipped', error);
    }
  }, []);

  return { triggerConfetti };
}

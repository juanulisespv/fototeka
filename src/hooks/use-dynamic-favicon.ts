'use client';

import { useEffect } from 'react';

export function useDynamicFavicon(isActive: boolean, timeRemaining: number) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 32;
    canvas.height = 32;

    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);

    if (isActive) {
      // Draw tomato emoji as base
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍅', 16, 16);

      // Draw timer indicator
      const minutes = Math.floor(timeRemaining / 60);
      if (minutes < 100) {
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(minutes.toString(), 16, 26);
        ctx.fillText(minutes.toString(), 16, 26);
      }
    } else {
      // Default tomato emoji
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍅', 16, 16);
    }

    // Update favicon
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement || 
                document.createElement('link') as HTMLLinkElement;
    
    link.rel = 'icon';
    link.href = canvas.toDataURL();
    
    if (!document.querySelector('link[rel="icon"]')) {
      document.head.appendChild(link);
    }

    // Clean up
    return () => {
      canvas.remove();
    };
  }, [isActive, timeRemaining]);
}

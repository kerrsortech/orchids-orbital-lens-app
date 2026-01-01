'use client';

import { useEffect, useState } from 'react';

export function useViewportHeight() {
  const [height, setHeight] = useState('100vh');

  useEffect(() => {
    // Only execute on client
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      // Use window.innerHeight to get the precise visible viewport height
      const vh = window.innerHeight;
      setHeight(`${vh}px`);
    };

    // Initial set
    updateHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return height;
}
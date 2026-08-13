import { useState, useEffect } from 'react';

export function getSidebarOffset(bp) {
  if (bp === 'desktop') return 240;
  if (bp === 'tablet') return 68;
  return 0;
}

export function getMainPadding(bp) {
  if (bp === 'mobile') return '56px 16px 80px';
  if (bp === 'tablet') return '24px';
  return '40px';
}

export default function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };

    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return bp;
}

import { useState, useEffect } from 'react';

/**
 * Unified breakpoint system (mobile-first, matches Tailwind defaults):
 *   Mobile:  0 – 767px
 *   Tablet:  768 – 1023px
 *   Laptop:  1024 – 1279px
 *   Desktop: 1280px+
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointName = 'mobile' | 'tablet' | 'laptop' | 'desktop';

function getBreakpoint(width: number): BreakpointName {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'laptop';
  return 'desktop';
}

export function useBreakpoint() {
  const [bp, setBp] = useState<BreakpointName>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'desktop'
  );

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth));

    // Listen to all relevant thresholds
    const queries = [BREAKPOINTS.md, BREAKPOINTS.lg, BREAKPOINTS.xl].map((px) => {
      const mql = window.matchMedia(`(min-width: ${px}px)`);
      mql.addEventListener('change', update);
      return mql;
    });

    update();
    return () => {
      queries.forEach((mql) => mql.removeEventListener('change', update));
    };
  }, []);

  return {
    breakpoint: bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isLaptop: bp === 'laptop',
    isDesktop: bp === 'desktop',
    /** < 768px */
    isMobileOnly: bp === 'mobile',
    /** < 1024px (mobile + tablet) */
    isBelowLaptop: bp === 'mobile' || bp === 'tablet',
    /** >= 1024px (laptop + desktop) */
    isLaptopUp: bp === 'laptop' || bp === 'desktop',
    /** >= 1280px */
    isDesktopUp: bp === 'desktop',
  };
}

/**
 * Drop-in replacement for the old useIsMobile hook.
 * Returns true for < 768px (matches Tailwind md: breakpoint).
 */
export function useIsMobile() {
  const { isMobile } = useBreakpoint();
  return isMobile;
}

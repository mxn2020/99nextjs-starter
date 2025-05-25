
export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;
export type Breakpoint = keyof typeof breakpoints;
export function getBreakpointValue(breakpoint: Breakpoint): number {
    return breakpoints[breakpoint];
}
export function createMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): string {
    const value = getBreakpointValue(breakpoint);
    return (`${type}-width: ${value}px`);
}
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.md;
}
export function isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
}
export function isDesktop(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints.lg;
}

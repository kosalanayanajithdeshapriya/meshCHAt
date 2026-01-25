// Responsive breakpoints
export const breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
} as const;

// Media query strings
export const mediaQueries = {
    mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
    tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
    desktop: `(min-width: ${breakpoints.desktop}px)`,
    touch: '(hover: none) and (pointer: coarse)'
} as const;

// Check if current viewport is mobile
export function isMobile(): boolean {
    return window.innerWidth < breakpoints.tablet;
}

// Check if current viewport is tablet
export function isTablet(): boolean {
    return window.innerWidth >= breakpoints.tablet && window.innerWidth < breakpoints.desktop;
}

// Check if current viewport is desktop
export function isDesktop(): boolean {
    return window.innerWidth >= breakpoints.desktop;
}

// Check if device is touch-enabled
export function isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get current breakpoint name
export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
    const width = window.innerWidth;

    if (width < breakpoints.tablet) return 'mobile';
    if (width < breakpoints.desktop) return 'tablet';
    if (width < breakpoints.wide) return 'desktop';
    return 'wide';
}

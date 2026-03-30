// Theme configuration for IONORA CARE (Vibrant Aqua + Mango)
// Goals: modern, clean, high-contrast, consistent across Service + Store

import { Platform, type ViewStyle } from 'react-native';

export type ColorMode = 'light' | 'dark';

const common = {
    // Brand
    primary: '#00C2B3',        // Electric Aqua (main CTA)
    primaryPressed: '#00A79A',
    accent: '#FFB000',         // Mango (highlights/badges/offers)
    accentPressed: '#E89A00',

    // Status
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#2563EB',
};

const light = {
    mode: 'light' as const,

    // Surfaces
    background: '#F7FAFA',
    backgroundAlt: '#EEF7F7',
    surface: '#FFFFFF',
    surface2: '#EFF7F7',
    surface3: '#E6F3F2',

    // Text
    text: '#0B1220',
    textSecondary: '#324152',
    textMuted: '#5B6B7A',
    textOnPrimary: '#FFFFFF',

    // Borders & separators
    border: '#E4EFF1',
    borderStrong: '#CFE3E6',

    // Icons
    icon: '#0B1220',
    iconMuted: '#5B6B7A',

    // Interactive
    primary: common.primary,
    primaryPressed: common.primaryPressed,
    primaryLight: '#CFF7F3',          // subtle tint backgrounds
    primaryDark: '#007E74',
    accent: common.accent,
    accentPressed: common.accentPressed,

    // Status colors
    success: common.success,
    warning: common.warning,
    error: common.error,
    info: common.info,

    // Feedback surfaces (for chips/badges)
    successBg: 'rgba(22, 163, 74, 0.12)',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    errorBg: 'rgba(239, 68, 68, 0.12)',
    infoBg: 'rgba(37, 99, 235, 0.10)',

    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarActive: common.primary,
    tabBarInactive: '#7A8A99',
    tabBarBorder: '#E4EFF1',

    // Gradients
    gradientStart: common.primary,
    gradientEnd: '#007E74',

    // Missing properties
    secondary: common.accent,
    secondaryLight: 'rgba(255, 255, 255, 0.7)',
    textLight: '#94A3B8',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    surfaceSecondary: '#F1F5F9',
    glassSurface: 'rgba(255, 255, 255, 0.9)',
    glowPink: '#FF4081',
    glassText: '#0B1220',
    glowTeal: common.primary,
};

const dark = {
    mode: 'dark' as const,

    // Surfaces
    background: '#071A1D',
    backgroundAlt: '#061417',
    surface: '#0D252A',
    surface2: '#103038',
    surface3: '#123842',

    // Text
    text: '#EAF6F6',
    textSecondary: '#C6DEE0',
    textMuted: '#97B9BE',
    textOnPrimary: '#062124',

    // Borders
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',

    // Icons
    icon: '#EAF6F6',
    iconMuted: '#97B9BE',

    // Interactive
    primary: common.primary,
    primaryPressed: common.primaryPressed,
    primaryLight: 'rgba(0, 194, 179, 0.18)',
    primaryDark: '#00A79A',
    accent: common.accent,
    accentPressed: common.accentPressed,

    // Feedback surfaces
    successBg: 'rgba(22, 163, 74, 0.18)',
    warningBg: 'rgba(245, 158, 11, 0.18)',
    errorBg: 'rgba(239, 68, 68, 0.18)',
    infoBg: 'rgba(37, 99, 235, 0.18)',

    // Tab bar
    tabBarBackground: '#0D252A',
    tabBarActive: common.primary,
    tabBarInactive: '#97B9BE',
    tabBarBorder: 'rgba(255, 255, 255, 0.10)',

    // Gradients
    gradientStart: common.primary,
    gradientEnd: '#00A79A',

    // Missing properties
    secondary: common.accent,
    secondaryLight: 'rgba(255, 255, 255, 0.6)',
    textLight: '#94A3B8',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    surfaceSecondary: '#1E293B',
    glassSurface: 'rgba(30, 41, 59, 0.8)',
    glowPink: '#FF4081',
    glassText: '#EAF6F6',
    glowTeal: common.primary,
};

export type ThemeColors = typeof light;

/**
 * Default theme (use Light as primary for "viral India" look).
 * Switch to dark based on user/system preference later.
 */
export const colors: ThemeColors = light;

/**
 * Optional: expose both modes if you want runtime switching.
 */
export const themes = {
    light,
    dark,
};

// Keep "storeTheme" but align it with the SAME system
export const storeColors: ThemeColors = light;

// Main theme export (service booking shell)
export const mainTheme = colors;

// Store theme export (ecommerce shell)
export const storeTheme = storeColors;

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
};

export const borderRadius = {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
};

export const typography = {
    title: {
        fontSize: 28,
        fontWeight: '800' as const,
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: -0.2,
        fontFamily: Platform.select({
            ios: 'System',
            android: 'sans-serif-medium',
            default: 'System',
        }),
    },
    h1: {
        fontSize: 22,
        fontWeight: '700' as const,
        lineHeight: 28,
    },
    h2: {
        fontSize: 18,
        fontWeight: '700' as const,
        lineHeight: 24,
    },
    h3: {
        fontSize: 16,
        fontWeight: '700' as const,
        lineHeight: 24,
    },
    body: {
        fontSize: 16,
        fontWeight: '500' as const,
        lineHeight: 22,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
    },
    button: {
        fontSize: 16,
        fontWeight: '700' as const,
        lineHeight: 20,
    },
};

const createShadow = (config: {
    boxShadow: string;
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}): ViewStyle => {
    if (Platform.OS === 'web') {
        return { boxShadow: config.boxShadow } as ViewStyle;
    }

    return {
        shadowColor: config.shadowColor,
        shadowOffset: config.shadowOffset,
        shadowOpacity: config.shadowOpacity,
        shadowRadius: config.shadowRadius,
        elevation: config.elevation,
    };
};

export const shadows = {
    sm: createShadow({
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    }),
    md: createShadow({
        boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
    }),
    lg: createShadow({
        boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.14)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 6,
    }),
};

export default {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
};

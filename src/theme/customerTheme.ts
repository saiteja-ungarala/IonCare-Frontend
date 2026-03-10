// Customer-specific theme configuration
// Isolated from global theme to ensure role-specific branding stability

import { ThemeColors } from './theme';

export const customerColors: ThemeColors = {
    mode: 'light', // Force light mode for "Pure" look

    // Surfaces
    background: '#F9FAFB', // Soft White
    backgroundAlt: '#F3F4F6',
    surface: '#FFFFFF',
    surface2: '#F9FAFB',
    surface3: '#F3F4F6',

    // Text
    text: '#111827',        // Charcoal Gray
    textSecondary: '#6B7280', // Slate Gray
    textMuted: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    textLight: '#9CA3AF',

    // Borders & separators
    border: '#E5E7EB',       // Cool Gray
    borderStrong: '#D1D5DB',

    // Icons
    icon: '#00B8D9',         // Primary (Aqua)
    iconMuted: '#9CA3AF',    // Icon Inactive

    // Interactive
    primary: '#00B8D9',        // Aqua Blue (Brand)
    primaryLight: '#E0F7FA',   // Very light aqua tint
    primaryDark: '#007C91',    // Deep Teal (Accents)
    primaryPressed: '#00A0BE',

    accent: '#FF7043',         // Sunset Orange (Deals/Urgency)
    accentPressed: '#E64A19',

    // Secondary
    secondary: '#38BDF8',      // Sky Blue (Secondary accents)
    secondaryLight: '#E0F2FE',

    // Status colors
    success: '#A7F3D0', // Mint Green
    warning: '#FF7043', // Sunset Orange
    error: '#EF4444',
    info: '#38BDF8',    // Sky Blue

    // Feedback surfaces
    successBg: 'rgba(167, 243, 208, 0.2)',
    warningBg: 'rgba(255, 112, 67, 0.15)',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    infoBg: 'rgba(56, 189, 248, 0.1)',

    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#007C91',   // Deep Teal
    tabBarInactive: '#9CA3AF',
    tabBarBorder: '#E5E7EB',

    // Gradients
    gradientStart: '#00B8D9',
    gradientEnd: '#007C91',

    // Missing properties required by ThemeColors interface
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    surfaceSecondary: '#F3F4F6',
    glassSurface: 'rgba(255, 255, 255, 0.8)',
    glowPink: '#FF7043',
    glassText: '#111827',
    glowTeal: '#00B8D9',
};

// Extended customer-specific design tokens (beyond ThemeColors)
export const customerDesign = {
    gradient1: ['#00B8D9', '#007C91'] as readonly string[],
    gradient2: ['#00B8D9', '#38BDF8'] as readonly string[],
    gradientWarm: ['#FF7043', '#FFB74D'] as readonly string[],
    cardShadowColor: 'rgba(0, 184, 217, 0.10)',
    cardShadow: {
        shadowColor: 'rgba(0, 184, 217, 0.18)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
};

export default {
    colors: customerColors,
    design: customerDesign,
};

/**
 * PeriSense Design System
 * Centralized theming for consistent UI across the app
 */

export const colors = {
    // Primary brand colors
    primary: '#007AFF',
    primaryDark: '#0056b3',
    secondary: '#00CEC9',

    // Accent colors
    accent: '#6f42c1',

    // Status colors
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',

    // Background colors
    background: {
        primary: '#F9FAFB',
        secondary: '#EAF0F6',
        dark: '#1B3A57',
        card: 'rgba(20, 20, 20, 0.45)',
        glass: 'rgba(255, 255, 255, 0.1)',
    },

    // Text colors
    text: {
        primary: '#DFF9FB',
        secondary: '#A4B0BE',
        muted: '#CED6E0',
        dark: '#333333',
        light: '#ffffff',
    },

    // Border colors
    border: {
        light: '#ccc',
        primary: '#007AFF',
        secondary: '#00CEC9',
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 6,
    md: 10,
    lg: 15,
    xl: 20,
    round: 30,
    full: 9999,
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700',
    },
    h2: {
        fontSize: 24,
        fontWeight: '600',
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
    },
    button: {
        fontSize: 16,
        fontWeight: 'bold',
    },
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
};

// Export all as default theme object
const theme = {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
};

export default theme;

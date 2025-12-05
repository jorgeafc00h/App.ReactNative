// Theme configuration matching Swift app design

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Colors from Swift app (matching the design)
export const colors = {
  // Primary colors (from Swift app)
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF9500',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Text colors
  text: {
    primary: '#000000',
    secondary: '#6D6D80',
    tertiary: '#8E8E93',
    inverse: '#FFFFFF',
    link: '#007AFF',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#E5E5EA',
    modal: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Surface colors
  surface: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Border colors
  border: {
    light: '#E5E5EA',
    medium: '#C7C7CC',
    dark: '#8E8E93',
  },
  
  // Tab bar colors (matching Swift app)
  tabBar: {
    background: '#F2F2F7',
    active: '#007AFF',
    inactive: '#8E8E93',
    border: '#C7C7CC',
  },
  
  // Navigation colors
  navigation: {
    background: '#F2F2F7',
    title: '#000000',
    button: '#007AFF',
  },
  
  // Invoice status colors (matching Swift implementation)
  invoiceStatus: {
    nueva: '#FF9500',      // Orange
    sincronizando: '#007AFF', // Blue
    completada: '#34C759',   // Green
    anulada: '#FF3B30',      // Red
    modificada: '#8E8E93',   // Gray
  },
  
  // Company environment colors
  environment: {
    production: '#34C759',   // Green
    development: '#FF9500',  // Orange
  },
  
  // Certificate status colors
  certificate: {
    valid: '#34C759',        // Green
    expired: '#FF3B30',      // Red
    expiring: '#FF9500',     // Orange
  },
  
  // Dark theme colors (for future dark mode support)
  dark: {
    background: {
      primary: '#000000',
      secondary: '#1C1C1E',
      tertiary: '#2C2C2E',
      modal: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#AEAEB2',
      tertiary: '#8E8E93',
      inverse: '#000000',
      link: '#0A84FF',
    },
    surface: {
      primary: '#1C1C1E',
      secondary: '#2C2C2E',
      elevated: '#3A3A3C',
      overlay: 'rgba(255, 255, 255, 0.1)',
    },
    border: {
      light: '#38383A',
      medium: '#48484A',
      dark: '#636366',
    },
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography system (matching Swift app font styles)
export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  
  // Labels and captions
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  
  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  
  // Input text
  input: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // Navigation title
  navTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  
  // Tab bar text
  tabLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 12,
    letterSpacing: 0.1,
  },
};

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadow system (iOS-style shadows)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Layout dimensions
export const layout = {
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  header: {
    height: 44,
  },
  tabBar: {
    height: 83, // 49 + safe area
  },
  statusBar: {
    height: 20, // Default, actual height from StatusBar API
  },
  safeArea: {
    top: 44,
    bottom: 34,
  },
  button: {
    height: 44,
    minWidth: 44,
  },
  input: {
    height: 44,
  },
  listItem: {
    minHeight: 44,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
};

// Animation timings
export const animation = {
  fast: 150,
  medium: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Z-index system
export const zIndex = {
  behind: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
};

// Default theme object
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  layout,
  animation,
  zIndex,
  isDark: false,
};

// Dark theme object
export const darkTheme = {
  ...theme,
  colors: {
    ...colors,
    text: colors.dark.text,
    background: colors.dark.background,
    surface: colors.dark.surface,
    border: colors.dark.border,
  },
  isDark: true,
};

// Theme type
export type Theme = typeof theme;

// Theme context default value
export const defaultThemeContext = {
  theme,
  isDark: false,
  toggleTheme: () => {},
  setTheme: (_: 'light' | 'dark' | 'system') => {},
};

export default theme;
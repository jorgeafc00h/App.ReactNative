// Theme hook for accessing theme in components

import { useColorScheme } from 'react-native';
import { useAppSelector } from '../store';
import { selectCurrentTheme, selectIsDarkTheme } from '../store/selectors/appSelectors';
import { theme, darkTheme, Theme } from '../config/theme';

export const useTheme = (): {
  theme: Theme;
  isDark: boolean;
  colors: Theme['colors'];
  spacing: Theme['spacing'];
  typography: Theme['typography'];
  shadows: Theme['shadows'];
} => {
  const systemColorScheme = useColorScheme();
  const currentTheme = useAppSelector(selectCurrentTheme);
  
  // Determine the effective theme
  let effectiveTheme: 'light' | 'dark';
  
  if (currentTheme === 'system') {
    effectiveTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    effectiveTheme = currentTheme;
  }
  
  const isDark = effectiveTheme === 'dark';
  const selectedTheme = isDark ? darkTheme : theme;
  
  return {
    theme: selectedTheme,
    isDark,
    colors: selectedTheme.colors,
    spacing: selectedTheme.spacing,
    typography: selectedTheme.typography,
    shadows: selectedTheme.shadows,
  };
};
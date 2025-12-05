// Button component with consistent styling

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
      default:
        baseStyle.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push({
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        });
        break;
      case 'secondary':
        baseStyle.push({
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.secondary,
        });
        break;
      case 'outline':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary,
          borderWidth: 1,
        });
        break;
      case 'ghost':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        });
        break;
      case 'danger':
        baseStyle.push({
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
        });
        break;
    }

    // State styles
    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }

    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }

    return [...baseStyle, style].filter(Boolean) as ViewStyle[];
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.buttonText];

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push({ fontSize: 14, lineHeight: 18 });
        break;
      case 'large':
        baseStyle.push({ fontSize: 18, lineHeight: 24 });
        break;
      default:
        baseStyle.push({ fontSize: 16, lineHeight: 22 });
    }

    // Variant text colors
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        baseStyle.push({ color: theme.colors.text.inverse });
        break;
      case 'outline':
        baseStyle.push({ color: theme.colors.primary });
        break;
      case 'ghost':
        baseStyle.push({ color: theme.colors.primary });
        break;
    }

    // Disabled text color
    if (disabled || loading) {
      baseStyle.push({ color: theme.colors.text.tertiary });
    }

    return [...baseStyle, textStyle].filter(Boolean) as TextStyle[];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.text.inverse}
            style={styles.loadingIndicator}
          />
          <Text style={getTextStyle()}>{title}</Text>
        </>
      );
    }

    if (icon) {
      return (
        <>
          {iconPosition === 'left' && icon}
          <Text style={getTextStyle()}>{title}</Text>
          {iconPosition === 'right' && icon}
        </>
      );
    }

    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 0,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});
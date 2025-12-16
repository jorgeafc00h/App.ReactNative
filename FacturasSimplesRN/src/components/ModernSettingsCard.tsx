import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface ModernSettingsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconColor: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  hasCustomContent?: boolean;
  customContent?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const ModernSettingsCard: React.FC<ModernSettingsCardProps> = ({
  icon,
  title,
  subtitle,
  iconColor,
  hasToggle = false,
  toggleValue = false,
  onToggleChange,
  hasCustomContent = false,
  customContent,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const CardContent = () => (
    <View style={styles.cardContainer}>
      {/* Icon with gradient background */}
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}30` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {subtitle}
          </Text>
          {hasCustomContent && customContent}
        </View>
      </View>

      {/* Toggle or Chevron */}
      <View style={styles.actionContainer}>
        {hasToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ 
              false: theme.colors.border.medium, 
              true: `${iconColor}50` 
            }}
            thumbColor={toggleValue ? iconColor : theme.colors.text.tertiary}
            ios_backgroundColor={theme.colors.border.medium}
          />
        ) : (
          !disabled && (
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={theme.colors.text.secondary} 
            />
          )
        )}
      </View>
    </View>
  );

  if (hasToggle || disabled) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface.primary }]}>
        <CardContent />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <CardContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
  },
});

export default ModernSettingsCard;
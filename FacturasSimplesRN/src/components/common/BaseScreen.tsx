// Base screen component with consistent layout and styling

import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface BaseScreenProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollable?: boolean;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const BaseScreen: React.FC<BaseScreenProps> = ({
  children,
  loading = false,
  error = null,
  onRefresh,
  refreshing = false,
  scrollable = true,
  backgroundColor,
  statusBarStyle = 'auto',
  safeAreaEdges = ['top', 'bottom'],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
  const { theme, isDark } = useTheme();
  
  const backgroundStyle = {
    backgroundColor: backgroundColor || theme.colors.background.primary,
  };

  const content = scrollable ? (
    <ScrollView
      style={[styles.scrollView, backgroundStyle]}
      contentContainerStyle={[
        styles.scrollContent,
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, backgroundStyle, style]}>
      {children}
    </View>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView
        edges={safeAreaEdges}
        style={[styles.safeArea, backgroundStyle]}
      >
        <StatusBar style={statusBarStyle} backgroundColor={backgroundStyle.backgroundColor} />
        {content}
        {loading && <LoadingSpinner />}
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
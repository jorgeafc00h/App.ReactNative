// Main app component with initialization and routing

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeApp } from '../store/slices/appSlice';
import { fetchCompanies } from '../store/slices/companySlice';
import { syncCatalogs } from '../store/slices/catalogSlice';
import { selectIsAppInitialized, selectIsOnline } from '../store/selectors/appSelectors';
import { selectIsAuthenticated, selectIsGuestMode } from '../store/selectors/authSelectors';
import { LoadingSpinner } from './common/LoadingSpinner';
import { AppNavigator } from '../navigation/AppNavigator';
import { WelcomeContainer } from '../screens/auth/WelcomeContainer';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

export const MainApp: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const isInitialized = useAppSelector(selectIsAppInitialized);
  const isOnline = useAppSelector(selectIsOnline);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isGuestMode = useAppSelector(selectIsGuestMode);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Initialize the app
    dispatch(initializeApp());
    
    // Check if user has seen onboarding
    checkOnboardingStatus();
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && isOnline) {
      // Sync catalogs on app start
      dispatch(syncCatalogs({}));
      
      // Load companies if authenticated
      if (isAuthenticated) {
        dispatch(fetchCompanies({}));
      }
    }
  }, [isInitialized, isOnline, isAuthenticated, dispatch]);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('@has_seen_onboarding');
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      console.log('MainApp: handleOnboardingComplete called');
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
      setHasSeenOnboarding(true);
      console.log('MainApp: Onboarding completion saved successfully');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!isInitialized || hasSeenOnboarding === null) {
    return <LoadingSpinner text="Initializing app..." />;
  }

  // Show onboarding if user hasn't seen it (regardless of auth status)
  if (!hasSeenOnboarding) {
    console.log('MainApp: Rendering OnboardingScreen with onComplete:', typeof handleOnboardingComplete);
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show welcome screen if user has seen onboarding but is not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    return <WelcomeContainer />;
  }

  // Show the main app with tab navigation (for both authenticated and guest users)
  return <AppNavigator />;
};
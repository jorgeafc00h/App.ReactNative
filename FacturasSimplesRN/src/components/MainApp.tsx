// Main app component with initialization and routing

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeApp } from '../store/slices/appSlice';
import { initializeDefaultCompany } from '../store/slices/companySlice';
import { loadCatalogsIntelligently } from '../store/slices/catalogSlice';
import { selectIsAppInitialized, selectIsOnline } from '../store/selectors/appSelectors';
import { selectIsAuthenticated, selectIsGuestMode } from '../store/selectors/authSelectors';
import { setGuestMode } from '../store/slices/authSlice';
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
  const { companies, currentCompany } = useAppSelector(state => state.companies);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Initialize the app without clearing persisted data
    console.log('MainApp: Initializing app with persisted data...');
    dispatch(initializeApp());
    
    // Check if user has seen onboarding
    checkOnboardingStatus();
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && isOnline) {
      // Load catalogs intelligently (with caching) on app start with error handling
      dispatch(loadCatalogsIntelligently({}))
        .unwrap()
        .catch((error) => {
          console.warn('MainApp: Failed to load catalogs on startup:', error);
          // Don't block app startup for catalog sync failures
        });
    }
  }, [isInitialized, isOnline, dispatch]);

  // Handle company loading and default selection when app is ready and persisted state is loaded
  useEffect(() => {
    if (isInitialized && (isAuthenticated || isGuestMode)) {
      console.log('MainApp: Checking if default company selection needed...', {
        companiesCount: companies.length,
        hasCurrentCompany: !!currentCompany,
        currentCompanyId: currentCompany?.id
      });
      // Initialize default company selection if companies exist but no current company selected
      if (companies.length > 0 && !currentCompany) {
        console.log('MainApp: Initializing default company selection...');
        dispatch(initializeDefaultCompany());
      }
    }
  }, [isInitialized, isAuthenticated, isGuestMode, companies.length, currentCompany, dispatch]);

  // Auto-complete onboarding if companies exist but onboarding flag not set
  useEffect(() => {
    if (!hasSeenOnboarding && companies.length > 0) {
      console.log('MainApp: Companies exist, auto-completing onboarding');
      handleOnboardingComplete();
    }
  }, [hasSeenOnboarding, companies.length]);

  // Handle data inconsistency - auto-enable guest mode if onboarding completed but not authenticated
  useEffect(() => {
    const hasCompletedOnboardingButNotAuthenticatedOrGuest = hasSeenOnboarding && !isAuthenticated && !isGuestMode;
    if (hasCompletedOnboardingButNotAuthenticatedOrGuest) {
      console.log('MainApp: Data inconsistency detected - onboarding completed but not authenticated/guest');
      console.log('MainApp: This may indicate a persistence issue or auth state loss');
      console.log('MainApp: Auto-enabling guest mode to allow access to main app');
      console.log('MainApp: Enabling guest mode for data recovery');
      dispatch(setGuestMode(true));
    }
  }, [hasSeenOnboarding, isAuthenticated, isGuestMode, dispatch]);

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

  // Show onboarding if user hasn't seen it AND no companies exist
  // If companies exist, user has completed setup even if onboarding flag isn't set
  const shouldShowOnboarding = !hasSeenOnboarding && companies.length === 0;
  
  // Handle edge case: user completed onboarding but lost auth state (data recovery)
  // This is now handled by useEffect above to avoid setState during render
  const hasCompletedOnboardingButNotAuthenticatedOrGuest = hasSeenOnboarding && !isAuthenticated && !isGuestMode;
  
  if (hasCompletedOnboardingButNotAuthenticatedOrGuest) {
    return <LoadingSpinner text="Recovering app state..." />;
  }
  
  console.log('MainApp: Navigation decision - hasSeenOnboarding:', hasSeenOnboarding, 'companies:', companies.length, 'currentCompany:', currentCompany?.nombreComercial);
  
  if (shouldShowOnboarding) {
    console.log('MainApp: Showing onboarding - no companies exist');
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  

  if (!hasSeenOnboarding && companies.length > 0) {
    return <LoadingSpinner text="Initializing..." />;
  }

  // Show welcome screen if user has seen onboarding but is not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    console.log('MainApp: Showing welcome container - not authenticated and not guest');
    return <WelcomeContainer />;
  }

  // Show the main app with tab navigation (for both authenticated and guest users)
  console.log('MainApp: Showing main app navigator - isAuthenticated:', isAuthenticated, 'isGuestMode:', isGuestMode);
  return <AppNavigator />;
};
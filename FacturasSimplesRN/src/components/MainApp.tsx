// Main app component with initialization and routing

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeApp } from '../store/slices/appSlice';
import { initializeDefaultCompany } from '../store/slices/companySlice';
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
      // Sync catalogs on app start with error handling
      dispatch(syncCatalogs({}))
        .unwrap()
        .catch((error) => {
          console.warn('MainApp: Failed to sync catalogs on startup:', error);
          // Don't block app startup for catalog sync failures
        });
    }
  }, [isInitialized, isOnline, dispatch]);

  // Handle company loading and default selection when app is ready and persisted state is loaded
  useEffect(() => {
    if (isInitialized && (isAuthenticated || isGuestMode)) {
      console.log('MainApp: Checking if default company selection needed...', {
        companiesCount: companies.length,
        hasCurrentCompany: !!currentCompany
      });
      // Initialize default company selection if companies exist but no current company selected
      if (companies.length > 0 && !currentCompany) {
        console.log('MainApp: Initializing default company selection...');
        dispatch(initializeDefaultCompany());
      }
    }
  }, [isInitialized, isAuthenticated, isGuestMode, companies.length, dispatch]);

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
  
  // Handle edge case: user completed onboarding but companies got lost (data recovery)
  const hasCompletedOnboardingButNoCompanies = hasSeenOnboarding && companies.length === 0;
  
  if (hasCompletedOnboardingButNoCompanies) {
    console.log('MainApp: Data inconsistency detected - onboarding completed but no companies found');
    console.log('MainApp: This may indicate a persistence issue or data loss');
    console.log('MainApp: Proceeding to main app - user can create companies from "Administracion de empresas"');
  }
  
  console.log('MainApp: Navigation decision - hasSeenOnboarding:', hasSeenOnboarding, 'companies:', companies.length, 'currentCompany:', currentCompany?.nombreComercial);
  
  if (shouldShowOnboarding) {
    console.log('MainApp: Showing onboarding - no companies exist');
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  
  // If companies exist but onboarding flag not set, auto-complete onboarding
  if (!hasSeenOnboarding && companies.length > 0) {
    console.log('MainApp: Companies exist, auto-completing onboarding');
    handleOnboardingComplete();
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
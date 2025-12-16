// Main app component with initialization and routing

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeApp } from '../store/slices/appSlice';
import { fetchCompanies, resetCompanies } from '../store/slices/companySlice';
import { syncCatalogs } from '../store/slices/catalogSlice';
import { resetCustomers } from '../store/slices/customerSlice';
import { resetInvoices } from '../store/slices/invoiceSlice';
import { resetProducts } from '../store/slices/productSlice';
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
    // Clear any persisted sample data for clean startup
    const clearSampleData = async () => {
      try {
        console.log('MainApp: Clearing any persisted sample data...');
        await AsyncStorage.multiRemove([
          'persist:companies',
          'persist:customers', 
          'persist:invoices'
        ]);
        console.log('MainApp: Successfully cleared persisted sample data');
      } catch (error) {
        console.warn('MainApp: Failed to clear persisted data:', error);
      }
    };
    
    clearSampleData().then(() => {
      // Reset all data slices to ensure clean state
      console.log('MainApp: Resetting Redux state for clean startup...');
      dispatch(resetCompanies());
      dispatch(resetCustomers());
      dispatch(resetInvoices());
      dispatch(resetProducts());
      
      // Initialize the app after clearing old data
      dispatch(initializeApp());
      
      // Check if user has seen onboarding
      checkOnboardingStatus();
    });
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
      
      // Load companies if authenticated with error handling
      if (isAuthenticated) {
        dispatch(fetchCompanies({}))
          .unwrap()
          .catch((error) => {
            console.warn('MainApp: Failed to fetch companies on startup:', error);
            // Don't block app startup for company fetch failures
          });
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
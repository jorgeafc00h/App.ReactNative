import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { WelcomeContainer } from '../screens/auth/WelcomeContainer';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { useAppSelector } from '../store';
import { selectShouldShowMainApp } from '../store/selectors/authSelectors';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const shouldShowMainApp = useAppSelector(selectShouldShowMainApp);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMainApp ? (
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeContainer} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStack } from './MainStack';
import { WelcomeContainer } from '../screens/auth/WelcomeContainer';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAppSelector } from '../store';
import { selectShouldShowMainApp } from '../store/selectors/authSelectors';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const shouldShowMainApp = useAppSelector(selectShouldShowMainApp);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMainApp ? (
          <Stack.Screen name="Main" component={MainStack} />
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
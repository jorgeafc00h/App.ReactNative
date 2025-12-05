import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { WelcomeScreen } from './WelcomeScreen';
import { GoogleAuthService, GoogleAuthResult } from '../../services/auth/GoogleAuthService';
import { useAppDispatch } from '../../store';
import { setAuthenticatedUser, setGuestMode } from '../../store/slices/authSlice';

export const WelcomeContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { request, response, promptAsync } = GoogleAuthService.useGoogleAuth();

  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response.params.code);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    }
  }, [response]);

  const handleAuthSuccess = async (code: string) => {
    try {
      // Exchange code for access token
      const tokenData = await GoogleAuthService.exchangeCodeForToken(code);
      
      // Get user information
      const userInfo = await GoogleAuthService.getUserInfo(tokenData.access_token);
      
      // Update auth state
      dispatch(setAuthenticatedUser({
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
        },
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      }));

    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Failed to complete authentication. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!request) {
      Alert.alert('Error', 'Authentication not ready. Please wait and try again.');
      return;
    }

    try {
      await promptAsync();
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to start authentication. Please try again.');
    }
  };

  const handleContinueWithoutAccount = () => {
    dispatch(setGuestMode(true));
  };

  return (
    <WelcomeScreen 
      onGoogleSignIn={handleGoogleSignIn}
      onContinueWithoutAccount={handleContinueWithoutAccount}
    />
  );
};
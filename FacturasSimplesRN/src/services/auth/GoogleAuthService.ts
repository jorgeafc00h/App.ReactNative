import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth 2.0 configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUserInfo;
  accessToken?: string;
  error?: string;
}

export class GoogleAuthService {
  private static clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

  static useGoogleAuth() {
    const [request, response, promptAsync] = useAuthRequest(
      {
        clientId: this.clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: 'code',
        redirectUri: makeRedirectUri({
          scheme: 'com.anonymous.FacturasSimplesRN',
        }),
      },
      discovery
    );

    return {
      request,
      response,
      promptAsync,
    };
  }

  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
  }> {
    const tokenEndpoint = discovery.tokenEndpoint;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: makeRedirectUri({
          scheme: 'com.anonymous.FacturasSimplesRN',
        }),
      }).toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  static async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  static async signOut(accessToken: string): Promise<void> {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: accessToken,
        }).toString(),
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Don't throw error - local sign out should still work
    }
  }
}
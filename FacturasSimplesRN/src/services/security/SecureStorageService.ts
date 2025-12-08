// Secure Storage Service for sensitive data
// Handles encryption and storage of certificates, credentials, and sensitive user data

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

interface StoredCredentials {
  user: string;
  password: string;
  certificateKey?: string;
  invoiceNumber?: string;
}

interface SecureStorageOptions {
  accessControl?: Keychain.ACCESS_CONTROL;
  authenticationType?: Keychain.AUTHENTICATION_TYPE;
  accessGroup?: string;
  service?: string;
}

export class SecureStorageService {
  private static readonly ENCRYPTION_KEY = 'facturas-simples-key';
  private static readonly KEYCHAIN_SERVICE = 'com.kandangalabs.facturassimples';
  
  // Certificate-related keys
  private static readonly CERTIFICATE_PASSWORD_PREFIX = 'cert_password_';
  private static readonly COMPANY_CREDENTIALS_PREFIX = 'company_creds_';
  
  // User-related keys
  private static readonly AUTH_TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly SELECTED_COMPANY_KEY = 'selected_company';

  /**
   * Store certificate password securely in Keychain
   * Matches Swift's keychain storage for certificates
   */
  static async storeCertificatePassword(nit: string, encryptedPassword: string): Promise<void> {
    try {
      const key = `${this.CERTIFICATE_PASSWORD_PREFIX}${nit}`;
      
      await Keychain.setInternetCredentials(
        key,
        nit,
        encryptedPassword,
        {
          accessControl: Keychain.ACCESS_CONTROL.WHEN_UNLOCKED,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          service: this.KEYCHAIN_SERVICE,
        }
      );
      
      console.log('✅ SecureStorage: Certificate password stored for NIT:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store certificate password:', error);
      throw new Error('Failed to store certificate password securely');
    }
  }

  /**
   * Get certificate password from Keychain
   */
  static async getCertificatePassword(nit: string): Promise<string | null> {
    try {
      const key = `${this.CERTIFICATE_PASSWORD_PREFIX}${nit}`;
      
      const credentials = await Keychain.getInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      
      if (credentials && credentials.password) {
        console.log('✅ SecureStorage: Certificate password retrieved for NIT:', nit);
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get certificate password:', error);
      return null;
    }
  }

  /**
   * Remove certificate password from Keychain
   */
  static async removeCertificatePassword(nit: string): Promise<void> {
    try {
      const key = `${this.CERTIFICATE_PASSWORD_PREFIX}${nit}`;
      
      await Keychain.resetInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      
      console.log('✅ SecureStorage: Certificate password removed for NIT:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to remove certificate password:', error);
      throw error;
    }
  }

  /**
   * Store company credentials securely
   * For government API access (NIT/password)
   */
  static async storeCredentials(nit: string, credentials: StoredCredentials): Promise<void> {
    try {
      const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
      const credentialsJson = JSON.stringify(credentials);
      
      await Keychain.setInternetCredentials(
        key,
        nit,
        credentialsJson,
        {
          accessControl: Keychain.ACCESS_CONTROL.WHEN_UNLOCKED,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          service: this.KEYCHAIN_SERVICE,
        }
      );
      
      console.log('✅ SecureStorage: Credentials stored for NIT:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store credentials:', error);
      throw new Error('Failed to store credentials securely');
    }
  }

  /**
   * Get company credentials from Keychain
   */
  static async getCredentials(nit: string): Promise<StoredCredentials | null> {
    try {
      const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
      
      const result = await Keychain.getInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      
      if (result && result.password) {
        const credentials = JSON.parse(result.password) as StoredCredentials;
        console.log('✅ SecureStorage: Credentials retrieved for NIT:', nit);
        return credentials;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get credentials:', error);
      return null;
    }
  }

  /**
   * Remove company credentials from Keychain
   */
  static async removeCredentials(nit: string): Promise<void> {
    try {
      const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
      
      await Keychain.resetInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      
      console.log('✅ SecureStorage: Credentials removed for NIT:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to remove credentials:', error);
      throw error;
    }
  }

  /**
   * Store authentication token securely
   */
  static async storeAuthToken(token: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(
        this.AUTH_TOKEN_KEY,
        token,
        {
          accessControl: Keychain.ACCESS_CONTROL.WHEN_UNLOCKED,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          service: this.KEYCHAIN_SERVICE,
        }
      );
      
      console.log('✅ SecureStorage: Auth token stored');
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store auth token:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from Keychain
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: this.KEYCHAIN_SERVICE,
      });
      
      if (credentials && credentials.username === this.AUTH_TOKEN_KEY) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Remove authentication token from Keychain
   */
  static async removeAuthToken(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: this.KEYCHAIN_SERVICE,
      });
      
      console.log('✅ SecureStorage: Auth token removed');
    } catch (error) {
      console.error('❌ SecureStorage: Failed to remove auth token:', error);
      throw error;
    }
  }

  /**
   * Store refresh token securely
   */
  static async storeRefreshToken(token: string): Promise<void> {
    try {
      // Encrypt refresh token before storing
      const encrypted = this.encrypt(token);
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, encrypted);
      
      console.log('✅ SecureStorage: Refresh token stored');
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      const encrypted = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (encrypted) {
        return this.decrypt(encrypted);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Remove refresh token
   */
  static async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY);
      console.log('✅ SecureStorage: Refresh token removed');
    } catch (error) {
      console.error('❌ SecureStorage: Failed to remove refresh token:', error);
      throw error;
    }
  }

  /**
   * Store selected company ID
   */
  static async setCurrentCompanyNit(nit: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SELECTED_COMPANY_KEY, nit);
      console.log('✅ SecureStorage: Current company set:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to set current company:', error);
      throw error;
    }
  }

  /**
   * Get selected company ID
   */
  static async getCurrentCompanyNit(): Promise<string | null> {
    try {
      const nit = await AsyncStorage.getItem(this.SELECTED_COMPANY_KEY);
      return nit;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get current company:', error);
      return null;
    }
  }

  /**
   * Clear all stored data for a company
   */
  static async clearCompanyData(nit: string): Promise<void> {
    try {
      await Promise.all([
        this.removeCertificatePassword(nit),
        this.removeCredentials(nit),
      ]);
      
      console.log('✅ SecureStorage: All company data cleared for NIT:', nit);
    } catch (error) {
      console.error('❌ SecureStorage: Failed to clear company data:', error);
      throw error;
    }
  }

  /**
   * Clear all stored data (logout)
   */
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.removeAuthToken(),
        this.removeRefreshToken(),
        AsyncStorage.removeItem(this.SELECTED_COMPANY_KEY),
      ]);
      
      console.log('✅ SecureStorage: All data cleared');
    } catch (error) {
      console.error('❌ SecureStorage: Failed to clear all data:', error);
      throw error;
    }
  }

  /**
   * Check if Keychain is available and working
   */
  static async isKeychainAvailable(): Promise<boolean> {
    try {
      const testKey = 'test_keychain_availability';
      const testValue = 'test_value';
      
      // Try to store and retrieve a test value
      await Keychain.setGenericPassword(testKey, testValue, {
        service: `${this.KEYCHAIN_SERVICE}_test`,
      });
      
      const result = await Keychain.getGenericPassword({
        service: `${this.KEYCHAIN_SERVICE}_test`,
      });
      
      await Keychain.resetGenericPassword({
        service: `${this.KEYCHAIN_SERVICE}_test`,
      });
      
      return result.username === testKey && result.password === testValue;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Keychain not available:', error);
      return false;
    }
  }

  /**
   * Get Keychain security level information
   */
  static async getSecurityLevel(): Promise<Keychain.SECURITY_LEVEL | null> {
    try {
      return await Keychain.getSecurityLevel();
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get security level:', error);
      return null;
    }
  }

  // Private encryption/decryption methods
  private static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
  }

  private static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

export default SecureStorageService;
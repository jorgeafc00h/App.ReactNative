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
      
      // First try Keychain with fallback to AsyncStorage
      try {
        await Keychain.setInternetCredentials(
          key,
          nit,
          encryptedPassword,
          {
            accessControl: Keychain.ACCESS_CONTROL.WHEN_UNLOCKED,
            service: this.KEYCHAIN_SERVICE,
          }
        );
        console.log('✅ SecureStorage: Certificate password stored in Keychain for NIT:', nit);
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed, using AsyncStorage fallback:', keychainError);
        
        // Fallback to AsyncStorage with simple encoding (development/testing only)
        try {
          const encodedForStorage = this.simpleEncode(encryptedPassword);
          await AsyncStorage.setItem(key, encodedForStorage);
          console.warn('⚠️ SecureStorage: Using AsyncStorage fallback - less secure than Keychain');
          console.log('✅ SecureStorage: Certificate password stored in AsyncStorage for NIT:', nit);
        } catch (storageError) {
          console.error('❌ SecureStorage: AsyncStorage fallback failed:', storageError);
          throw new Error('All storage methods failed');
        }
      }
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
      
      // First try Keychain
      try {
        const credentials = await Keychain.getInternetCredentials(key, {
          service: this.KEYCHAIN_SERVICE,
        });
        
        if (credentials && credentials.password) {
          console.log('✅ SecureStorage: Certificate password retrieved from Keychain for NIT:', nit);
          return credentials.password;
        }
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed, trying AsyncStorage fallback:', keychainError);
      }
      
      // Fallback to AsyncStorage
      try {
        const encodedPassword = await AsyncStorage.getItem(key);
        if (encodedPassword) {
          const decodedPassword = this.simpleDecode(encodedPassword);
          console.log('✅ SecureStorage: Certificate password retrieved from AsyncStorage for NIT:', nit);
          return decodedPassword;
        }
      } catch (storageError) {
        console.warn('⚠️ SecureStorage: AsyncStorage fallback failed:', storageError);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get certificate password:', error);
      return null;
    }
  }

  /**
   * Remove certificate password from all storage locations
   * Cleans up from Keychain and AsyncStorage fallbacks
   */
  static async removeCertificatePassword(nit: string): Promise<void> {
    const key = `${this.CERTIFICATE_PASSWORD_PREFIX}${nit}`;
    const errors: Error[] = [];
    
    // Try to remove from Keychain
    try {
      await Keychain.resetInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      console.log('✅ SecureStorage: Certificate password removed from Keychain for NIT:', nit);
    } catch (keychainError) {
      console.warn('⚠️ SecureStorage: Failed to remove certificate password from Keychain (may not exist):', keychainError);
      errors.push(keychainError as Error);
    }
    
    // Try to remove from AsyncStorage fallback
    try {
      await AsyncStorage.removeItem(key);
      console.log('✅ SecureStorage: Certificate password removed from AsyncStorage for NIT:', nit);
    } catch (storageError) {
      console.warn('⚠️ SecureStorage: Failed to remove certificate password from AsyncStorage:', storageError);
      errors.push(storageError as Error);
    }
    
    // Only throw error if all removal attempts failed
    if (errors.length === 2) {
      console.error('❌ SecureStorage: Failed to remove certificate password from all storage locations:', errors);
      throw new Error('Failed to remove certificate password from all storage locations');
    }
    
    console.log('✅ SecureStorage: Certificate password cleanup completed for NIT:', nit);
  }

  /**
   * Store company credentials securely
   * For government API access (NIT/password)
   * Uses three-tier fallback: Keychain → AsyncStorage+AES → AsyncStorage+simple encoding
   */
  static async storeCredentials(nit: string, credentials: StoredCredentials): Promise<void> {
    try {
      const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
      const credentialsJson = JSON.stringify(credentials);
      
      // First try Keychain with fallback to AsyncStorage
      try {
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
        console.log('✅ SecureStorage: Credentials stored in Keychain for NIT:', nit);
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed for credentials, using AsyncStorage with AES fallback:', keychainError);
        
        // Fallback 1: AsyncStorage with AES encryption
        try {
          const encryptedForStorage = this.encrypt(credentialsJson);
          await AsyncStorage.setItem(key, encryptedForStorage);
          console.warn('⚠️ SecureStorage: Using AsyncStorage+AES fallback for credentials - less secure than Keychain');
          console.log('✅ SecureStorage: Credentials stored with AES encryption for NIT:', nit);
        } catch (aesError) {
          console.warn('⚠️ SecureStorage: AES encryption failed, using simple encoding fallback:', aesError);
          
          // Fallback 2: AsyncStorage with simple encoding (development/testing only)
          try {
            const encodedForStorage = this.simpleEncode(credentialsJson);
            await AsyncStorage.setItem(key + '_simple', encodedForStorage);
            console.warn('⚠️ SecureStorage: Using AsyncStorage+simple encoding fallback - development only!');
            console.log('✅ SecureStorage: Credentials stored with simple encoding for NIT:', nit);
          } catch (storageError) {
            console.error('❌ SecureStorage: All storage methods failed for credentials:', storageError);
            throw new Error('All storage methods failed for credentials');
          }
        }
      }
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store credentials:', error);
      throw new Error('Failed to store credentials securely');
    }
  }

  /**
   * Get company credentials from Keychain
   * Uses three-tier fallback: Keychain → AsyncStorage+AES → AsyncStorage+simple encoding
   */
  static async getCredentials(nit: string): Promise<StoredCredentials | null> {
    try {
      const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
      
      // First try Keychain
      try {
        const result = await Keychain.getInternetCredentials(key, {
          service: this.KEYCHAIN_SERVICE,
        });
        
        if (result && result.password) {
          const credentials = JSON.parse(result.password) as StoredCredentials;
          console.log('✅ SecureStorage: Credentials retrieved from Keychain for NIT:', nit);
          return credentials;
        }
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed for credentials, trying AsyncStorage with AES fallback:', keychainError);
      }
      
      // Fallback 1: AsyncStorage with AES encryption
      try {
        const encryptedCredentials = await AsyncStorage.getItem(key);
        if (encryptedCredentials) {
          const decryptedCredentials = this.decrypt(encryptedCredentials);
          const credentials = JSON.parse(decryptedCredentials) as StoredCredentials;
          console.log('✅ SecureStorage: Credentials retrieved from AsyncStorage+AES for NIT:', nit);
          return credentials;
        }
      } catch (aesError) {
        console.warn('⚠️ SecureStorage: AES decryption failed, trying simple encoding fallback:', aesError);
      }
      
      // Fallback 2: AsyncStorage with simple encoding
      try {
        const encodedCredentials = await AsyncStorage.getItem(key + '_simple');
        if (encodedCredentials) {
          const decodedCredentials = this.simpleDecode(encodedCredentials);
          const credentials = JSON.parse(decodedCredentials) as StoredCredentials;
          console.log('✅ SecureStorage: Credentials retrieved from AsyncStorage+simple encoding for NIT:', nit);
          return credentials;
        }
      } catch (storageError) {
        console.warn('⚠️ SecureStorage: Simple encoding fallback failed:', storageError);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get credentials:', error);
      return null;
    }
  }

  /**
   * Remove company credentials from all storage locations
   * Cleans up from Keychain, AsyncStorage+AES, and AsyncStorage+simple encoding
   */
  static async removeCredentials(nit: string): Promise<void> {
    const key = `${this.COMPANY_CREDENTIALS_PREFIX}${nit}`;
    const errors: Error[] = [];
    
    // Try to remove from Keychain
    try {
      await Keychain.resetInternetCredentials(key, {
        service: this.KEYCHAIN_SERVICE,
      });
      console.log('✅ SecureStorage: Credentials removed from Keychain for NIT:', nit);
    } catch (keychainError) {
      console.warn('⚠️ SecureStorage: Failed to remove from Keychain (may not exist):', keychainError);
      errors.push(keychainError as Error);
    }
    
    // Try to remove from AsyncStorage (AES)
    try {
      await AsyncStorage.removeItem(key);
      console.log('✅ SecureStorage: Credentials removed from AsyncStorage+AES for NIT:', nit);
    } catch (aesError) {
      console.warn('⚠️ SecureStorage: Failed to remove from AsyncStorage+AES:', aesError);
      errors.push(aesError as Error);
    }
    
    // Try to remove from AsyncStorage (simple encoding)
    try {
      await AsyncStorage.removeItem(key + '_simple');
      console.log('✅ SecureStorage: Credentials removed from AsyncStorage+simple for NIT:', nit);
    } catch (storageError) {
      console.warn('⚠️ SecureStorage: Failed to remove from AsyncStorage+simple:', storageError);
      errors.push(storageError as Error);
    }
    
    // Only throw error if all removal attempts failed
    if (errors.length === 3) {
      console.error('❌ SecureStorage: Failed to remove credentials from all storage locations:', errors);
      throw new Error('Failed to remove credentials from all storage locations');
    }
    
    console.log('✅ SecureStorage: Credentials cleanup completed for NIT:', nit);
  }

  /**
   * Store authentication token securely
   * Uses fallback strategy: Keychain → AsyncStorage+AES
   */
  static async storeAuthToken(token: string): Promise<void> {
    try {
      // First try Keychain
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
        console.log('✅ SecureStorage: Auth token stored in Keychain');
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed for auth token, using AsyncStorage+AES fallback:', keychainError);
        
        // Fallback: AsyncStorage with AES encryption
        try {
          const encryptedToken = this.encrypt(token);
          await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, encryptedToken);
          console.warn('⚠️ SecureStorage: Using AsyncStorage+AES fallback for auth token');
          console.log('✅ SecureStorage: Auth token stored with AES encryption');
        } catch (storageError) {
          console.error('❌ SecureStorage: AsyncStorage fallback failed for auth token:', storageError);
          throw new Error('All storage methods failed for auth token');
        }
      }
    } catch (error) {
      console.error('❌ SecureStorage: Failed to store auth token:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from Keychain
   * Uses fallback strategy: Keychain → AsyncStorage+AES
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      // First try Keychain
      try {
        const credentials = await Keychain.getGenericPassword({
          service: this.KEYCHAIN_SERVICE,
        });
        
        if (credentials && credentials.username === this.AUTH_TOKEN_KEY) {
          console.log('✅ SecureStorage: Auth token retrieved from Keychain');
          return credentials.password;
        }
      } catch (keychainError) {
        console.warn('⚠️ SecureStorage: Keychain failed for auth token, trying AsyncStorage+AES fallback:', keychainError);
      }
      
      // Fallback: AsyncStorage with AES encryption
      try {
        const encryptedToken = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
        if (encryptedToken) {
          const decryptedToken = this.decrypt(encryptedToken);
          console.log('✅ SecureStorage: Auth token retrieved from AsyncStorage+AES');
          return decryptedToken;
        }
      } catch (storageError) {
        console.warn('⚠️ SecureStorage: AsyncStorage fallback failed for auth token:', storageError);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Remove authentication token from all storage locations
   * Cleans up from Keychain and AsyncStorage+AES
   */
  static async removeAuthToken(): Promise<void> {
    const errors: Error[] = [];
    
    // Try to remove from Keychain
    try {
      await Keychain.resetGenericPassword({
        service: this.KEYCHAIN_SERVICE,
      });
      console.log('✅ SecureStorage: Auth token removed from Keychain');
    } catch (keychainError) {
      console.warn('⚠️ SecureStorage: Failed to remove auth token from Keychain (may not exist):', keychainError);
      errors.push(keychainError as Error);
    }
    
    // Try to remove from AsyncStorage
    try {
      await AsyncStorage.removeItem(this.AUTH_TOKEN_KEY);
      console.log('✅ SecureStorage: Auth token removed from AsyncStorage');
    } catch (storageError) {
      console.warn('⚠️ SecureStorage: Failed to remove auth token from AsyncStorage:', storageError);
      errors.push(storageError as Error);
    }
    
    // Only throw error if all removal attempts failed
    if (errors.length === 2) {
      console.error('❌ SecureStorage: Failed to remove auth token from all storage locations:', errors);
      throw new Error('Failed to remove auth token from all storage locations');
    }
    
    console.log('✅ SecureStorage: Auth token cleanup completed');
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
   * Performs a comprehensive check to avoid 'Cannot read property' errors
   */
  static async isKeychainAvailable(): Promise<boolean> {
    try {
      // First check if Keychain module is properly loaded
      if (!Keychain || typeof Keychain.setGenericPassword !== 'function') {
        console.warn('⚠️ SecureStorage: Keychain module not properly loaded');
        return false;
      }
      
      const testKey = 'test_keychain_availability';
      const testValue = 'test_value';
      const testService = `${this.KEYCHAIN_SERVICE}_test`;
      
      // Try to store and retrieve a test value with comprehensive error handling
      try {
        await Keychain.setGenericPassword(testKey, testValue, {
          service: testService,
        });
        
        const result = await Keychain.getGenericPassword({
          service: testService,
        });
        
        // Clean up test data
        try {
          await Keychain.resetGenericPassword({
            service: testService,
          });
        } catch (cleanupError) {
          console.warn('⚠️ SecureStorage: Failed to clean up test keychain data:', cleanupError);
        }
        
        // Verify the test was successful
        const isValid = result && 
                       typeof result === 'object' && 
                       result.username === testKey && 
                       result.password === testValue;
        
        if (isValid) {
          console.log('✅ SecureStorage: Keychain is available and working');
        } else {
          console.warn('⚠️ SecureStorage: Keychain test failed - invalid result:', result);
        }
        
        return isValid;
      } catch (keychainTestError) {
        console.warn('⚠️ SecureStorage: Keychain test operation failed:', keychainTestError);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ SecureStorage: Keychain availability check failed:', error);
      return false;
    }
  }

  /**
   * Get Keychain security level information
   */
  static async getSecurityLevel(): Promise<Keychain.SECURITY_LEVEL | null> {
    try {
      // Check if Keychain is available first
      if (!Keychain || typeof Keychain.getSecurityLevel !== 'function') {
        return null;
      }
      
      return await Keychain.getSecurityLevel();
    } catch (error) {
      console.warn('⚠️ SecureStorage: Failed to get security level:', error);
      return null;
    }
  }

  /**
   * Initialize and test the secure storage system
   * Should be called on app startup to verify storage capabilities
   */
  static async initializeAndTest(): Promise<{
    keychainAvailable: boolean;
    securityLevel: Keychain.SECURITY_LEVEL | null;
    fallbackRequired: boolean;
  }> {
    console.log('🔐 SecureStorage: Initializing and testing storage system...');
    
    try {
      const keychainAvailable = await this.isKeychainAvailable();
      const securityLevel = await this.getSecurityLevel();
      const fallbackRequired = !keychainAvailable;
      
      console.log('🔍 SecureStorage: System capabilities:', {
        keychainAvailable,
        securityLevel,
        fallbackRequired,
      });
      
      if (fallbackRequired) {
        console.warn('⚠️ SecureStorage: Keychain not available - will use AsyncStorage fallbacks');
        console.warn('⚠️ This may occur in development environments or on devices with keychain issues');
      } else {
        console.log('✅ SecureStorage: Keychain is available and working properly');
      }
      
      return {
        keychainAvailable,
        securityLevel,
        fallbackRequired,
      };
    } catch (error) {
      console.error('❌ SecureStorage: Failed to initialize and test storage system:', error);
      
      // Return safe defaults
      return {
        keychainAvailable: false,
        securityLevel: null,
        fallbackRequired: true,
      };
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

  // Simple encoding/decoding for fallback (development/testing only)
  // Note: This is not cryptographically secure, only for development
  private static simpleEncode(text: string): string {
    // Simple character shifting for development fallback
    return text.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) + 3)
    ).join('');
  }

  private static simpleDecode(encodedText: string): string {
    return encodedText.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) - 3)
    ).join('');
  }
}

export default SecureStorageService;
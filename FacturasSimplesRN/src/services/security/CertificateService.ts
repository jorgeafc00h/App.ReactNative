// Certificate Management Service
// Based on SwiftUI CertificateUpdateViewModel implementation

import { Platform } from 'react-native';
// import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
// import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import { InvoiceService } from '../api/InvoiceService';
import { SecureStorageService } from './SecureStorageService';
import { Company } from '../../types/company';

export interface CertificateUploadResult {
  success: boolean;
  message: string;
  certificateKey?: string;
}

export interface CertificateValidationResult {
  isValid: boolean;
  message: string;
}

export interface CertificateFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded
}

export class CertificateService {
  private invoiceService: InvoiceService;
  
  public getEnvironmentCode(): string {
    return this.invoiceService.getEnvironmentCode();
  }
  
  constructor(isProduction: boolean = false) {
    this.invoiceService = new InvoiceService(isProduction);
  }

  /**
   * Encrypt password using SHA512 (matches Swift Cryptographic.encrypt)
   * @param password Plain text password
   * @returns SHA512 hash
   */
  private encryptPassword(password: string): string {
    try {
      // Using CryptoJS to match Swift's SHA512 implementation
      const hash = CryptoJS.SHA512(password);
      return hash.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Error encrypting password:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  /**
   * Select certificate file from device
   * Matches Swift's DocumentPicker functionality
   */
  async selectCertificateFile(): Promise<CertificateFile | null> {
    try {
      console.log('📁 CertificateService: File picker not yet implemented');
      
      // TODO: Implement document picker when compatible version is available
      // For now, return null to allow app to start
      return null;
    } catch (error) {
      console.error('❌ Error selecting certificate file:', error);
      throw new Error(`Failed to select certificate file: ${error}`);
    }
  }

  /**
   * Upload certificate to government servers
   * Matches Swift's uploadAsync functionality
   */
  async uploadCertificate(
    certificateFile: CertificateFile,
    company: Company
  ): Promise<CertificateUploadResult> {
    try {
      console.log('📤 CertificateService: Uploading certificate for NIT:', company.nit);

      // Upload certificate using the invoice service
      await this.invoiceService.uploadCertificate(
        certificateFile.data,
        company.nit
      );

      console.log('✅ CertificateService: Certificate uploaded successfully');

      return {
        success: true,
        message: 'Certificado Actualizado!', // Matches Swift message
      };
    } catch (error) {
      console.error('❌ CertificateService: Certificate upload failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading certificate',
      };
    }
  }

  /**
   * Update certificate password
   * Matches Swift's updateCertCredentials functionality
   */
  async updateCertificatePassword(
    password: string,
    confirmPassword: string,
    company: Company
  ): Promise<CertificateValidationResult> {
    try {
      console.log('🔐 CertificateService: Updating certificate password');

      // Validate password match (matches Swift validation)
      if (password !== confirmPassword || password.length === 0 || confirmPassword.length === 0) {
        return {
          isValid: false,
          message: 'Passwords no coinciden', // Matches Swift message
        };
      }

      // Encrypt password using SHA512 (matches Swift implementation)
      const encryptedPassword = this.encryptPassword(password);

      // Validate certificate with government API
      const isValid = await this.invoiceService.validateCertificate(
        company.nit,
        encryptedPassword
      );

      if (isValid) {
        // Store encrypted password securely
        await SecureStorageService.storeCertificatePassword(company.nit, encryptedPassword);

        console.log('✅ CertificateService: Certificate password updated successfully');

        return {
          isValid: true,
          message: 'Contraseña del certificado actualizada', // Matches Swift message
        };
      } else {
        return {
          isValid: false,
          message: 'Error al actualizar Contraseña, actualice y verifique la contraseña del certificado en el portal de Hacienda', // Matches Swift message
        };
      }
    } catch (error) {
      console.error('❌ CertificateService: Certificate password update failed:', error);
      
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Error updating certificate password',
      };
    }
  }

  /**
   * Validate certificate credentials
   * Matches Swift's certificate validation flow
   */
  async validateCertificate(
    nit: string,
    certificateKey: string
  ): Promise<CertificateValidationResult> {
    try {
      console.log('🔍 CertificateService: Validating certificate');

      const isValid = await this.invoiceService.validateCertificate(nit, certificateKey);

      return {
        isValid,
        message: isValid 
          ? 'Certificate is valid'
          : 'Certificate validation failed',
      };
    } catch (error) {
      console.error('❌ CertificateService: Certificate validation failed:', error);
      
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Error validating certificate',
      };
    }
  }

  /**
   * Get stored certificate password for a company
   */
  async getCertificatePassword(nit: string): Promise<string | null> {
    try {
      return await SecureStorageService.getCertificatePassword(nit);
    } catch (error) {
      console.error('❌ CertificateService: Error getting certificate password:', error);
      return null;
    }
  }

  /**
   * Check if company has a valid certificate
   */
  async hasValidCertificate(company: Company): Promise<boolean> {
    try {
      const certificatePassword = await this.getCertificatePassword(company.nit);
      
      if (!certificatePassword) {
        return false;
      }

      const validation = await this.validateCertificate(company.nit, certificatePassword);
      return validation.isValid;
    } catch (error) {
      console.error('❌ CertificateService: Error checking certificate validity:', error);
      return false;
    }
  }

  /**
   * Remove certificate for a company
   */
  async removeCertificate(nit: string): Promise<void> {
    try {
      console.log('🗑️ CertificateService: Removing certificate for NIT:', nit);
      await SecureStorageService.removeCertificatePassword(nit);
      console.log('✅ CertificateService: Certificate removed successfully');
    } catch (error) {
      console.error('❌ CertificateService: Error removing certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificate info for a company
   */
  async getCertificateInfo(nit: string): Promise<{
    hasPassword: boolean;
    isValid: boolean;
    lastValidated?: string;
  }> {
    try {
      const certificatePassword = await this.getCertificatePassword(nit);
      const hasPassword = !!certificatePassword;
      
      let isValid = false;
      if (hasPassword && certificatePassword) {
        const validation = await this.validateCertificate(nit, certificatePassword);
        isValid = validation.isValid;
      }

      return {
        hasPassword,
        isValid,
        lastValidated: isValid ? new Date().toISOString() : undefined,
      };
    } catch (error) {
      console.error('❌ CertificateService: Error getting certificate info:', error);
      return {
        hasPassword: false,
        isValid: false,
      };
    }
  }

  /**
   * Switch environment (production/development)
   */
  setEnvironment(isProduction: boolean): void {
    this.invoiceService.setEnvironment(isProduction);
  }
}

// Singleton instance
let certificateServiceInstance: CertificateService | null = null;

export const getCertificateService = (isProduction?: boolean): CertificateService => {
  if (!certificateServiceInstance || 
      (isProduction !== undefined && certificateServiceInstance.getEnvironmentCode() !== (isProduction ? 'PROD' : 'DEV'))) {
    certificateServiceInstance = new CertificateService(isProduction);
  }
  return certificateServiceInstance;
};

export default CertificateService;
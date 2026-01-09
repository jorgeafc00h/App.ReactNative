// Certificate Management Service
// Based on SwiftUI CertificateUpdateViewModel implementation

import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
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
      console.log('📁 CertificateService: Opening document picker for certificate');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/x-pkcs12', 'application/pkcs12', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file type
        if (!asset.name.toLowerCase().endsWith('.p12') && !asset.name.toLowerCase().endsWith('.pfx')) {
          throw new Error('Please select a valid certificate file (.p12 or .pfx)');
        }

        // Read file as base64
        const fileData = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        console.log('✅ CertificateService: Certificate file selected:', asset.name);

        return {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: asset.mimeType || 'application/x-pkcs12',
          data: fileData,
        };
      }
      
      console.log('📁 CertificateService: File selection cancelled');
      return null;
    } catch (error) {
      console.error('❌ Error selecting certificate file:', error);
      throw new Error(`Failed to select certificate file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // Early validation: avoid API call if certificateKey is empty or invalid
      if (!certificateKey || typeof certificateKey !== 'string' || certificateKey.trim() === '') {
        console.log('⚠️ CertificateService: Certificate validation skipped - empty or invalid certificateKey');
        return {
          isValid: false,
          message: 'Certificate key is empty or invalid',
        };
      }

      // Early validation: avoid API call if NIT is empty or invalid
      if (!nit || typeof nit !== 'string' || nit.trim() === '') {
        console.log('⚠️ CertificateService: Certificate validation skipped - empty or invalid NIT');
        return {
          isValid: false,
          message: 'NIT is empty or invalid',
        };
      }

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
   * Complete certificate setup workflow
   * Combines file selection, upload, and password validation
   */
  async setupCertificate(
    company: Company,
    password: string,
    confirmPassword: string
  ): Promise<CertificateUploadResult> {
    try {
      console.log('🛠️ CertificateService: Starting complete certificate setup');

      // Step 1: Validate passwords
      if (password !== confirmPassword || password.length === 0) {
        return {
          success: false,
          message: 'Las contraseñas no coinciden o están vacías',
        };
      }

      // Step 2: Select certificate file
      const certificateFile = await this.selectCertificateFile();
      if (!certificateFile) {
        return {
          success: false,
          message: 'No se seleccionó ningún archivo de certificado',
        };
      }

      // Step 3: Upload certificate
      const uploadResult = await this.uploadCertificate(certificateFile, company);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Step 4: Validate and store certificate password
      const passwordResult = await this.updateCertificatePassword(
        password,
        confirmPassword,
        company
      );

      if (!passwordResult.isValid) {
        return {
          success: false,
          message: passwordResult.message,
        };
      }

      console.log('✅ CertificateService: Complete certificate setup successful');
      return {
        success: true,
        message: 'Certificado configurado correctamente',
        certificateKey: await this.getCertificatePassword(company.nit) || undefined,
      };
    } catch (error) {
      console.error('❌ CertificateService: Certificate setup failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en la configuración del certificado',
      };
    }
  }

  /**
   * Validate certificate file format
   */
  private validateCertificateFile(file: CertificateFile): boolean {
    const validExtensions = ['.p12', '.pfx'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get certificate status summary for a company
   */
  async getCertificateStatus(company: Company): Promise<{
    hasFile: boolean;
    hasPassword: boolean;
    isValid: boolean;
    lastValidated?: string;
    message: string;
  }> {
    try {
      const info = await this.getCertificateInfo(company.nit);
      
      let message = '';
      if (!info.hasPassword) {
        message = 'Certificado no configurado';
      } else if (!info.isValid) {
        message = 'Certificado configurado pero no válido';
      } else {
        message = 'Certificado configurado y válido';
      }

      return {
        hasFile: true, // We assume if password exists, file was uploaded
        hasPassword: info.hasPassword,
        isValid: info.isValid,
        lastValidated: info.lastValidated,
        message,
      };
    } catch (error) {
      console.error('❌ CertificateService: Error getting certificate status:', error);
      return {
        hasFile: false,
        hasPassword: false,
        isValid: false,
        message: 'Error al obtener estado del certificado',
      };
    }
  }

  /**
   * Test certificate configuration with government API
   */
  async testCertificate(company: Company): Promise<CertificateValidationResult> {
    try {
      console.log('🧪 CertificateService: Testing certificate configuration');

      const certificatePassword = await this.getCertificatePassword(company.nit);
      if (!certificatePassword) {
        return {
          isValid: false,
          message: 'No hay contraseña de certificado almacenada',
        };
      }

      const validation = await this.validateCertificate(company.nit, certificatePassword);
      
      if (validation.isValid) {
        console.log('✅ CertificateService: Certificate test successful');
        return {
          isValid: true,
          message: 'Certificado válido y funcionando correctamente',
        };
      } else {
        console.log('❌ CertificateService: Certificate test failed');
        return {
          isValid: false,
          message: 'Certificado no válido o expirado',
        };
      }
    } catch (error) {
      console.error('❌ CertificateService: Certificate test error:', error);
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Error al probar certificado',
      };
    }
  }

  /**
   * Get credentials for API calls (includes certificate)
   */
  async getApiCredentials(company: Company): Promise<{
    user: string;
    password: string;
    certificateKey: string;
  } | null> {
    try {
      // Get MH credentials
      const credentials = await SecureStorageService.getCredentials(company.nit);
      const certificatePassword = await this.getCertificatePassword(company.nit);

      if (!credentials || !certificatePassword) {
        return null;
      }

      return {
        user: credentials.user,
        password: credentials.password,
        certificateKey: certificatePassword,
      };
    } catch (error) {
      console.error('❌ CertificateService: Error getting API credentials:', error);
      return null;
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
      (isProduction !== undefined && certificateServiceInstance.getEnvironmentCode() !== (isProduction ? '01' : '00'))) {
    certificateServiceInstance = new CertificateService(isProduction);
  }
  return certificateServiceInstance;
};

export default CertificateService;
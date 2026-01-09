// Complete Invoice Service for Government DTE API Integration
// Based on SwiftUI InvoiceServiceClient implementation

import { HttpClient, ApiError, getHttpClient } from './HttpClient';
import { API_CONFIG, API_HEADERS, getApiConfig } from '../../config/api';
import { deepOmitUndefined } from '../../utils/json';
import { 
  DTE_Base, 
  DTEResponseWrapper, 
  DTEErrorResponseWrapper,
  ServiceCredentials, 
  ContingenciaRequest,
  DTE_InvalidationRequest 
} from '../../types/dte';
import { 
  PromoCodeRequest, 
  PromoResponse, 
  PromoStatus 
} from '../../types/promo';
import { EmailAccount } from '../../types/email';
import { PurchaseResponse } from '../../types/purchase';

export class InvoiceService {
  private httpClient: HttpClient;
  private isProduction: boolean;

  constructor(isProduction: boolean = false) {
    this.httpClient = getHttpClient(isProduction); // Use singleton
    this.isProduction = isProduction;
  }

  /**
   * Submits a DTE (Electronic Tax Document) to the Ministry of Finance
   * Core government compliance functionality
   */
  async submitDTE(
    dte: DTE_Base, 
    credentials: ServiceCredentials
  ): Promise<DTEResponseWrapper> {
    try {
      console.log('📄 InvoiceService: Submitting DTE to government API');
      
      // Format the DTE with proper date formatting (ISO8601 date-only)
      const formattedDTE = this.formatDTEDates(dte);
      // Mirror Swift Codable: omit any optional fields that are absent.
      const sanitizedDTE = deepOmitUndefined(formattedDTE);

      // Backend schema note:
      // For Factura (tipoDte='01'), some validators treat a missing array as an empty array
      // and enforce minItems. Sending explicit null avoids accidentally validating an empty list.
      if (sanitizedDTE.identificacion?.tipoDte === '01' && (sanitizedDTE as any).documentoRelacionado === undefined) {
        (sanitizedDTE as any).documentoRelacionado = null;
      }
      
      // Determine the correct endpoint based on document type
      const endpoint = this.getDTEEndpoint(dte.identificacion.tipoDte);
      
      // Set up headers with credentials - exact same as Swift implementation
      const headers = {
        [API_HEADERS.API_KEY]: API_CONFIG.apiKey,
        [API_HEADERS.CERTIFICATE_KEY]: credentials.key,
        [API_HEADERS.MH_USER]: credentials.user,
        [API_HEADERS.MH_KEY]: credentials.credential,
        [API_HEADERS.INVOICE_NUMBER]: credentials.invoiceNumber,
        [API_HEADERS.CONTENT_TYPE]: 'application/json'
      };

      console.log('DTE JSON:', JSON.stringify(sanitizedDTE, null, 2));

      const response = await this.httpClient.post<DTEResponseWrapper>(
        endpoint,
        sanitizedDTE,
        { headers }
      );

      console.log('✅ InvoiceService: DTE submitted successfully');
      return response;

    } catch (error) {
      console.error('❌ InvoiceService: DTE submission failed', error);
      
      // Handle DTE-specific error responses (same as Swift)
      // ApiError.details contains the raw server response body (see HttpClient.createApiError).
      if (error instanceof ApiError && error.details) {
        try {
          const dteError: DTEErrorResponseWrapper = error.details as DTEErrorResponseWrapper;
          
          if (dteError.observaciones && Array.isArray(dteError.observaciones)) {
            const errors = [...dteError.observaciones];
            if (dteError.descripcionMsg) {
              errors.push(dteError.descripcionMsg);
            }
            const customErrorMessage = errors.join('\n');
            throw new ApiError(customErrorMessage, error.statusCode);
          }
        } catch (parseError) {
          // Fall through to original error
        }
      }
      throw error;
    }
  }

  /**
   * Get the correct DTE endpoint based on document type
   * Matches Swift implementation exactly
   */
  private getDTEEndpoint(tipoDte: string): string {
    switch (tipoDte) {
      case '14': // Sujeto Excluido
        return '/document/dte/se/sync/';
      case '11': // Factura
        return '/document/dte/fe/sync/';
      case '08': // Comprobante Liquidación
        return '/document/dte/cl/sync/';
      default:
        return '/document/dte/sync';
    }
  }

  /**
   * Format DTE dates to ISO8601 date-only format (YYYY-MM-DD)
   * Matches Swift implementation
   */
  private formatDTEDates(dte: DTE_Base): DTE_Base {
    const formatDate = (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString().split('T')[0];
    };

    return {
      ...dte,
      identificacion: {
        ...dte.identificacion,
        fecEmi: formatDate(dte.identificacion.fecEmi)
      }
      // Add other date field formatting as needed
    };
  }

  /**
   * Upload certificate file to government servers
   * Matches Swift implementation
   */
  async uploadCertificate(
    certificateData: string, // Base64 encoded certificate data
    nit: string
  ): Promise<boolean> {
    try {
      console.log('📜 InvoiceService: Uploading certificate');

      const headers = {
        [API_HEADERS.API_KEY]: API_CONFIG.apiKey,
        [API_HEADERS.MH_USER]: nit,
        [API_HEADERS.CONTENT_TYPE]: 'application/json'
      };

      await this.httpClient.post(
        '/document/upload',
        certificateData,
        { headers }
      );

      console.log('✅ InvoiceService: Certificate uploaded successfully');
      return true;
    } catch (error) {
      console.error('❌ InvoiceService: Certificate upload failed', error);
      throw error;
    }
  }

  /**
   * Validate certificate with government API
   * Matches Swift implementation with early validation
   */
  async validateCertificate(
    nit: string,
    certificateKey: string
  ): Promise<boolean> {
    try {
      // Early validation: avoid API call if certificateKey is empty or invalid
      if (!certificateKey || typeof certificateKey !== 'string' || certificateKey.trim() === '') {
        console.log('⚠️ InvoiceService: Certificate validation skipped - empty or invalid certificateKey');
        return false;
      }

      // Early validation: avoid API call if NIT is empty or invalid
      if (!nit || typeof nit !== 'string' || nit.trim() === '') {
        console.log('⚠️ InvoiceService: Certificate validation skipped - empty or invalid NIT');
        return false;
      }

      console.log('🔍 InvoiceService: Validating certificate');

      const headers = {
        [API_HEADERS.API_KEY]: API_CONFIG.apiKey,
        [API_HEADERS.CERTIFICATE_KEY]: certificateKey.trim(), // Ensure no leading/trailing whitespace
        [API_HEADERS.MH_USER]: nit.trim()
      };

      console.log('InvoiceService: Sending certificate validation request');
      console.log('Headers:', { ...headers, [API_HEADERS.CERTIFICATE_KEY]: '[REDACTED]' }); // Don't log the actual key

      const response = await this.httpClient.post<unknown>(
        '/settings/certificate/validate',
        {},
        { headers }
      );

      const isValid = response === 'true' || response === true;
      console.log(`${isValid ? '✅' : '❌'} InvoiceService: Certificate validation result: ${isValid}`);
      
      return isValid;
    } catch (error) {
      console.error('❌ InvoiceService: Certificate validation failed', error);
      return false;
    }
  }

  /**
   * Validate government credentials (NIT/password)
   * Sends password as PLAIN TEXT to match Swift implementation exactly
   * Note: Only certificate passwords are hashed - credential passwords are sent as plain text
   */
  async validateCredentials(
    nit: string, 
    password: string, 
    forceRefresh: boolean = false
  ): Promise<boolean> {
    try {
      // Early validation: avoid API call if credentials are empty or invalid
      if (!nit || typeof nit !== 'string' || nit.trim() === '') {
        console.log('⚠️ InvoiceService: Credential validation skipped - empty or invalid NIT');
        return false;
      }

      if (!password || typeof password !== 'string' || password.trim() === '') {
        console.log('⚠️ InvoiceService: Credential validation skipped - empty or invalid password');
        return false;
      }

      console.log(`🔐 InvoiceService: Validating credentials for NIT: ${nit.trim()}`);
      
      const endpoint = `/account/validate?forceRefresh=${forceRefresh}`;
      const baseURL = this.httpClient.getBaseURL();
      const fullURL = `${baseURL}${endpoint}`;

      console.log(`🌐 InvoiceService: Full URL: ${fullURL}`);
      console.log(`🏭 InvoiceService: Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

      const headers = {
        [API_HEADERS.API_KEY]: API_CONFIG.apiKey,
        [API_HEADERS.MH_USER]: nit.trim(),
        [API_HEADERS.MH_KEY]: password, // PLAIN TEXT password - matches Swift exactly
        [API_HEADERS.CONTENT_TYPE]: 'application/json'
      };

     console.log('InvoiceService: Sending credential validation request');
     console.log('Headers (password redacted):', { 
       ...headers, 
       [API_HEADERS.MH_KEY]: '[REDACTED]' 
     });

      await this.httpClient.get(
        `/account/validate?forceRefresh=${forceRefresh}`,
        { headers }
      );

      console.log('✅ InvoiceService: Credentials validated successfully');
      return true;
    } catch (error) {
      console.error('❌ InvoiceService: Credential validation failed', error);
      return false;
    }
  }

  /**
   * Upload PDF document to government storage
   * Matches Swift implementation
   */
  async uploadPDF(
    pdfData: string, // Base64 encoded PDF
    controlNumber: string,
    nit: string
  ): Promise<void> {
    try {
      console.log('📎 InvoiceService: Uploading PDF');

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'mhUser': nit,
        'invoiceNumber': controlNumber,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post(
        '/document/pdf/upload',
        pdfData,
        { headers }
      );

      console.log('✅ InvoiceService: PDF uploaded successfully');
    } catch (error) {
      console.error('❌ InvoiceService: PDF upload failed', error);
      throw error;
    }
  }

  /**
   * Invalidate a previously submitted document
   * Matches Swift implementation
   */
  async invalidateDocument(
    dte: DTE_InvalidationRequest,
    credentials: ServiceCredentials
  ): Promise<boolean> {
    try {
      console.log('🚫 InvoiceService: Invalidating document');

      const formattedDTE = this.formatDTEDates(dte as any);

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'certificateKey': credentials.key,
        'mhUser': credentials.user,
        'mhKey': credentials.credential,
        'invoiceNumber': credentials.invoiceNumber,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post(
        '/document/dte/invalidate',
        formattedDTE,
        { headers }
      );

      console.log('✅ InvoiceService: Document invalidated successfully');
      return true;
    } catch (error) {
      console.error('❌ InvoiceService: Document invalidation failed', error);
      
      // Handle DTE-specific errors (same pattern as submitDTE)
      if (error instanceof ApiError && error.details) {
        try {
          const dteError: DTEErrorResponseWrapper = error.details as DTEErrorResponseWrapper;
          
          if (dteError.observaciones && Array.isArray(dteError.observaciones)) {
            const errors = [...dteError.observaciones];
            if (dteError.descripcionMsg) {
              errors.push(dteError.descripcionMsg);
            }
            const customErrorMessage = errors.join('\n');
            throw new ApiError(customErrorMessage, error.statusCode);
          }
        } catch (parseError) {
          // Fall through to original error
        }
      }
      throw error;
    }
  }

  /**
   * Send contingency request for failed invoices
   * Matches Swift implementation exactly
   */
  async sendContingencyRequest(
    contingencyRequest: ContingenciaRequest,
    credentials: ServiceCredentials
  ): Promise<boolean> {
    try {
      console.log(`📋 InvoiceService: Sending contingency request for ${contingencyRequest.detalleDTE.length} invoices`);

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'certificateKey': credentials.key,
        'mhUser': credentials.user,
        'mhKey': credentials.credential,
        'invoiceNumber': credentials.invoiceNumber,
        'Content-Type': 'application/json'
      };

      // Format dates in the request (same as Swift)
      const formattedRequest = {
        ...contingencyRequest,
        detalleDTE: contingencyRequest.detalleDTE.map(item => ({
          ...item,
          fechaEmi: this.formatDateOnly(new Date(item.fechaEmi))
        }))
      };

      console.log('Contingency Request JSON:', JSON.stringify(formattedRequest, null, 2));

      await this.httpClient.post(
        '/document/contingencia/report',
        formattedRequest,
        { headers }
      );

      console.log('✅ InvoiceService: Contingency request sent successfully');
      return true;
    } catch (error) {
      console.error('❌ InvoiceService: Contingency request failed', error);
      throw error;
    }
  }

  /**
   * Get document from Azure storage
   * Matches Swift implementation
   */
  async getDocumentFromStorage(path: string): Promise<DTE_Base> {
    try {
      const response = await this.httpClient.get<DTE_Base>(path);
      return response;
    } catch (error) {
      console.error('❌ InvoiceService: Failed to get document from storage', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * Matches Swift implementation
   */
  async deactivateAccount(email: string, userId: string): Promise<void> {
    try {
      console.log('🚫 InvoiceService: Deactivating account');

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'userId': userId,
        'mhUser': email,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post('/account/deactivate', {}, { headers });

      console.log('✅ InvoiceService: Account deactivated successfully');
    } catch (error) {
      console.error('❌ InvoiceService: Account deactivation failed', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * Matches Swift implementation
   */
  async deleteAccount(email: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ InvoiceService: Deleting account');

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'userId': userId,
        'mhUser': email,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post('/account/delete', {}, { headers });

      console.log('✅ InvoiceService: Account deleted successfully');
    } catch (error) {
      console.error('❌ InvoiceService: Account deletion failed', error);
      throw error;
    }
  }

  // MARK: - Promo Code Management

  /**
   * Request promo code from government API
   * Matches Swift implementation
   */
  async requestPromoCode(
    userId: string,
    email: string,
    nit?: string,
    promoCodeRequest?: string
  ): Promise<PromoResponse> {
    try {
      console.log('🎫 InvoiceService: Requesting promo code');

      const requestModel: PromoCodeRequest = {
        userId,
        email,
        nit,
        promoCodeRequest
      };

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'Content-Type': 'application/json'
      };

      console.log('PromoCode Request JSON:', JSON.stringify(requestModel, null, 2));

      const response = await this.httpClient.post<PromoResponse>(
        '/promo',
        requestModel,
        { headers }
      );

      console.log('✅ InvoiceService: Promo code request successful');
      return response;
    } catch (error) {
      console.error('❌ InvoiceService: Promo code request failed', error);
      throw error;
    }
  }

  /**
   * Check promo code status
   * Matches Swift implementation
   */
  async checkPromoStatus(orderReference: string): Promise<PromoStatus> {
    try {
      console.log('📊 InvoiceService: Checking promo status');

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || ''
      };

      const response = await this.httpClient.get<PromoStatus>(
        `/promo/status?orderReference=${orderReference}`,
        { headers }
      );

      console.log('✅ InvoiceService: Promo status retrieved');
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        throw new Error('Promo code not found');
      }
      console.error('❌ InvoiceService: Failed to check promo status', error);
      throw error;
    }
  }

  // MARK: - Email Settings Management

  /**
   * Get all email accounts
   * Matches Swift implementation
   */
  async getAllEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const headers = {
        'Authorization': process.env.REACT_APP_API_KEY || ''
      };

      const response = await this.httpClient.get<EmailAccount[]>(
        '/email-settings',
        { headers }
      );

      return response;
    } catch (error) {
      console.error('❌ InvoiceService: Failed to get email accounts', error);
      throw error;
    }
  }

  /**
   * Get email account by NIT
   * Matches Swift implementation
   */
  async getEmailAccount(nit: string): Promise<EmailAccount | null> {
    try {
      const headers = {
        'Authorization': process.env.REACT_APP_API_KEY || ''
      };

      const response = await this.httpClient.get<EmailAccount>(
        `/email-settings/${nit}`,
        { headers }
      );

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      console.error('❌ InvoiceService: Failed to get email account', error);
      throw error;
    }
  }

  /**
   * Save email settings (create or update)
   * Matches Swift implementation logic
   */
  async saveEmailSettings(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    // Check if account exists first (same logic as Swift)
    const existingAccount = await this.getEmailAccount(nit);
    
    if (existingAccount) {
      return this.updateEmailAccount(emailAccount, nit);
    } else {
      return this.createEmailAccount(emailAccount, nit);
    }
  }

  /**
   * Create email account
   * Matches Swift implementation
   */
  private async createEmailAccount(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    const headers = {
      'Authorization': process.env.REACT_APP_API_KEY || '',
      'Content-Type': 'application/json'
    };

    console.log('Creating email account:', JSON.stringify(emailAccount, null, 2));

    const response = await this.httpClient.post<EmailAccount>(
      `/email-settings/${nit}`,
      emailAccount,
      { headers }
    );

    return response;
  }

  /**
   * Update email account
   * Matches Swift implementation
   */
  private async updateEmailAccount(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    const headers = {
      'Authorization': process.env.REACT_APP_API_KEY || '',
      'Content-Type': 'application/json'
    };

    const response = await this.httpClient.put<EmailAccount>(
      `/email-settings/${nit}`,
      emailAccount,
      { headers }
    );

    return response;
  }

  /**
   * Delete email account
   * Matches Swift implementation
   */
  async deleteEmailAccount(nit: string): Promise<void> {
    const headers = {
      'Authorization': process.env.REACT_APP_API_KEY || ''
    };

    await this.httpClient.delete(`/email-settings/${nit}`, { headers });
  }

  /**
   * Deactivate email account
   * Matches Swift implementation
   */
  async deactivateEmailAccount(nit: string): Promise<void> {
    const headers = {
      'Authorization': process.env.REACT_APP_API_KEY || ''
    };

    await this.httpClient.patch(`/email-settings/${nit}/deactivate`, {}, { headers });
  }

  // MARK: - Purchase Management

  /**
   * Fetch purchases for a company
   * Matches Swift implementation
   */
  async fetchPurchases(nit: string): Promise<PurchaseResponse> {
    try {
      console.log('💳 InvoiceService: Fetching purchases');

      const headers = {
        'apiKey': process.env.REACT_APP_API_KEY || '',
        'Content-Type': 'application/json'
      };

      const response = await this.httpClient.get<PurchaseResponse>(
        `/purchases/${nit}`,
        { headers }
      );

      console.log('✅ InvoiceService: Purchases fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ InvoiceService: Failed to fetch purchases', error);
      throw error;
    }
  }

  // MARK: - Utility Methods

  /**
   * Format date to YYYY-MM-DD only (matches Swift implementation)
   */
  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Switch environment (production/development)
   * Matches Swift implementation
   */
  setEnvironment(isProduction: boolean): void {
    this.isProduction = isProduction;
    // Keep behavior consistent with constructor (singleton-per-environment)
    this.httpClient = getHttpClient(isProduction);
  }

  /**
   * Get current environment
   * Matches Swift implementation
   */
  getEnvironmentCode(): string {
    // Must match Swift `Constants.EnvironmentCode_PRD` / `Constants.EnvironmentCode`
    // and API config expectations: production='01', development='00'
    return getApiConfig(this.isProduction).environmentCode;
  }
}
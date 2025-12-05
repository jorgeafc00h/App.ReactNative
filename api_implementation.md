# API Implementation Guide for React Native

## 🌐 API Base Configuration

### Base URLs and Environment Management
```typescript
// config/api.ts
export const API_CONFIG = {
  production: {
    baseUrl: 'https://k-invoices-api.azurewebsites.net',
    environmentCode: 'PROD'
  },
  development: {
    baseUrl: 'https://k-invoices-api-dev.azurewebsites.net',
    environmentCode: 'DEV'
  },
  timeout: 120000, // 2 minutes - matches Swift implementation
  apiKey: process.env.REACT_APP_API_KEY || 'your-api-key-here'
};

export const getApiConfig = (isProduction: boolean) => {
  return isProduction ? API_CONFIG.production : API_CONFIG.development;
};
```

### HTTP Client Setup with Axios
```typescript
// services/api/HttpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, getApiConfig } from '../../config/api';
import { SecureStorage } from '../security/SecureStorage';

export class HttpClient {
  private client: AxiosInstance;
  private isProduction: boolean;

  constructor(isProduction: boolean = false) {
    this.isProduction = isProduction;
    const config = getApiConfig(isProduction);

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'apiKey': API_CONFIG.apiKey,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for adding auth headers
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication headers if available
        const credentials = await this.getCurrentCredentials();
        if (credentials) {
          config.headers = {
            ...config.headers,
            'mhUser': credentials.user,
            'mhKey': credentials.password,
            ...(credentials.certificateKey && { 'certificateKey': credentials.certificateKey })
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private async getCurrentCredentials() {
    // Get current company NIT from storage or state
    const currentCompanyNit = await SecureStorage.getCurrentCompanyNit();
    if (currentCompanyNit) {
      return await SecureStorage.getCredentials(currentCompanyNit);
    }
    return null;
  }

  private handleApiError(error: any): ApiError {
    if (error.response) {
      const { status, data } = error.response;
      
      // Try to parse DTE error response format
      if (data && typeof data === 'object') {
        if (data.observaciones && Array.isArray(data.observaciones)) {
          const errors = [...data.observaciones];
          if (data.descripcionMsg) {
            errors.push(data.descripcionMsg);
          }
          return new ApiError(errors.join('\n'), status);
        }
        
        if (typeof data === 'string') {
          return new ApiError(data, status);
        }
      }
      
      return new ApiError(`HTTP Error ${status}`, status);
    } else if (error.request) {
      return new ApiError('Network error - please check your connection', 0);
    } else {
      return new ApiError('Unknown error occurred', -1);
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isNetworkError(error: ApiError): boolean {
    return error.statusCode === 0;
  }

  static isUnauthorized(error: ApiError): boolean {
    return error.statusCode === 401;
  }

  static isServerError(error: ApiError): boolean {
    return error.statusCode >= 500;
  }
}
```

## 📋 Catalog Service Implementation

```typescript
// services/api/CatalogService.ts
import { HttpClient } from './HttpClient';
import { Catalog, CatalogOption, CatalogDTO } from '../../types/catalog';
import { AsyncStorageService } from '../storage/AsyncStorageService';

export class CatalogService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async getCatalogs(): Promise<Catalog[]> {
    try {
      console.log('📋 CatalogService: Fetching catalogs from API');
      
      const response = await this.httpClient.get<CatalogDTO>('/catalog');
      
      const catalogs = response.catalogs.map(catalogDto => ({
        id: catalogDto.id,
        name: catalogDto.name,
        options: catalogDto.options.map(option => ({
          id: `${catalogDto.id}_${option.code}`,
          code: option.code,
          description: option.description,
          departamento: option.departamento,
          catalogId: catalogDto.id
        }))
      }));

      console.log(`✅ CatalogService: Successfully fetched ${catalogs.length} catalogs`);
      return catalogs;
      
    } catch (error) {
      console.error('❌ CatalogService: Failed to fetch catalogs', error);
      throw error;
    }
  }

  async shouldSync(): Promise<boolean> {
    const lastSyncDate = await AsyncStorageService.getLastSyncDate();
    if (!lastSyncDate) return true;

    const hoursSinceLastSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSync > 24; // Sync every 24 hours
  }

  async forceSync(): Promise<void> {
    await this.syncCatalogs();
  }

  private async syncCatalogs(): Promise<void> {
    const catalogs = await this.getCatalogs();
    
    // Store catalogs locally (implementation depends on chosen database)
    await this.storeCatalogsLocally(catalogs);
    
    // Update last sync date
    await AsyncStorageService.setLastSyncDate(new Date());
  }

  private async storeCatalogsLocally(catalogs: Catalog[]): Promise<void> {
    // Implementation depends on chosen database solution
    // For Realm:
    // await RealmService.replaceCatalogs(catalogs);
    
    // For SQLite:
    // await DatabaseService.replaceCatalogs(catalogs);
    
    console.log(`✅ Stored ${catalogs.length} catalogs locally`);
  }
}
```

## 🧾 Invoice Service Implementation

```typescript
// services/api/InvoiceService.ts
import { HttpClient } from './HttpClient';
import { 
  DTE_Base, 
  DTEResponseWrapper, 
  ServiceCredentials, 
  ContingenciaRequest,
  DTE_InvalidationRequest 
} from '../../types/dte';
import { InvoiceType } from '../../types/invoice';

export class InvoiceService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async submitDTE(
    dte: DTE_Base, 
    credentials: ServiceCredentials
  ): Promise<DTEResponseWrapper> {
    try {
      console.log('📄 InvoiceService: Submitting DTE to government API');
      
      // Prepare the DTE with proper date formatting
      const formattedDTE = this.formatDTEDates(dte);
      
      // Determine the correct endpoint based on document type
      const endpoint = this.getDTEEndpoint(dte.identificacion.tipoDte);
      
      // Set up headers with credentials
      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'certificateKey': credentials.key,
        'mhUser': credentials.user,
        'mhKey': credentials.credential,
        'invoiceNumber': credentials.invoiceNumber,
        'Content-Type': 'application/json'
      };

      console.log('DTE JSON:', JSON.stringify(formattedDTE, null, 2));

      const response = await this.httpClient.post<DTEResponseWrapper>(
        endpoint,
        formattedDTE,
        { headers }
      );

      console.log('✅ InvoiceService: DTE submitted successfully');
      return response;

    } catch (error) {
      console.error('❌ InvoiceService: DTE submission failed', error);
      throw error;
    }
  }

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

  private formatDTEDates(dte: DTE_Base): DTE_Base {
    // Format dates to ISO8601 date-only format (YYYY-MM-DD)
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    return {
      ...dte,
      identificacion: {
        ...dte.identificacion,
        fecEmi: formatDate(new Date(dte.identificacion.fecEmi))
      }
      // Format other date fields as needed
    };
  }

  async uploadPDF(
    pdfData: string, // Base64 encoded
    controlNumber: string,
    nit: string
  ): Promise<void> {
    try {
      console.log('📎 InvoiceService: Uploading PDF');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
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

  async invalidateDocument(
    dte: DTE_InvalidationRequest,
    credentials: ServiceCredentials
  ): Promise<boolean> {
    try {
      console.log('🚫 InvoiceService: Invalidating document');

      const formattedDTE = this.formatDTEDates(dte as any);

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
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
      throw error;
    }
  }

  async sendContingencyRequest(
    contingencyRequest: ContingenciaRequest,
    credentials: ServiceCredentials
  ): Promise<boolean> {
    try {
      console.log(`📋 InvoiceService: Sending contingency request for ${contingencyRequest.detalleDTE.length} invoices`);

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'certificateKey': credentials.key,
        'mhUser': credentials.user,
        'mhKey': credentials.credential,
        'invoiceNumber': credentials.invoiceNumber,
        'Content-Type': 'application/json'
      };

      const formattedRequest = {
        ...contingencyRequest,
        // Format dates in the request
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

  async getDocumentFromStorage(path: string): Promise<DTE_Base> {
    try {
      const response = await this.httpClient.get<DTE_Base>(path);
      return response;
    } catch (error) {
      console.error('❌ InvoiceService: Failed to get document from storage', error);
      throw error;
    }
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

## 🔐 Certificate & Authentication Service

```typescript
// services/api/AuthService.ts
import { HttpClient } from './HttpClient';
import { SecureStorage } from '../security/SecureStorage';

export class AuthService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async validateCredentials(
    nit: string,
    password: string,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    try {
      console.log('🔐 AuthService: Validating credentials');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'mhUser': nit,
        'mhKey': password,
        'Content-Type': 'application/json'
      };

      await this.httpClient.get(
        `/account/validate?forceRefresh=${forceRefresh}`,
        { headers }
      );

      console.log('✅ AuthService: Credentials validated successfully');
      return true;
    } catch (error) {
      console.error('❌ AuthService: Credential validation failed', error);
      return false;
    }
  }

  async uploadCertificate(
    certificateData: string, // Base64 or raw data
    nit: string
  ): Promise<boolean> {
    try {
      console.log('📜 AuthService: Uploading certificate');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'mhUser': nit,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post(
        '/document/upload',
        certificateData,
        { headers }
      );

      console.log('✅ AuthService: Certificate uploaded successfully');
      return true;
    } catch (error) {
      console.error('❌ AuthService: Certificate upload failed', error);
      throw error;
    }
  }

  async validateCertificate(
    nit: string,
    certificateKey: string
  ): Promise<boolean> {
    try {
      console.log('🔍 AuthService: Validating certificate');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'certificateKey': certificateKey,
        'mhUser': nit
      };

      const response = await this.httpClient.post(
        '/settings/certificate/validate',
        {},
        { headers }
      );

      const isValid = response === 'true' || response === true;
      console.log(`${isValid ? '✅' : '❌'} AuthService: Certificate validation result: ${isValid}`);
      
      return isValid;
    } catch (error) {
      console.error('❌ AuthService: Certificate validation failed', error);
      return false;
    }
  }

  async deactivateAccount(email: string, userId: string): Promise<void> {
    try {
      console.log('🚫 AuthService: Deactivating account');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'userId': userId,
        'mhUser': email,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post('/account/deactivate', {}, { headers });

      console.log('✅ AuthService: Account deactivated successfully');
    } catch (error) {
      console.error('❌ AuthService: Account deactivation failed', error);
      throw error;
    }
  }

  async deleteAccount(email: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ AuthService: Deleting account');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'userId': userId,
        'mhUser': email,
        'Content-Type': 'application/json'
      };

      await this.httpClient.post('/account/delete', {}, { headers });

      console.log('✅ AuthService: Account deleted successfully');
    } catch (error) {
      console.error('❌ AuthService: Account deletion failed', error);
      throw error;
    }
  }
}
```

## 🎟️ Promo Code Service

```typescript
// services/api/PromoCodeService.ts
import { HttpClient } from './HttpClient';
import { PromoCodeRequest, PromoResponse, PromoStatus } from '../../types/promo';

export class PromoCodeService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async requestPromoCode(
    userId: string,
    email: string,
    nit?: string,
    promoCodeRequest?: string
  ): Promise<PromoResponse> {
    try {
      console.log('🎫 PromoCodeService: Requesting promo code');

      const requestModel: PromoCodeRequest = {
        userId,
        email,
        nit,
        promoCodeRequest
      };

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'Content-Type': 'application/json'
      };

      console.log('PromoCode Request JSON:', JSON.stringify(requestModel, null, 2));

      const response = await this.httpClient.post<PromoResponse>(
        '/promo',
        requestModel,
        { headers }
      );

      console.log('✅ PromoCodeService: Promo code request successful');
      return response;
    } catch (error) {
      console.error('❌ PromoCodeService: Promo code request failed', error);
      throw error;
    }
  }

  async checkPromoStatus(orderReference: string): Promise<PromoStatus> {
    try {
      console.log('📊 PromoCodeService: Checking promo status');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey']
      };

      const response = await this.httpClient.get<PromoStatus>(
        `/promo/status?orderReference=${orderReference}`,
        { headers }
      );

      console.log('✅ PromoCodeService: Promo status retrieved');
      return response;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('Promo code not found');
      }
      console.error('❌ PromoCodeService: Failed to check promo status', error);
      throw error;
    }
  }
}
```

## 📧 Email Settings Service

```typescript
// services/api/EmailService.ts
import { HttpClient } from './HttpClient';
import { EmailAccount } from '../../types/email';

export class EmailService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async getAllEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const headers = {
        'Authorization': this.httpClient['client'].defaults.headers['apiKey']
      };

      const response = await this.httpClient.get<EmailAccount[]>(
        '/email-settings',
        { headers }
      );

      return response;
    } catch (error) {
      console.error('❌ EmailService: Failed to get email accounts', error);
      throw error;
    }
  }

  async getEmailAccount(nit: string): Promise<EmailAccount | null> {
    try {
      const headers = {
        'Authorization': this.httpClient['client'].defaults.headers['apiKey']
      };

      const response = await this.httpClient.get<EmailAccount>(
        `/email-settings/${nit}`,
        { headers }
      );

      return response;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error('❌ EmailService: Failed to get email account', error);
      throw error;
    }
  }

  async saveEmailSettings(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    // Check if account exists first
    const existingAccount = await this.getEmailAccount(nit);
    
    if (existingAccount) {
      return this.updateEmailAccount(emailAccount, nit);
    } else {
      return this.createEmailAccount(emailAccount, nit);
    }
  }

  private async createEmailAccount(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    const headers = {
      'Authorization': this.httpClient['client'].defaults.headers['apiKey'],
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

  private async updateEmailAccount(
    emailAccount: EmailAccount,
    nit: string
  ): Promise<EmailAccount> {
    const headers = {
      'Authorization': this.httpClient['client'].defaults.headers['apiKey'],
      'Content-Type': 'application/json'
    };

    const response = await this.httpClient.put<EmailAccount>(
      `/email-settings/${nit}`,
      emailAccount,
      { headers }
    );

    return response;
  }

  async deleteEmailAccount(nit: string): Promise<void> {
    const headers = {
      'Authorization': this.httpClient['client'].defaults.headers['apiKey']
    };

    await this.httpClient.delete(`/email-settings/${nit}`, { headers });
  }

  async deactivateEmailAccount(nit: string): Promise<void> {
    const headers = {
      'Authorization': this.httpClient['client'].defaults.headers['apiKey']
    };

    await this.httpClient.patch(`/email-settings/${nit}/deactivate`, {}, { headers });
  }
}
```

## 🛒 Purchase Service

```typescript
// services/api/PurchaseService.ts
import { HttpClient } from './HttpClient';
import { PurchaseResponse } from '../../types/purchase';

export class PurchaseService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  async fetchPurchases(nit: string): Promise<PurchaseResponse> {
    try {
      console.log('💳 PurchaseService: Fetching purchases');

      const headers = {
        'apiKey': this.httpClient['client'].defaults.headers['apiKey'],
        'Content-Type': 'application/json'
      };

      const response = await this.httpClient.get<PurchaseResponse>(
        `/purchases/${nit}`,
        { headers }
      );

      console.log('✅ PurchaseService: Purchases fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ PurchaseService: Failed to fetch purchases', error);
      throw error;
    }
  }
}
```

## 🔄 Service Factory and Dependency Injection

```typescript
// services/ServiceFactory.ts
import { CatalogService } from './api/CatalogService';
import { InvoiceService } from './api/InvoiceService';
import { AuthService } from './api/AuthService';
import { PromoCodeService } from './api/PromoCodeService';
import { EmailService } from './api/EmailService';
import { PurchaseService } from './api/PurchaseService';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private isProduction: boolean = false;

  private catalogService?: CatalogService;
  private invoiceService?: InvoiceService;
  private authService?: AuthService;
  private promoCodeService?: PromoCodeService;
  private emailService?: EmailService;
  private purchaseService?: PurchaseService;

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  setEnvironment(isProduction: boolean): void {
    this.isProduction = isProduction;
    // Clear existing instances to force recreation with new environment
    this.catalogService = undefined;
    this.invoiceService = undefined;
    this.authService = undefined;
    this.promoCodeService = undefined;
    this.emailService = undefined;
    this.purchaseService = undefined;
  }

  getCatalogService(): CatalogService {
    if (!this.catalogService) {
      this.catalogService = new CatalogService(this.isProduction);
    }
    return this.catalogService;
  }

  getInvoiceService(): InvoiceService {
    if (!this.invoiceService) {
      this.invoiceService = new InvoiceService(this.isProduction);
    }
    return this.invoiceService;
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.isProduction);
    }
    return this.authService;
  }

  getPromoCodeService(): PromoCodeService {
    if (!this.promoCodeService) {
      this.promoCodeService = new PromoCodeService(this.isProduction);
    }
    return this.promoCodeService;
  }

  getEmailService(): EmailService {
    if (!this.emailService) {
      this.emailService = new EmailService(this.isProduction);
    }
    return this.emailService;
  }

  getPurchaseService(): PurchaseService {
    if (!this.purchaseService) {
      this.purchaseService = new PurchaseService(this.isProduction);
    }
    return this.purchaseService;
  }
}

// Usage hook for React components
export const useApiServices = () => {
  const factory = ServiceFactory.getInstance();
  
  return {
    catalogService: factory.getCatalogService(),
    invoiceService: factory.getInvoiceService(),
    authService: factory.getAuthService(),
    promoCodeService: factory.getPromoCodeService(),
    emailService: factory.getEmailService(),
    purchaseService: factory.getPurchaseService(),
    setEnvironment: factory.setEnvironment.bind(factory)
  };
};
```

This comprehensive API implementation provides a solid foundation for the React Native app that mirrors the Swift app's functionality while leveraging TypeScript's type safety and React Native's ecosystem.
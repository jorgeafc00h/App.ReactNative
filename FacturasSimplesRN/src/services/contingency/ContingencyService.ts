// Contingency Request Service for Offline Invoice Processing
// Handles government API unavailability scenarios (matches Swift ContingencyRequestManager)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoiceService } from '../api/InvoiceService';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { Company } from '../../types/company';

export interface ContingencyRequest {
  id: string;
  invoice: Invoice;
  company: Company;
  createdAt: string;
  submissionAttempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  isSubmitted: boolean;
  submittedAt?: string;
  controlNumber?: string;
  generationCode?: string;
}

export interface ContingencyRequestResult {
  success: boolean;
  requestId?: string;
  message: string;
  shouldRetryLater?: boolean;
}

export interface ContingencySubmissionResult {
  success: boolean;
  submitted: number;
  failed: number;
  results: Array<{
    requestId: string;
    invoiceNumber: string;
    success: boolean;
    error?: string;
    controlNumber?: string;
    generationCode?: string;
  }>;
}

// Contingency reasons matching Swift ContingencyReason enum
export enum ContingencyReason {
  // API Issues
  ApiUnavailable = 'API_UNAVAILABLE',
  NetworkTimeout = 'NETWORK_TIMEOUT',
  ServerError = 'SERVER_ERROR',
  CertificateError = 'CERTIFICATE_ERROR',
  
  // System Issues
  SystemMaintenance = 'SYSTEM_MAINTENANCE',
  ConnectionLost = 'CONNECTION_LOST',
  
  // Emergency
  Emergency = 'EMERGENCY',
  ForceOffline = 'FORCE_OFFLINE',
}

class ContingencyService {
  private static readonly STORAGE_KEY = '@contingency_requests';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly RETRY_DELAY = 60000; // 1 minute
  private static readonly MAX_AGE_HOURS = 24; // 24 hours max storage
  
  private invoiceService: InvoiceService;
  private autoSubmissionTimer: NodeJS.Timeout | null = null;
  
  constructor(isProduction: boolean = false) {
    this.invoiceService = new InvoiceService(isProduction);
  }

  /**
   * Create a contingency request for an invoice
   * (matches Swift ContingencyRequestManager.createContingencyRequest)
   */
  async createContingencyRequest(
    invoice: Invoice,
    company: Company,
    reason: ContingencyReason = ContingencyReason.ApiUnavailable
  ): Promise<ContingencyRequestResult> {
    try {
      console.log(`🚨 ContingencyService: Creating contingency request for invoice ${invoice.invoiceNumber}`);
      
      const request: ContingencyRequest = {
        id: `contingency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoice: {
          ...invoice,
          status: InvoiceStatus.Sincronizando, // Mark as syncing
        },
        company,
        createdAt: new Date().toISOString(),
        submissionAttempts: 0,
        isSubmitted: false,
      };

      // Store the contingency request
      await this.storeContingencyRequest(request);
      
      // Start auto-submission monitoring
      this.startAutoSubmission();
      
      console.log(`✅ ContingencyService: Contingency request created with ID: ${request.id}`);
      
      return {
        success: true,
        requestId: request.id,
        message: 'Factura guardada para envío automático cuando la conexión se restablezca',
        shouldRetryLater: true,
      };
      
    } catch (error) {
      console.error('❌ ContingencyService: Error creating contingency request:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error creando solicitud de contingencia',
      };
    }
  }

  /**
   * Get all pending contingency requests
   */
  async getPendingRequests(): Promise<ContingencyRequest[]> {
    try {
      const requests = await this.getStoredContingencyRequests();
      return requests.filter(request => !request.isSubmitted);
    } catch (error) {
      console.error('❌ ContingencyService: Error getting pending requests:', error);
      return [];
    }
  }

  /**
   * Get all contingency requests (pending and submitted)
   */
  async getAllRequests(): Promise<ContingencyRequest[]> {
    try {
      return await this.getStoredContingencyRequests();
    } catch (error) {
      console.error('❌ ContingencyService: Error getting all requests:', error);
      return [];
    }
  }

  /**
   * Submit all pending contingency requests
   * (matches Swift ContingencyRequestManager.submitAllPendingRequests)
   */
  async submitPendingRequests(): Promise<ContingencySubmissionResult> {
    console.log('📤 ContingencyService: Submitting all pending contingency requests');
    
    const pendingRequests = await this.getPendingRequests();
    
    if (pendingRequests.length === 0) {
      console.log('📤 ContingencyService: No pending contingency requests to submit');
      return {
        success: true,
        submitted: 0,
        failed: 0,
        results: [],
      };
    }

    console.log(`📤 ContingencyService: Found ${pendingRequests.length} pending requests to submit`);
    
    let submitted = 0;
    let failed = 0;
    const results: ContingencySubmissionResult['results'] = [];

    // Submit requests sequentially to avoid overwhelming the API
    for (const request of pendingRequests) {
      try {
        const result = await this.submitSingleRequest(request);
        
        if (result.success) {
          submitted++;
          console.log(`✅ ContingencyService: Successfully submitted contingency request ${request.id}`);
        } else {
          failed++;
          console.log(`❌ ContingencyService: Failed to submit contingency request ${request.id}: ${result.error}`);
        }
        
        results.push(result);
        
        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`❌ ContingencyService: Error submitting contingency request ${request.id}:`, error);
        
        results.push({
          requestId: request.id,
          invoiceNumber: request.invoice.invoiceNumber,
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log(`📤 ContingencyService: Submission complete. ${submitted} successful, ${failed} failed`);
    
    return {
      success: submitted > 0,
      submitted,
      failed,
      results,
    };
  }

  /**
   * Submit a single contingency request
   */
  private async submitSingleRequest(
    request: ContingencyRequest
  ): Promise<{
    requestId: string;
    invoiceNumber: string;
    success: boolean;
    error?: string;
    controlNumber?: string;
    generationCode?: string;
  }> {
    try {
      console.log(`📤 ContingencyService: Submitting contingency request ${request.id} for invoice ${request.invoice.invoiceNumber}`);
      
      // Update attempt count
      const updatedRequest: ContingencyRequest = {
        ...request,
        submissionAttempts: request.submissionAttempts + 1,
        lastAttemptAt: new Date().toISOString(),
      };

      // TODO: Implement proper DTE submission for contingency requests
      // This would require converting the invoice to DTE format and using submitDTE
      // For now, simulate a failed submission to prevent errors
      console.log('📤 ContingencyService: TODO - Implement DTE conversion for contingency submission');
      
      const dteResult = { success: false, message: 'DTE submission not yet implemented for contingency' };

      if (dteResult.success && dteResult.data) {
        // Mark as successfully submitted
        const submittedRequest: ContingencyRequest = {
          ...updatedRequest,
          isSubmitted: true,
          submittedAt: new Date().toISOString(),
          controlNumber: dteResult.data.codigoGeneracion,
          generationCode: dteResult.data.codigoGeneracion,
        };

        await this.updateContingencyRequest(submittedRequest);
        
        return {
          requestId: request.id,
          invoiceNumber: request.invoice.invoiceNumber,
          success: true,
          controlNumber: dteResult.data.codigoGeneracion,
          generationCode: dteResult.data.codigoGeneracion,
        };
        
      } else {
        // Update with error and check if should retry
        const errorMessage = dteResult.message || 'Unknown submission error';
        const shouldRetry = updatedRequest.submissionAttempts < ContingencyService.MAX_ATTEMPTS;
        
        if (shouldRetry) {
          updatedRequest.lastError = errorMessage;
          await this.updateContingencyRequest(updatedRequest);
        } else {
          // Mark as failed after max attempts
          updatedRequest.lastError = `Max attempts exceeded: ${errorMessage}`;
          await this.updateContingencyRequest(updatedRequest);
        }
        
        return {
          requestId: request.id,
          invoiceNumber: request.invoice.invoiceNumber,
          success: false,
          error: errorMessage,
        };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update request with error
      const updatedRequest: ContingencyRequest = {
        ...request,
        submissionAttempts: request.submissionAttempts + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: errorMessage,
      };
      
      await this.updateContingencyRequest(updatedRequest);
      
      return {
        requestId: request.id,
        invoiceNumber: request.invoice.invoiceNumber,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Start automatic submission monitoring
   * (matches Swift ContingencyRequestManager.startAutoSubmissionTimer)
   */
  startAutoSubmission(): void {
    if (this.autoSubmissionTimer) {
      clearInterval(this.autoSubmissionTimer);
    }

    console.log('🔄 ContingencyService: Starting auto-submission monitoring');
    
    this.autoSubmissionTimer = setInterval(async () => {
      try {
        const pendingRequests = await this.getPendingRequests();
        
        if (pendingRequests.length > 0) {
          console.log(`🔄 ContingencyService: Auto-submitting ${pendingRequests.length} pending requests`);
          await this.submitPendingRequests();
        }
        
      } catch (error) {
        console.error('❌ ContingencyService: Error in auto-submission:', error);
      }
    }, ContingencyService.RETRY_DELAY);
  }

  /**
   * Stop automatic submission monitoring
   */
  stopAutoSubmission(): void {
    if (this.autoSubmissionTimer) {
      console.log('🛑 ContingencyService: Stopping auto-submission monitoring');
      clearInterval(this.autoSubmissionTimer);
      this.autoSubmissionTimer = null;
    }
  }

  /**
   * Clear old contingency requests (older than 24 hours)
   */
  async cleanupOldRequests(): Promise<number> {
    try {
      const requests = await this.getStoredContingencyRequests();
      const cutoffTime = new Date(Date.now() - ContingencyService.MAX_AGE_HOURS * 60 * 60 * 1000);
      
      const validRequests = requests.filter(request => {
        const requestTime = new Date(request.createdAt);
        return requestTime > cutoffTime;
      });
      
      const removedCount = requests.length - validRequests.length;
      
      if (removedCount > 0) {
        await AsyncStorage.setItem(ContingencyService.STORAGE_KEY, JSON.stringify(validRequests));
        console.log(`🧹 ContingencyService: Cleaned up ${removedCount} old contingency requests`);
      }
      
      return removedCount;
      
    } catch (error) {
      console.error('❌ ContingencyService: Error cleaning up old requests:', error);
      return 0;
    }
  }

  /**
   * Remove a specific contingency request
   */
  async removeRequest(requestId: string): Promise<boolean> {
    try {
      const requests = await this.getStoredContingencyRequests();
      const filteredRequests = requests.filter(request => request.id !== requestId);
      
      await AsyncStorage.setItem(ContingencyService.STORAGE_KEY, JSON.stringify(filteredRequests));
      
      console.log(`🗑️ ContingencyService: Removed contingency request ${requestId}`);
      return true;
      
    } catch (error) {
      console.error('❌ ContingencyService: Error removing request:', error);
      return false;
    }
  }

  /**
   * Check if contingency mode should be activated
   * (matches Swift ContingencyRequestManager.shouldActivateContingency)
   */
  async shouldActivateContingency(): Promise<boolean> {
    try {
      // TODO: Implement API connectivity test in InvoiceService
      // For now, assume API is available to prevent errors
      console.log('🚨 ContingencyService: TODO - Implement API connectivity test');
      return false; // Assume API is available
      
    } catch (error) {
      console.log('🚨 ContingencyService: API connectivity test failed, activating contingency mode');
      return true;
    }
  }

  /**
   * Get contingency statistics
   */
  async getContingencyStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    submittedRequests: number;
    failedRequests: number;
  }> {
    try {
      const requests = await this.getStoredContingencyRequests();
      
      return {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => !r.isSubmitted).length,
        submittedRequests: requests.filter(r => r.isSubmitted).length,
        failedRequests: requests.filter(r => r.submissionAttempts >= ContingencyService.MAX_ATTEMPTS && !r.isSubmitted).length,
      };
      
    } catch (error) {
      console.error('❌ ContingencyService: Error getting stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        submittedRequests: 0,
        failedRequests: 0,
      };
    }
  }

  /**
   * Set environment (production/test)
   */
  setEnvironment(isProduction: boolean): void {
    this.invoiceService.setEnvironment(isProduction);
  }

  // Private helper methods

  private async storeContingencyRequest(request: ContingencyRequest): Promise<void> {
    const requests = await this.getStoredContingencyRequests();
    requests.push(request);
    await AsyncStorage.setItem(ContingencyService.STORAGE_KEY, JSON.stringify(requests));
  }

  private async updateContingencyRequest(updatedRequest: ContingencyRequest): Promise<void> {
    const requests = await this.getStoredContingencyRequests();
    const index = requests.findIndex(r => r.id === updatedRequest.id);
    
    if (index !== -1) {
      requests[index] = updatedRequest;
      await AsyncStorage.setItem(ContingencyService.STORAGE_KEY, JSON.stringify(requests));
    }
  }

  private async getStoredContingencyRequests(): Promise<ContingencyRequest[]> {
    try {
      const stored = await AsyncStorage.getItem(ContingencyService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ ContingencyService: Error getting stored requests:', error);
      return [];
    }
  }
}

// Export singleton instance
let contingencyServiceInstance: ContingencyService | null = null;

export const createContingencyService = (isProduction: boolean = false): ContingencyService => {
  if (!contingencyServiceInstance) {
    contingencyServiceInstance = new ContingencyService(isProduction);
  }
  return contingencyServiceInstance;
};

export const getContingencyService = (): ContingencyService | null => {
  return contingencyServiceInstance;
};

export { ContingencyService };
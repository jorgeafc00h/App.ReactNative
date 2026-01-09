// Real-time Invoice Status Tracking Service
// Matches SwiftUI invoice status monitoring functionality

import { EventEmitter } from 'events';
import { InvoiceService } from '../api/InvoiceService';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { Company } from '../../types/company';

export interface InvoiceStatusUpdate {
  invoiceId: string;
  oldStatus: InvoiceStatus;
  newStatus: InvoiceStatus;
  generationCode?: string;
  controlNumber?: string;
  receptionSeal?: string;
  timestamp: string;
  error?: string;
}

export interface TrackingOptions {
  pollingInterval: number; // milliseconds
  maxRetries: number;
  timeout: number;
}

class InvoiceStatusTrackerService extends EventEmitter {
  private invoiceService: InvoiceService;
  private trackedInvoices: Map<string, NodeJS.Timeout> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private retryCounters: Map<string, number> = new Map();
  
  private defaultOptions: TrackingOptions = {
    pollingInterval: 30000, // 30 seconds - matches Swift polling frequency
    maxRetries: 10, // Max retries before giving up
    timeout: 15000, // 15 seconds request timeout
  };

  constructor(isProduction: boolean = false) {
    super();
    this.invoiceService = new InvoiceService(isProduction);
  }

  /**
   * Start tracking an invoice status (matches Swift startMonitoring)
   */
  startTracking(
    invoice: Invoice, 
    company: Company, 
    options: Partial<TrackingOptions> = {}
  ): void {
    const opts = { ...this.defaultOptions, ...options };
    const key = `${invoice.id}_${company.id}`;
    
    // Stop any existing tracking for this invoice
    this.stopTracking(invoice.id);
    
    console.log(`📊 InvoiceStatusTracker: Starting tracking for invoice ${invoice.invoiceNumber}`);
    
    // Only track invoices that are in "Sincronizando" status
    if (invoice.status !== InvoiceStatus.Sincronizando) {
      console.log(`📊 InvoiceStatusTracker: Invoice ${invoice.invoiceNumber} not in tracking state (${invoice.status})`);
      return;
    }
    
    // Initialize retry counter
    this.retryCounters.set(key, 0);
    
    // Start immediate check, then set up polling
    this.checkInvoiceStatus(invoice, company, opts);
    
    // Set up periodic polling
    const intervalId = setInterval(() => {
      this.checkInvoiceStatus(invoice, company, opts);
    }, opts.pollingInterval);
    
    this.pollingIntervals.set(key, intervalId);
    
    // Set up maximum tracking timeout (matches Swift timeout)
    const timeoutId = setTimeout(() => {
      console.log(`⏱️ InvoiceStatusTracker: Tracking timeout for invoice ${invoice.invoiceNumber}`);
      this.stopTracking(invoice.id);
      this.emit('trackingTimeout', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        timestamp: new Date().toISOString(),
      });
    }, 10 * 60 * 1000); // 10 minutes max tracking time
    
    this.trackedInvoices.set(key, timeoutId);
  }

  /**
   * Stop tracking an invoice (matches Swift stopMonitoring)
   */
  stopTracking(invoiceId: string): void {
    console.log(`📊 InvoiceStatusTracker: Stopping tracking for invoice ${invoiceId}`);
    
    // Find and clear all related timers
    const keysToRemove: string[] = [];
    
    for (const [key, timeoutId] of this.trackedInvoices) {
      if (key.startsWith(invoiceId)) {
        clearTimeout(timeoutId);
        keysToRemove.push(key);
      }
    }
    
    for (const [key, intervalId] of this.pollingIntervals) {
      if (key.startsWith(invoiceId)) {
        clearInterval(intervalId);
        keysToRemove.push(key);
      }
    }
    
    // Clean up maps
    keysToRemove.forEach(key => {
      this.trackedInvoices.delete(key);
      this.pollingIntervals.delete(key);
      this.retryCounters.delete(key);
    });
  }

  /**
   * Check invoice status with government API
   */
  private async checkInvoiceStatus(
    invoice: Invoice, 
    company: Company, 
    options: TrackingOptions
  ): Promise<void> {
    const key = `${invoice.id}_${company.id}`;
    const retryCount = this.retryCounters.get(key) || 0;
    
    try {
      console.log(`📊 InvoiceStatusTracker: Checking status for invoice ${invoice.invoiceNumber} (attempt ${retryCount + 1})`);
      
      // Use the query API to get current status
      if (!invoice.controlNumber) {
        console.log(`📊 InvoiceStatusTracker: No control number for invoice ${invoice.invoiceNumber}, cannot check status`);
        return;
      }

      const statusResponse = await this.invoiceService.queryDocumentStatus(
        invoice.controlNumber,
        company.nit
      );

      if (statusResponse && statusResponse.estado) {
        const currentStatus = this.mapAPIStatusToInvoiceStatus(statusResponse.estado);
        
        // Check if status has changed
        if (currentStatus !== invoice.status) {
          console.log(`✅ InvoiceStatusTracker: Status changed for invoice ${invoice.invoiceNumber}: ${invoice.status} → ${currentStatus}`);
          
          const statusUpdate: InvoiceStatusUpdate = {
            invoiceId: invoice.id,
            oldStatus: invoice.status,
            newStatus: currentStatus,
            generationCode: statusResponse.codigoGeneracion || invoice.generationCode,
            controlNumber: statusResponse.numeroControl || invoice.controlNumber,
            receptionSeal: statusResponse.selloRecibido || invoice.receptionSeal,
            timestamp: new Date().toISOString(),
          };

          this.emit('statusUpdate', statusUpdate);
          
          // If invoice is now completed or cancelled, stop tracking
          if (currentStatus === InvoiceStatus.Completada || currentStatus === InvoiceStatus.Anulada) {
            this.stopTracking(invoice.id);
          }
        } else {
          console.log(`📊 InvoiceStatusTracker: No status change for invoice ${invoice.invoiceNumber} (still ${currentStatus})`);
        }
        
        // Reset retry counter on successful check
        this.retryCounters.set(key, 0);
        
      } else {
        throw new Error('Invalid response from status query API');
      }
      
    } catch (error) {
      const newRetryCount = retryCount + 1;
      this.retryCounters.set(key, newRetryCount);
      
      console.error(`❌ InvoiceStatusTracker: Error checking status for invoice ${invoice.invoiceNumber} (attempt ${newRetryCount}):`, error);
      
      // Emit error event
      this.emit('statusError', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: newRetryCount,
        timestamp: new Date().toISOString(),
      });
      
      // Stop tracking if max retries exceeded
      if (newRetryCount >= options.maxRetries) {
        console.error(`❌ InvoiceStatusTracker: Max retries exceeded for invoice ${invoice.invoiceNumber}, stopping tracking`);
        this.stopTracking(invoice.id);
        
        this.emit('trackingFailed', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          reason: 'Max retries exceeded',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Map API status string to InvoiceStatus enum
   */
  private mapAPIStatusToInvoiceStatus(apiStatus: string): InvoiceStatus {
    // Map government API status responses to our InvoiceStatus enum
    switch (apiStatus.toLowerCase()) {
      case 'procesado':
      case 'autorizado':
      case 'completado':
        return InvoiceStatus.Completada;
      case 'rechazado':
      case 'anulado':
      case 'invalidado':
        return InvoiceStatus.Anulada;
      case 'procesando':
      case 'en_proceso':
      case 'pendiente':
        return InvoiceStatus.Sincronizando;
      case 'modificado':
        return InvoiceStatus.Modificada;
      default:
        return InvoiceStatus.Sincronizando; // Default to processing state
    }
  }

  /**
   * Start tracking multiple invoices
   */
  startBatchTracking(
    invoices: Invoice[], 
    company: Company, 
    options: Partial<TrackingOptions> = {}
  ): void {
    console.log(`📊 InvoiceStatusTracker: Starting batch tracking for ${invoices.length} invoices`);
    
    invoices.forEach(invoice => {
      // Add small delay between each tracking start to avoid API rate limits
      setTimeout(() => {
        this.startTracking(invoice, company, options);
      }, Math.random() * 5000); // Random delay up to 5 seconds
    });
  }

  /**
   * Stop tracking all invoices
   */
  stopAllTracking(): void {
    console.log('📊 InvoiceStatusTracker: Stopping all tracking');
    
    // Clear all timeouts and intervals
    this.trackedInvoices.forEach((timeoutId) => clearTimeout(timeoutId));
    this.pollingIntervals.forEach((intervalId) => clearInterval(intervalId));
    
    // Clear maps
    this.trackedInvoices.clear();
    this.pollingIntervals.clear();
    this.retryCounters.clear();
    
    this.emit('allTrackingStopped', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get currently tracked invoice IDs
   */
  getTrackedInvoiceIds(): string[] {
    const invoiceIds: string[] = [];
    
    this.trackedInvoices.forEach((_, key) => {
      const invoiceId = key.split('_')[0];
      if (!invoiceIds.includes(invoiceId)) {
        invoiceIds.push(invoiceId);
      }
    });
    
    return invoiceIds;
  }

  /**
   * Check if an invoice is currently being tracked
   */
  isTracking(invoiceId: string): boolean {
    return this.getTrackedInvoiceIds().includes(invoiceId);
  }

  /**
   * Update polling interval for all tracked invoices
   */
  updatePollingInterval(newInterval: number): void {
    console.log(`📊 InvoiceStatusTracker: Updating polling interval to ${newInterval}ms`);
    this.defaultOptions.pollingInterval = newInterval;
    
    // Note: This won't affect currently running trackers, only new ones
    // To update existing trackers, they would need to be restarted
  }

  /**
   * Set production/test environment
   */
  setEnvironment(isProduction: boolean): void {
    this.invoiceService.setEnvironment(isProduction);
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats(): {
    totalTracked: number;
    retryCounters: Record<string, number>;
    pollingInterval: number;
  } {
    const retryCounters: Record<string, number> = {};
    this.retryCounters.forEach((count, key) => {
      retryCounters[key] = count;
    });
    
    return {
      totalTracked: this.trackedInvoices.size,
      retryCounters,
      pollingInterval: this.defaultOptions.pollingInterval,
    };
  }
}

// Export singleton instance
let trackerInstance: InvoiceStatusTrackerService | null = null;

export const createInvoiceStatusTracker = (isProduction: boolean = false): InvoiceStatusTrackerService => {
  if (!trackerInstance) {
    trackerInstance = new InvoiceStatusTrackerService(isProduction);
  }
  return trackerInstance;
};

export const getInvoiceStatusTracker = (): InvoiceStatusTrackerService | null => {
  return trackerInstance;
};

export { InvoiceStatusTrackerService };
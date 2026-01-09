// React Hook for Invoice Status Tracking
// Provides real-time invoice status updates in React components

import { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateInvoice } from '../store/slices/invoiceSlice';
import { 
  InvoiceStatusTrackerService, 
  InvoiceStatusUpdate,
  TrackingOptions,
  createInvoiceStatusTracker 
} from '../services/tracking/InvoiceStatusTracker';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { Company } from '../types/company';

export interface UseInvoiceStatusTrackingResult {
  // Tracking state
  isTracking: boolean;
  trackedInvoices: string[];
  trackingStats: {
    totalTracked: number;
    retryCounters: Record<string, number>;
    pollingInterval: number;
  };
  
  // Tracking actions
  startTracking: (invoice: Invoice, options?: Partial<TrackingOptions>) => void;
  stopTracking: (invoiceId: string) => void;
  startBatchTracking: (invoices: Invoice[], options?: Partial<TrackingOptions>) => void;
  stopAllTracking: () => void;
  
  // Status updates
  lastStatusUpdate: InvoiceStatusUpdate | null;
  trackingErrors: Array<{
    invoiceId: string;
    invoiceNumber: string;
    error: string;
    retryCount: number;
    timestamp: string;
  }>;
}

export const useInvoiceStatusTracking = (): UseInvoiceStatusTrackingResult => {
  const dispatch = useAppDispatch();
  const { currentCompany } = useAppSelector(state => state.companies);
  const isProduction = currentCompany?.environment === 'PRODUCTION' && currentCompany?.isTestAccount !== true;
  
  // Local state
  const [tracker, setTracker] = useState<InvoiceStatusTrackerService | null>(null);
  const [trackedInvoices, setTrackedInvoices] = useState<string[]>([]);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<InvoiceStatusUpdate | null>(null);
  const [trackingErrors, setTrackingErrors] = useState<Array<{
    invoiceId: string;
    invoiceNumber: string;
    error: string;
    retryCount: number;
    timestamp: string;
  }>>([]);
  const [trackingStats, setTrackingStats] = useState({
    totalTracked: 0,
    retryCounters: {},
    pollingInterval: 30000,
  });

  // Initialize tracker
  useEffect(() => {
    const trackerInstance = createInvoiceStatusTracker(isProduction);
    setTracker(trackerInstance);
    
    return () => {
      // Cleanup on unmount
      trackerInstance.stopAllTracking();
    };
  }, [isProduction]);

  // Set up event listeners
  useEffect(() => {
    if (!tracker) return;

    // Status update handler
    const handleStatusUpdate = (update: InvoiceStatusUpdate) => {
      console.log('📱 useInvoiceStatusTracking: Received status update', update);
      
      setLastStatusUpdate(update);
      
      // Update invoice in Redux store
      dispatch(updateInvoice({
        id: update.invoiceId,
        status: update.newStatus,
        generationCode: update.generationCode,
        controlNumber: update.controlNumber,
        receptionSeal: update.receptionSeal,
      }));
      
      // Update tracked invoices list
      updateTrackedInvoicesList();
    };

    // Error handler
    const handleStatusError = (errorData: {
      invoiceId: string;
      invoiceNumber: string;
      error: string;
      retryCount: number;
      timestamp: string;
    }) => {
      console.warn('📱 useInvoiceStatusTracking: Tracking error', errorData);
      
      setTrackingErrors(prev => {
        // Keep only the last 10 errors
        const newErrors = [errorData, ...prev.slice(0, 9)];
        return newErrors;
      });
      
      updateTrackedInvoicesList();
    };

    // Tracking timeout handler
    const handleTrackingTimeout = (data: {
      invoiceId: string;
      invoiceNumber: string;
      timestamp: string;
    }) => {
      console.warn('📱 useInvoiceStatusTracking: Tracking timeout', data);
      updateTrackedInvoicesList();
    };

    // Tracking failed handler
    const handleTrackingFailed = (data: {
      invoiceId: string;
      invoiceNumber: string;
      reason: string;
      timestamp: string;
    }) => {
      console.error('📱 useInvoiceStatusTracking: Tracking failed', data);
      
      // Add to error list
      setTrackingErrors(prev => [{
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        error: data.reason,
        retryCount: 0,
        timestamp: data.timestamp,
      }, ...prev.slice(0, 9)]);
      
      updateTrackedInvoicesList();
    };

    // All tracking stopped handler
    const handleAllTrackingStopped = () => {
      console.log('📱 useInvoiceStatusTracking: All tracking stopped');
      setTrackedInvoices([]);
      updateTrackingStats();
    };

    // Register event listeners
    tracker.on('statusUpdate', handleStatusUpdate);
    tracker.on('statusError', handleStatusError);
    tracker.on('trackingTimeout', handleTrackingTimeout);
    tracker.on('trackingFailed', handleTrackingFailed);
    tracker.on('allTrackingStopped', handleAllTrackingStopped);

    // Cleanup function
    return () => {
      tracker.off('statusUpdate', handleStatusUpdate);
      tracker.off('statusError', handleStatusError);
      tracker.off('trackingTimeout', handleTrackingTimeout);
      tracker.off('trackingFailed', handleTrackingFailed);
      tracker.off('allTrackingStopped', handleAllTrackingStopped);
    };
  }, [tracker, dispatch]);

  // Helper function to update tracked invoices list
  const updateTrackedInvoicesList = useCallback(() => {
    if (tracker) {
      const tracked = tracker.getTrackedInvoiceIds();
      setTrackedInvoices(tracked);
      updateTrackingStats();
    }
  }, [tracker]);

  // Helper function to update tracking stats
  const updateTrackingStats = useCallback(() => {
    if (tracker) {
      const stats = tracker.getTrackingStats();
      setTrackingStats(stats);
    }
  }, [tracker]);

  // Update tracked invoices list periodically
  useEffect(() => {
    const interval = setInterval(updateTrackedInvoicesList, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateTrackedInvoicesList]);

  // Action functions
  const startTracking = useCallback((invoice: Invoice, options?: Partial<TrackingOptions>) => {
    if (!tracker || !currentCompany) {
      console.warn('📱 useInvoiceStatusTracking: Cannot start tracking - tracker or company not available');
      return;
    }

    console.log(`📱 useInvoiceStatusTracking: Starting tracking for invoice ${invoice.invoiceNumber}`);
    tracker.startTracking(invoice, currentCompany, options);
    updateTrackedInvoicesList();
  }, [tracker, currentCompany, updateTrackedInvoicesList]);

  const stopTracking = useCallback((invoiceId: string) => {
    if (!tracker) {
      console.warn('📱 useInvoiceStatusTracking: Cannot stop tracking - tracker not available');
      return;
    }

    console.log(`📱 useInvoiceStatusTracking: Stopping tracking for invoice ${invoiceId}`);
    tracker.stopTracking(invoiceId);
    updateTrackedInvoicesList();
  }, [tracker, updateTrackedInvoicesList]);

  const startBatchTracking = useCallback((invoices: Invoice[], options?: Partial<TrackingOptions>) => {
    if (!tracker || !currentCompany) {
      console.warn('📱 useInvoiceStatusTracking: Cannot start batch tracking - tracker or company not available');
      return;
    }

    console.log(`📱 useInvoiceStatusTracking: Starting batch tracking for ${invoices.length} invoices`);
    tracker.startBatchTracking(invoices, currentCompany, options);
    updateTrackedInvoicesList();
  }, [tracker, currentCompany, updateTrackedInvoicesList]);

  const stopAllTracking = useCallback(() => {
    if (!tracker) {
      console.warn('📱 useInvoiceStatusTracking: Cannot stop all tracking - tracker not available');
      return;
    }

    console.log('📱 useInvoiceStatusTracking: Stopping all tracking');
    tracker.stopAllTracking();
    setTrackedInvoices([]);
    updateTrackingStats();
  }, [tracker, updateTrackingStats]);

  return {
    // Tracking state
    isTracking: trackedInvoices.length > 0,
    trackedInvoices,
    trackingStats,
    
    // Tracking actions
    startTracking,
    stopTracking,
    startBatchTracking,
    stopAllTracking,
    
    // Status updates
    lastStatusUpdate,
    trackingErrors,
  };
};

// Helper hook for auto-tracking invoices in Sincronizando status
export const useAutoInvoiceTracking = () => {
  const { invoices } = useAppSelector(state => state.invoices);
  const { currentCompany } = useAppSelector(state => state.companies);
  const { startTracking, stopTracking, isTracking } = useInvoiceStatusTracking();

  useEffect(() => {
    if (!currentCompany) return;

    // Find all invoices in Sincronizando status
    const syncingInvoices = invoices.filter(invoice => 
      invoice.status === InvoiceStatus.Sincronizando &&
      invoice.controlNumber // Only track invoices with control numbers
    );

    console.log(`📱 useAutoInvoiceTracking: Found ${syncingInvoices.length} invoices to auto-track`);

    // Start tracking for each syncing invoice
    syncingInvoices.forEach(invoice => {
      startTracking(invoice, {
        pollingInterval: 30000, // 30 seconds
        maxRetries: 20, // More retries for auto-tracking
        timeout: 20000, // 20 seconds timeout
      });
    });

    // Cleanup function
    return () => {
      // Note: We don't stop all tracking here as the user might want to continue tracking
      // Tracking will naturally stop when invoices change status
    };
  }, [invoices, currentCompany, startTracking]);

  return {
    isAutoTracking: isTracking,
  };
};
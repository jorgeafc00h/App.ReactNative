// React Hook for Contingency Request Management
// Handles offline invoice submission and automatic retry logic

import { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateInvoice } from '../store/slices/invoiceSlice';
import {
  ContingencyService,
  ContingencyRequest,
  ContingencyRequestResult,
  ContingencySubmissionResult,
  ContingencyReason,
  createContingencyService,
} from '../services/contingency/ContingencyService';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { Company } from '../types/company';

export interface UseContingencyRequestsResult {
  // Contingency state
  isContingencyMode: boolean;
  pendingRequests: ContingencyRequest[];
  allRequests: ContingencyRequest[];
  stats: {
    totalRequests: number;
    pendingRequests: number;
    submittedRequests: number;
    failedRequests: number;
  };

  // Contingency actions
  createContingencyRequest: (
    invoice: Invoice, 
    reason?: ContingencyReason
  ) => Promise<ContingencyRequestResult>;
  submitPendingRequests: () => Promise<ContingencySubmissionResult>;
  removeRequest: (requestId: string) => Promise<boolean>;
  cleanupOldRequests: () => Promise<number>;
  
  // Auto-submission control
  isAutoSubmissionActive: boolean;
  startAutoSubmission: () => void;
  stopAutoSubmission: () => void;
  
  // Utilities
  refreshRequests: () => Promise<void>;
  checkContingencyMode: () => Promise<boolean>;
}

export const useContingencyRequests = (): UseContingencyRequestsResult => {
  const dispatch = useAppDispatch();
  const { currentCompany } = useAppSelector(state => state.companies);
  const isProduction = currentCompany?.environment === 'PRODUCTION' && currentCompany?.isTestAccount !== true;
  
  // Local state
  const [contingencyService, setContingencyService] = useState<ContingencyService | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ContingencyRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ContingencyRequest[]>([]);
  const [isContingencyMode, setIsContingencyMode] = useState(false);
  const [isAutoSubmissionActive, setIsAutoSubmissionActive] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    submittedRequests: 0,
    failedRequests: 0,
  });

  // Initialize contingency service
  useEffect(() => {
    const service = createContingencyService(isProduction);
    setContingencyService(service);
    
    // Start auto-submission by default if there are pending requests
    const initializeAutoSubmission = async () => {
      const pending = await service.getPendingRequests();
      if (pending.length > 0) {
        console.log('📱 useContingencyRequests: Found pending requests, starting auto-submission');
        service.startAutoSubmission();
        setIsAutoSubmissionActive(true);
      }
    };
    
    initializeAutoSubmission();
    
    return () => {
      // Cleanup on unmount - keep auto-submission running for background processing
      console.log('📱 useContingencyRequests: Component unmounting, keeping auto-submission active');
    };
  }, [isProduction]);

  // Refresh contingency requests and stats
  const refreshRequests = useCallback(async () => {
    if (!contingencyService) return;

    try {
      const [pending, all, statsData] = await Promise.all([
        contingencyService.getPendingRequests(),
        contingencyService.getAllRequests(),
        contingencyService.getContingencyStats(),
      ]);

      setPendingRequests(pending);
      setAllRequests(all);
      setStats(statsData);
      
      console.log(`📱 useContingencyRequests: Refreshed - ${pending.length} pending, ${all.length} total requests`);
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error refreshing requests:', error);
    }
  }, [contingencyService]);

  // Check if contingency mode should be active
  const checkContingencyMode = useCallback(async (): Promise<boolean> => {
    if (!contingencyService) return false;

    try {
      const shouldActivate = await contingencyService.shouldActivateContingency();
      setIsContingencyMode(shouldActivate);
      
      if (shouldActivate) {
        console.log('🚨 useContingencyRequests: Contingency mode activated - API unavailable');
      } else {
        console.log('✅ useContingencyRequests: Normal mode - API available');
      }
      
      return shouldActivate;
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error checking contingency mode:', error);
      setIsContingencyMode(true); // Default to contingency mode on error
      return true;
    }
  }, [contingencyService]);

  // Auto-refresh requests periodically
  useEffect(() => {
    if (!contingencyService) return;

    // Initial load
    refreshRequests();
    
    // Set up periodic refresh
    const interval = setInterval(refreshRequests, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [contingencyService, refreshRequests]);

  // Check contingency mode periodically
  useEffect(() => {
    if (!contingencyService) return;

    // Initial check
    checkContingencyMode();
    
    // Set up periodic check
    const interval = setInterval(checkContingencyMode, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [contingencyService, checkContingencyMode]);

  // Action functions
  const createContingencyRequest = useCallback(async (
    invoice: Invoice,
    reason: ContingencyReason = ContingencyReason.ApiUnavailable
  ): Promise<ContingencyRequestResult> => {
    if (!contingencyService || !currentCompany) {
      return {
        success: false,
        message: 'Servicio de contingencia no disponible',
      };
    }

    console.log(`📱 useContingencyRequests: Creating contingency request for invoice ${invoice.invoiceNumber}`);
    
    try {
      const result = await contingencyService.createContingencyRequest(invoice, currentCompany, reason);
      
      if (result.success) {
        // Update invoice status to Sincronizando in Redux
        dispatch(updateInvoice({
          id: invoice.id,
          status: InvoiceStatus.Sincronizando,
        }));
        
        // Refresh requests list
        await refreshRequests();
        
        // Start auto-submission if not already active
        if (!isAutoSubmissionActive) {
          startAutoSubmission();
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error creating contingency request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }, [contingencyService, currentCompany, dispatch, refreshRequests, isAutoSubmissionActive]);

  const submitPendingRequests = useCallback(async (): Promise<ContingencySubmissionResult> => {
    if (!contingencyService) {
      return {
        success: false,
        submitted: 0,
        failed: 0,
        results: [],
      };
    }

    console.log('📱 useContingencyRequests: Submitting all pending requests');
    
    try {
      const result = await contingencyService.submitPendingRequests();
      
      // Update Redux store with successful submissions
      for (const submissionResult of result.results) {
        if (submissionResult.success && submissionResult.controlNumber) {
          // Find the corresponding request to get the invoice ID
          const request = allRequests.find(r => r.id === submissionResult.requestId);
          if (request) {
            dispatch(updateInvoice({
              id: request.invoice.id,
              status: InvoiceStatus.Completada,
              controlNumber: submissionResult.controlNumber,
              generationCode: submissionResult.generationCode,
            }));
          }
        }
      }
      
      // Refresh requests list
      await refreshRequests();
      
      return result;
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error submitting pending requests:', error);
      return {
        success: false,
        submitted: 0,
        failed: 0,
        results: [],
      };
    }
  }, [contingencyService, allRequests, dispatch, refreshRequests]);

  const removeRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!contingencyService) return false;

    console.log(`📱 useContingencyRequests: Removing contingency request ${requestId}`);
    
    try {
      const success = await contingencyService.removeRequest(requestId);
      
      if (success) {
        await refreshRequests();
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error removing request:', error);
      return false;
    }
  }, [contingencyService, refreshRequests]);

  const cleanupOldRequests = useCallback(async (): Promise<number> => {
    if (!contingencyService) return 0;

    console.log('📱 useContingencyRequests: Cleaning up old requests');
    
    try {
      const removedCount = await contingencyService.cleanupOldRequests();
      
      if (removedCount > 0) {
        await refreshRequests();
      }
      
      return removedCount;
      
    } catch (error) {
      console.error('❌ useContingencyRequests: Error cleaning up old requests:', error);
      return 0;
    }
  }, [contingencyService, refreshRequests]);

  const startAutoSubmission = useCallback(() => {
    if (!contingencyService) return;

    console.log('📱 useContingencyRequests: Starting auto-submission');
    contingencyService.startAutoSubmission();
    setIsAutoSubmissionActive(true);
  }, [contingencyService]);

  const stopAutoSubmission = useCallback(() => {
    if (!contingencyService) return;

    console.log('📱 useContingencyRequests: Stopping auto-submission');
    contingencyService.stopAutoSubmission();
    setIsAutoSubmissionActive(false);
  }, [contingencyService]);

  return {
    // Contingency state
    isContingencyMode,
    pendingRequests,
    allRequests,
    stats,

    // Contingency actions
    createContingencyRequest,
    submitPendingRequests,
    removeRequest,
    cleanupOldRequests,
    
    // Auto-submission control
    isAutoSubmissionActive,
    startAutoSubmission,
    stopAutoSubmission,
    
    // Utilities
    refreshRequests,
    checkContingencyMode,
  };
};

// Helper hook for auto-contingency when API fails
export const useAutoContingency = () => {
  const { createContingencyRequest, isContingencyMode } = useContingencyRequests();

  const submitWithContingency = useCallback(async (
    invoice: Invoice,
    normalSubmissionFunction: () => Promise<{ success: boolean; message: string }>,
    reason: ContingencyReason = ContingencyReason.ApiUnavailable
  ): Promise<{ success: boolean; message: string; usedContingency?: boolean }> => {
    
    try {
      // Try normal submission first
      console.log('📱 useAutoContingency: Attempting normal submission');
      const normalResult = await normalSubmissionFunction();
      
      if (normalResult.success) {
        return normalResult;
      }
      
      // If normal submission fails and we're in contingency mode, create contingency request
      if (isContingencyMode) {
        console.log('📱 useAutoContingency: Normal submission failed, using contingency mode');
        
        const contingencyResult = await createContingencyRequest(invoice, reason);
        
        if (contingencyResult.success) {
          return {
            success: true,
            message: contingencyResult.message,
            usedContingency: true,
          };
        } else {
          return {
            success: false,
            message: `Error en envío normal: ${normalResult.message}. Error en contingencia: ${contingencyResult.message}`,
          };
        }
      } else {
        // Not in contingency mode, return original error
        return normalResult;
      }
      
    } catch (error) {
      console.error('❌ useAutoContingency: Error in submission with contingency:', error);
      
      // Try contingency as last resort
      try {
        console.log('📱 useAutoContingency: Exception occurred, trying contingency as fallback');
        const contingencyResult = await createContingencyRequest(invoice, reason);
        
        if (contingencyResult.success) {
          return {
            success: true,
            message: contingencyResult.message + ' (modo de emergencia)',
            usedContingency: true,
          };
        }
      } catch (contingencyError) {
        console.error('❌ useAutoContingency: Contingency fallback also failed:', contingencyError);
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido en el envío',
      };
    }
  }, [createContingencyRequest, isContingencyMode]);

  return {
    submitWithContingency,
    isContingencyMode,
  };
};
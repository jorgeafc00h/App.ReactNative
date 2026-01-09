// Invoice Invalidation Service
// Handles document invalidation (anulación) with El Salvador government API

import { InvoiceService } from '../api/InvoiceService';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { Company } from '../../types/company';
import { SecureStorageService } from '../security/SecureStorageService';
import { DTE_InvalidationRequest, ServiceCredentials } from '../../types/dte';

export interface InvalidationRequest {
  invoiceId: string;
  controlNumber: string;
  reason: InvalidationReason;
  customReason?: string;
  responsibleName: string;
  responsibleDocument: string;
  timestamp: string;
}

export interface InvalidationResult {
  success: boolean;
  message: string;
  invalidationId?: string;
  invalidatedAt?: string;
  error?: string;
}

// Invalidation reasons matching El Salvador tax authority requirements
export enum InvalidationReason {
  ErrorInformation = '1', // Error en la información del documento
  ProductReturn = '2',    // Devolución de producto
  MutualAgreement = '3',  // Anulación por acuerdo entre las partes
  Other = '4'            // Otro
}

// Invalidation reason descriptions
export const INVALIDATION_REASON_DESCRIPTIONS: Record<InvalidationReason, string> = {
  [InvalidationReason.ErrorInformation]: 'Error en la información del documento',
  [InvalidationReason.ProductReturn]: 'Devolución de producto',
  [InvalidationReason.MutualAgreement]: 'Anulación por acuerdo entre las partes',
  [InvalidationReason.Other]: 'Otro',
};

class InvoiceInvalidationService {
  private invoiceService: InvoiceService;

  constructor(isProduction: boolean = false) {
    this.invoiceService = new InvoiceService(isProduction);
  }

  /**
   * Invalidate (anular) an invoice with the government API
   * (matches Swift DocumentInvalidationManager.invalidateDocument)
   */
  async invalidateInvoice(
    invoice: Invoice,
    company: Company,
    request: Omit<InvalidationRequest, 'invoiceId' | 'controlNumber' | 'timestamp'>
  ): Promise<InvalidationResult> {
    try {
      console.log(`🚫 InvoiceInvalidationService: Starting invalidation for invoice ${invoice.invoiceNumber}`);

      // Validate prerequisites
      const validation = this.validateInvalidationRequest(invoice, company, request);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Datos de invalidación inválidos',
        };
      }

      // Get company credentials
      const credentials = await SecureStorageService.getCredentials(company.nit);
      if (!credentials) {
        return {
          success: false,
          message: 'Credenciales de la empresa no encontradas. Configure las credenciales en Perfil > Empresas.',
        };
      }

      // Create DTE invalidation request (matches government API structure)
      const dteInvalidationRequest: DTE_InvalidationRequest = {
        // Document identification
        identificacion: {
          version: 1,
          ambiente: this.invoiceService.getEnvironmentCode(),
          tipoDte: '05', // Invalidation document type
          numeroControl: invoice.controlNumber || '',
          codigoGeneracion: invoice.generationCode || '',
          tipoModelo: 1,
          tipoOperacion: 1,
          fecEmi: this.formatDateOnly(new Date()),
          horEmi: this.formatTimeOnly(new Date()),
          tipoMoneda: 'USD'
        },
        
        // Invalidation details
        motivo: {
          tipoAnulacion: parseInt(this.getInvalidationReasonCode(request.reason)),
          motivoAnulacion: request.reason === InvalidationReason.Other 
            ? request.customReason || ''
            : INVALIDATION_REASON_DESCRIPTIONS[request.reason],
          nombreResponsable: request.responsibleName,
          tipDocResponsable: '36', // DUI type
          numDocResponsable: request.responsibleDocument,
          fechaSolicitud: this.formatDateOnly(new Date())
        },
        
        // Company information (emisor)
        emisor: {
          nit: company.nit || '',
          nrc: company.nrc || '',
          nombre: company.nombre,
          codActividad: company.codActividad,
          descActividad: company.descActividad,
          nombreComercial: company.nombreComercial,
          tipoEstablecimiento: company.tipoEstablecimiento,
          direccion: {
            departamento: company.departamento,
            municipio: company.municipio,
            complemento: company.complemento
          },
          telefono: company.telefono || '',
          correo: company.correo
        }
      } as any;

      // Create service credentials
      const serviceCredentials: ServiceCredentials = {
        user: credentials.user,
        credential: credentials.password,
        key: credentials.certificateKey || '',
        invoiceNumber: invoice.invoiceNumber
      };

      console.log('🚫 InvoiceInvalidationService: Sending invalidation request to government API');

      // Submit invalidation request to government API
      const apiResult = await this.invoiceService.invalidateDocument(
        dteInvalidationRequest,
        serviceCredentials
      );

      if (apiResult) {
        const invalidationId = `invalidation_${Date.now()}`; // Generate a simple ID
        
        console.log(`✅ InvoiceInvalidationService: Invoice ${invoice.invoiceNumber} invalidated successfully`);
        
        return {
          success: true,
          message: 'Documento anulado correctamente en el Ministerio de Hacienda',
          invalidationId,
          invalidatedAt: new Date().toISOString(),
        };
        
      } else {
        const errorMessage = 'Error en la anulación del documento';
        
        console.error(`❌ InvoiceInvalidationService: Invalidation failed for invoice ${invoice.invoiceNumber}: ${errorMessage}`);
        
        return {
          success: false,
          message: `Error al anular documento: ${errorMessage}`,
          error: errorMessage,
        };
      }

    } catch (error) {
      console.error('❌ InvoiceInvalidationService: Exception during invalidation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return {
        success: false,
        message: `Error al procesar anulación: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if an invoice can be invalidated
   */
  canInvalidateInvoice(invoice: Invoice): { canInvalidate: boolean; reason?: string } {
    // Only completed invoices can be invalidated
    if (invoice.status !== InvoiceStatus.Completada) {
      return {
        canInvalidate: false,
        reason: 'Solo se pueden anular documentos completados',
      };
    }

    // Must have control number (was successfully submitted to government)
    if (!invoice.controlNumber || !invoice.generationCode) {
      return {
        canInvalidate: false,
        reason: 'El documento no tiene código de generación o número de control',
      };
    }

    // Must not be already invalidated
    if (invoice.invalidatedViaApi) {
      return {
        canInvalidate: false,
        reason: 'El documento ya está anulado',
      };
    }

    // Check if it's too old (El Salvador has time limits for invalidation)
    const invoiceDate = new Date(invoice.date);
    const daysSinceInvoice = Math.floor((Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceInvoice > 30) { // 30 days limit
      return {
        canInvalidate: false,
        reason: 'No se puede anular un documento con más de 30 días de antigüedad',
      };
    }

    return { canInvalidate: true };
  }

  /**
   * Get invalidation status from government API
   * Note: This would require implementing document status query in InvoiceService
   */
  async getInvalidationStatus(
    controlNumber: string,
    company: Company
  ): Promise<{
    isInvalidated: boolean;
    invalidationDate?: string;
    invalidationReason?: string;
    error?: string;
  }> {
    try {
      console.log(`📄 InvoiceInvalidationService: Checking invalidation status for control number ${controlNumber}`);
      
      // For now, return based on local invoice state since API method doesn't exist
      // TODO: Implement queryDocumentStatus in InvoiceService
      return { isInvalidated: false, error: 'Status query not yet implemented' };
      
    } catch (error) {
      console.error('❌ InvoiceInvalidationService: Error checking invalidation status:', error);
      
      return {
        isInvalidated: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Validate invalidation request data
   */
  private validateInvalidationRequest(
    invoice: Invoice,
    company: Company,
    request: Omit<InvalidationRequest, 'invoiceId' | 'controlNumber' | 'timestamp'>
  ): { isValid: boolean; error?: string } {
    // Check if invoice can be invalidated
    const canInvalidate = this.canInvalidateInvoice(invoice);
    if (!canInvalidate.canInvalidate) {
      return { isValid: false, error: canInvalidate.reason };
    }

    // Validate company data
    if (!company.nit || !company.nombre) {
      return { isValid: false, error: 'Datos de empresa incompletos' };
    }

    // Validate reason
    if (!Object.values(InvalidationReason).includes(request.reason)) {
      return { isValid: false, error: 'Motivo de anulación inválido' };
    }

    // Validate custom reason if "Other" is selected
    if (request.reason === InvalidationReason.Other) {
      if (!request.customReason || request.customReason.trim().length < 5) {
        return { isValid: false, error: 'Debe especificar un motivo personalizado de al menos 5 caracteres' };
      }
    }

    // Validate responsible person data
    if (!request.responsibleName || request.responsibleName.trim().length < 3) {
      return { isValid: false, error: 'Nombre del responsable debe tener al menos 3 caracteres' };
    }

    if (!request.responsibleDocument || request.responsibleDocument.trim().length < 8) {
      return { isValid: false, error: 'Documento del responsable debe ser válido' };
    }

    return { isValid: true };
  }

  /**
   * Get the government API reason code for invalidation
   * (matches Swift AnulacionReason codes)
   */
  private getInvalidationReasonCode(reason: InvalidationReason): string {
    return reason; // The enum values match the API codes directly
  }

  /**
   * Get human-readable description for invalidation reason
   */
  getReasonDescription(reason: InvalidationReason): string {
    return INVALIDATION_REASON_DESCRIPTIONS[reason];
  }

  /**
   * Get all available invalidation reasons
   */
  getAvailableReasons(): Array<{ code: InvalidationReason; description: string }> {
    return Object.entries(INVALIDATION_REASON_DESCRIPTIONS).map(([code, description]) => ({
      code: code as InvalidationReason,
      description,
    }));
  }

  /**
   * Set environment (production/test)
   */
  setEnvironment(isProduction: boolean): void {
    this.invoiceService.setEnvironment(isProduction);
  }

  /**
   * Format date to YYYY-MM-DD only
   */
  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time to HH:MM:SS only
   */
  private formatTimeOnly(date: Date): string {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  /**
   * Test invalidation API connectivity
   * Note: This would require implementing testConnection in InvoiceService
   */
  async testInvalidationApi(): Promise<{ available: boolean; message: string }> {
    try {
      // For now, assume API is available since we can't test without the method
      // TODO: Implement testConnection in InvoiceService
      return {
        available: true,
        message: 'API de anulación disponible (sin verificación)',
      };
      
    } catch (error) {
      return {
        available: false,
        message: 'Error al conectar con API de anulación',
      };
    }
  }
}

// Export singleton instance
let invalidationServiceInstance: InvoiceInvalidationService | null = null;

export const createInvalidationService = (isProduction: boolean = false): InvoiceInvalidationService => {
  if (!invalidationServiceInstance) {
    invalidationServiceInstance = new InvoiceInvalidationService(isProduction);
  }
  return invalidationServiceInstance;
};

export const getInvalidationService = (): InvoiceInvalidationService | null => {
  return invalidationServiceInstance;
};

export { InvoiceInvalidationService };
// DTE Submission Modal Component
// Handles the complete workflow of submitting invoices to the government API

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateInvoice } from '../../store/slices/invoiceSlice';
import { Invoice, InvoiceType } from '../../types/invoice';
import { Company } from '../../types/company';
import { Customer } from '../../types/customer';
import { InvoiceService } from '../../services/api/InvoiceService';
import { getApiConfig } from '../../config/api';
import { getCertificateService } from '../../services/security/CertificateService';
import { DTE_Base, DTEResponseWrapper, ServiceCredentials } from '../../types/dte';
import { isProductionCompany } from '../../utils/companyEnvironment';
import { optionalString } from '../../utils/json';

interface DTESubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (response: DTEResponseWrapper) => void;
  invoice: Invoice | null;
  pdfData?: string;
}

type SubmissionStep = 
  | 'validating-certificate'
  | 'preparing-dte'
  | 'submitting-dte'
  | 'uploading-pdf'
  | 'completed'
  | 'error';

interface SubmissionProgress {
  step: SubmissionStep;
  message: string;
  progress: number; // 0-100
  error?: string;
}

export const DTESubmissionModal: React.FC<DTESubmissionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  invoice,
  pdfData,
}) => {
  const dispatch = useDispatch();
  const selectedCompany = useSelector((state: RootState) => state.companies.currentCompany);
  const customers = useSelector((state: RootState) => state.customers.customers);
  // Use company-specific environment (matches Swift).
  // IMPORTANT: never default to PROD when `isTestAccount` is missing.
  const isProduction = isProductionCompany(selectedCompany);

  const [invoiceService] = useState(() => new InvoiceService(isProduction));
  const [certificateService] = useState(() => getCertificateService(isProduction));
  
  const [progress, setProgress] = useState<SubmissionProgress>({
    step: 'validating-certificate',
    message: 'Iniciando proceso de envío...',
    progress: 0,
  });
  
  const [dteResponse, setDteResponse] = useState<DTEResponseWrapper | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (__DEV__ && selectedCompany) {
      console.log(
        `🏭 DTE: company env=${selectedCompany.environment} isTestAccount=${selectedCompany.isTestAccount} => isProduction=${isProduction}`
      );
    }
  }, [selectedCompany, isProduction]);

  // Update services environment when it changes
  useEffect(() => {
    invoiceService.setEnvironment(isProduction);
    certificateService.setEnvironment(isProduction);
  }, [isProduction, invoiceService, certificateService]);

  // Start submission when modal opens
  useEffect(() => {
    if (visible && invoice && selectedCompany && !submitting) {
      startSubmission();
    }
  }, [visible, invoice, selectedCompany]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setProgress({
        step: 'validating-certificate',
        message: 'Iniciando proceso de envío...',
        progress: 0,
      });
      setDteResponse(null);
      setSubmitting(false);
    }
  }, [visible]);

  const updateProgress = (step: SubmissionStep, message: string, progress: number, error?: string) => {
    setProgress({ step, message, progress, error });
  };

  const startSubmission = async () => {
    if (!invoice || !selectedCompany) return;

    const nit = selectedCompany.nit;
    if (!nit) {
      Alert.alert('Error', 'La empresa seleccionada no tiene NIT configurado.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Step 1: Validate Certificate (20%)
      updateProgress('validating-certificate', 'Validando certificado digital...', 20);
      
      const certificatePassword = await certificateService.getCertificatePassword(nit);
      
      if (!certificatePassword) {
        throw new Error('No se encontró certificado configurado para esta empresa. Configure su certificado digital primero.');
      }

      const certValidation = await certificateService.validateCertificate(
        nit,
        certificatePassword
      );

      if (!certValidation.isValid) {
        throw new Error('El certificado digital no es válido. Verifique su configuración.');
      }

      // Step 2: Prepare DTE (40%)
      updateProgress('preparing-dte', 'Preparando documento tributario electrónico...', 40);
      
      const dte = await prepareDTEFromInvoice(invoice, selectedCompany);
      const credentials: ServiceCredentials = {
        user: nit,
        credential: selectedCompany.credentials || '',
        key: certificatePassword,
        invoiceNumber: invoice.invoiceNumber || '',
      };

      // Step 3: Submit DTE (70%)
      updateProgress('submitting-dte', 'Enviando factura al Ministerio de Hacienda...', 70);
      
      const response = await invoiceService.submitDTE(dte, credentials);
      
      if (response.estado !== 'PROCESADO' && response.estado !== 'RECIBIDO') {
        throw new Error(`Error del Ministerio de Hacienda: ${response.descripcionMsg || 'Error desconocido'}`);
      }

      setDteResponse(response);

      // Step 4: Upload PDF (90%)
      if (pdfData) {
        updateProgress('uploading-pdf', 'Subiendo archivo PDF...', 90);
        
        await invoiceService.uploadPDF(
          pdfData,
          response.codigoGeneracion || invoice.invoiceNumber || '',
          nit
        );
      }

      // Step 5: Update Invoice Record (100%)
      updateProgress('completed', '¡Factura enviada exitosamente!', 100);
      
      // Update invoice with DTE response data
      dispatch(
        updateInvoice({
          id: invoice.id,
          generationCode: response.codigoGeneracion || '',
          receptionSeal: response.selloRecibido || '',
          status: 2,
        })
      );

      // Notify success after a brief delay to show completion
      setTimeout(() => {
        onSuccess(response);
      }, 1500);

    } catch (error) {
      console.error('❌ DTE Submission failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al enviar la factura';

      updateProgress('error', 'Error al enviar factura', progress.progress, errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const prepareDTEFromInvoice = async (invoice: Invoice, company: Company): Promise<DTE_Base> => {
    // This function converts the React Native Invoice to DTE format
    // Implementation matches SwiftUI DTEGenerator logic
    
    const currentDate = new Date();
    const environmentCode = getApiConfig(isProduction).environmentCode;

    const tipoDte = getDocumentTypeFromInvoiceType(invoice.invoiceType);
    const version = getVersionFromInvoiceType(invoice.invoiceType);

    const customer: Customer | undefined = invoice.customerId
      ? customers.find((c) => c.id === invoice.customerId)
      : undefined;

    // Swift always maps a receptor. In RN we must derive it from customerId.
    if (!customer) {
      throw new Error(
        'Esta factura no tiene cliente asignado o el cliente no existe. Seleccione un cliente antes de enviar a Hacienda.'
      );
    }

    const receptor = buildReceptor(invoice.invoiceType, customer);

    const roundTo = (value: number, decimals: number): number => {
      const factor = Math.pow(10, decimals);
      return Math.round((value + Number.EPSILON) * factor) / factor;
    };

    if (!invoice.totals) {
      throw new Error(
        'No se pudieron calcular los totales de la factura. Reintente o edite la factura antes de enviar a Hacienda.'
      );
    }

    const numeroControl = generateControlNumber(tipoDte, company, invoice);
    const codigoGeneracion = invoice.generationCode || generateUUID();

    const dte: DTE_Base = {
      identificacion: {
        version,
        // Must match Swift + backend expectations: production='01', development='00'
        ambiente: environmentCode,
        tipoDte,
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1, // Previo
        tipoOperacion: 1, // Normal
        fecEmi: currentDate.toISOString().split('T')[0],
        horEmi: currentDate.toTimeString().split(' ')[0],
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: company.nit ?? '',
        nrc: company.nrc ?? '',
        nombre: company.nombre,
        nombreComercial: company.nombreComercial,
        codActividad: company.codActividad || '47111',
        descActividad: optionalString(company.descActividad),
        // In Swift this is a code (company.tipoEstablecimiento), not the display name
        tipoEstablecimiento: company.tipoEstablecimiento || '01',
        direccion: {
          departamento: company.departamentoCode || '06',
          municipio: company.municipioCode || '05',
          complemento: company.complemento || company.direccion || '',
        },
        telefono: company.telefono || '',
        correo: company.correo || '',
        codEstableMH: optionalString(company.codEstableMH),
        codEstable: optionalString(company.codEstable),
        codPuntoVentaMH: optionalString(company.codPuntoVentaMH),
        codPuntoVenta: optionalString(company.codPuntoVenta),

        // Export-specific required field (backend expects this when tipoDte="11")
        ...(tipoDte === '11'
          ? {
              tipoItemExpor: 1,
              recintoFiscal: undefined,
              regimen: undefined,
            }
          : {}),
      },
      receptor,
      cuerpoDocumento: invoice.items?.map((item, index) => {
        const isCCF = invoice.invoiceType === InvoiceType.CCF;
        const productTotal = Number(item.quantity) * Number(item.unitPrice);
        const tax = roundTo(productTotal - productTotal / 1.13, 2);
        const precioUni = isCCF
          ? roundTo(Number(item.unitPrice) / 1.13, 2)
          : roundTo(Number(item.unitPrice), 8);

        return {
          numItem: index + 1,
          tipoItem: 2, // 1 producto, 2 servicios (Swift uses 2)
          numeroDocumento: undefined,
          cantidad: item.quantity,
          codigo: isCCF ? undefined : '1',
          codTributo: undefined,
          uniMedida: isCCF ? 59 : 99,
          descripcion: item.productName || `Item ${index + 1}`,
          precioUni,
          montoDescu: 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: isCCF ? roundTo(productTotal - tax, 2) : roundTo(productTotal, 2),
          psv: 0,
          noGravado: 0,
          ivaItem: isCCF ? undefined : tax,
        };
      }) || [],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        // Swift uses totalWithoutTax for CCF, otherwise totalAmount
        totalGravada: invoice.totals.isCCF ? invoice.totals.totalWithoutTax : invoice.totals.totalAmount,
        subTotalVentas: invoice.totals.isCCF ? invoice.totals.totalWithoutTax : invoice.totals.totalAmount,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        subTotal: invoice.totals.subTotal || 0,
        ivaRete1: customer.hasContributorRetention ? (invoice.totals.ivaRete1 || 0) : 0,
        reteRenta: 0,
        montoTotalOperacion: invoice.totals.totalAmount || 0,
        totalNoGravado: 0,
        totalPagar: invoice.totals.totalPagar || 0,
        totalLetras: convertNumberToWords(invoice.totals.totalPagar || 0),
        totalIva: invoice.totals.tax || 0,
        saldoFavor: 0,
        condicionOperacion: 1, // Contado
        pagos: tipoDte === '11'
          ? [{
              codigo: '05',
              montoPago: invoice.totals.totalAmount || 0,
              referencia: '',
            }]
          : undefined,

        ...(tipoDte === '11'
          ? {
              descuento: 0,
              seguro: 0,
              flete: 0,
              codIncoterms: undefined,
              descIncoterms: undefined,
              observaciones: '',
              // Swift export resumen sets totalIva=nil
              totalIva: undefined,
            }
          : {}),
      },
    };

    // Swift sets `documentoRelacionado=nil` for Factura; never send an empty array.
    if (tipoDte === '01') {
      dte.documentoRelacionado = undefined;
    }

    // Add tax information if CCF (matches Swift mapResumen)
    if (invoice.invoiceType === InvoiceType.CCF && invoice.totals.tax) {
      dte.resumen.tributos = [{
        codigo: '20',
        descripcion: 'Impuesto al Valor Agregado 13%',
        valor: invoice.totals.tax,
      }];
    } else {
      dte.resumen.tributos = undefined;
    }

    return dte;
  };

  // Matches Swift Extensions.documentTypeFromInvoiceType
  const getDocumentTypeFromInvoiceType = (invoiceType: InvoiceType): string => {
    switch (invoiceType) {
      case InvoiceType.Factura: return '01';
      case InvoiceType.CCF: return '03';
      case InvoiceType.NotaRemision: return '04';
      case InvoiceType.NotaCredito: return '05';
      case InvoiceType.NotaDebito: return '06';
      case InvoiceType.ComprobanteLiquidacion: return '08';
      case InvoiceType.FacturaExportacion: return '11';
      case InvoiceType.SujetoExcluido: return '14';
      default: return '01';
    }
  };

  // Matches Swift version rules in MHService.swift
  const getVersionFromInvoiceType = (invoiceType: InvoiceType): number => {
    switch (invoiceType) {
      case InvoiceType.Factura:
      case InvoiceType.FacturaExportacion:
      case InvoiceType.ComprobanteLiquidacion:
      case InvoiceType.SujetoExcluido:
        return 1;
      default:
        return 3;
    }
  };

  const buildReceptor = (invoiceType: InvoiceType, customer: Customer) => {
    const nombre = customer.businessName || `${customer.firstName} ${customer.lastName}`;

    const formatNationalId = (value: string | undefined): string | undefined => {
      if (!value) return undefined;
      const digits = value.replace(/\D/g, '');
      if (digits.length === 9) {
        return `${digits.slice(0, 8)}-${digits.slice(8)}`;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    // Basic doc mapping: NIT ("36") preferred if present, otherwise DUI ("13")
    const hasNit = !!customer.nit && customer.nit.trim().length > 0;
    const hasDui = !!customer.nationalId && customer.nationalId.trim().length > 0;

    // Swift's `hasInvoiceSettings` corresponds to the customer being a business.
    const hasInvoiceSettings = customer.customerType === 1;

    const isCCF = invoiceType === InvoiceType.CCF;
    const requiredNitForFactura = invoiceType === InvoiceType.Factura && hasNit && hasInvoiceSettings;

    const tipoDocumento = invoiceType === InvoiceType.FacturaExportacion
      ? (optionalString(customer.tipoDocumento) || (hasNit ? '36' : hasDui ? '13' : '37'))
      : isCCF
        ? undefined
        : requiredNitForFactura
          ? '36'
          : (invoiceType === InvoiceType.Factura && hasDui ? '13' : undefined);

    const numDocumento = invoiceType === InvoiceType.FacturaExportacion
      ? (tipoDocumento === '36'
          ? optionalString(customer.nit)
          : (tipoDocumento === '13'
              ? formatNationalId(customer.nationalId)
              : optionalString(customer.nationalId)))
      : isCCF
        ? undefined
        : requiredNitForFactura
          ? optionalString(customer.nit)
          : formatNationalId(customer.nationalId);

    return {
      nombre,
      // Swift only includes these for CCF.
      nombreComercial: isCCF ? optionalString(customer.businessName) : undefined,
      nrc: isCCF ? optionalString(customer.nrc) : undefined,
      tipoDocumento,
      numDocumento,
      correo: optionalString(customer.email),
      telefono: optionalString(customer.phone),
      direccion: customer.address
        ? {
            departamento: customer.departmentCode || '06',
            municipio: customer.municipalityCode || '05',
            complemento: customer.address,
          }
        : undefined,

      ...(isCCF
        ? {
            nit: optionalString(customer.nit),
            codActividad: optionalString(customer.codActividad),
            descActividad: optionalString(customer.descActividad),
          }
        : {}),

      ...(invoiceType === InvoiceType.FacturaExportacion
        ? {
            codPais: customer.codPais || 'US',
            nombrePais: customer.nombrePais || 'Estados Unidos',
            tipoPersona: customer.tipoPersona ? Number(customer.tipoPersona) || 1 : 1,
            descActividad: optionalString(customer.descActividad),
            complemento: customer.address,
          }
        : {}),
    };
  };

  const generateControlNumber = (
    tipoDte: string,
    company: Company,
    invoice: Invoice
  ): string => {
    // Match Swift `Extensions.generateString(baseString:codEstableMH:codPuntoVentaMH:)`:
    // `${baseString}-${codEstableMH}${codPuntoVentaMH}-${15 random digits}`
    const baseString = `DTE-${tipoDte}`;
    const codEstableMH = optionalString(company.codEstableMH) || 'M001';
    const codPuntoVentaMH = optionalString(company.codPuntoVentaMH) || 'P001';
    const establishmentCode = `${codEstableMH}${codPuntoVentaMH}`;

    const existing = optionalString(invoice.controlNumber);
    if (existing && existing.startsWith(baseString)) {
      return existing;
    }

    const numericPart = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10).toString()).join('');
    return `${baseString}-${establishmentCode}-${numericPart}`;
  };

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  };

  const convertNumberToWords = (amount: number): string => {
    // Simple implementation - in production, use a proper number-to-words library
    return `${amount.toFixed(2)} DÓLARES AMERICANOS`;
  };

  const handleRetry = () => {
    if (invoice && selectedCompany) {
      startSubmission();
    }
  };

  const getProgressColor = (): string => {
    switch (progress.step) {
      case 'error': return '#E53E3E';
      case 'completed': return '#38A169';
      default: return '#3182CE';
    }
  };

  const getStepIcon = (): string => {
    switch (progress.step) {
      case 'validating-certificate': return '🔐';
      case 'preparing-dte': return '📋';
      case 'submitting-dte': return '📤';
      case 'uploading-pdf': return '📄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const canClose = progress.step === 'completed' || progress.step === 'error';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={canClose ? onClose : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Envío al Ministerio de Hacienda</Text>
            <Text style={styles.subtitle}>
              Procesando factura: {invoice?.invoiceNumber || 'N/A'}
            </Text>
          </View>
          
          {canClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.stepIcon}>{getStepIcon()}</Text>
              <View style={styles.progressInfo}>
                <Text style={styles.progressMessage}>{progress.message}</Text>
                <Text style={styles.progressPercent}>{progress.progress}%</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress.progress}%`,
                    backgroundColor: getProgressColor(),
                  }
                ]} 
              />
            </View>

            {progress.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorMessage}>{progress.error}</Text>
              </View>
            )}
          </View>

          {/* Step Details */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Proceso de Envío</Text>
            
            <View style={styles.stepsList}>
              <View style={[styles.stepItem, getStepStatus('validating-certificate')]}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Validar Certificado Digital</Text>
              </View>
              
              <View style={[styles.stepItem, getStepStatus('preparing-dte')]}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Preparar Documento Tributario</Text>
              </View>
              
              <View style={[styles.stepItem, getStepStatus('submitting-dte')]}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Enviar al Ministerio de Hacienda</Text>
              </View>
              
              {pdfData && (
                <View style={[styles.stepItem, getStepStatus('uploading-pdf')]}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>Subir Archivo PDF</Text>
                </View>
              )}
              
              <View style={[styles.stepItem, getStepStatus('completed')]}>
                <Text style={styles.stepNumber}>{pdfData ? '5' : '4'}</Text>
                <Text style={styles.stepText}>Finalizar Proceso</Text>
              </View>
            </View>
          </View>

          {/* Response Details */}
          {dteResponse && (
            <View style={styles.responseContainer}>
              <Text style={styles.responseTitle}>📋 Respuesta del Ministerio</Text>
              
              <View style={styles.responseDetails}>
                <View style={styles.responseItem}>
                  <Text style={styles.responseLabel}>Estado:</Text>
                  <Text style={[styles.responseValue, styles.successValue]}>
                    {dteResponse.estado}
                  </Text>
                </View>
                
                <View style={styles.responseItem}>
                  <Text style={styles.responseLabel}>Código de Generación:</Text>
                  <Text style={styles.responseValue}>{dteResponse.codigoGeneracion}</Text>
                </View>
                
                <View style={styles.responseItem}>
                  <Text style={styles.responseLabel}>Sello de Recepción:</Text>
                  <Text style={styles.responseValue}>{dteResponse.selloRecibido}</Text>
                </View>
                
                <View style={styles.responseItem}>
                  <Text style={styles.responseLabel}>Fecha de Procesamiento:</Text>
                  <Text style={styles.responseValue}>
                    {new Date(dteResponse.fhProcesamiento).toLocaleString('es-SV')}
                  </Text>
                </View>

                {dteResponse.descripcionMsg && (
                  <View style={styles.responseItem}>
                    <Text style={styles.responseLabel}>Mensaje:</Text>
                    <Text style={styles.responseValue}>{dteResponse.descripcionMsg}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Error Actions */}
          {progress.step === 'error' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  function getStepStatus(stepName: SubmissionStep) {
    const currentStepIndex = getStepIndex(progress.step);
    const stepIndex = getStepIndex(stepName);
    
    if (progress.step === 'error') {
      return stepIndex < currentStepIndex ? styles.stepCompleted : styles.stepPending;
    }
    
    if (stepIndex < currentStepIndex) return styles.stepCompleted;
    if (stepIndex === currentStepIndex) return styles.stepActive;
    return styles.stepPending;
  }

  function getStepIndex(step: SubmissionStep): number {
    const steps: SubmissionStep[] = ['validating-certificate', 'preparing-dte', 'submitting-dte', 'uploading-pdf', 'completed'];
    return steps.indexOf(step);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EDF2F7',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  progressInfo: {
    flex: 1,
  },
  progressMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 14,
    color: '#4A5568',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  errorContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FED7D7',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53E3E',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#E53E3E',
  },
  stepsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  stepPending: {
    opacity: 0.5,
  },
  stepActive: {
    // Active step styling will be applied via stepNumber and stepText
  },
  stepCompleted: {
    // Completed step styling will be applied via stepNumber and stepText
  },
  responseContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  responseDetails: {
    gap: 10,
  },
  responseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  responseLabel: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  responseValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  successValue: {
    color: '#38A169',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DTESubmissionModal;
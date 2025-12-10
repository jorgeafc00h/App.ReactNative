// Invoice Preview Modal Component
// Shows PDF preview and allows final confirmation before DTE submission

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Invoice } from '../../types/invoice';
import { Company } from '../../types/company';
import { getPDFGenerationService, PDFGenerationResult } from '../../services/pdf/PDFGenerationService';

interface InvoicePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSubmit: (pdfData: string) => void;
  invoice: Invoice | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  visible,
  onClose,
  onConfirmSubmit,
  invoice,
}) => {
  const selectedCompany = useSelector((state: RootState) => state.company.selectedCompany);
  const isProduction = useSelector((state: RootState) => state.app.environment === 'PRODUCTION');

  const [pdfGenerationService] = useState(() => getPDFGenerationService(isProduction));
  const [pdfResult, setPdfResult] = useState<PDFGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Update service environment when it changes
  useEffect(() => {
    pdfGenerationService.setEnvironment(isProduction);
  }, [isProduction, pdfGenerationService]);

  // Generate PDF when modal opens with valid invoice
  useEffect(() => {
    if (visible && invoice && selectedCompany && !pdfResult && !generating) {
      generatePreviewPDF();
    }
  }, [visible, invoice, selectedCompany]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPdfResult(null);
      setGenerating(false);
      setSubmitting(false);
    }
  }, [visible]);

  const generatePreviewPDF = async () => {
    if (!invoice || !selectedCompany) return;

    setGenerating(true);
    try {
      console.log('📄 InvoicePreviewModal: Generating PDF preview');
      
      const result = await pdfGenerationService.previewPDF(invoice, selectedCompany);
      
      if (result.success) {
        setPdfResult(result);
        console.log('✅ PDF preview generated successfully');
      } else {
        throw new Error(result.message || 'Failed to generate PDF preview');
      }
    } catch (error) {
      console.error('❌ PDF preview generation failed:', error);
      Alert.alert(
        'Error',
        'No se pudo generar la vista previa del PDF. ¿Desea continuar sin vista previa?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => handleSubmitWithoutPreview() }
        ]
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitWithoutPreview = () => {
    if (!invoice || !selectedCompany) return;

    Alert.alert(
      'Confirmar Envío',
      'Se enviará la factura al Ministerio de Hacienda sin vista previa del PDF. ¿Está seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: 'default',
          onPress: () => onConfirmSubmit('')
        }
      ]
    );
  };

  const handleSubmitWithPDF = async () => {
    if (!pdfResult?.pdfData) {
      Alert.alert('Error', 'No hay datos PDF disponibles');
      return;
    }

    setSubmitting(true);
    try {
      // Pass PDF data to parent for DTE submission
      onConfirmSubmit(pdfResult.pdfData);
    } catch (error) {
      console.error('❌ Error submitting with PDF:', error);
      Alert.alert('Error', 'Error al procesar el PDF');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryGeneration = () => {
    setPdfResult(null);
    generatePreviewPDF();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderInvoiceSummary = () => {
    if (!invoice || !selectedCompany) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen de Factura</Text>
        
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Empresa:</Text>
            <Text style={styles.summaryValue}>{selectedCompany.nombreComercial}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cliente:</Text>
            <Text style={styles.summaryValue}>
              {invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName}` : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tipo:</Text>
            <Text style={styles.summaryValue}>{invoice.invoiceType}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha:</Text>
            <Text style={styles.summaryValue}>
              {new Date(invoice.date).toLocaleDateString('es-SV')}
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items:</Text>
            <Text style={styles.summaryValue}>{invoice.items?.length || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoice.totals?.subTotal || 0)}
            </Text>
          </View>
          
          {invoice.totals?.tax && invoice.totals.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IVA (13%):</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.totals.tax)}
              </Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.totals?.totalPagar || 0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGeneratingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3182CE" />
      <Text style={styles.loadingText}>Generando vista previa...</Text>
      <Text style={styles.loadingSubText}>
        Creando PDF con formato legal para el Ministerio de Hacienda
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Error al generar vista previa</Text>
      <Text style={styles.errorMessage}>
        No se pudo generar la vista previa del PDF. Puede continuar sin vista previa o reintentar.
      </Text>
      
      <View style={styles.errorButtons}>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetryGeneration}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleSubmitWithoutPreview}
        >
          <Text style={styles.continueButtonText}>Continuar sin vista previa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccessState = () => (
    <View style={styles.successContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PDF Info */}
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfInfoTitle}>📄 PDF Generado</Text>
          <Text style={styles.pdfInfoText}>
            Archivo: {pdfResult?.fileName}
          </Text>
          <Text style={styles.pdfInfoText}>
            Tamaño: {pdfResult?.pdfData ? `${(pdfResult.pdfData.length * 0.75 / 1024).toFixed(1)} KB` : 'N/A'}
          </Text>
          <Text style={styles.pdfInfoText}>
            Estado: ✅ Listo para envío
          </Text>
        </View>

        {/* Invoice Summary */}
        {renderInvoiceSummary()}

        {/* Submission Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Importante</Text>
          <Text style={styles.warningText}>
            Al confirmar, se enviará esta factura al Ministerio de Hacienda para su procesamiento oficial.
            Esta acción no se puede deshacer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Vista Previa</Text>
          
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (generating || !pdfResult || submitting) && styles.submitButtonDisabled
            ]} 
            onPress={pdfResult ? handleSubmitWithPDF : handleSubmitWithoutPreview}
            disabled={generating || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {pdfResult ? 'Enviar DTE' : 'Enviar sin PDF'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {generating && renderGeneratingState()}
          {!generating && !pdfResult && renderErrorState()}
          {!generating && pdfResult && renderSuccessState()}
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  submitButton: {
    backgroundColor: '#38A169',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2D3748',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 50,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E53E3E',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  errorButtons: {
    width: '100%',
    gap: 10,
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
  continueButton: {
    backgroundColor: '#ED8936',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
  },
  pdfInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  pdfInfoText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 5,
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  summarySection: {
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38A169',
    flex: 2,
    textAlign: 'right',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D69E2E',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#B7791F',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InvoicePreviewModal;
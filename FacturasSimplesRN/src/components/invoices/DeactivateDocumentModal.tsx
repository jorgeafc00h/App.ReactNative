// Deactivate Document Modal - Matches Swift DeactivateDocumentView
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Invoice, InvoiceType } from '../../types/invoice';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateInvoice } from '../../store/slices/invoiceSlice';
import { 
  createInvalidationService, 
  InvalidationReason, 
  INVALIDATION_REASON_DESCRIPTIONS 
} from '../../services/invalidation/InvoiceInvalidationService';

interface DeactivateDocumentModalProps {
  visible: boolean;
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

// Map service reasons to UI options
const ANULACION_REASONS = [
  { code: InvalidationReason.ErrorInformation, description: INVALIDATION_REASON_DESCRIPTIONS[InvalidationReason.ErrorInformation] },
  { code: InvalidationReason.ProductReturn, description: INVALIDATION_REASON_DESCRIPTIONS[InvalidationReason.ProductReturn] },
  { code: InvalidationReason.MutualAgreement, description: INVALIDATION_REASON_DESCRIPTIONS[InvalidationReason.MutualAgreement] },
  { code: InvalidationReason.Other, description: INVALIDATION_REASON_DESCRIPTIONS[InvalidationReason.Other] },
];

export const DeactivateDocumentModal: React.FC<DeactivateDocumentModalProps> = ({
  visible,
  invoice,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentCompany } = useAppSelector(state => state.companies);
  const isProduction = currentCompany?.environment === 'PRODUCTION' && currentCompany?.isTestAccount !== true;
  
  const [selectedReason, setSelectedReason] = useState<InvalidationReason | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleDocument, setResponsibleDocument] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeName = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura:
        return 'Factura';
      case InvoiceType.CCF:
        return 'Comprobante de Crédito Fiscal';
      case InvoiceType.NotaCredito:
        return 'Nota de Crédito';
      case InvoiceType.NotaDebito:
        return 'Nota de Débito';
      case InvoiceType.NotaRemision:
        return 'Nota de Remisión';
      case InvoiceType.SujetoExcluido:
        return 'Sujeto Excluido';
      case InvoiceType.ComprobanteLiquidacion:
        return 'Comprobante de Liquidación';
      case InvoiceType.FacturaExportacion:
        return 'Factura de Exportación';
      default:
        return 'Documento';
    }
  };

  const isFormValid = () => {
    if (!selectedReason) return false;
    if (selectedReason === InvalidationReason.Other && !customReason.trim()) return false;
    if (!responsibleName.trim()) return false;
    if (!responsibleDocument.trim()) return false;
    return true;
  };

  // Check if invoice can be invalidated
  const canInvalidateInvoice = () => {
    if (!currentCompany) return { canInvalidate: false, reason: 'No hay empresa seleccionada' };
    
    const invalidationService = createInvalidationService(isProduction);
    return invalidationService.canInvalidateInvoice(invoice);
  };

  const invalidationCheck = canInvalidateInvoice();
  
  // Don't render modal if invoice can't be invalidated
  if (!invalidationCheck.canInvalidate) {
    React.useEffect(() => {
      if (visible) {
        Alert.alert(
          'No se puede anular',
          invalidationCheck.reason || 'Este documento no puede ser anulado',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    }, [visible]);
    
    return null;
  }

  const handleSubmit = async () => {
    if (!isFormValid() || !currentCompany || !selectedReason) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📱 DeactivateDocumentModal: Starting invoice invalidation process');
      
      const invalidationService = createInvalidationService(isProduction);
      
      const invalidationRequest = {
        reason: selectedReason,
        customReason: selectedReason === InvalidationReason.Other ? customReason : undefined,
        responsibleName: responsibleName.trim(),
        responsibleDocument: responsibleDocument.trim(),
      };
      
      const result = await invalidationService.invalidateInvoice(
        invoice,
        currentCompany,
        invalidationRequest
      );
      
      if (result.success) {
        // Update invoice in Redux store
        dispatch(updateInvoice({
          id: invoice.id,
          invalidatedViaApi: true,
          invalidatedAt: result.invalidatedAt || new Date().toISOString(),
          invalidationReason: selectedReason === InvalidationReason.Other ? customReason : INVALIDATION_REASON_DESCRIPTIONS[selectedReason],
        }));
        
        Alert.alert(
          'Éxito',
          result.message,
          [{ text: 'OK', onPress: onSuccess }]
        );
        
        console.log(`✅ DeactivateDocumentModal: Invoice ${invoice.invoiceNumber} invalidated successfully`);
      } else {
        Alert.alert(
          'Error',
          result.message,
          [{ text: 'OK' }]
        );
        
        console.error(`❌ DeactivateDocumentModal: Invalidation failed: ${result.message}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo anular el documento: ${errorMessage}`);
      
      console.error('❌ DeactivateDocumentModal: Exception during invalidation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelButtonText, { color: theme.colors.text.secondary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Anular Documento
          </Text>
          
          <View style={styles.cancelButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Warning Banner */}
          <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={[styles.warningText, { color: '#92400E' }]}>
              Esta acción es irreversible. El documento será anulado en el sistema del Ministerio de Hacienda.
            </Text>
          </View>

          {/* Document Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Documento a Anular
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Tipo:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {getTypeName(invoice.invoiceType)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Número:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {invoice.invoiceNumber}
              </Text>
            </View>
            
            {invoice.controlNumber && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Control:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {invoice.controlNumber}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Total:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                ${(invoice.totals?.totalAmount || invoice.totalAmountIncludingTax || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Reason Selection */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Motivo de Anulación *
            </Text>
            
            {ANULACION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.code}
                style={[
                  styles.reasonOption,
                  { borderColor: theme.colors.border.light },
                  selectedReason === reason.code && { 
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '10'
                  }
                ]}
                onPress={() => setSelectedReason(reason.code)}
              >
                <View style={[
                  styles.radioOuter,
                  { borderColor: selectedReason === reason.code ? theme.colors.primary : theme.colors.border.light }
                ]}>
                  {selectedReason === reason.code && (
                    <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.reasonText, { color: theme.colors.text.primary }]}>
                  {reason.description}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom Reason Input (when "Otro" is selected) */}
            {selectedReason === InvalidationReason.Other && (
              <View style={styles.customReasonContainer}>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.light,
                    color: theme.colors.text.primary
                  }]}
                  placeholder="Especifique el motivo..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>

          {/* Responsible Person Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Persona Responsable
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Nombre Completo *
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.light,
                  color: theme.colors.text.primary
                }]}
                placeholder="Nombre del responsable"
                placeholderTextColor={theme.colors.text.secondary}
                value={responsibleName}
                onChangeText={setResponsibleName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Documento de Identidad *
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.light,
                  color: theme.colors.text.primary
                }]}
                placeholder="DUI o Pasaporte"
                placeholderTextColor={theme.colors.text.secondary}
                value={responsibleDocument}
                onChangeText={setResponsibleDocument}
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: '#EF4444' },
                (!isFormValid() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Procesando...</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Text style={styles.submitButtonIcon}>❌</Text>
                  <Text style={styles.submitButtonText}>Anular Documento</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    width: 70,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  warningIcon: {
    fontSize: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
  },
  customReasonContainer: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitSection: {
    padding: 16,
  },
  submitButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonIcon: {
    fontSize: 18,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DeactivateDocumentModal;

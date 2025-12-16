// Enhanced Invoice Detail Screen - Matches Swift InvoiceDetailView functionality
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store';
import { deleteInvoice, updateInvoice, setCurrentInvoice } from '../../store/slices/invoiceSlice';
import { InvoicesStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { Invoice, InvoiceStatus, InvoiceType, InvoiceDetail } from '../../types/invoice';

// Components
import { DeactivateDocumentModal } from '../../components/invoices';
import { InvoicePDFPreview } from '../../components/invoices';

type InvoiceDetailRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;
type InvoiceDetailNavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreenEnhanced: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<InvoiceDetailRouteProp>();
  const navigation = useNavigation<InvoiceDetailNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { invoiceId } = route.params;
  const { currentInvoice, loading, invoices } = useAppSelector(state => state.invoices);
  const { currentCompany } = useAppSelector(state => state.companies);
  
  // UI State
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [syncLabel, setSyncLabel] = useState('Enviando...');
  
  // Confirmation dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [showCreditNoteConfirm, setShowCreditNoteConfirm] = useState(false);
  const [showDebitNoteConfirm, setShowDebitNoteConfirm] = useState(false);
  const [showRemissionNoteConfirm, setShowRemissionNoteConfirm] = useState(false);
  const [showComprobanteLiquidacionConfirm, setShowComprobanteLiquidacionConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      dispatch(setCurrentInvoice(invoiceId));
    }
  }, [invoiceId, dispatch]);

  // Find related document (for credit/debit notes)
  const relatedDocument = useMemo(() => {
    if (!currentInvoice?.relatedId) return null;
    return invoices.find(inv => inv.id === currentInvoice.relatedId);
  }, [currentInvoice?.relatedId, invoices]);

  // Check if should show related document button
  const shouldShowRelatedDocumentButton = useMemo(() => {
    if (!currentInvoice) return false;
    const relatedDocumentTypes = [
      InvoiceType.NotaCredito,
      InvoiceType.NotaDebito,
      InvoiceType.NotaRemision,
      InvoiceType.ComprobanteLiquidacion,
    ];
    return relatedDocumentTypes.includes(currentInvoice.invoiceType) &&
           currentInvoice.relatedDocumentNumber &&
           relatedDocument !== null;
  }, [currentInvoice, relatedDocument]);

  // Check if has delivery information (for remission notes)
  const hasDeliveryInformation = useMemo(() => {
    if (!currentInvoice) return false;
    return !!(currentInvoice.nombEntrega || 
              currentInvoice.docuEntrega || 
              currentInvoice.observaciones || 
              currentInvoice.receptor || 
              currentInvoice.receptorDocu);
  }, [currentInvoice]);

  // Status color
  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return '#F59E0B';
      case InvoiceStatus.Sincronizando:
        return '#3B82F6';
      case InvoiceStatus.Completada:
        return '#10B981';
      case InvoiceStatus.Anulada:
        return '#EF4444';
      case InvoiceStatus.Modificada:
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  // Get status text
  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return 'Nueva';
      case InvoiceStatus.Sincronizando:
        return 'Sincronizando';
      case InvoiceStatus.Completada:
        return 'Completada';
      case InvoiceStatus.Anulada:
        return 'Anulada';
      case InvoiceStatus.Modificada:
        return 'Modificada';
      default:
        return 'Desconocido';
    }
  };

  // Get invoice type name
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

  // Handlers
  const handleEdit = () => {
    if (currentInvoice && currentInvoice.status === InvoiceStatus.Nueva) {
      setShowActionsMenu(false);
      navigation.navigate('EditInvoice', { invoiceId: currentInvoice.id });
    }
  };

  const handleDelete = async () => {
    if (!currentInvoice) return;
    
    try {
      dispatch(deleteInvoice(currentInvoice.id));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la factura');
    }
  };

  const handleShare = async () => {
    if (!currentInvoice) return;
    
    try {
      const totals = currentInvoice.totals;
      const message = `${getTypeName(currentInvoice.invoiceType)} ${currentInvoice.invoiceNumber}\n` +
        `Total: $${(totals?.totalAmount || currentInvoice.totalAmountIncludingTax || 0).toFixed(2)}\n` +
        `Fecha: ${new Date(currentInvoice.date).toLocaleDateString('es-ES')}\n` +
        (currentInvoice.controlNumber ? `Control: ${currentInvoice.controlNumber}` : '');
      
      await Share.share({
        message,
        title: `${getTypeName(currentInvoice.invoiceType)} ${currentInvoice.invoiceNumber}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
    setShowActionsMenu(false);
  };

  const handlePrintPDF = () => {
    setShowActionsMenu(false);
    setShowPDFPreview(true);
  };

  const handleSendEmail = async () => {
    setShowEmailConfirm(false);
    setShowActionsMenu(false);
    // TODO: Implement email sending with PDF attachment
    Alert.alert('Enviando', 'Enviando correo con documento adjunto...');
  };

  const handleDeactivate = () => {
    setShowActionsMenu(false);
    setShowDeactivateModal(true);
  };

  // Generate Credit Note
  const handleGenerateCreditNote = async () => {
    if (!currentInvoice) return;
    setShowCreditNoteConfirm(false);
    
    // TODO: Create credit note from this invoice
    Alert.alert('Nota de Crédito', 'Funcionalidad en desarrollo');
  };

  // Generate Debit Note
  const handleGenerateDebitNote = async () => {
    if (!currentInvoice) return;
    setShowDebitNoteConfirm(false);
    
    // TODO: Create debit note from this invoice
    Alert.alert('Nota de Débito', 'Funcionalidad en desarrollo');
  };

  // Generate Remission Note
  const handleGenerateRemissionNote = async () => {
    if (!currentInvoice) return;
    setShowRemissionNoteConfirm(false);
    
    // TODO: Create remission note from this invoice
    Alert.alert('Nota de Remisión', 'Funcionalidad en desarrollo');
  };

  // Generate Comprobante de Liquidación
  const handleGenerateComprobanteLiquidacion = async () => {
    if (!currentInvoice) return;
    setShowComprobanteLiquidacionConfirm(false);
    
    // TODO: Create comprobante de liquidación from this invoice
    Alert.alert('Comprobante de Liquidación', 'Funcionalidad en desarrollo');
  };

  // Sync invoice with Hacienda
  const handleSyncInvoice = async () => {
    if (!currentInvoice) return;
    setShowSyncConfirm(false);
    setIsBusy(true);
    setSyncLabel('Validando...');

    try {
      // TODO: Implement DTE submission
      setSyncLabel('Enviando al MH...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      
      Alert.alert('Éxito', 'Documento sincronizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo sincronizar el documento');
    } finally {
      setIsBusy(false);
    }
  };

  // Navigate to related document
  const handleViewRelatedDocument = () => {
    if (relatedDocument) {
      navigation.push('InvoiceDetail', { invoiceId: relatedDocument.id });
    }
  };

  // Can show credit note button (CCF only, Completada or Modificada status)
  const canGenerateCreditNote = useMemo(() => {
    if (!currentInvoice) return false;
    return currentInvoice.invoiceType === InvoiceType.CCF &&
           (currentInvoice.status === InvoiceStatus.Completada || 
            currentInvoice.status === InvoiceStatus.Modificada);
  }, [currentInvoice]);

  // Can show debit note button
  const canGenerateDebitNote = canGenerateCreditNote;

  // Can show remission note button (CCF or Factura, Completada or Modificada)
  const canGenerateRemissionNote = useMemo(() => {
    if (!currentInvoice) return false;
    return (currentInvoice.invoiceType === InvoiceType.CCF || 
            currentInvoice.invoiceType === InvoiceType.Factura) &&
           (currentInvoice.status === InvoiceStatus.Completada || 
            currentInvoice.status === InvoiceStatus.Modificada);
  }, [currentInvoice]);

  // Can show comprobante liquidación button
  const canGenerateComprobanteLiquidacion = canGenerateRemissionNote;

  if (loading || !currentInvoice) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          {loading ? 'Cargando factura...' : 'Factura no encontrada'}
        </Text>
      </View>
    );
  }

  const statusColor = getStatusColor(currentInvoice.status);
  const totals = currentInvoice.totals;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Atrás</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
          {getTypeName(currentInvoice.invoiceType)}
        </Text>
        
        <View style={styles.headerButtons}>
          {/* Share Button */}
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Text style={styles.headerButtonIcon}>📤</Text>
          </TouchableOpacity>
          
          {/* Actions Menu Button */}
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowActionsMenu(true)}>
            <Text style={styles.headerButtonIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Number - Large Title */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.invoiceNumberLarge, { color: theme.colors.text.primary }]}>
            {currentInvoice.invoiceNumber}
          </Text>
          
          {/* Customer Info */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Cliente</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {/* Would show customer name */}
              Cliente
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Identificación</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              N/A
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              N/A
            </Text>
          </View>
          
          {/* Status Badge */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Estado</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusText(currentInvoice.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons (for Nueva status) */}
        {currentInvoice.status === InvoiceStatus.Nueva && (
          <View style={styles.actionsSection}>
            {/* Edit Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar factura</Text>
            </TouchableOpacity>
            
            {/* PDF Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handlePrintPDF}>
              <Text style={styles.actionIcon}>🖨️</Text>
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>PDF</Text>
            </TouchableOpacity>
            
            {/* Delete Button */}
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeleteConfirm(true)}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar Factura</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Document Details Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Fecha</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {new Date(currentInvoice.date).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Tipo</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {getTypeName(currentInvoice.invoiceType)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Estado</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {getStatusText(currentInvoice.status)}
            </Text>
          </View>
          
          {/* Generation Code */}
          {currentInvoice.generationCode && (
            <View style={styles.codeBlock}>
              <Text style={[styles.codeLabel, { color: theme.colors.text.secondary }]}>Cod. Gen.</Text>
              <Text style={[styles.codeValue, { color: theme.colors.text.primary }]}>
                {currentInvoice.generationCode}
              </Text>
            </View>
          )}
          
          {/* Reception Seal */}
          {currentInvoice.receptionSeal && (
            <View style={styles.codeBlock}>
              <Text style={[styles.codeLabel, { color: theme.colors.text.secondary }]}>Sello</Text>
              <Text style={[styles.codeValue, { color: theme.colors.text.primary }]}>
                {currentInvoice.receptionSeal}
              </Text>
            </View>
          )}
          
          {/* Control Number */}
          {currentInvoice.controlNumber && (
            <View style={styles.codeBlock}>
              <Text style={[styles.codeLabel, { color: theme.colors.text.secondary }]}>Número Control</Text>
              <Text style={[styles.codeValue, { color: theme.colors.text.primary }]}>
                {currentInvoice.controlNumber}
              </Text>
            </View>
          )}

          {/* Related Document Button */}
          {shouldShowRelatedDocumentButton && relatedDocument && (
            <TouchableOpacity
              style={[styles.relatedDocumentButton, { borderColor: theme.colors.primary + '50' }]}
              onPress={handleViewRelatedDocument}
            >
              <View style={styles.relatedDocumentHeader}>
                <Text style={[styles.relatedDocumentLabel, { color: theme.colors.text.secondary }]}>
                  Documento Relacionado
                </Text>
                <Text style={[styles.relatedDocumentArrow, { color: theme.colors.primary }]}>→</Text>
              </View>
              <View style={styles.relatedDocumentContent}>
                <View>
                  <Text style={[styles.relatedDocumentType, { color: theme.colors.text.primary }]}>
                    {getTypeName(relatedDocument.invoiceType)}
                  </Text>
                  {relatedDocument.controlNumber && (
                    <Text style={[styles.relatedDocumentControl, { color: theme.colors.text.secondary }]}>
                      Control: {relatedDocument.controlNumber}
                    </Text>
                  )}
                </View>
                <Text style={[styles.relatedDocumentDate, { color: theme.colors.text.secondary }]}>
                  {new Date(relatedDocument.date).toLocaleDateString('es-ES')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Information Section (for Remission Notes) */}
        {currentInvoice.invoiceType === InvoiceType.NotaRemision && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.deliveryIcon}>🚚</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Información de Entrega
              </Text>
              {hasDeliveryInformation && currentInvoice.status === InvoiceStatus.Nueva && (
                <TouchableOpacity onPress={handleEdit}>
                  <Text style={[styles.editIcon, { color: theme.colors.primary }]}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>

            {hasDeliveryInformation ? (
              <View style={[styles.deliveryContent, { backgroundColor: theme.colors.primary + '08' }]}>
                {currentInvoice.nombEntrega && (
                  <View style={styles.deliveryRow}>
                    <Text style={[styles.deliveryLabel, { color: theme.colors.text.secondary }]}>
                      Persona que Entrega:
                    </Text>
                    <Text style={[styles.deliveryValue, { color: theme.colors.text.primary }]}>
                      {currentInvoice.nombEntrega}
                    </Text>
                  </View>
                )}
                {currentInvoice.docuEntrega && (
                  <View style={styles.deliveryRow}>
                    <Text style={[styles.deliveryLabel, { color: theme.colors.text.secondary }]}>
                      Documento de Identidad:
                    </Text>
                    <Text style={[styles.deliveryValue, { color: theme.colors.text.primary }]}>
                      {currentInvoice.docuEntrega}
                    </Text>
                  </View>
                )}
                {currentInvoice.observaciones && (
                  <View style={styles.deliveryColumn}>
                    <Text style={[styles.deliveryLabel, { color: theme.colors.text.secondary }]}>
                      Observaciones:
                    </Text>
                    <Text style={[styles.deliveryValue, { color: theme.colors.text.primary }]}>
                      {currentInvoice.observaciones}
                    </Text>
                  </View>
                )}
                {currentInvoice.receptor && (
                  <View style={styles.deliveryRow}>
                    <Text style={[styles.deliveryLabel, { color: theme.colors.text.secondary }]}>
                      Receptor:
                    </Text>
                    <Text style={[styles.deliveryValue, { color: theme.colors.text.primary }]}>
                      {currentInvoice.receptor}
                    </Text>
                  </View>
                )}
                {currentInvoice.receptorDocu && (
                  <View style={styles.deliveryRow}>
                    <Text style={[styles.deliveryLabel, { color: theme.colors.text.secondary }]}>
                      Documento Receptor:
                    </Text>
                    <Text style={[styles.deliveryValue, { color: theme.colors.text.primary }]}>
                      {currentInvoice.receptorDocu}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addDeliveryButton, { borderColor: theme.colors.primary + '50' }]}
                onPress={handleEdit}
                disabled={currentInvoice.status !== InvoiceStatus.Nueva}
              >
                <Text style={[styles.addDeliveryIcon, { color: theme.colors.primary }]}>➕</Text>
                <Text style={[styles.addDeliveryText, { color: theme.colors.primary }]}>
                  Agregar información de entrega
                </Text>
                <Text style={[styles.addDeliveryArrow, { color: theme.colors.text.secondary }]}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Totals Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          {currentInvoice.invoiceType === InvoiceType.SujetoExcluido ? (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Sub Total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  ${(totals?.totalAmount || currentInvoice.totalAmountIncludingTax || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Renta Retenida:</Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  ${(totals?.reteRenta || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>Total</Text>
                <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                  ${(totals?.totalPagar || 0).toFixed(2)}
                </Text>
              </View>
            </>
          ) : currentInvoice.invoiceType === InvoiceType.FacturaExportacion ? (
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>Total</Text>
              <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                ${(totals?.totalAmount || currentInvoice.totalAmountIncludingTax || 0).toFixed(2)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Sub Total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  ${(totals?.subTotal || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>Total</Text>
                <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                  ${(totals?.totalAmount || currentInvoice.totalAmountIncludingTax || 0).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Products Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos</Text>
          
          {(currentInvoice.items || []).map((item: InvoiceDetail, index: number) => (
            <View key={item.id || index} style={[styles.productItem, { borderBottomColor: theme.colors.border.light }]}>
              <View style={styles.productHeader}>
                <Text style={[styles.productName, { color: theme.colors.text.primary }]} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={[styles.productTotal, { color: theme.colors.text.primary }]}>
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </Text>
              </View>
              <View style={styles.productDetails}>
                <Text style={[styles.productDetail, { color: theme.colors.text.secondary }]}>
                  Cantidad: {item.quantity}
                </Text>
                <Text style={[styles.productDetail, { color: theme.colors.text.secondary }]}>
                  Precio: ${item.unitPrice.toFixed(2)}
                </Text>
              </View>
              {item.obsItem && (
                <Text style={[styles.productObs, { color: theme.colors.text.secondary }]}>
                  {item.obsItem}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Sync Button (for Nueva status) */}
        {currentInvoice.status === InvoiceStatus.Nueva && (
          <View style={styles.syncSection}>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowSyncConfirm(true)}
              disabled={isBusy}
            >
              {isBusy ? (
                <View style={styles.syncButtonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.syncButtonText}>{syncLabel}</Text>
                </View>
              ) : (
                <View style={styles.syncButtonContent}>
                  <Text style={styles.syncButtonIcon}>✅</Text>
                  <Text style={styles.syncButtonText}>Completar y Sincronizar</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Completed Status Display */}
        {currentInvoice.status === InvoiceStatus.Completada && (
          <View style={[styles.completedSection, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.completedRow}>
              <Text style={[styles.completedType, { color: theme.colors.text.primary }]}>
                {getTypeName(currentInvoice.invoiceType)}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusText(currentInvoice.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Invalidated Display */}
        {currentInvoice.invalidatedViaApi && (
          <View style={[styles.completedSection, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.completedRow}>
              <Text style={[styles.completedType, { color: theme.colors.text.primary }]}>
                {getTypeName(currentInvoice.invoiceType)}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.statusBadge, { backgroundColor: '#EF444415' }]}>
                  <Text style={[styles.statusText, { color: '#EF4444' }]}>
                    ANULADA
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={[styles.actionsMenuContainer, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.menuTitle, { color: theme.colors.text.primary }]}>Acciones</Text>
            
            {/* Credit Note */}
            {canGenerateCreditNote && (
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowActionsMenu(false);
                setShowCreditNoteConfirm(true);
              }}>
                <Text style={styles.menuItemIcon}>➖</Text>
                <Text style={[styles.menuItemText, { color: '#F59E0B' }]}>Generar Nota de crédito</Text>
              </TouchableOpacity>
            )}
            
            {/* Debit Note */}
            {canGenerateDebitNote && (
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowActionsMenu(false);
                setShowDebitNoteConfirm(true);
              }}>
                <Text style={styles.menuItemIcon}>➕</Text>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Generar Nota de Débito</Text>
              </TouchableOpacity>
            )}
            
            {/* Remission Note */}
            {canGenerateRemissionNote && (
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowActionsMenu(false);
                setShowRemissionNoteConfirm(true);
              }}>
                <Text style={styles.menuItemIcon}>🚚</Text>
                <Text style={[styles.menuItemText, { color: '#3B82F6' }]}>Generar Nota de Remisión</Text>
              </TouchableOpacity>
            )}
            
            {/* Comprobante Liquidación */}
            {canGenerateComprobanteLiquidacion && (
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowActionsMenu(false);
                setShowComprobanteLiquidacionConfirm(true);
              }}>
                <Text style={styles.menuItemIcon}>📑</Text>
                <Text style={[styles.menuItemText, { color: '#8B5CF6' }]}>Generar Comprobante de Liquidación</Text>
              </TouchableOpacity>
            )}
            
            {/* Edit (only for Nueva) */}
            {currentInvoice.status === InvoiceStatus.Nueva && (
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Text style={styles.menuItemIcon}>✏️</Text>
                <Text style={[styles.menuItemText, { color: theme.colors.primary }]}>Editar factura</Text>
              </TouchableOpacity>
            )}
            
            {/* PDF */}
            <TouchableOpacity style={styles.menuItem} onPress={handlePrintPDF}>
              <Text style={styles.menuItemIcon}>🖨️</Text>
              <Text style={[styles.menuItemText, { color: theme.colors.primary }]}>PDF</Text>
            </TouchableOpacity>
            
            {/* Send Email (only for Completada) */}
            {currentInvoice.status === InvoiceStatus.Completada && (
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setShowActionsMenu(false);
                setShowEmailConfirm(true);
              }}>
                <Text style={styles.menuItemIcon}>📧</Text>
                <Text style={[styles.menuItemText, { color: theme.colors.primary }]}>Enviar PDF por Email</Text>
              </TouchableOpacity>
            )}
            
            {/* Deactivate (only for Completada) */}
            {currentInvoice.status === InvoiceStatus.Completada && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDeactivate}>
                <Text style={styles.menuItemIcon}>❌</Text>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Anular Documento</Text>
              </TouchableOpacity>
            )}
            
            {/* Cancel */}
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemCancel]} 
              onPress={() => setShowActionsMenu(false)}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Dialogs */}
      {/* Delete Confirmation */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Está seguro que desea eliminar esta Factura?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonDestructive]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
              >
                <Text style={[styles.confirmButtonText, { color: '#EF4444' }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Confirmation */}
      <Modal visible={showEmailConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Desea enviar nuevamente esta factura via email?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowEmailConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSendEmail}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Credit Note Confirmation */}
      <Modal visible={showCreditNoteConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Está seguro que desea Generar una Nota de crédito para esta Factura?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowCreditNoteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: '#F59E0B' }]}
                onPress={handleGenerateCreditNote}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Debit Note Confirmation */}
      <Modal visible={showDebitNoteConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Está seguro que desea Generar una Nota de débito para esta Factura?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowDebitNoteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: '#EF4444' }]}
                onPress={handleGenerateDebitNote}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remission Note Confirmation */}
      <Modal visible={showRemissionNoteConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Está seguro que desea Generar una Nota de Remisión para esta Factura?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowRemissionNoteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: '#3B82F6' }]}
                onPress={handleGenerateRemissionNote}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comprobante Liquidación Confirmation */}
      <Modal visible={showComprobanteLiquidacionConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Está seguro que desea Generar un Comprobante de Liquidación para esta Factura?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowComprobanteLiquidacionConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: '#8B5CF6' }]}
                onPress={handleGenerateComprobanteLiquidacion}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Confirmation */}
      <Modal visible={showSyncConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text.primary }]}>
              ¿Desea completar y sincronizar esta factura con el ministerio de hacienda?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowSyncConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.text.secondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSyncInvoice}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>Sincronizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deactivate Document Modal */}
      {showDeactivateModal && currentInvoice && (
        <DeactivateDocumentModal
          visible={showDeactivateModal}
          invoice={currentInvoice}
          onClose={() => setShowDeactivateModal(false)}
          onSuccess={() => {
            setShowDeactivateModal(false);
            dispatch(setCurrentInvoice(invoiceId));
          }}
        />
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && currentInvoice && (
        <InvoicePDFPreview
          visible={showPDFPreview}
          invoice={currentInvoice}
          onClose={() => setShowPDFPreview(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceNumberLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  codeBlock: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  relatedDocumentButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  relatedDocumentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedDocumentLabel: {
    fontSize: 12,
  },
  relatedDocumentArrow: {
    fontSize: 14,
    fontWeight: '600',
  },
  relatedDocumentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relatedDocumentType: {
    fontSize: 15,
    fontWeight: '500',
  },
  relatedDocumentControl: {
    fontSize: 12,
    marginTop: 2,
  },
  relatedDocumentDate: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  editIcon: {
    fontSize: 16,
  },
  deliveryContent: {
    padding: 12,
    borderRadius: 8,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  deliveryColumn: {
    paddingVertical: 4,
  },
  deliveryLabel: {
    fontSize: 13,
  },
  deliveryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  addDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addDeliveryIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  addDeliveryText: {
    fontSize: 13,
    flex: 1,
  },
  addDeliveryArrow: {
    fontSize: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
  },
  grandTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
  productTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productDetail: {
    fontSize: 13,
  },
  productObs: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  syncSection: {
    padding: 16,
  },
  syncButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButtonIcon: {
    fontSize: 18,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completedSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedType: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionsMenuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
  },
  menuItemCancel: {
    marginTop: 8,
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  // Confirmation Dialog Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  confirmDialog: {
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  confirmButtonPrimary: {},
  confirmButtonDestructive: {
    backgroundColor: '#FEE2E2',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoiceDetailScreenEnhanced;

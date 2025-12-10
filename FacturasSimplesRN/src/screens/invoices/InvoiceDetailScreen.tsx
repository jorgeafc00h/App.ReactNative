import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchInvoiceById, deleteInvoice } from '../../store/slices/invoiceSlice';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Invoice, InvoiceStatus } from '../../types/invoice';

type InvoiceDetailRouteProp = RouteProp<RootStackParamList, 'InvoiceDetail'>;
type InvoiceDetailNavigationProp = StackNavigationProp<RootStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<InvoiceDetailRouteProp>();
  const navigation = useNavigation<InvoiceDetailNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { invoiceId } = route.params;
  const { currentInvoice, loading } = useAppSelector(state => state.invoices);
  
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      dispatch(fetchInvoiceById(invoiceId));
    }
  }, [invoiceId, dispatch]);

  const handleEdit = () => {
    if (currentInvoice) {
      navigation.navigate('EditInvoice', { invoiceId: currentInvoice.id });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Factura',
      '¿Está seguro que desea eliminar esta factura? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteInvoice(invoiceId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la factura');
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    if (!currentInvoice) return;
    
    try {
      const message = `Factura ${currentInvoice.documentNumber}\nCliente: ${currentInvoice.customer.name}\nTotal: $${currentInvoice.totalAmount.toFixed(2)}\nFecha: ${new Date(currentInvoice.date).toLocaleDateString()}`;
      
      await Share.share({
        message,
        title: `Factura ${currentInvoice.documentNumber}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handleDuplicate = () => {
    if (!currentInvoice) return;
    
    Alert.alert(
      'Duplicar Factura',
      '¿Desea crear una nueva factura basada en esta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Duplicar',
          onPress: () => {
            navigation.navigate('CreateInvoice', { 
              duplicateFrom: currentInvoice.id 
            });
          }
        }
      ]
    );
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Draft:
        return '#6B7280';
      case InvoiceStatus.Pending:
        return '#F59E0B';
      case InvoiceStatus.Sent:
        return '#3B82F6';
      case InvoiceStatus.Paid:
        return '#10B981';
      case InvoiceStatus.Cancelled:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Draft:
        return 'Borrador';
      case InvoiceStatus.Pending:
        return 'Pendiente';
      case InvoiceStatus.Sent:
        return 'Enviada';
      case InvoiceStatus.Paid:
        return 'Pagada';
      case InvoiceStatus.Cancelled:
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  if (loading || !currentInvoice) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          {loading ? 'Cargando factura...' : 'Factura no encontrada'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Atrás</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {currentInvoice.documentNumber}
        </Text>
        
        <TouchableOpacity onPress={() => setShowActions(!showActions)}>
          <Text style={[styles.actionsButton, { color: theme.colors.primary }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Actions Menu */}
      {showActions && (
        <View style={[styles.actionsMenu, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
            <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
            <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>📋 Duplicar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>📤 Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
            <Text style={[styles.actionText, { color: theme.colors.error }]}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentInvoice.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(currentInvoice.status) }]}>
              {getStatusText(currentInvoice.status)}
            </Text>
          </View>
        </View>

        {/* Invoice Header Info */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Información General</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Número:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{currentInvoice.documentNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Tipo:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{currentInvoice.type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Fecha:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {new Date(currentInvoice.date).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          {currentInvoice.dueDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Vencimiento:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {new Date(currentInvoice.dueDate).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente</Text>
          
          <TouchableOpacity 
            style={styles.customerCard}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: currentInvoice.customer.id })}
          >
            <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
              {currentInvoice.customer.name}
            </Text>
            <Text style={[styles.customerInfo, { color: theme.colors.text.secondary }]}>
              {currentInvoice.customer.documentType}: {currentInvoice.customer.documentNumber}
            </Text>
            <Text style={[styles.customerInfo, { color: theme.colors.text.secondary }]}>
              {currentInvoice.customer.email}
            </Text>
            {currentInvoice.customer.address && (
              <Text style={[styles.customerInfo, { color: theme.colors.text.secondary }]}>
                {currentInvoice.customer.address}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos/Servicios</Text>
          
          {currentInvoice.items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>{item.description}</Text>
                <Text style={[styles.itemTotal, { color: theme.colors.text.primary }]}>
                  ${item.totalAmount.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={[styles.itemDetail, { color: theme.colors.text.secondary }]}>
                  Cantidad: {item.quantity} {item.unitType}
                </Text>
                <Text style={[styles.itemDetail, { color: theme.colors.text.secondary }]}>
                  Precio: ${item.unitPrice.toFixed(2)}
                </Text>
              </View>
              
              {item.discount > 0 && (
                <Text style={[styles.itemDetail, { color: theme.colors.error }]}>
                  Descuento: ${item.discount.toFixed(2)}
                </Text>
              )}
              
              {item.taxes && item.taxes.length > 0 && (
                <View style={styles.taxesContainer}>
                  {item.taxes.map((tax, taxIndex) => (
                    <Text key={taxIndex} style={[styles.itemDetail, { color: theme.colors.text.secondary }]}>
                      {tax.name}: ${tax.amount.toFixed(2)} ({tax.percentage}%)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Totales</Text>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Subtotal:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
              ${currentInvoice.subtotalAmount.toFixed(2)}
            </Text>
          </View>
          
          {currentInvoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Descuento:</Text>
              <Text style={[styles.totalValue, { color: theme.colors.error }]}>
                -${currentInvoice.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          
          {currentInvoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>IVA:</Text>
              <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                ${currentInvoice.taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>Total:</Text>
            <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
              ${currentInvoice.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {currentInvoice.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Notas</Text>
            <Text style={[styles.notesText, { color: theme.colors.text.secondary }]}>
              {currentInvoice.notes}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
  },
  actionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  customerCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemCard: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
  },
  taxesContainer: {
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default InvoiceDetailScreen;
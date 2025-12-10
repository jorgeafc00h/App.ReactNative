import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchInvoiceById, updateInvoice } from '../../store/slices/invoiceSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Invoice, InvoiceType, InvoiceStatus, UpdateInvoiceInput } from '../../types/invoice';
import { CustomerPicker } from '../../components/customers/CustomerPicker';
import { ProductSelector } from '../../components/products/ProductSelector';

type EditInvoiceRouteProp = RouteProp<RootStackParamList, 'EditInvoice'>;
type EditInvoiceNavigationProp = StackNavigationProp<RootStackParamList, 'EditInvoice'>;

export const EditInvoiceScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<EditInvoiceRouteProp>();
  const navigation = useNavigation<EditInvoiceNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { invoiceId } = route.params;
  const { currentInvoice, loading } = useAppSelector(state => state.invoices);
  const { customers } = useAppSelector(state => state.customers);
  const { products } = useAppSelector(state => state.products);
  
  const [formData, setFormData] = useState<Partial<UpdateInvoiceInput>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      dispatch(fetchInvoiceById(invoiceId));
    }
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [invoiceId, dispatch]);

  useEffect(() => {
    if (currentInvoice) {
      setFormData({
        id: currentInvoice.id,
        type: currentInvoice.type,
        status: currentInvoice.status,
        customerId: currentInvoice.customer.id,
        date: new Date(currentInvoice.date),
        dueDate: currentInvoice.dueDate ? new Date(currentInvoice.dueDate) : undefined,
        notes: currentInvoice.notes || '',
        items: [...currentInvoice.items],
      });
    }
  }, [currentInvoice]);

  const handleSave = async () => {
    if (!formData.customerId || !formData.items || formData.items.length === 0) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await dispatch(updateInvoice({
        id: invoiceId,
        type: formData.type || InvoiceType.Factura,
        status: formData.status || InvoiceStatus.Draft,
        customerId: formData.customerId,
        date: formData.date || new Date(),
        dueDate: formData.dueDate,
        notes: formData.notes,
        items: formData.items,
      })).unwrap();

      Alert.alert('Éxito', 'Factura actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la factura');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dueDate: selectedDate }));
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerPicker(false);
  };

  const handleProductSelect = (product: any) => {
    const newItem = {
      productId: product.id,
      description: product.name,
      quantity: 1,
      unitType: product.unitType || 'unidad',
      unitPrice: product.price,
      discount: 0,
      totalAmount: product.price,
      taxes: [],
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
    setShowProductSelector(false);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => 
        i === index 
          ? { ...item, quantity, totalAmount: quantity * item.unitPrice - item.discount }
          : item
      ) || []
    }));
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === formData.customerId);
  };

  const calculateSubtotal = () => {
    return formData.items?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;
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

  const selectedCustomer = getSelectedCustomer();
  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * 0.13; // 13% IVA
  const total = subtotal + taxAmount;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: theme.colors.text.secondary }]}>Cancelar</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Editar Factura</Text>
        
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Type */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Tipo de Documento</Text>
          
          <View style={styles.typeSelector}>
            {Object.values(InvoiceType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  { borderColor: theme.colors.border },
                  formData.type === type && { 
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '20'
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type }))}
              >
                <Text style={[
                  styles.typeText,
                  { color: theme.colors.text.primary },
                  formData.type === type && { color: theme.colors.primary }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Estado</Text>
          
          <View style={styles.statusSelector}>
            {Object.values(InvoiceStatus).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  { borderColor: theme.colors.border },
                  formData.status === status && { 
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '20'
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status }))}
              >
                <Text style={[
                  styles.statusText,
                  { color: theme.colors.text.primary },
                  formData.status === status && { color: theme.colors.primary }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Customer */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente</Text>
          
          <TouchableOpacity
            style={[styles.customerButton, { borderColor: theme.colors.border }]}
            onPress={() => setShowCustomerPicker(true)}
          >
            {selectedCustomer ? (
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                  {selectedCustomer.name}
                </Text>
                <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
                  {selectedCustomer.documentType}: {selectedCustomer.documentNumber}
                </Text>
              </View>
            ) : (
              <View style={styles.searchButton}>
                <Text style={[styles.searchText, { color: theme.colors.text.secondary }]}>
                  Seleccionar Cliente
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dates */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Fechas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Fecha de Emisión</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                {formData.date?.toLocaleDateString('es-ES') || 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Fecha de Vencimiento (Opcional)</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                {formData.dueDate?.toLocaleDateString('es-ES') || 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos/Servicios</Text>
          
          {formData.items && formData.items.length > 0 ? (
            formData.items.map((item, index) => (
              <View key={index} style={[styles.itemCard, { borderColor: theme.colors.border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
                    {item.description}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Text style={[styles.removeButton, { color: theme.colors.error }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.itemRow}>
                  <View style={styles.quantityContainer}>
                    <Text style={[styles.itemLabel, { color: theme.colors.text.secondary }]}>Cantidad</Text>
                    <TextInput
                      style={[styles.quantityInput, { borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                      value={item.quantity.toString()}
                      onChangeText={(text) => updateItemQuantity(index, parseFloat(text) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={[styles.itemLabel, { color: theme.colors.text.secondary }]}>Precio Unit.</Text>
                    <Text style={[styles.priceText, { color: theme.colors.text.primary }]}>
                      ${item.unitPrice.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.totalContainer}>
                    <Text style={[styles.itemLabel, { color: theme.colors.text.secondary }]}>Total</Text>
                    <Text style={[styles.totalText, { color: theme.colors.primary }]}>
                      ${item.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No hay productos agregados
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowProductSelector(true)}
          >
            <Text style={styles.addButtonText}>+ Agregar Producto</Text>
          </TouchableOpacity>
        </View>

        {/* Totals */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Totales</Text>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Subtotal:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>IVA (13%):</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
              ${taxAmount.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>Total:</Text>
            <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Notas (Opcional)</Text>
          
          <TextInput
            style={[styles.notesInput, { borderColor: theme.colors.border, color: theme.colors.text.primary }]}
            value={formData.notes || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Agregar notas adicionales..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showDueDatePicker && (
        <DateTimePicker
          value={formData.dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDueDateChange}
        />
      )}

      {/* Customer Picker Modal */}
      <CustomerPicker
        visible={showCustomerPicker}
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setShowCustomerPicker(false)}
      />

      {/* Product Selector Modal */}
      <ProductSelector
        visible={showProductSelector}
        products={products}
        onSelect={handleProductSelect}
        onClose={() => setShowProductSelector(false)}
      />
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
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    minWidth: 100,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  customerDocument: {
    fontSize: 14,
  },
  searchButton: {
    alignItems: 'center',
  },
  searchText: {
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  itemCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
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
    fontWeight: '500',
    flex: 1,
  },
  removeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  priceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EditInvoiceScreen;
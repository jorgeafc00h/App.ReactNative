// Add Invoice Screen - matches SwiftUI AddInvoiceView functionality
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addInvoice,
  setCurrentInvoice,
} from '../../store/slices/invoiceSlice';
import {
  selectCustomers,
  selectCurrentCustomer,
} from '../../store/selectors/customerSelectors';
import { 
  selectProducts,
} from '../../store/selectors/productSelectors';
import {
  selectCurrentCompany,
} from '../../store/selectors/companySelectors';

import {
  InvoiceType,
  CreateInvoiceInput,
  InvoiceDetailInput,
} from '../../types/invoice';
import { Customer } from '../../types/customer';
import { Product } from '../../types/product';
import { API_CONFIG } from '../../config/api';

import { CustomerPicker } from '../../components/invoices/CustomerPicker';
import { ProductSelector } from '../../components/invoices/ProductSelector';
import { InvoiceCalculator } from '../../components/invoices/InvoiceCalculator';
import { ProductDetailEditor } from '../../components/invoices/ProductDetailEditor';

type AddInvoiceNavigation = StackNavigationProp<any, 'AddInvoice'>;

interface AddInvoiceFormData {
  invoiceNumber: string;
  date: Date;
  invoiceType: InvoiceType;
  customer: Customer | null;
  items: InvoiceDetailInput[];
  // Export invoice fields
  nombEntrega: string;
  docuEntrega: string;
  observaciones: string;
  receptor: string;
  receptorDocu: string;
}

interface ProductFormData {
  productName: string;
  unitPrice: number;
  hasTax: boolean;
}

export const AddInvoiceScreen: React.FC = () => {
  const navigation = useNavigation<AddInvoiceNavigation>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux selectors
  const customers = useAppSelector(selectCustomers);
  const currentCustomer = useAppSelector(selectCurrentCustomer);
  const products = useAppSelector(selectProducts);
  const currentCompany = useAppSelector(selectCurrentCompany);

  // Form state
  const [formData, setFormData] = useState<AddInvoiceFormData>({
    invoiceNumber: '',
    date: new Date(),
    invoiceType: InvoiceType.Factura,
    customer: null,
    items: [],
    nombEntrega: '',
    docuEntrega: '',
    observaciones: '',
    receptor: '',
    receptorDocu: '',
  });

  // UI state
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  // Product form state (matches Swift addProductSection)
  const [productForm, setProductForm] = useState<ProductFormData>({
    productName: '',
    unitPrice: 0,
    hasTax: true,
  });

  // Available invoice types (matches Swift)
  const invoiceTypes = [
    InvoiceType.Factura,
    InvoiceType.CCF,
    InvoiceType.SujetoExcluido,
    InvoiceType.FacturaExportacion,
  ];

  // Generate next invoice number (matches Swift functionality)
  const generateNextInvoiceNumber = useCallback(() => {
    if (!currentCompany) return '00001';
    
    // This would be replaced with actual logic to get the next number from existing invoices
    // For now, using a simple timestamp-based approach
    const timestamp = Date.now().toString().slice(-5);
    return timestamp.padStart(5, '0');
  }, [currentCompany]);

  // Initialize form on mount
  useEffect(() => {
    const nextNumber = generateNextInvoiceNumber();
    setFormData(prev => ({
      ...prev,
      invoiceNumber: nextNumber,
    }));
  }, [generateNextInvoiceNumber]);

  // Tax calculations (matches Swift ViewModel calculations)
  const taxCalculations = useMemo(() => {
    const taxFactor = API_CONFIG.includedTax; // 1.13
    
    // Calculate totals for all items
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);

    const tax = totalAmount > 0 ? totalAmount - (totalAmount / taxFactor) : 0;
    const subTotal = totalAmount - tax;
    const reteRenta = totalAmount > 0 ? totalAmount * 0.10 : 0;
    
    let totalPagar = totalAmount;
    if (formData.invoiceType === InvoiceType.SujetoExcluido) {
      totalPagar = totalAmount - reteRenta;
    }

    const hasRetention = formData.customer?.hasContributorRetention || false;
    const ivaRete1 = hasRetention ? (totalAmount / taxFactor) * 0.01 : 0;

    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      subTotal: Math.round(subTotal * 100) / 100,
      reteRenta: Math.round(reteRenta * 100) / 100,
      totalPagar: Math.round(totalPagar * 100) / 100,
      ivaRete1: Math.round(ivaRete1 * 100) / 100,
      totalWithoutTax: Math.round((totalAmount / taxFactor) * 100) / 100,
      isCCF: formData.invoiceType === InvoiceType.CCF,
    };
  }, [formData.items, formData.invoiceType, formData.customer]);

  // Product form calculations (matches Swift ViewModel)
  const productCalculations = useMemo(() => {
    const { unitPrice, hasTax } = productForm;
    const taxFactor = API_CONFIG.includedTax; // 1.13
    
    const tax = hasTax 
      ? unitPrice - (unitPrice / taxFactor)
      : (unitPrice * taxFactor) - unitPrice;
    
    const priceWithoutTax = unitPrice - (hasTax ? tax : 0);
    const pricePlusTax = unitPrice + (hasTax ? 0 : tax);

    return {
      tax: Math.round(tax * 100) / 100,
      priceWithoutTax: Math.round(priceWithoutTax * 100) / 100,
      pricePlusTax: Math.round(pricePlusTax * 100) / 100,
    };
  }, [productForm.unitPrice, productForm.hasTax]);

  // Form validation (matches Swift disableAddInvoice)
  const isFormValid = useMemo(() => {
    return formData.invoiceNumber.trim() !== '' && 
           formData.items.length > 0 && 
           formData.customer !== null;
  }, [formData.invoiceNumber, formData.items.length, formData.customer]);

  // Product form validation (matches Swift isDisabledAddProduct)
  const isProductFormValid = useMemo(() => {
    return productForm.productName.trim() !== '' && productForm.unitPrice > 0;
  }, [productForm.productName, productForm.unitPrice]);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer,
    }));
    setShowCustomerPicker(false);
  }, []);

  // Handle product selection from existing products
  const handleProductSelect = useCallback((selectedProducts: Product[]) => {
    const newItems: InvoiceDetailInput[] = selectedProducts.map(product => ({
      quantity: 1,
      productId: product.id,
      productName: product.productName,
      unitPrice: product.unitPrice,
      obsItem: '',
    }));

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));
    setShowProductSelector(false);
  }, []);

  // Add new product (matches Swift AddNewProduct)
  const handleAddNewProduct = useCallback(() => {
    if (!isProductFormValid) return;

    const finalPrice = productForm.hasTax 
      ? productForm.unitPrice 
      : productCalculations.pricePlusTax;

    const newItem: InvoiceDetailInput = {
      quantity: 1,
      productId: `temp_${Date.now()}`, // Temporary ID for new products
      productName: productForm.productName,
      unitPrice: finalPrice,
      obsItem: '',
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset product form
    setProductForm({
      productName: '',
      unitPrice: 0,
      hasTax: true,
    });
    setShowAddProductForm(false);
  }, [productForm, productCalculations, isProductFormValid]);

  // Update item quantity/price
  const handleUpdateItem = useCallback((index: number, updates: Partial<InvoiceDetailInput>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  // Remove item
  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // Handle invoice creation (matches Swift addInvoice)
  const handleCreateInvoice = useCallback(async () => {
    if (!isFormValid || !currentCompany || !formData.customer) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const invoiceInput: CreateInvoiceInput = {
        invoiceNumber: formData.invoiceNumber,
        date: formData.date.toISOString(),
        invoiceType: formData.invoiceType,
        customerId: formData.customer.id,
        companyId: currentCompany.id,
        items: formData.items,
        nombEntrega: formData.nombEntrega,
        docuEntrega: formData.docuEntrega,
        observaciones: formData.observaciones,
        receptor: formData.receptor,
        receptorDocu: formData.receptorDocu,
        customerHasRetention: formData.customer.hasContributorRetention,
      };

      // Create invoice via Redux
      const resultAction = dispatch(addInvoice(invoiceInput));
      
      if (addInvoice.fulfilled.match(resultAction)) {
        // Set as current invoice and navigate back
        dispatch(setCurrentInvoice(resultAction.payload.id));
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo crear la factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la factura');
    }
  }, [formData, isFormValid, currentCompany, dispatch, navigation]);

  // Handle date change
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancelar</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Nueva Factura</Text>
        
        <TouchableOpacity 
          onPress={handleCreateInvoice}
          disabled={!isFormValid}
          style={[
            styles.saveButton, 
            { 
              backgroundColor: isFormValid ? theme.colors.primary : theme.colors.border.light,
            }
          ]}
        >
          <Text style={[styles.saveButtonText, { 
            color: isFormValid ? '#FFFFFF' : theme.colors.text.secondary 
          }]}>
            Guardar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Customer Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente</Text>
          
          <TouchableOpacity 
            style={[styles.customerButton, { borderColor: theme.colors.border.light }]}
            onPress={() => setShowCustomerPicker(true)}
          >
            {formData.customer ? (
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                  {formData.customer.firstName} {formData.customer.lastName}
                </Text>
                <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
                  {formData.customer.nationalId}
                </Text>
              </View>
            ) : (
              <View style={styles.searchButton}>
                <Text style={[styles.searchText, { color: theme.colors.primary }]}>🔍 Buscar Cliente</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Invoice Data Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Datos de Factura</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Número de Factura</Text>
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text.primary,
                borderColor: theme.colors.border.light 
              }]}
              value={formData.invoiceNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, invoiceNumber: text }))}
              keyboardType="numeric"
              placeholder="00001"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Fecha</Text>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: theme.colors.border.light }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                {formData.date.toLocaleDateString('es-SV')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Tipo Documento</Text>
            <View style={[styles.pickerContainer, { borderColor: theme.colors.border.light }]}>
              {invoiceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.invoiceType === type && { backgroundColor: theme.colors.primary + '20' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, invoiceType: type }))}
                >
                  <Text style={[
                    styles.pickerText,
                    { 
                      color: formData.invoiceType === type 
                        ? theme.colors.primary 
                        : theme.colors.text.primary 
                    }
                  ]}>
                    {type === InvoiceType.CCF ? 'CCF' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Export Section (only for FacturaExportacion) */}
        {formData.invoiceType === InvoiceType.FacturaExportacion && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Información de Exportación
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Nombre Entrega</Text>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light 
                }]}
                value={formData.nombEntrega}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nombEntrega: text }))}
                placeholder="Nombre de quien entrega"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Documento Entrega</Text>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light 
                }]}
                value={formData.docuEntrega}
                onChangeText={(text) => setFormData(prev => ({ ...prev, docuEntrega: text }))}
                placeholder="Documento de identidad"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          </View>
        )}

        {/* Products Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos</Text>
          
          {formData.items.map((item, index) => (
            <ProductDetailEditor
              key={index}
              item={item}
              invoiceType={formData.invoiceType}
              onUpdate={(updates) => handleUpdateItem(index, updates)}
              onRemove={() => handleRemoveItem(index)}
            />
          ))}

          {/* Add Product Form */}
          {showAddProductForm && (
            <View style={[styles.addProductForm, { borderColor: theme.colors.border.light }]}>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light 
                }]}
                value={productForm.productName}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, productName: text }))}
                placeholder="Nombre del producto"
                placeholderTextColor={theme.colors.text.secondary}
              />

              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light 
                }]}
                value={productForm.unitPrice.toString()}
                onChangeText={(text) => setProductForm(prev => ({ 
                  ...prev, 
                  unitPrice: parseFloat(text) || 0 
                }))}
                placeholder="Precio unitario"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="decimal-pad"
              />

              <View style={styles.taxToggleRow}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  IVA Incluido: {productForm.hasTax ? 'Sí' : 'No'}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.toggle,
                    { backgroundColor: productForm.hasTax ? theme.colors.primary : theme.colors.border.light }
                  ]}
                  onPress={() => setProductForm(prev => ({ ...prev, hasTax: !prev.hasTax }))}
                >
                  <View style={[
                    styles.toggleThumb,
                    productForm.hasTax && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={styles.calculationsRow}>
                <Text style={[styles.calculationText, { color: theme.colors.text.secondary }]}>
                  IVA: ${productCalculations.tax.toFixed(2)}
                </Text>
                <Text style={[styles.calculationText, { color: theme.colors.text.secondary }]}>
                  {productForm.hasTax 
                    ? `Sin IVA: $${productCalculations.priceWithoutTax.toFixed(2)}`
                    : `Con IVA: $${productCalculations.pricePlusTax.toFixed(2)}`
                  }
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.addProductButton,
                  { 
                    backgroundColor: isProductFormValid ? theme.colors.primary : theme.colors.border.light,
                  }
                ]}
                onPress={handleAddNewProduct}
                disabled={!isProductFormValid}
              >
                <Text style={[styles.addProductButtonText, { 
                  color: isProductFormValid ? '#FFFFFF' : theme.colors.text.secondary 
                }]}>
                  ✓ Agregar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.productActions}>
            {!showAddProductForm && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowProductSelector(true)}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  🔍 Buscar Producto
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddProductForm(!showAddProductForm)}
            >
              <Text style={[styles.actionButtonText, { 
                color: showAddProductForm ? theme.colors.error : theme.colors.primary 
              }]}>
                {showAddProductForm ? '✕' : '+'} {showAddProductForm ? 'Cancelar' : 'Nuevo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Section */}
        <InvoiceCalculator 
          calculations={taxCalculations}
          invoiceType={formData.invoiceType}
          customer={formData.customer}
        />

        {/* Create Invoice Button */}
        <View style={styles.createSection}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: isFormValid ? theme.colors.primary : theme.colors.border.light,
              }
            ]}
            onPress={handleCreateInvoice}
            disabled={!isFormValid}
          >
            <Text style={[styles.createButtonText, { 
              color: isFormValid ? '#FFFFFF' : theme.colors.text.secondary 
            }]}>
              ✓ Crear Factura
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
  pickerOption: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    margin: 2,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addProductForm: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  taxToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  calculationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  calculationText: {
    fontSize: 14,
  },
  addProductButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  createSection: {
    margin: 16,
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AddInvoiceScreen;
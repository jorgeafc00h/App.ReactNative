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
  KeyboardAvoidingView,
  Switch,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import { addInvoice, setCurrentInvoice } from '../../store/slices/invoiceSlice';
import { addProduct } from '../../store/slices/productSlice';
import { selectAllCustomers, selectCurrentCustomer } from '../../store/selectors/customerSelectors';
import { selectAllProducts } from '../../store/selectors/productSelectors';
import { selectCurrentCompany } from '../../store/selectors/companySelectors';

import {
  InvoiceType,
  CreateInvoiceInput,
  InvoiceDetailInput,
} from '../../types/invoice';
import { Customer } from '../../types/customer';
import { Product, ProductStatus, UnitOfMeasure, TaxCategory } from '../../types/product';
import { API_CONFIG } from '../../config/api';

import { CustomerPicker } from '../../components/invoices/CustomerPicker';
import { ProductSelector } from '../../components/invoices/ProductSelector';
import { ProductDetailEditor } from '../../components/invoices/ProductDetailEditor';

type AddInvoiceNavigation = StackNavigationProp<any, 'AddInvoice'>;

// Matches Swift AddInvoiceViewModel structure
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

// Matches Swift addProductSection state
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
  const customers = useAppSelector(selectAllCustomers);
  const products = useAppSelector(selectAllProducts);
  const currentCompany = useAppSelector(selectCurrentCompany);
  const allInvoices = useAppSelector(state => state.invoices.invoices);

  // Form state - matches Swift ViewModel
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

  // UI state - matches Swift ViewModel
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddProductSection, setShowAddProductSection] = useState(false);
  const [showInvoiceTypePicker, setShowInvoiceTypePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product form state - matches Swift addProductSection
  const [productForm, setProductForm] = useState<ProductFormData>({
    productName: '',
    unitPrice: 0,
    hasTax: true,
  });

  // Available invoice types - matches Swift invoiceTypes
  const invoiceTypes = [
    InvoiceType.Factura,
    InvoiceType.CCF,
    InvoiceType.SujetoExcluido,
    InvoiceType.FacturaExportacion,
  ];

  // Tax factor constant
  const TAX_FACTOR = API_CONFIG.includedTax || 1.13;

  // Dark cyan color to match Swift InvoiceDetailView button style
  const DARK_CYAN = '#008B8B';

  // Generate next invoice number - matches Swift getNextInvoiceNumber
  const generateNextInvoiceNumber = useCallback((invoiceType: InvoiceType) => {
    if (!currentCompany?.id) return '00001';

    // Get all invoices for the current company and document type
    // This matches Swift's FetchDescriptor with predicate filtering
    
    // Convert invoice type to document type (matches Swift Extensions.documentTypeFromInvoiceType + TipoDocumento enum)
    const getDocumentType = (type: InvoiceType): string => {
      switch (type) {
        case InvoiceType.Factura: return '01';
        case InvoiceType.CCF: return '03';  
        case InvoiceType.NotaCredito: return '05';
        case InvoiceType.SujetoExcluido: return '14';
        case InvoiceType.NotaDebito: return '06';
        case InvoiceType.NotaRemision: return '04';
        case InvoiceType.ComprobanteLiquidacion: return '08';
        case InvoiceType.FacturaExportacion: return '11';
        default: return '01';
      }
    };

    const documentType = getDocumentType(invoiceType);
    
    // Filter invoices by company and document type (matches Swift predicate)
    const companyInvoices = allInvoices.filter(invoice => 
      invoice.companyId === currentCompany.id && 
      invoice.documentType === documentType
    );

    // Sort by invoice number (descending) to get latest (matches Swift sortBy)
    const sortedInvoices = companyInvoices
      .filter(invoice => invoice.invoiceNumber && !isNaN(parseInt(invoice.invoiceNumber)))
      .sort((a, b) => parseInt(b.invoiceNumber) - parseInt(a.invoiceNumber));

    // Get next number (matches Swift logic)
    if (sortedInvoices.length > 0) {
      const latestNumber = parseInt(sortedInvoices[0].invoiceNumber);
      const nextNumber = latestNumber + 1;
      return nextNumber.toString().padStart(5, '0'); // Format as 5-digit zero-padded string
    } else {
      return '00001'; // First invoice for this company and document type
    }
  }, [currentCompany?.id, allInvoices]);

  // Initialize form on mount - matches Swift onAppear
  useEffect(() => {
    const nextNumber = generateNextInvoiceNumber(formData.invoiceType);
    setFormData(prev => ({
      ...prev,
      invoiceNumber: nextNumber,
    }));
  }, [generateNextInvoiceNumber, formData.invoiceType]);

  // Update invoice number when invoice type changes (matches Swift behavior)
  useEffect(() => {
    const nextNumber = generateNextInvoiceNumber(formData.invoiceType);
    setFormData(prev => ({
      ...prev,
      invoiceNumber: nextNumber,
    }));
  }, [formData.invoiceType, generateNextInvoiceNumber]);

  // Product tax calculations - matches Swift productTax, productWithoutTax, productUnitPricePlusTax
  const productCalculations = useMemo(() => {
    const { unitPrice, hasTax } = productForm;
    
    const tax = hasTax 
      ? unitPrice - (unitPrice / TAX_FACTOR)
      : (unitPrice * TAX_FACTOR) - unitPrice;
    
    const priceWithoutTax = unitPrice - (hasTax ? tax : 0);
    const pricePlusTax = unitPrice + (hasTax ? 0 : tax);

    return {
      tax: Math.round(tax * 100) / 100,
      priceWithoutTax: Math.round(priceWithoutTax * 100) / 100,
      pricePlusTax: Math.round(pricePlusTax * 100) / 100,
    };
  }, [productForm.unitPrice, productForm.hasTax, TAX_FACTOR]);

  // Invoice totals calculations - matches Swift totalAmount, subTotal, reteRenta, totalPagar
  const invoiceCalculations = useMemo(() => {
    const totalAmount = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unitPrice || 0));
    }, 0);

    const tax = totalAmount > 0 ? totalAmount - (totalAmount / TAX_FACTOR) : 0;
    const subTotal = totalAmount - tax;
    const reteRenta = totalAmount > 0 ? totalAmount * 0.10 : 0;
    
    let totalPagar = totalAmount;
    if (formData.invoiceType === InvoiceType.SujetoExcluido) {
      totalPagar = totalAmount - reteRenta;
    }

    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      subTotal: Math.round(subTotal * 100) / 100,
      reteRenta: Math.round(reteRenta * 100) / 100,
      totalPagar: Math.round(totalPagar * 100) / 100,
    };
  }, [formData.items, formData.invoiceType, TAX_FACTOR]);

  // Form validation - matches Swift disableAddInvoice
  const isFormValid = useMemo(() => {
    return formData.invoiceNumber.trim() !== '' && 
           formData.items.length > 0 && 
           formData.customer !== null;
  }, [formData.invoiceNumber, formData.items.length, formData.customer]);

  // Product form validation - matches Swift isDisabledAddProduct
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

  // Add new product - matches Swift AddNewProduct
  const handleAddNewProduct = useCallback(() => {
    if (!isProductFormValid || !currentCompany?.id) return;

    // Use price with tax if not already included - matches Swift logic
    const finalPrice = productForm.hasTax 
      ? productForm.unitPrice 
      : productCalculations.pricePlusTax;

    // Create a proper Product object and save it to the store
    const productId = `product_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newProduct: Product = {
      id: productId,
      productName: productForm.productName,
      unitPrice: finalPrice,
      unitOfMeasure: UnitOfMeasure.UNIDAD, // Default unit
      taxCategory: productForm.hasTax ? TaxCategory.GRAVADO : TaxCategory.EXENTO,
      status: ProductStatus.Active,
      companyId: currentCompany.id, // Link to current company
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Add product to the store so it appears in Products section
    dispatch(addProduct(newProduct));

    // Create invoice item using the real product ID
    const newItem: InvoiceDetailInput = {
      quantity: 1,
      productId: productId,
      productName: productForm.productName,
      unitPrice: finalPrice,
      obsItem: '',
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset product form and hide section - matches Swift
    setProductForm({
      productName: '',
      unitPrice: 0,
      hasTax: true,
    });
    setShowAddProductSection(false);
  }, [productForm, productCalculations, isProductFormValid, currentCompany?.id, dispatch]);

  // Update item - for ProductDetailEditor
  const handleUpdateItem = useCallback((index: number, updates: Partial<InvoiceDetailInput>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  // Remove item - matches Swift deleteProduct
  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // Create invoice - matches Swift addInvoice
  const handleCreateInvoice = useCallback(async () => {
    if (!isFormValid || !currentCompany || !formData.customer) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

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

      // Create invoice via Redux - matches Swift modelContext.insert(invoice)
      const result = dispatch(addInvoice(invoiceInput));
      
      // The addInvoice action returns the created invoice in payload
      const createdInvoice = (result as any).payload;
      
      if (createdInvoice && createdInvoice.id) {
        dispatch(setCurrentInvoice(createdInvoice.id));
        
        Alert.alert(
          'Factura Creada',
          `Factura ${formData.invoiceNumber} creada exitosamente`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('No se pudo crear la factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo crear la factura: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isFormValid, currentCompany, dispatch, navigation]);

  // Handle date change
  const handleDateChange = useCallback((_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get invoice type display name
  const getInvoiceTypeName = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura: return 'Factura';
      case InvoiceType.CCF: return 'CCF';
      case InvoiceType.SujetoExcluido: return 'Sujeto Excluido';
      case InvoiceType.FacturaExportacion: return 'Exportación';
      default: return String(type);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header - matches Swift toolbar */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancelar</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Nueva Factura</Text>
        
        <TouchableOpacity 
          onPress={handleCreateInvoice}
          disabled={!isFormValid || isSubmitting}
        >
          <Text style={[
            styles.saveButton, 
            { 
              color: isFormValid && !isSubmitting 
                ? theme.colors.primary 
                : theme.colors.text.secondary 
            }
          ]}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Customer Section - matches Swift CustomerSection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente</Text>
          
          <TouchableOpacity 
            style={[styles.customerButton, { borderColor: theme.colors.border.light }]}
            onPress={() => setShowCustomerPicker(true)}
          >
            {formData.customer ? (
              <View style={styles.customerInfo}>
                <View>
                  <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                    {formData.customer.firstName} {formData.customer.lastName}
                  </Text>
                  <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
                    {formData.customer.nationalId}
                  </Text>
                </View>
                <Text style={[styles.changeText, { color: theme.colors.primary }]}>Cambiar</Text>
              </View>
            ) : (
              <View style={styles.searchButton}>
                <Text style={[styles.searchText, { color: theme.colors.primary }]}>
                  🔍 Buscar Cliente
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Invoice Data Section - matches Swift InvoiceDataSection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Datos de Factura
          </Text>
          
          {/* Invoice Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              Número de Factura
            </Text>
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text.primary,
                borderColor: theme.colors.border.light,
                backgroundColor: theme.colors.background.secondary,
              }]}
              value={formData.invoiceNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, invoiceNumber: text }))}
              keyboardType="numeric"
              placeholder="00001"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          {/* Date */}
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

          {/* Invoice Type - Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              Tipo Documento
            </Text>
            <TouchableOpacity 
              style={[styles.dropdown, { borderColor: theme.colors.border.light, backgroundColor: theme.colors.background.secondary }]}
              onPress={() => setShowInvoiceTypePicker(true)}
            >
              <Text style={[styles.dropdownText, { color: theme.colors.text.primary }]}>
                {getInvoiceTypeName(formData.invoiceType)}
              </Text>
              <Text style={[styles.dropdownArrow, { color: theme.colors.text.secondary }]}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Section - matches Swift FacturaExportacionSection */}
        {formData.invoiceType === InvoiceType.FacturaExportacion && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Información de Exportación
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Nombre Entrega
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light,
                  backgroundColor: theme.colors.background.secondary,
                }]}
                value={formData.nombEntrega}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nombEntrega: text }))}
                placeholder="Nombre de quien entrega"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Documento Entrega
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light,
                  backgroundColor: theme.colors.background.secondary,
                }]}
                value={formData.docuEntrega}
                onChangeText={(text) => setFormData(prev => ({ ...prev, docuEntrega: text }))}
                placeholder="Documento de identidad"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          </View>
        )}

        {/* Products Section - matches Swift ProductDetailsSection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos</Text>
          
          {/* Product List */}
          {formData.items.map((item, index) => (
            <ProductDetailEditor
              key={item.productId || index}
              item={item}
              invoiceType={formData.invoiceType}
              onUpdate={(updates) => handleUpdateItem(index, updates)}
              onRemove={() => handleRemoveItem(index)}
            />
          ))}

          {/* Add Product Form - matches Swift addProductSection */}
          {showAddProductSection && (
            <View style={[styles.addProductForm, { borderColor: theme.colors.border.light }]}>
              {/* Product Name */}
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light,
                  backgroundColor: theme.colors.background.secondary,
                  marginBottom: 12,
                }]}
                value={productForm.productName}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, productName: text }))}
                placeholder="Producto"
                placeholderTextColor={theme.colors.text.secondary}
              />

              {/* Unit Price */}
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light,
                  backgroundColor: theme.colors.background.secondary,
                  marginBottom: 12,
                }]}
                value={productForm.unitPrice > 0 ? productForm.unitPrice.toString() : ''}
                onChangeText={(text) => setProductForm(prev => ({ 
                  ...prev, 
                  unitPrice: parseFloat(text) || 0 
                }))}
                placeholder="Precio Unitario"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="decimal-pad"
              />

              {/* Tax Toggle - matches Swift Toggle */}
              <View style={styles.taxToggleRow}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  IVA Incluido: {productForm.hasTax ? 'Sí' : 'No'}
                </Text>
                <Switch
                  value={productForm.hasTax}
                  onValueChange={(value) => setProductForm(prev => ({ ...prev, hasTax: value }))}
                  trackColor={{ false: theme.colors.border.light, true: theme.colors.primary }}
                  thumbColor={'#FFFFFF'}
                />
              </View>

              {/* Tax Calculations - matches Swift HStack calculations */}
              <View style={styles.calculationsRow}>
                <Text style={[styles.calculationText, { color: theme.colors.text.secondary }]}>
                  IVA: {formatCurrency(productCalculations.tax)}
                </Text>
                <Text style={[styles.calculationText, { color: theme.colors.text.secondary }]}>
                  {productForm.hasTax 
                    ? `Precio Unitario: ${formatCurrency(productCalculations.priceWithoutTax)}`
                    : `Precio más IVA: ${formatCurrency(productCalculations.pricePlusTax)}`
                  }
                </Text>
              </View>

              {/* Add Button - matches Swift InvoiceDetailView Button style */}
              <TouchableOpacity
                style={[
                  styles.addProductButton,
                  { 
                    backgroundColor: isProductFormValid 
                      ? DARK_CYAN  // Dark cyan like Swift app
                      : theme.colors.border.light,
                  }
                ]}
                onPress={handleAddNewProduct}
                disabled={!isProductFormValid}
                activeOpacity={0.8}
              >
                <View style={styles.addProductButtonContent}>
                  <Text style={[styles.addProductButtonIcon, { 
                    color: isProductFormValid ? '#000000' : theme.colors.text.secondary 
                  }]}>
                    ✓
                  </Text>
                  <Text style={[styles.addProductButtonText, { 
                    color: isProductFormValid ? '#000000' : theme.colors.text.secondary 
                  }]}>
                    Agregar Producto
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons - matches Swift HStack with buttons */}
          <View style={styles.productActions}>
            {!showAddProductSection && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowProductSelector(true)}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  🔍 Buscar Producto
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={{ flex: 1 }} />
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddProductSection(!showAddProductSection)}
            >
              <Text style={[styles.actionButtonText, { 
                color: showAddProductSection ? theme.colors.error : theme.colors.primary 
              }]}>
                {showAddProductSection ? '✕' : '+'} 
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Section - matches Swift TotalSection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Totales</Text>
          
          {formData.invoiceType === InvoiceType.SujetoExcluido ? (
            // Sujeto Excluido totals
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>
                  Sub Total
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(invoiceCalculations.totalAmount)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>
                  Renta Retenida
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(invoiceCalculations.reteRenta)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>
                  Total
                </Text>
                <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                  {formatCurrency(invoiceCalculations.totalPagar)}
                </Text>
              </View>
            </>
          ) : formData.invoiceType === InvoiceType.FacturaExportacion ? (
            // Export invoice totals
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>
                Total
              </Text>
              <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                {formatCurrency(invoiceCalculations.totalPagar)}
              </Text>
            </View>
          ) : (
            // Regular invoice totals (Factura, CCF)
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>
                  Sub Total
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(invoiceCalculations.subTotal)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>
                  IVA (13%)
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(invoiceCalculations.tax)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.grandTotalLabel, { color: theme.colors.text.primary }]}>
                  Total
                </Text>
                <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                  {formatCurrency(invoiceCalculations.totalAmount)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Create Invoice Button - matches Swift InvoiceDetailView Button style */}
        <View style={styles.createSection}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: isFormValid && !isSubmitting 
                  ? DARK_CYAN  // Dark cyan like Swift app
                  : theme.colors.border.light,
              }
            ]}
            onPress={handleCreateInvoice}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.8}
          >
            <View style={styles.createButtonContent}>
              {!isSubmitting && (
                <Text style={[styles.createButtonIcon, { 
                  color: isFormValid ? '#000000' : theme.colors.text.secondary 
                }]}>
                  ✓
                </Text>
              )}
              <Text style={[styles.createButtonText, { 
                color: isFormValid && !isSubmitting ? '#000000' : theme.colors.text.secondary 
              }]}>
                {isSubmitting ? 'Creando Factura...' : 'Crear Factura'}
              </Text>
            </View>
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

      {/* Invoice Type Picker Modal */}
      <Modal
        visible={showInvoiceTypePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={[styles.modal, { backgroundColor: theme.colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border.light }]}>
            <TouchableOpacity onPress={() => setShowInvoiceTypePicker(false)}>
              <Text style={[styles.cancelButton, { color: theme.colors.text.secondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Tipo Documento</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.typeOptionsContainer}>
            {invoiceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOptionRow,
                  { borderBottomColor: theme.colors.border.light },
                  formData.invoiceType === type && { backgroundColor: theme.colors.primary + '10' }
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, invoiceType: type }));
                  setShowInvoiceTypePicker(false);
                }}
              >
                <Text style={[
                  styles.typeOptionText,
                  { 
                    color: formData.invoiceType === type 
                      ? theme.colors.primary 
                      : theme.colors.text.primary,
                    fontWeight: formData.invoiceType === type ? '600' : '400'
                  }
                ]}>
                  {getInvoiceTypeName(type)}
                </Text>
                {formData.invoiceType === type && (
                  <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  customerButton: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerDocument: {
    fontSize: 14,
    marginTop: 2,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    alignItems: 'center',
    paddingVertical: 8,
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
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  typeOptionsContainer: {
    flex: 1,
  },
  typeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeOptionText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addProductForm: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  taxToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calculationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calculationText: {
    fontSize: 13,
  },
  addProductButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12, // Increased corner radius like Swift app
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Ensure good touch target
    // Add shadow for depth like Swift buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addProductButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProductButtonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  createSection: {
    margin: 16,
    marginTop: 8,
  },
  createButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12, // Consistent with Swift app
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Larger button for primary action
    // Add shadow for depth like Swift buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AddInvoiceScreen;

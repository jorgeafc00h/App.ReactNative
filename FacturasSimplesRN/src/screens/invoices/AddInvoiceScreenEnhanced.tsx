// Enhanced Add Invoice Screen with multi-step form and full service integration
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
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
  updateInvoice,
  setInvoiceStatus,
} from '../../store/slices/invoiceSlice';
import {
  selectAllCustomers,
  selectCurrentCustomer,
} from '../../store/selectors/customerSelectors';
import { 
  selectAllProducts,
} from '../../store/selectors/productSelectors';
import {
  selectCurrentCompany,
} from '../../store/selectors/companySelectors';

// Services
import { InvoiceService } from '../../services/api/InvoiceService';
import { getCertificateService } from '../../services/security/CertificateService';
import { getPDFGenerationService } from '../../services/pdf/PDFGenerationService';
import { isProductionCompany } from '../../utils/companyEnvironment';

import {
  InvoiceType,
  InvoiceStatus,
  CreateInvoiceInput,
  InvoiceDetailInput,
  Invoice,
  InvoiceDetail,
} from '../../types/invoice';
import { Customer } from '../../types/customer';
import { Product } from '../../types/product';
import { API_CONFIG } from '../../config/api';
import { DTE_Base, ServiceCredentials } from '../../types/dte';

import { CustomerPicker } from '../../components/invoices/CustomerPicker';
import { ProductSelector } from '../../components/invoices/ProductSelector';
import { InvoiceCalculator } from '../../components/invoices/InvoiceCalculator';
import { ProductDetailEditor } from '../../components/invoices/ProductDetailEditor';

type AddInvoiceNavigation = StackNavigationProp<any, 'AddInvoice'>;

// Multi-step form navigation
enum FormStep {
  BASIC_INFO = 'basic_info',
  CUSTOMER_SELECTION = 'customer_selection',
  PRODUCT_SELECTION = 'product_selection',
  INVOICE_DETAILS = 'invoice_details',
  REVIEW_AND_SUBMIT = 'review_and_submit'
}

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
  // Additional tracking
  isDraft: boolean;
}

interface ProductFormData {
  productName: string;
  unitPrice: number;
  hasTax: boolean;
}

interface SubmissionState {
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isValidatingCertificate: boolean;
  isDTESubmission: boolean;
  submissionProgress: number;
  submissionStatus: string;
  error: string | null;
}

export const AddInvoiceScreenEnhanced: React.FC = () => {
  const navigation = useNavigation<AddInvoiceNavigation>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux selectors
  const customers = useAppSelector(selectAllCustomers);
  const currentCustomer = useAppSelector(selectCurrentCustomer);
  const products = useAppSelector(selectAllProducts);
  const currentCompany = useAppSelector(selectCurrentCompany);

  const isProduction = isProductionCompany(currentCompany);

  // Services
  const invoiceService = useMemo(() => new InvoiceService(isProduction), [isProduction]);
  const certificateService = useMemo(() => getCertificateService(isProduction), [isProduction]);
  const pdfService = useMemo(() => getPDFGenerationService(isProduction), [isProduction]);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  
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
    isDraft: false,
  });

  // Submission state
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isGeneratingPDF: false,
    isValidatingCertificate: false,
    isDTESubmission: false,
    submissionProgress: 0,
    submissionStatus: '',
    error: null,
  });

  // UI state
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  // Product form state (matches Swift addProductSection)
  const [productForm, setProductForm] = useState<ProductFormData>({
    productName: '',
    unitPrice: 0,
    hasTax: true,
  });

  // Step titles for navigation
  const stepTitles = {
    [FormStep.BASIC_INFO]: 'Información Básica',
    [FormStep.CUSTOMER_SELECTION]: 'Selección de Cliente',
    [FormStep.PRODUCT_SELECTION]: 'Productos',
    [FormStep.INVOICE_DETAILS]: 'Detalles de Factura',
    [FormStep.REVIEW_AND_SUBMIT]: 'Revisar y Enviar',
  };

  // Available invoice types
  const invoiceTypes = [
    InvoiceType.Factura,
    InvoiceType.CCF,
    InvoiceType.SujetoExcluido,
    InvoiceType.FacturaExportacion,
  ];

  // Step order for navigation
  const stepOrder = [
    FormStep.BASIC_INFO,
    FormStep.CUSTOMER_SELECTION,
    FormStep.PRODUCT_SELECTION,
    FormStep.INVOICE_DETAILS,
    FormStep.REVIEW_AND_SUBMIT,
  ];

  const currentStepIndex = stepOrder.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepOrder.length - 1;

  // Step validation
  const stepValidation = {
    [FormStep.BASIC_INFO]: () => formData.invoiceNumber.trim() !== '',
    [FormStep.CUSTOMER_SELECTION]: () => formData.customer !== null,
    [FormStep.PRODUCT_SELECTION]: () => formData.items.length > 0,
    [FormStep.INVOICE_DETAILS]: () => true, // Optional fields
    [FormStep.REVIEW_AND_SUBMIT]: () => isFormValid,
  };

  // Step navigation functions
  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step);
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, []);

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      const nextStep = stepOrder[currentStepIndex + 1];
      if (stepValidation[currentStep]()) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        goToStep(nextStep);
      } else {
        Alert.alert('Error', 'Por favor complete todos los campos requeridos en este paso.');
      }
    }
  }, [currentStep, currentStepIndex, isLastStep, stepOrder, stepValidation, goToStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      const previousStep = stepOrder[currentStepIndex - 1];
      goToStep(previousStep);
    }
  }, [currentStepIndex, isFirstStep, stepOrder, goToStep]);

  // Generate next invoice number
  const generateNextInvoiceNumber = useCallback(() => {
    if (!currentCompany) return '00001';
    
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

  // Tax calculations
  const taxCalculations = useMemo(() => {
    const taxFactor = API_CONFIG.includedTax; // 1.13
    
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
      totalItems: formData.items.length,
      version: formData.invoiceType === InvoiceType.CCF ? 3 : 1,
    };
  }, [formData.items, formData.invoiceType, formData.customer]);

  // Product form calculations
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

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.invoiceNumber.trim() !== '' && 
           formData.items.length > 0 && 
           formData.customer !== null;
  }, [formData.invoiceNumber, formData.items.length, formData.customer]);

  // Product form validation
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
    
    // Auto-advance to next step if we're on customer selection
    if (currentStep === FormStep.CUSTOMER_SELECTION) {
      setTimeout(() => goToNextStep(), 300);
    }
  }, [currentStep, goToNextStep]);

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
    
    // Mark product selection step as completed if we have items
    if (newItems.length > 0 && currentStep === FormStep.PRODUCT_SELECTION) {
      setCompletedSteps(prev => new Set([...prev, FormStep.PRODUCT_SELECTION]));
    }
  }, [currentStep]);

  // Add new product
  const handleAddNewProduct = useCallback(() => {
    if (!isProductFormValid) return;

    const finalPrice = productForm.hasTax 
      ? productForm.unitPrice 
      : productCalculations.pricePlusTax;

    const newItem: InvoiceDetailInput = {
      quantity: 1,
      productId: `temp_${Date.now()}`,
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

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    if (!currentCompany) {
      Alert.alert('Error', 'No hay empresa seleccionada');
      return;
    }

    try {
      const draftInput: CreateInvoiceInput = {
        invoiceNumber: formData.invoiceNumber,
        date: formData.date.toISOString(),
        invoiceType: formData.invoiceType,
        customerId: formData.customer?.id,
        companyId: currentCompany.id,
        items: formData.items,
        nombEntrega: formData.nombEntrega,
        docuEntrega: formData.docuEntrega,
        observaciones: formData.observaciones,
        receptor: formData.receptor,
        receptorDocu: formData.receptorDocu,
        customerHasRetention: formData.customer?.hasContributorRetention,
      };

      const resultAction = dispatch(addInvoice(draftInput));
      const newInvoice = (resultAction as any).payload;
      
      if (newInvoice) {
        Alert.alert('Guardado', 'Borrador guardado exitosamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Error guardando borrador');
    }
  }, [formData, currentCompany, dispatch, navigation]);

  // Certificate validation
  const validateCertificate = useCallback(async (): Promise<boolean> => {
    if (!currentCompany) return false;

    setSubmissionState(prev => ({ 
      ...prev, 
      isValidatingCertificate: true, 
      submissionStatus: 'Validando certificado...' 
    }));

    try {
      const hasValidCertificate = await certificateService.hasValidCertificate(currentCompany);
      
      if (!hasValidCertificate) {
        Alert.alert(
          'Certificado Requerido',
          'Es necesario configurar un certificado digital válido para enviar facturas al Ministerio de Hacienda.\n\n¿Desea configurar el certificado ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Configurar', 
              onPress: () => navigation.navigate('CertificateSettings')
            }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Certificate validation error:', error);
      Alert.alert('Error', 'Error validando certificado. Intente nuevamente.');
      return false;
    } finally {
      setSubmissionState(prev => ({ ...prev, isValidatingCertificate: false }));
    }
  }, [currentCompany, certificateService, navigation]);

  // Handle invoice creation
  const handleCreateInvoice = useCallback(async () => {
    if (!isFormValid || !currentCompany || !formData.customer) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    setSubmissionState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submissionStatus: 'Creando factura...' 
    }));

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

      const resultAction = dispatch(addInvoice(invoiceInput));
      const newInvoice = (resultAction as any).payload;
      
      if (newInvoice) {
        setCreatedInvoice(newInvoice);
        dispatch(setCurrentInvoice(newInvoice.id));
        
        Alert.alert(
          'Factura Creada',
          'La factura ha sido creada exitosamente.',
          [
            { text: 'Finalizar', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear la factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la factura');
    } finally {
      setSubmissionState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, isFormValid, currentCompany, dispatch, navigation]);

  // Handle date change
  const handleDateChange = useCallback((_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, []);

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {stepOrder.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = completedSteps.has(step);
        
        return (
          <View key={step} style={styles.stepIndicatorContainer}>
            <TouchableOpacity
              style={[
                styles.stepCircle,
                {
                  backgroundColor: isCompleted 
                    ? theme.colors.success || theme.colors.primary
                    : isActive 
                    ? theme.colors.primary 
                    : theme.colors.border.light
                }
              ]}
              onPress={() => goToStep(step)}
              disabled={!isCompleted && !isActive}
            >
              <Text style={[
                styles.stepNumber,
                {
                  color: isCompleted || isActive 
                    ? '#FFFFFF' 
                    : theme.colors.text.secondary
                }
              ]}>
                {isCompleted ? '✓' : index + 1}
              </Text>
            </TouchableOpacity>
            
            <Text style={[
              styles.stepLabel,
              {
                color: isActive 
                  ? theme.colors.primary 
                  : theme.colors.text.secondary
              }
            ]}>
              {stepTitles[step]}
            </Text>
            
            {index < stepOrder.length - 1 && (
              <View style={[
                styles.stepConnector,
                {
                  backgroundColor: isCompleted 
                    ? theme.colors.success || theme.colors.primary
                    : theme.colors.border.light
                }
              ]} />
            )}
          </View>
        );
      })}
    </View>
  );

  // Render step navigation buttons
  const renderStepNavigation = () => {
    const canProceed = stepValidation[currentStep]();
    
    return (
      <View style={styles.stepNavigation}>
        {!isFirstStep && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton, { borderColor: theme.colors.primary }]}
            onPress={goToPreviousStep}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Anterior
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {!isLastStep ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { 
                backgroundColor: canProceed ? theme.colors.primary : theme.colors.border.light 
              }
            ]}
            onPress={goToNextStep}
            disabled={!canProceed}
          >
            <Text style={[
              styles.nextButtonText,
              { 
                color: canProceed ? '#FFFFFF' : theme.colors.text.secondary 
              }
            ]}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.finishButton,
              { 
                backgroundColor: canProceed ? (theme.colors.success || theme.colors.primary) : theme.colors.border.light 
              }
            ]}
            onPress={handleCreateInvoice}
            disabled={!canProceed || submissionState.isSubmitting}
          >
            <Text style={[
              styles.finishButtonText,
              { 
                color: canProceed ? '#FFFFFF' : theme.colors.text.secondary 
              }
            ]}>
              {submissionState.isSubmitting ? 'Creando...' : 'Crear Factura'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Step content renderers
  const renderBasicInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        Información básica de la factura
      </Text>
      
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Número de Factura *</Text>
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
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Fecha *</Text>
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
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Tipo Documento *</Text>
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
                  {type === InvoiceType.CCF ? 'CCF' : InvoiceType[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderCustomerSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        Seleccione un cliente para la factura
      </Text>
      
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente *</Text>
        
        {formData.customer ? (
          <View style={[styles.selectedCustomer, { borderColor: theme.colors.success || theme.colors.primary }]}>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                {formData.customer.firstName} {formData.customer.lastName}
              </Text>
              <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
                {formData.customer.nationalId} • {formData.customer.email}
              </Text>
              {formData.customer.hasContributorRetention && (
                <Text style={[styles.retentionBadge, { color: theme.colors.warning || theme.colors.error }]}>
                  ⚠️ Sujeto a retención de IVA
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.changeButton, { borderColor: theme.colors.primary }]}
              onPress={() => setFormData(prev => ({ ...prev, customer: null }))}
            >
              <Text style={[styles.changeButtonText, { color: theme.colors.primary }]}>
                Cambiar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.customerSelection}>
            <TouchableOpacity 
              style={[styles.selectionButton, { borderColor: theme.colors.primary }]}
              onPress={() => setShowCustomerPicker(true)}
            >
              <Text style={[styles.selectionButtonIcon, { color: theme.colors.primary }]}>🔍</Text>
              <Text style={[styles.selectionButtonText, { color: theme.colors.primary }]}>
                Buscar Cliente Existente
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
  
  const renderProductSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        Agregue productos o servicios a la factura
      </Text>
      
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos *</Text>
        
        {/* Product Items List */}
        {formData.items.map((item, index) => (
          <ProductDetailEditor
            key={`${item.productId}_${index}`}
            item={item}
            invoiceType={formData.invoiceType}
            onUpdate={(updates) => handleUpdateItem(index, updates)}
            onRemove={() => handleRemoveItem(index)}
          />
        ))}

        {/* Add Product Form */}
        {showAddProductForm && (
          <View style={[styles.addProductForm, { borderColor: theme.colors.border.light }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>
              Nuevo Producto
            </Text>
            
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
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => setShowProductSelector(true)}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              🔍 Buscar Producto
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: showAddProductForm ? theme.colors.error : theme.colors.primary }]}
            onPress={() => setShowAddProductForm(!showAddProductForm)}
          >
            <Text style={[styles.actionButtonText, { 
              color: showAddProductForm ? theme.colors.error : theme.colors.primary 
            }]}>
              {showAddProductForm ? '✕ Cancelar' : '+ Nuevo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  const renderInvoiceDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        Información adicional para la factura (opcional)
      </Text>
      
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Observaciones</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Observaciones generales</Text>
          <TextInput
            style={[styles.textAreaInput, { 
              color: theme.colors.text.primary,
              borderColor: theme.colors.border.light 
            }]}
            value={formData.observaciones}
            onChangeText={(text) => setFormData(prev => ({ ...prev, observaciones: text }))}
            placeholder="Observaciones adicionales..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={3}
          />
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Receptor</Text>
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text.primary,
                borderColor: theme.colors.border.light 
              }]}
              value={formData.receptor}
              onChangeText={(text) => setFormData(prev => ({ ...prev, receptor: text }))}
              placeholder="Nombre de quien recibe"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Documento Receptor</Text>
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text.primary,
                borderColor: theme.colors.border.light 
              }]}
              value={formData.receptorDocu}
              onChangeText={(text) => setFormData(prev => ({ ...prev, receptorDocu: text }))}
              placeholder="Documento de identidad del receptor"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
        </View>
      )}
    </View>
  );
  
  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        Revise toda la información antes de crear la factura
      </Text>
      
      {/* Summary Sections */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Información General</Text>
        
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: theme.colors.text.secondary }]}>Número:</Text>
          <Text style={[styles.reviewValue, { color: theme.colors.text.primary }]}>{formData.invoiceNumber}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: theme.colors.text.secondary }]}>Tipo:</Text>
          <Text style={[styles.reviewValue, { color: theme.colors.text.primary }]}>
            {formData.invoiceType === InvoiceType.CCF ? 'CCF' : InvoiceType[formData.invoiceType]}
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: theme.colors.text.secondary }]}>Fecha:</Text>
          <Text style={[styles.reviewValue, { color: theme.colors.text.primary }]}>
            {formData.date.toLocaleDateString('es-SV')}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Cliente</Text>
        
        {formData.customer ? (
          <View style={styles.reviewCustomer}>
            <Text style={[styles.reviewCustomerName, { color: theme.colors.text.primary }]}>
              {formData.customer.firstName} {formData.customer.lastName}
            </Text>
            <Text style={[styles.reviewCustomerDetails, { color: theme.colors.text.secondary }]}>
              {formData.customer.nationalId} • {formData.customer.email}
            </Text>
            {formData.customer.hasContributorRetention && (
              <Text style={[styles.retentionBadge, { color: theme.colors.warning || theme.colors.error }]}>
                ⚠️ Sujeto a retención de IVA
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            No se ha seleccionado cliente
          </Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Productos ({formData.items.length})</Text>
        
        {formData.items.map((item, index) => (
          <View key={index} style={styles.reviewProduct}>
            <View style={styles.reviewProductInfo}>
              <Text style={[styles.reviewProductName, { color: theme.colors.text.primary }]}>
                {item.productName}
              </Text>
              <Text style={[styles.reviewProductDetails, { color: theme.colors.text.secondary }]}>
                {item.quantity} × ${item.unitPrice?.toFixed(2)} = ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        
        {formData.items.length === 0 && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            No se han agregado productos
          </Text>
        )}
      </View>

      {/* Total Section */}
      <InvoiceCalculator 
        calculations={taxCalculations}
        invoiceType={formData.invoiceType}
        customer={formData.customer}
      />
    </View>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case FormStep.BASIC_INFO:
        return renderBasicInfoStep();
      case FormStep.CUSTOMER_SELECTION:
        return renderCustomerSelectionStep();
      case FormStep.PRODUCT_SELECTION:
        return renderProductSelectionStep();
      case FormStep.INVOICE_DETAILS:
        return renderInvoiceDetailsStep();
      case FormStep.REVIEW_AND_SUBMIT:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Enhanced Header with Step Indicator */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancelar</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Nueva Factura</Text>
          <Text style={[styles.stepTitle, { color: theme.colors.text.secondary }]}>
            {stepTitles[currentStep]}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleSaveDraft}
          style={[styles.headerButton, styles.draftButton]}
        >
          <Text style={[styles.draftButtonText, { color: theme.colors.text.secondary }]}>
            Guardar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          key={currentStep}
          style={styles.stepContent}
        >
          {renderStepContent()}
        </View>
      </ScrollView>

      {/* Step Navigation */}
      {renderStepNavigation()}
      
      {/* Loading Overlay */}
      {(submissionState.isSubmitting || submissionState.isGeneratingPDF || submissionState.isValidatingCertificate) && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: theme.colors.surface.primary }]}>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary} 
              style={styles.loadingSpinner}
            />
            <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
              {submissionState.submissionStatus}
            </Text>
            {submissionState.submissionProgress > 0 && (
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border.light }]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${submissionState.submissionProgress}%`
                    }
                  ]} 
                />
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Existing Modals */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <CustomerPicker
        visible={showCustomerPicker}
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setShowCustomerPicker(false)}
      />

      <ProductSelector
        visible={showProductSelector}
        products={products}
        onSelect={handleProductSelect}
        onClose={() => setShowProductSelector(false)}
      />
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    minWidth: 80,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    marginTop: 4,
  },
  draftButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  draftButtonText: {
    fontSize: 12,
  },
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Step Indicator Styles
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stepIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-60%',
    height: 2,
  },
  // Step Navigation Styles
  stepNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  backButton: {
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    // backgroundColor will be set dynamically
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    // backgroundColor will be set dynamically
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Customer Selection Styles
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 12,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerSelection: {
    gap: 16,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  createButton: {
    borderWidth: 0,
  },
  selectionButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  selectionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerText: {
    fontSize: 14,
  },
  retentionBadge: {
    fontSize: 12,
    marginTop: 4,
  },
  // Existing styles from original AddInvoiceScreen
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
  textAreaInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
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
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Review Step Styles
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
  },
  reviewCustomer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  reviewCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewCustomerDetails: {
    fontSize: 14,
  },
  reviewProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  reviewProductInfo: {
    flex: 1,
  },
  reviewProductName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  reviewProductDetails: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default AddInvoiceScreenEnhanced;
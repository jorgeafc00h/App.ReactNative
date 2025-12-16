// Add Product Screen - Create new products and services
// Matches Swift UI functionality with government tax code integration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { addProduct } from '../../store/slices/productSlice';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../types/product';
import { generateId, formatCurrency } from '../../utils';
import { BaseScreen } from '../../components/common/BaseScreen';

export const AddProductScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { loading } = useSelector((state: RootState) => state.products);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    category: '',
    price: '',
    stockQuantity: '',
    isService: false,
    taxIncluded: true,
    taxCode: '',
    unitOfMeasure: 'UNIDAD',
    minimumStock: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Auto-generate product code
  useEffect(() => {
    if (!formData.code && formData.name.length > 0) {
      const prefix = formData.isService ? 'SERV' : 'PROD';
      const timestamp = Date.now().toString().slice(-4);
      setFormData(prev => ({
        ...prev,
        code: `${prefix}-${timestamp}`
      }));
    }
  }, [formData.name, formData.isService]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.price.trim()) {
      errors.price = 'El precio es requerido';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'El precio debe ser un número mayor que 0';
      }
    }

    // Stock validation for products (not services)
    if (!formData.isService) {
      if (!formData.stockQuantity.trim()) {
        errors.stockQuantity = 'La cantidad en stock es requerida para productos';
      } else {
        const stock = parseInt(formData.stockQuantity);
        if (isNaN(stock) || stock < 0) {
          errors.stockQuantity = 'La cantidad debe ser un número mayor o igual a 0';
        }
      }

      if (formData.minimumStock.trim()) {
        const minStock = parseInt(formData.minimumStock);
        if (isNaN(minStock) || minStock < 0) {
          errors.minimumStock = 'El stock mínimo debe ser un número mayor o igual a 0';
        }
      }
    }

    // Code validation
    if (formData.code.trim() && formData.code.length < 3) {
      errors.code = 'El código debe tener al menos 3 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const newProduct: Product = {
        id: generateId(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        category: formData.category.trim() || undefined,
        price: parseFloat(formData.price),
        stockQuantity: formData.isService ? undefined : parseInt(formData.stockQuantity),
        minimumStock: formData.isService || !formData.minimumStock.trim() 
          ? undefined 
          : parseInt(formData.minimumStock),
        isService: formData.isService,
        taxIncluded: formData.taxIncluded,
        taxCode: formData.taxCode.trim() || undefined,
        unitOfMeasure: formData.unitOfMeasure,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(addProduct(newProduct));
      
      Alert.alert(
        'Producto Creado',
        `${formData.isService ? 'Servicio' : 'Producto'} "${formData.name}" creado exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Descartar Cambios',
        '¿Está seguro que desea descartar los cambios?',
        [
          { text: 'Continuar Editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const hasChanges = (): boolean => {
    return formData.name.trim() !== '' || 
           formData.description.trim() !== '' || 
           formData.price.trim() !== '' ||
           formData.category.trim() !== '';
  };

  const calculateTaxAmount = (): number => {
    const price = parseFloat(formData.price) || 0;
    if (formData.taxIncluded) {
      return price * 0.13; // 13% IVA in El Salvador
    }
    return 0;
  };

  const getPriceDisplay = (): string => {
    const price = parseFloat(formData.price) || 0;
    if (price === 0) return '';
    
    if (formData.taxIncluded) {
      const basePrice = price / 1.13;
      return `Base: ${formatCurrency(basePrice)} + IVA: ${formatCurrency(price - basePrice)} = Total: ${formatCurrency(price)}`;
    } else {
      return `Precio sin IVA: ${formatCurrency(price)}`;
    }
  };

  return (
    <BaseScreen style={{ backgroundColor: theme.colors.background.primary }}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {formData.isService ? 'Nuevo Servicio' : 'Nuevo Producto'}
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary },
              saving && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Toggle */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabels}>
                <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
                  Tipo de ítem
                </Text>
                <Text style={[styles.toggleSubLabel, { color: theme.colors.text.secondary }]}>
                  {formData.isService 
                    ? 'Los servicios no manejan inventario' 
                    : 'Los productos manejan stock e inventario'
                  }
                </Text>
              </View>
              
              <View style={styles.toggleOptions}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !formData.isService && { backgroundColor: theme.colors.primary },
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => updateFormData('isService', false)}
                >
                  <Text style={[
                    styles.toggleOptionText,
                    !formData.isService ? { color: 'white' } : { color: theme.colors.text.secondary }
                  ]}>
                    Producto
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    formData.isService && { backgroundColor: theme.colors.primary },
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => updateFormData('isService', true)}
                >
                  <Text style={[
                    styles.toggleOptionText,
                    formData.isService ? { color: 'white' } : { color: theme.colors.text.secondary }
                  ]}>
                    Servicio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Basic Information */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Información Básica
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    borderColor: validationErrors.name ? '#E53E3E' : theme.colors.border
                  }
                ]}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder={`Nombre del ${formData.isService ? 'servicio' : 'producto'}`}
                placeholderTextColor={theme.colors.text.secondary}
                editable={!saving}
              />
              {validationErrors.name && (
                <Text style={styles.errorText}>{validationErrors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Descripción
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border
                  }
                ]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Descripción detallada (opcional)"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!saving}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Código
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      borderColor: validationErrors.code ? '#E53E3E' : theme.colors.border
                    }
                  ]}
                  value={formData.code}
                  onChangeText={(text) => updateFormData('code', text)}
                  placeholder="Ej: PROD-001"
                  placeholderTextColor={theme.colors.text.secondary}
                  autoCapitalize="characters"
                  editable={!saving}
                />
                {validationErrors.code && (
                  <Text style={styles.errorText}>{validationErrors.code}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Categoría
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={formData.category}
                  onChangeText={(text) => updateFormData('category', text)}
                  placeholder="Ej: Servicios"
                  placeholderTextColor={theme.colors.text.secondary}
                  editable={!saving}
                />
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Precios e IVA
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                Precio <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                    borderColor: validationErrors.price ? '#E53E3E' : theme.colors.border
                  }
                ]}
                value={formData.price}
                onChangeText={(text) => updateFormData('price', text)}
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="decimal-pad"
                editable={!saving}
              />
              {validationErrors.price && (
                <Text style={styles.errorText}>{validationErrors.price}</Text>
              )}
              {getPriceDisplay() && (
                <Text style={[styles.priceBreakdown, { color: theme.colors.text.secondary }]}>
                  {getPriceDisplay()}
                </Text>
              )}
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.switchLabel, { color: theme.colors.text.primary }]}>
                  IVA incluido en el precio
                </Text>
                <Text style={[styles.switchSubLabel, { color: theme.colors.text.secondary }]}>
                  {formData.taxIncluded 
                    ? 'El precio incluye el 13% de IVA'
                    : 'El IVA se calculará por separado'
                  }
                </Text>
              </View>
              <Switch
                value={formData.taxIncluded}
                onValueChange={(value) => updateFormData('taxIncluded', value)}
                disabled={saving}
              />
            </View>
          </View>

          {/* Stock Management (Products only) */}
          {!formData.isService && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Control de Inventario
              </Text>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                    Stock Inicial <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: theme.colors.background.primary,
                        color: theme.colors.text.primary,
                        borderColor: validationErrors.stockQuantity ? '#E53E3E' : theme.colors.border
                      }
                    ]}
                    value={formData.stockQuantity}
                    onChangeText={(text) => updateFormData('stockQuantity', text)}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.secondary}
                    keyboardType="number-pad"
                    editable={!saving}
                  />
                  {validationErrors.stockQuantity && (
                    <Text style={styles.errorText}>{validationErrors.stockQuantity}</Text>
                  )}
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                    Stock Mínimo
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: theme.colors.background.primary,
                        color: theme.colors.text.primary,
                        borderColor: validationErrors.minimumStock ? '#E53E3E' : theme.colors.border
                      }
                    ]}
                    value={formData.minimumStock}
                    onChangeText={(text) => updateFormData('minimumStock', text)}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.secondary}
                    keyboardType="number-pad"
                    editable={!saving}
                  />
                  {validationErrors.minimumStock && (
                    <Text style={styles.errorText}>{validationErrors.minimumStock}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Advanced Options */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Opciones Avanzadas
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Unidad de Medida
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={formData.unitOfMeasure}
                  onChangeText={(text) => updateFormData('unitOfMeasure', text)}
                  placeholder="UNIDAD"
                  placeholderTextColor={theme.colors.text.secondary}
                  autoCapitalize="characters"
                  editable={!saving}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  Código Tributario
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background.primary,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={formData.taxCode}
                  onChangeText={(text) => updateFormData('taxCode', text)}
                  placeholder="Opcional"
                  placeholderTextColor={theme.colors.text.secondary}
                  editable={!saving}
                />
              </View>
            </View>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </BaseScreen>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  toggleContainer: {
    marginBottom: 8,
  },
  toggleLabels: {
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleSubLabel: {
    fontSize: 14,
  },
  toggleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: '#E53E3E',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
  priceBreakdown: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: 12,
  },
  spacer: {
    height: 40,
  },
});

export default AddProductScreen;
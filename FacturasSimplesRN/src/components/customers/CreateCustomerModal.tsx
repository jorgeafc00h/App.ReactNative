// Create Customer Modal Component
// Allows inline customer creation during invoice workflow

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addCustomer } from '../../store/slices/customerSlice';
import { Customer, CustomerType } from '../../types/customer';
import { generateId } from '../../utils';

interface CreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  visible,
  onClose,
  onCustomerCreated,
}) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.customers);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    nationalId: '',
    nrc: '',
    hasRetention: false,
    taxRegistrationNumber: '',
    customerType: CustomerType.Individual,
    descActividad: '',
    codActividad: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    // Phone validation
    if (formData.phone && !/^\d{8,}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      errors.phone = 'Teléfono debe tener al menos 8 dígitos';
    }

    // National ID validation for El Salvador (DUI format: 12345678-9)
    if (formData.nationalId && !/^\d{8}-?\d$/.test(formData.nationalId)) {
      errors.nationalId = 'DUI debe tener formato: 12345678-9';
    }

    // NRC validation (if provided)
    if (formData.nrc && !/^\d{1,8}$/.test(formData.nrc)) {
      errors.nrc = 'NRC debe ser numérico';
    }

    // Tax registration number required if has retention
    if (formData.hasRetention && !formData.taxRegistrationNumber.trim()) {
      errors.taxRegistrationNumber = 'Número de registro fiscal requerido para retenciones';
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
      // Create customer object
      const newCustomer: Customer = {
        id: generateId(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        address: formData.address.trim() || '',
        nationalId: formData.nationalId.trim() || '',
        nit: formData.nationalId.trim() || '', // Added missing nit property
        documentType: 'DUI' as any, // Default document type
        hasContributorRetention: formData.hasRetention,
        customerType: formData.customerType,
        isActive: true,
        companyId: '', // Will be set by the parent component
        nrc: formData.nrc.trim() || '',
        taxRegistrationNumber: formData.taxRegistrationNumber.trim() || '',
        descActividad: formData.descActividad.trim() || '',
        codActividad: formData.codActividad.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Redux store
      dispatch(addCustomer(newCustomer));

      // Notify parent component
      onCustomerCreated(newCustomer);

      // Reset form and close modal
      resetForm();
      onClose();

      Alert.alert('Éxito', 'Cliente creado correctamente');
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'No se pudo crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      nationalId: '',
      nrc: '',
      hasRetention: false,
      taxRegistrationNumber: '',
      customerType: CustomerType.Individual,
      descActividad: '',
      codActividad: '',
    });
    setValidationErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleClose}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Nuevo Cliente</Text>
          
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Nombre <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, validationErrors.firstName && styles.inputError]}
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  placeholder="Nombre"
                  editable={!saving}
                />
                {validationErrors.firstName && (
                  <Text style={styles.errorText}>{validationErrors.firstName}</Text>
                )}
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>
                  Apellido <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, validationErrors.lastName && styles.inputError]}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholder="Apellido"
                  editable={!saving}
                />
                {validationErrors.lastName && (
                  <Text style={styles.errorText}>{validationErrors.lastName}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, validationErrors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                placeholder="email@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, validationErrors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                placeholder="2234-5678"
                keyboardType="phone-pad"
                editable={!saving}
              />
              {validationErrors.phone && (
                <Text style={styles.errorText}>{validationErrors.phone}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={formData.address}
                onChangeText={(text) => updateFormData('address', text)}
                placeholder="Dirección completa"
                multiline
                numberOfLines={2}
                editable={!saving}
              />
            </View>
          </View>

          {/* Tax Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Fiscal</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>DUI</Text>
                <TextInput
                  style={[styles.input, validationErrors.nationalId && styles.inputError]}
                  value={formData.nationalId}
                  onChangeText={(text) => updateFormData('nationalId', text)}
                  placeholder="12345678-9"
                  keyboardType="numeric"
                  editable={!saving}
                />
                {validationErrors.nationalId && (
                  <Text style={styles.errorText}>{validationErrors.nationalId}</Text>
                )}
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>NRC</Text>
                <TextInput
                  style={[styles.input, validationErrors.nrc && styles.inputError]}
                  value={formData.nrc}
                  onChangeText={(text) => updateFormData('nrc', text)}
                  placeholder="12345"
                  keyboardType="numeric"
                  editable={!saving}
                />
                {validationErrors.nrc && (
                  <Text style={styles.errorText}>{validationErrors.nrc}</Text>
                )}
              </View>
            </View>

            {/* Retention Toggle */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Cliente sujeto a retenciones</Text>
                <Text style={styles.switchSubLabel}>
                  Activar si el cliente requiere retenciones fiscales
                </Text>
              </View>
              <Switch
                value={formData.hasRetention}
                onValueChange={(value) => updateFormData('hasRetention', value)}
                disabled={saving}
              />
            </View>

            {formData.hasRetention && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Número de Registro Fiscal <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, validationErrors.taxRegistrationNumber && styles.inputError]}
                  value={formData.taxRegistrationNumber}
                  onChangeText={(text) => updateFormData('taxRegistrationNumber', text)}
                  placeholder="Número de registro fiscal"
                  editable={!saving}
                />
                {validationErrors.taxRegistrationNumber && (
                  <Text style={styles.errorText}>{validationErrors.taxRegistrationNumber}</Text>
                )}
              </View>
            )}
          </View>

          {/* Economic Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad Económica</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Código</Text>
                <TextInput
                  style={styles.input}
                  value={formData.codActividad}
                  onChangeText={(text) => updateFormData('codActividad', text)}
                  placeholder="Ej: 4711"
                  keyboardType="numeric"
                  editable={!saving}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 2, marginLeft: 10 }]}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={styles.input}
                  value={formData.descActividad}
                  onChangeText={(text) => updateFormData('descActividad', text)}
                  placeholder="Descripción de la actividad"
                  editable={!saving}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
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
  saveButton: {
    backgroundColor: '#3182CE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 6,
  },
  required: {
    color: '#E53E3E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 10,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#718096',
  },
});

export default CreateCustomerModal;
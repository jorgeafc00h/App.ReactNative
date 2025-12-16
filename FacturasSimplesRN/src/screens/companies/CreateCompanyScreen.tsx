import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../../store';
import { createCompany } from '../../store/slices/companySlice';
import { CreateCompanyInput, CompanyEnvironment } from '../../types/company';
import { CertificateUpload } from '../../components/CertificateUpload';
import { CatalogDropdown } from '../../components/CatalogDropdown';
import { GovernmentCatalogId } from '../../types/catalog';
import { useTheme } from '../../hooks/useTheme';
import { generateId } from '../../utils';

export const CreateCompanyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Company form data
  const [formData, setFormData] = useState<Partial<CreateCompanyInput>>({
    environment: CompanyEnvironment.Development,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nit?.trim()) {
      newErrors.nit = 'NIT es requerido';
    }
    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'Nombre es requerido';
    }
    if (!formData.nombreComercial?.trim()) {
      newErrors.nombreComercial = 'Nombre comercial es requerido';
    }
    if (!formData.nrc?.trim()) {
      newErrors.nrc = 'NRC es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.direccion?.trim()) {
      newErrors.direccion = 'Dirección es requerida';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email debe ser válido';
    }
    if (!formData.telefono?.trim()) {
      newErrors.telefono = 'Teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.actividadEconomicaId) {
      newErrors.actividadEconomicaId = 'Actividad económica es requerida';
    }
    if (!formData.departamentoId) {
      newErrors.departamentoId = 'Departamento es requerido';
    }
    if (!formData.municipioId) {
      newErrors.municipioId = 'Municipio es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      handleCancel();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const companyInput: CreateCompanyInput = {
        id: generateId(),
        nit: formData.nit!,
        nombre: formData.nombre!,
        nombreComercial: formData.nombreComercial!,
        nrc: formData.nrc!,
        direccion: formData.direccion!,
        email: formData.email!,
        telefono: formData.telefono!,
        actividadEconomicaId: formData.actividadEconomicaId!,
        departamentoId: formData.departamentoId!,
        municipioId: formData.municipioId!,
        environment: formData.environment!,
        certificateContent: formData.certificateContent,
        certificatePassword: formData.certificatePassword,
      };

      await dispatch(createCompany(companyInput)).unwrap();
      
      Alert.alert(
        'Empresa Creada',
        `La empresa "${formData.nombreComercial}" ha sido creada exitosamente.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la empresa');
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
    return Object.values(formData).some(value => value !== undefined && value !== '');
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Información Fiscal
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          NIT <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.nit ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.nit || ''}
          onChangeText={(text) => updateFormData('nit', text)}
          placeholder="1234-567890-123-4"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
          editable={!saving}
        />
        {errors.nit && <Text style={styles.errorText}>{errors.nit}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Nombre <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.nombre ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.nombre || ''}
          onChangeText={(text) => updateFormData('nombre', text)}
          placeholder="Razón social"
          placeholderTextColor={theme.colors.text.secondary}
          editable={!saving}
        />
        {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Nombre Comercial <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.nombreComercial ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.nombreComercial || ''}
          onChangeText={(text) => updateFormData('nombreComercial', text)}
          placeholder="Nombre comercial"
          placeholderTextColor={theme.colors.text.secondary}
          editable={!saving}
        />
        {errors.nombreComercial && <Text style={styles.errorText}>{errors.nombreComercial}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          NRC <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.nrc ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.nrc || ''}
          onChangeText={(text) => updateFormData('nrc', text)}
          placeholder="123456-7"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
          editable={!saving}
        />
        {errors.nrc && <Text style={styles.errorText}>{errors.nrc}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Información de Contacto
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Dirección <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.direccion ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.direccion || ''}
          onChangeText={(text) => updateFormData('direccion', text)}
          placeholder="Dirección completa"
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!saving}
        />
        {errors.direccion && <Text style={styles.errorText}>{errors.direccion}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Email <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.email ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.email || ''}
          onChangeText={(text) => updateFormData('email', text)}
          placeholder="contacto@empresa.com"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!saving}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Teléfono <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              borderColor: errors.telefono ? '#E53E3E' : theme.colors.border,
            }
          ]}
          value={formData.telefono || ''}
          onChangeText={(text) => updateFormData('telefono', text)}
          placeholder="2345-6789"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="phone-pad"
          editable={!saving}
        />
        {errors.telefono && <Text style={styles.errorText}>{errors.telefono}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Ubicación y Actividad
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Actividad Económica <Text style={styles.required}>*</Text>
        </Text>
        <CatalogDropdown
          catalogId={GovernmentCatalogId.ActivitiesAndServices}
          selectedValue={formData.actividadEconomicaId}
          onValueChange={(value) => updateFormData('actividadEconomicaId', value)}
          placeholder="Seleccione actividad económica"
          error={errors.actividadEconomicaId}
        />
        {errors.actividadEconomicaId && <Text style={styles.errorText}>{errors.actividadEconomicaId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Departamento <Text style={styles.required}>*</Text>
        </Text>
        <CatalogDropdown
          catalogId={GovernmentCatalogId.Departments}
          selectedValue={formData.departamentoId}
          onValueChange={(value) => {
            updateFormData('departamentoId', value);
            // Clear municipality when department changes
            updateFormData('municipioId', undefined);
          }}
          placeholder="Seleccione departamento"
          error={errors.departamentoId}
        />
        {errors.departamentoId && <Text style={styles.errorText}>{errors.departamentoId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Municipio <Text style={styles.required}>*</Text>
        </Text>
        <CatalogDropdown
          catalogId={GovernmentCatalogId.Municipalities}
          selectedValue={formData.municipioId}
          onValueChange={(value) => updateFormData('municipioId', value)}
          placeholder="Seleccione municipio"
          dependsOn={formData.departamentoId}
          error={errors.municipioId}
          disabled={!formData.departamentoId}
        />
        {errors.municipioId && <Text style={styles.errorText}>{errors.municipioId}</Text>}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Certificado Digital (Opcional)
      </Text>

      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        El certificado digital es necesario para firmar documentos electrónicos. Puede agregar esta información más tarde.
      </Text>

      <CertificateUpload
        onCertificateUploaded={(content, password) => {
          updateFormData('certificateContent', content);
          updateFormData('certificatePassword', password);
        }}
        onCertificateRemoved={() => {
          updateFormData('certificateContent', undefined);
          updateFormData('certificatePassword', undefined);
        }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            disabled={saving}
          >
            <Text style={[styles.backText, { color: theme.colors.text.secondary }]}>
              {currentStep > 1 ? '← Anterior' : '← Cancelar'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Nueva Empresa
            </Text>
            <Text style={[styles.stepIndicator, { color: theme.colors.text.secondary }]}>
              Paso {currentStep} de 4
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              { backgroundColor: theme.colors.primary },
              saving && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={saving}
          >
            <Text style={styles.nextText}>
              {currentStep === 4 ? (saving ? 'Guardando...' : 'Crear') : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && { backgroundColor: theme.colors.primary },
                step > currentStep && { backgroundColor: theme.colors.border },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
    width: 80,
  },
  backText: {
    fontSize: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 14,
    marginTop: 2,
  },
  nextButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: 80,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#E53E3E',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    marginTop: 6,
  },
  spacer: {
    height: 40,
  },
});

export default CreateCompanyScreen;
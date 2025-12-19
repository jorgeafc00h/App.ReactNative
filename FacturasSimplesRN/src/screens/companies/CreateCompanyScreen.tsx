import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CompanyConfigurationForm } from '../../components/forms/CompanyConfigurationForm';
import { CreateCompanyInput, CompanyEnvironment } from '../../types/company';
import { useTheme } from '../../hooks/useTheme';

/**
 * Create Company Screen
 * 
 * This screen provides company creation functionality in the "Administración de Empresas" section.
 * It uses the shared CompanyConfigurationForm component for consistency with onboarding.
 * 
 * Features:
 * - Uses the same beautiful UI/UX as onboarding
 * - Consistent validation and form logic
 * - Clean header with step navigation
 * - Proper navigation handling
 */
export const CreateCompanyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Company data state - matches onboarding implementation
  const [companyData, setCompanyData] = useState<Partial<CreateCompanyInput>>({
    environment: CompanyEnvironment.Development,
    nit: '',
    nombre: '',
    nombreComercial: '',
    nrc: '',
    correo: '',
    telefono: '',
    complemento: '',
    departamentoCode: '',
    departamento: '',
    municipioCode: '',
    municipio: '',
    codActividad: '',
    descActividad: '',
    tipoEstablecimiento: '',
    establecimiento: '',
    codEstableMH: 'M001',
    codEstable: '',
    codPuntoVentaMH: 'P001',
    codPuntoVenta: '',
    certificatePath: '',
    certificatePassword: '',
    ivaPercentage: 13,
  });

  const handleStepComplete = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      // Final step completed - navigate back to companies list
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      navigation.goBack();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Información Básica';
      case 2: return 'Contacto y Ubicación';
      case 3: return 'Información del Emisor';
      case 4: return 'Certificados Digitales';
      default: return 'Nueva Empresa';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Custom Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.colors.surface.primary, 
        borderBottomColor: theme.colors.border.light 
      }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Nueva Empresa
          </Text>
          <Text style={[styles.stepIndicatorText, { color: theme.colors.text.secondary }]}>
            {getStepTitle()} • Paso {currentStep} de 4
          </Text>
        </View>

        {/* Step Navigation */}
        <View style={styles.stepNavigation}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {currentStep < 4 && (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Company Configuration Form - Using Shared Component */}
      <CompanyConfigurationForm
        step={currentStep}
        onComplete={handleStepComplete}
        onSkip={handleSkip}
        companyData={companyData}
        setCompanyData={setCompanyData}
        showStepIndicator={true}     // Show step indicator for visual consistency
        showSkipButton={true}        // Allow skipping steps
        saveButtonText={currentStep === 4 ? 'Crear Empresa' : 'Continuar'}
        skipButtonText="Omitir"
        minimal={false}              // Use full styling for standalone screen
        isCreating={true}            // Force creation mode - never update existing company
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

export default CreateCompanyScreen;
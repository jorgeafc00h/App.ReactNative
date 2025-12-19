import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { createCompany, updateCompany, setSelectedCompany } from '../../store/slices/companySlice';
import { CreateCompanyInput, CompanyEnvironment } from '../../types/company';
import { CertificateUpload } from '../CertificateUpload';
import { CatalogDropdown } from '../CatalogDropdown';
import { LocationDropdowns, LocationData } from '../LocationDropdowns';
import { GovernmentCatalogId } from '../../types/catalog';

export interface CompanyConfigurationFormProps {
  /** Current step (1-4) */
  step: 1 | 2 | 3 | 4;
  /** Callback when form is completed successfully */
  onComplete: () => void;
  /** Callback when user wants to skip current step */
  onSkip: () => void;
  /** Lifted state from parent - company data that persists across steps */
  companyData: Partial<CreateCompanyInput>;
  /** Function to update company data in parent */
  setCompanyData: React.Dispatch<React.SetStateAction<Partial<CreateCompanyInput>>>;
  /** Show step indicator (default: true) */
  showStepIndicator?: boolean;
  /** Show skip button (default: true) */
  showSkipButton?: boolean;
  /** Custom save button text */
  saveButtonText?: string;
  /** Custom skip button text */
  skipButtonText?: string;
  /** Hide form container styling for embedding */
  minimal?: boolean;
  /** Explicitly force creation mode (ignore currentCompany) */
  isCreating?: boolean;
}

/**
 * Shared CompanyConfigurationForm component
 * 
 * This component provides a unified company configuration experience that can be used:
 * - In onboarding flow (with step indicator and skip options)
 * - As standalone company edit screen (minimal styling)
 * 
 * Features:
 * - Beautiful step-by-step form with validation
 * - Enhanced UI with icons, gradients, and visual feedback
 * - Location dropdowns with cascade logic
 * - Certificate management
 * - Consistent with Swift UI patterns
 */
export const CompanyConfigurationForm: React.FC<CompanyConfigurationFormProps> = ({
  step,
  onComplete,
  onSkip,
  companyData,
  setCompanyData,
  showStepIndicator = true,
  showSkipButton = true,
  saveButtonText,
  skipButtonText,
  minimal = false,
  isCreating = false,
}) => {
  const dispatch = useAppDispatch();
  
  // Load companies and current company data
  const { companies, currentCompany, loading } = useAppSelector(state => state.companies);
  
  // Track if we've initialized forms to prevent loops
  const [formsInitialized, setFormsInitialized] = useState(false);

  // Step 1: Basic Company Info (matches AddCompanyView)
  const [fiscalData, setFiscalData] = useState({
    nit: '', // Optional in Swift
    nombre: '', // "Nombres y Apellidos" - required
    nombreComercial: '', // "Nombre Comercial" - required  
    nrc: '', // Optional in Swift
  });

  // Step 2: Contact & Location Info (matches AddCompanyView2)
  const [generalData, setGeneralData] = useState({
    correo: '', // Email - required
    telefono: '', // Phone - optional in Swift
    complemento: '', // Address - required  
    departamentoCode: '', // Department code
    departamento: '', // Department name
    municipioCode: '', // Municipality code
    municipio: '', // Municipality name
  });

  // Step 3: Economic Activity & Establishment (matches AddCompanyView3)
  const [issuerData, setIssuerData] = useState({
    codActividad: '', // Economic activity code
    descActividad: '', // Economic activity description
    tipoEstablecimiento: '', // Establishment type code
    establecimiento: '', // Establishment type description
    // MH codes with defaults from Swift
    codEstableMH: 'M001', // Default value from Swift
    codEstable: '', // Default value from Swift
    codPuntoVentaMH: 'P001', // Default value from Swift
    codPuntoVenta: '', // Default value from Swift
  });

  // Step 4: Certificate Info (matches AddCompanyView4)
  const [certificateData, setCertificateData] = useState({
    certificatePath: '',
    password: '',
    confirmPassword: '',
  });

  // Initialize form fields - restore user's entered data when navigating between steps
  useEffect(() => {
    console.log('CompanyConfigurationForm: Loading form data for step', step, 'companyData:', Object.keys(companyData).length);
    
    // Load data from accumulated companyData (user's entered data) when changing steps
    if (!formsInitialized || step) {
      // Restore user's previously entered data from companyData
      setFiscalData({
        nit: companyData.nit || '',
        nombre: companyData.nombre || '',
        nombreComercial: companyData.nombreComercial || '',
        nrc: companyData.nrc || '',
      });
      
      setGeneralData({
        correo: companyData.correo || '',
        telefono: companyData.telefono || '',
        complemento: companyData.complemento || '',
        departamentoCode: companyData.departamentoCode || '',
        departamento: companyData.departamento || '',
        municipioCode: companyData.municipioCode || '',
        municipio: companyData.municipio || '',
      });
      
      setIssuerData({
        codActividad: companyData.codActividad || '',
        descActividad: companyData.descActividad || '',
        tipoEstablecimiento: companyData.tipoEstablecimiento || '',
        establecimiento: companyData.establecimiento || '',
        codEstableMH: companyData.codEstableMH || 'M001',
        codEstable: companyData.codEstable || '',
        codPuntoVentaMH: companyData.codPuntoVentaMH || 'P001',
        codPuntoVenta: companyData.codPuntoVenta || '',
      });
      
      setCertificateData({
        certificatePath: companyData.certificatePath || '',
        password: companyData.certificatePassword || '',
        confirmPassword: '',
      });
      
      setFormsInitialized(true);
    }
  }, [step, companyData, formsInitialized]);

  const handleSave = async () => {
    try {
      let stepData: Partial<CreateCompanyInput> = {};

      switch (step) {
        case 1:
          // Only require nombre and nombreComercial (NIT and NRC are optional)
          if (!fiscalData.nombre.trim() || !fiscalData.nombreComercial.trim()) {
            Alert.alert('Error', 'Nombres y Apellidos y Nombre Comercial son requeridos');
            return;
          }
          stepData = fiscalData;
          break;
        case 2:
          // Only require email and address (phone is optional)
          if (!generalData.correo.trim() || !generalData.complemento.trim()) {
            Alert.alert('Error', 'Correo electrónico y dirección son requeridos');
            return;
          }
          stepData = generalData;
          break;
        case 3:
          // Economic activity is required
          if (!issuerData.codActividad) {
            Alert.alert('Error', 'Actividad económica es requerida');
            return;
          }
          stepData = issuerData;
          break;
        case 4:
          // Certificate validation - password confirmation
          if (certificateData.password && certificateData.password !== certificateData.confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
          }
          stepData = {
            certificatePath: certificateData.certificatePath,
            certificatePassword: certificateData.password,
          };
          break;
        default:
          break;
      }

      // Accumulate data across steps
      const updatedCompanyData = { ...companyData, ...stepData };
      console.log('CompanyConfigurationForm: Saving step data', {
        step,
        stepData,
        previousCompanyData: companyData,
        updatedCompanyData
      });
      setCompanyData(updatedCompanyData);

      // If this is the last step, create or update the company
      if (step === 4) {
        // Ensure we have all required fields
        const completeCompanyData: CreateCompanyInput = {
          // Basic info
          nombre: updatedCompanyData.nombre || fiscalData.nombre,
          nombreComercial: updatedCompanyData.nombreComercial || fiscalData.nombreComercial,
          nit: updatedCompanyData.nit || fiscalData.nit,
          nrc: updatedCompanyData.nrc || fiscalData.nrc,
          // Contact & location
          correo: updatedCompanyData.correo || generalData.correo,
          telefono: updatedCompanyData.telefono || generalData.telefono,
          complemento: updatedCompanyData.complemento || generalData.complemento,
          departamentoCode: updatedCompanyData.departamentoCode || generalData.departamentoCode,
          departamento: updatedCompanyData.departamento || generalData.departamento,
          municipioCode: updatedCompanyData.municipioCode || generalData.municipioCode,
          municipio: updatedCompanyData.municipio || generalData.municipio,
          // Economic activity & establishment
          codActividad: updatedCompanyData.codActividad || issuerData.codActividad,
          descActividad: updatedCompanyData.descActividad || issuerData.descActividad,
          tipoEstablecimiento: updatedCompanyData.tipoEstablecimiento || issuerData.tipoEstablecimiento,
          establecimiento: updatedCompanyData.establecimiento || issuerData.establecimiento,
          codEstableMH: updatedCompanyData.codEstableMH || issuerData.codEstableMH,
          codEstable: updatedCompanyData.codEstable || issuerData.codEstable,
          codPuntoVentaMH: updatedCompanyData.codPuntoVentaMH || issuerData.codPuntoVentaMH,
          codPuntoVenta: updatedCompanyData.codPuntoVenta || issuerData.codPuntoVenta,
          // Certificate
          certificatePath: updatedCompanyData.certificatePath || certificateData.certificatePath,
          certificatePassword: updatedCompanyData.certificatePassword || certificateData.password,
          // Defaults
          environment: CompanyEnvironment.Development,
          ivaPercentage: 13,
        };

        console.log('Saving company with data:', completeCompanyData);
        
        try {
          if (!isCreating && currentCompany && currentCompany.id) {
            // Update existing company (only when not in explicit creation mode)
            console.log('Updating existing company:', currentCompany.id);
            await dispatch(updateCompany({
              id: currentCompany.id,
              ...completeCompanyData
            })).unwrap();
            Alert.alert(
              'Empresa Actualizada',
              'Su empresa ha sido actualizada exitosamente',
              [{ text: 'OK', onPress: onComplete }]
            );
          } else {
            // Create new company (when isCreating=true or no currentCompany)
            console.log('Creating new company (isCreating:', isCreating, ', currentCompany:', !!currentCompany, ')');
            const newCompany = await dispatch(createCompany(completeCompanyData)).unwrap();
            console.log('New company created and selected as default:', newCompany.id, newCompany.nombreComercial);
            
            Alert.alert(
              'Empresa Creada',
              'Su empresa ha sido configurada exitosamente',
              [{ text: 'OK', onPress: onComplete }]
            );
          }
        } catch (error) {
          console.error('Failed to save company:', error);
          Alert.alert('Error', 'No se pudo guardar la empresa. Inténtelo de nuevo.');
        }
      } else {
        // For steps 1-3, save step data to local state and continue
        console.log(`Step ${step} completed, data saved locally:`, stepData);
        onComplete();
      }
    } catch (error) {
      console.error('Error saving step data:', error);
      Alert.alert('Error', 'No se pudo guardar la información');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={minimal ? styles.minimalContainer : styles.container}>
      <Text style={styles.title}>Información Básica</Text>
      <Text style={styles.subtitle}>Configure los datos básicos de su empresa para comenzar</Text>

      <View style={minimal ? styles.minimalForm : styles.form}>
        {/* NIT - Optional */}
        <View style={styles.fieldContainer}>
          <View style={styles.fieldHeaderRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="document-text-outline" size={18} color="#4A5568" style={styles.fieldIcon} />
              <Text style={styles.label}>NIT (Opcional)</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                Alert.alert(
                  'NIT - Número de Identificación Tributaria',
                  'Campo opcional que permite la integración completa con el sistema del Ministerio de Hacienda de El Salvador para facturación electrónica.',
                  [{ text: 'Entendido' }]
                );
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color="#3182ce" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.optionalField]}
              value={fiscalData.nit}
              onChangeText={(text) => setFiscalData({...fiscalData, nit: text})}
              placeholder="Ej: 06142903871106"
              keyboardType="numeric"
              maxLength={14}
            />
          </View>
          <Text style={styles.helperText}>
            <Ionicons name="information-circle" size={12} color="#4A5568" /> 
            {' '}Campo opcional - requerido para integración con Ministerio de Hacienda
          </Text>
        </View>

        {/* Nombres y Apellidos - Required */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelWithIcon}>
            <Ionicons name="person-outline" size={18} color="#E53E3E" style={styles.fieldIcon} />
            <Text style={[styles.label, styles.requiredField]}>Nombres y Apellidos *</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, !fiscalData.nombre.trim() ? styles.errorField : null]}
              value={fiscalData.nombre}
              onChangeText={(text) => setFiscalData({...fiscalData, nombre: text})}
              placeholder="Ej: Juan Carlos Pérez"
              keyboardType="default"
              autoCapitalize="words"
            />
          </View>
          {!fiscalData.nombre.trim() && (
            <Text style={styles.errorText}>
              <Ionicons name="alert-circle" size={12} color="#E53E3E" />
              {' '}Este campo es requerido
            </Text>
          )}
        </View>

        {/* Nombre Comercial - Required */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelWithIcon}>
            <Ionicons name="storefront-outline" size={18} color="#E53E3E" style={styles.fieldIcon} />
            <Text style={[styles.label, styles.requiredField]}>Nombre Comercial *</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, !fiscalData.nombreComercial.trim() ? styles.errorField : null]}
              value={fiscalData.nombreComercial}
              onChangeText={(text) => setFiscalData({...fiscalData, nombreComercial: text})}
              placeholder="Ej: Mi Empresa S.A."
              keyboardType="default"
              autoCapitalize="words"
            />
          </View>
          {!fiscalData.nombreComercial.trim() && (
            <Text style={styles.errorText}>
              <Ionicons name="alert-circle" size={12} color="#E53E3E" />
              {' '}Este campo es requerido
            </Text>
          )}
        </View>

        {/* NRC - Optional */}
        <View style={styles.fieldContainer}>
          <View style={styles.fieldHeaderRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="card-outline" size={18} color="#4A5568" style={styles.fieldIcon} />
              <Text style={styles.label}>NRC (Opcional)</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                Alert.alert(
                  'NRC - Número de Registro de Contribuyente',
                  'Campo opcional que identifica su empresa ante la DGI para efectos de IVA y otros tributos.',
                  [{ text: 'Entendido' }]
                );
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color="#3182ce" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.optionalField]}
              value={fiscalData.nrc}
              onChangeText={(text) => setFiscalData({...fiscalData, nrc: text})}
              placeholder="Ej: 12345"
              keyboardType="numeric"
              maxLength={8}
            />
          </View>
          <Text style={styles.helperText}>
            <Ionicons name="information-circle" size={12} color="#4A5568" /> 
            {' '}Campo opcional - requerido para configuración completa con Hacienda
          </Text>
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={24} color="#3182ce" />
            <Text style={styles.infoCardTitle}>Información Importante</Text>
          </View>
          <Text style={styles.infoCardText}>
            • Los campos marcados con * son obligatorios{'\n'}
            • NIT y NRC son opcionales pero recomendados para facturación electrónica{'\n'}
            • Puede completar esta información más tarde desde configuración
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={minimal ? styles.minimalContainer : styles.container}>
      <Text style={styles.title}>Datos de Contacto</Text>
      <Text style={styles.subtitle}>Información de contacto y ubicación</Text>

      <View style={minimal ? styles.minimalForm : styles.form}>
        {/* Email - Required */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.requiredField]}>Correo Electrónico *</Text>
          <TextInput
            style={[styles.input, !generalData.correo.trim() ? styles.errorField : null]}
            value={generalData.correo}
            onChangeText={(text) => setGeneralData({...generalData, correo: text})}
            placeholder="Correo Electrónico"
            keyboardType="email-address"
          />
        </View>

        {/* Phone - Optional */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Teléfono (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={generalData.telefono}
            onChangeText={(text) => setGeneralData({...generalData, telefono: text})}
            placeholder="Teléfono (Opcional)"
            keyboardType="phone-pad"
          />
          <Text style={styles.helperText}>Este campo es opcional y puede completarlo más tarde</Text>
        </View>

        {/* Address - Required */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.requiredField]}>Dirección *</Text>
          <TextInput
            style={[styles.input, !generalData.complemento.trim() ? styles.errorField : null]}
            value={generalData.complemento}
            onChangeText={(text) => setGeneralData({...generalData, complemento: text})}
            placeholder="Dirección completa"
            multiline
          />
        </View>

        {/* Location Dropdowns - Department and Municipality with cascade logic */}
        <LocationDropdowns
          value={{
            departamentoCode: generalData.departamentoCode,
            departamento: generalData.departamento,
            municipioCode: generalData.municipioCode,
            municipio: generalData.municipio,
          }}
          onChange={(locationData) => {
            setGeneralData({
              ...generalData,
              ...locationData,
            });
          }}
          required
        />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={minimal ? styles.minimalContainer : styles.container}>
      <Text style={styles.title}>Información del Emisor</Text>
      <Text style={styles.subtitle}>Actividad económica y tipo de establecimiento</Text>

      <View style={minimal ? styles.minimalForm : styles.form}>
        {/* Economic Activity Dropdown */}
        <CatalogDropdown
          catalogId={GovernmentCatalogId.ECONOMIC_ACTIVITIES}
          label="Actividad Económica"
          value={issuerData.codActividad}
          onSelect={(option) => setIssuerData({
            ...issuerData, 
            codActividad: option?.code || '',
            descActividad: option?.description || ''
          })}
          required
        />

        {/* Establishment Type Dropdown */}
        <CatalogDropdown
          catalogId={GovernmentCatalogId.ESTABLISHMENT_TYPES}
          label="Tipo Establecimiento"
          value={issuerData.tipoEstablecimiento}
          onSelect={(option) => setIssuerData({
            ...issuerData, 
            tipoEstablecimiento: option?.code || '',
            establecimiento: option?.description || ''
          })}
          required
        />

        {/* MH Codes Section */}
        <Text style={styles.sectionTitle}>Código del Punto de Venta (Emisor) Asignado por el MH</Text>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Código Establecimiento MH</Text>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={issuerData.codEstableMH}
            onChangeText={(text) => setIssuerData({...issuerData, codEstableMH: text})}
            placeholder="Código Establecimiento MH"
            keyboardType="default"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Código Establecimiento</Text>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={issuerData.codEstable}
            onChangeText={(text) => setIssuerData({...issuerData, codEstable: text})}
            placeholder="Código Establecimiento"
            keyboardType="default"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Código Punto Venta MH</Text>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={issuerData.codPuntoVentaMH}
            onChangeText={(text) => setIssuerData({...issuerData, codPuntoVentaMH: text})}
            placeholder="Código Punto Venta MH"
            keyboardType="default"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Código Punto Venta</Text>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={issuerData.codPuntoVenta}
            onChangeText={(text) => setIssuerData({...issuerData, codPuntoVenta: text})}
            placeholder="Código Punto Venta"
            keyboardType="default"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={minimal ? styles.minimalContainer : styles.container}>
      <Text style={styles.title}>Configuración de Certificado</Text>
      <Text style={styles.subtitle}>Configure el certificado para firmar documentos tributarios</Text>

      <View style={minimal ? styles.minimalForm : styles.form}>
        {/* Link to Hacienda */}
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            // Open Hacienda URL - in a real implementation you'd use Linking
            console.log('Opening Hacienda URL');
          }}
        >
          <Text style={styles.linkText}>Hacienda Facturación Electrónica</Text>
        </TouchableOpacity>

        {/* Certificate Selection */}
        <TouchableOpacity 
          style={styles.certificateButton}
          onPress={() => {
            // Handle certificate selection
            console.log('Select certificate');
          }}
        >
          <Text style={styles.certificateButtonText}>
            {certificateData.certificatePath ? 'Certificado Seleccionado' : 'Seleccionar Certificado'}
          </Text>
        </TouchableOpacity>

        {/* Certificate Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Contraseña Certificado</Text>
          <TextInput
            style={styles.input}
            value={certificateData.password}
            onChangeText={(text) => setCertificateData({...certificateData, password: text})}
            placeholder="Contraseña Certificado"
            secureTextEntry
            keyboardType="default"
          />
        </View>

        {/* Confirm Certificate Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Confirmar Contraseña Certificado</Text>
          <TextInput
            style={[
              styles.input,
              certificateData.password !== certificateData.confirmPassword && certificateData.confirmPassword.length > 0 
                ? styles.errorField 
                : null
            ]}
            value={certificateData.confirmPassword}
            onChangeText={(text) => setCertificateData({...certificateData, confirmPassword: text})}
            placeholder="Confirmar Contraseña Certificado"
            secureTextEntry
            keyboardType="default"
          />
        </View>

        {/* Update Certificate Credentials */}
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => {
            if (certificateData.password !== certificateData.confirmPassword) {
              Alert.alert('Error', 'Las contraseñas no coinciden');
              return;
            }
            console.log('Update certificate credentials');
          }}
        >
          <Text style={styles.updateButtonText}>Actualizar contraseña</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Step Progress Indicator Component
  const StepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepIndicatorGradient}
      >
        {[1, 2, 3, 4].map((stepNumber) => (
          <View key={stepNumber} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              step >= stepNumber ? styles.stepActive : styles.stepInactive
            ]}>
              {step > stepNumber ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  step >= stepNumber ? styles.stepNumberActive : styles.stepNumberInactive
                ]}>
                  {stepNumber}
                </Text>
              )}
            </View>
            {stepNumber < 4 && (
              <View style={[
                styles.stepLine,
                step > stepNumber ? styles.stepLineActive : styles.stepLineInactive
              ]} />
            )}
          </View>
        ))}
      </LinearGradient>
      
      {/* Step Labels */}
      <View style={styles.stepLabelsContainer}>
        <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
          Información{'\n'}Básica
        </Text>
        <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
          Contacto y{'\n'}Ubicación
        </Text>
        <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>
          Información{'\n'}del Emisor
        </Text>
        <Text style={[styles.stepLabel, step === 4 && styles.stepLabelActive]}>
          Certificados{'\n'}Digitales
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  if (loading && !currentCompany) {
    return (
      <View style={[styles.wrapper, styles.centerContent]}>
        <Text style={styles.loadingText}>Cargando información de la empresa...</Text>
      </View>
    );
  }

  return (
    <View style={minimal ? styles.minimalWrapper : styles.wrapper}>
      {showStepIndicator && <StepIndicator />}
      {renderCurrentStep()}
      
      <View style={styles.buttonContainer}>
        {showSkipButton && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>
              {skipButtonText || 'Omitir por ahora'}
            </Text>
          </TouchableOpacity>
        )}
        
        <LinearGradient
          colors={['#4299e1', '#3182ce']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.saveButtonGradient, showSkipButton ? {} : { flex: 1, marginLeft: 0 }]}
        >
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave} 
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {saveButtonText || (loading ? 'Guardando...' : (step === 4 ? 'Continuar' : 'Guardar y Continuar'))}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  minimalWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    paddingBottom: 20,
  },
  minimalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  minimalForm: {
    backgroundColor: 'transparent',
    padding: 24,
    margin: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  radioGroup: {
    marginTop: 10,
  },
  radioOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  radioSelected: {
    borderColor: '#3182CE',
    backgroundColor: '#EBF8FF',
  },
  radioText: {
    fontSize: 16,
    color: '#2D3748',
  },
  infoText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 15,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 10,
    marginBottom: 5,
  },
  uploadButton: {
    backgroundColor: '#3182CE',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for Swift-like UI
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  infoIcon: {
    fontSize: 16,
    color: '#3182CE',
  },
  requiredField: {
    color: '#E53E3E',
  },
  optionalField: {
    borderColor: '#CBD5E0',
    backgroundColor: '#F7FAFC',
  },
  errorField: {
    borderColor: '#E53E3E',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  focusField: {
    borderColor: '#3182ce',
    borderWidth: 2,
    backgroundColor: '#EBF8FF',
  },
  helperText: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  linkButton: {
    backgroundColor: '#3182CE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  certificateButton: {
    borderWidth: 3,
    borderColor: '#4A5568',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2B6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  certificateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  updateButton: {
    borderWidth: 3,
    borderColor: '#4A5568',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
  },
  
  // Step Indicator Styles
  stepIndicatorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  stepInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#667eea',
  },
  stepNumberInactive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#fff',
  },
  stepLineInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#718096',
    flex: 1,
    lineHeight: 16,
  },
  stepLabelActive: {
    color: '#2D3748',
    fontWeight: '600',
  },
  
  // Enhanced Button Styles
  saveButtonGradient: {
    flex: 2,
    marginLeft: 12,
    borderRadius: 12,
    shadowColor: '#3182ce',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Enhanced Field Styles
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 6,
    fontWeight: '500',
  },
  
  // Info Card Styles  
  infoCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3182ce',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B6CB0',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#2C5282',
    lineHeight: 20,
  },
});
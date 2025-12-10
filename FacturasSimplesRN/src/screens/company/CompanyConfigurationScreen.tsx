import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { createCompany, updateCompany, fetchCompanies, setSelectedCompany } from '../../store/slices/companySlice';
import { CreateCompanyInput, CompanyEnvironment } from '../../types/company';
import { CertificateUpload } from '../../components/CertificateUpload';
import { CatalogDropdown } from '../../components/CatalogDropdown';
import { GovernmentCatalogId } from '../../types/catalog';

interface CompanyConfigurationScreenProps {
  step: 1 | 2 | 3 | 4;
  onComplete: () => void;
  onSkip: () => void;
}

export const CompanyConfigurationScreen: React.FC<CompanyConfigurationScreenProps> = ({
  step,
  onComplete,
  onSkip,
}) => {
  const dispatch = useAppDispatch();
  
  // Load companies and current company data
  const { companies, currentCompany, loading } = useAppSelector(state => state.companies);
  
  // Combined company data that accumulates across all steps
  const [companyData, setCompanyData] = useState<Partial<CreateCompanyInput>>({
    environment: CompanyEnvironment.Development,
  });
  
  // Fetch companies on mount to get the first saved company
  useEffect(() => {
    console.log('CompanyConfigurationScreen: Fetching companies on mount');
    dispatch(fetchCompanies());
  }, [dispatch]);
  
  // Load existing company data when companies are loaded
  useEffect(() => {
    if (companies.length > 0 && !currentCompany) {
      // Load the first company (like Swift UI app behavior)
      console.log('CompanyConfigurationScreen: Setting first company as current', companies[0]);
      dispatch(setSelectedCompany(companies[0].id));
    }
  }, [companies, currentCompany, dispatch]);
  
  // Initialize form fields when currentCompany is available
  useEffect(() => {
    if (currentCompany) {
      console.log('CompanyConfigurationScreen: Loading company data into forms', currentCompany);
      // Load existing company data into form fields
      setFiscalData({
        nit: currentCompany.nit || '',
        nombre: currentCompany.nombre || '',
        nombreComercial: currentCompany.nombreComercial || '',
        nrc: currentCompany.nrc || '',
      });
      
      setGeneralData({
        correo: currentCompany.correo || '',
        telefono: currentCompany.telefono || '',
        complemento: currentCompany.complemento || '',
        departamentoCode: currentCompany.departamentoCode || '',
        departamento: currentCompany.departamento || '',
        municipioCode: currentCompany.municipioCode || '',
        municipio: currentCompany.municipio || '',
      });
      
      setIssuerData({
        codActividad: currentCompany.codActividad || '',
        descActividad: currentCompany.descActividad || '',
        tipoEstablecimiento: currentCompany.tipoEstablecimiento || '',
        establecimiento: currentCompany.establecimiento || '',
        codEstableMH: currentCompany.codEstableMH || 'M001',
        codEstable: currentCompany.codEstable || '',
        codPuntoVentaMH: currentCompany.codPuntoVentaMH || 'P001',
        codPuntoVenta: currentCompany.codPuntoVenta || '',
      });
      
      setCertificateData({
        certificatePath: currentCompany.certificatePath || '',
        password: '',
        confirmPassword: '',
      });
      
      // Also update the accumulated company data
      setCompanyData({
        environment: CompanyEnvironment.Development,
        // Basic info
        nit: currentCompany.nit || '',
        nombre: currentCompany.nombre || '',
        nombreComercial: currentCompany.nombreComercial || '',
        nrc: currentCompany.nrc || '',
        // Contact & location
        correo: currentCompany.correo || '',
        telefono: currentCompany.telefono || '',
        complemento: currentCompany.complemento || '',
        departamentoCode: currentCompany.departamentoCode || '',
        departamento: currentCompany.departamento || '',
        municipioCode: currentCompany.municipioCode || '',
        municipio: currentCompany.municipio || '',
        // Economic activity & establishment
        codActividad: currentCompany.codActividad || '',
        descActividad: currentCompany.descActividad || '',
        tipoEstablecimiento: currentCompany.tipoEstablecimiento || '',
        establecimiento: currentCompany.establecimiento || '',
        codEstableMH: currentCompany.codEstableMH || 'M001',
        codEstable: currentCompany.codEstable || '',
        codPuntoVentaMH: currentCompany.codPuntoVentaMH || 'P001',
        codPuntoVenta: currentCompany.codPuntoVenta || '',
        // Certificate
        certificatePath: currentCompany.certificatePath || '',
        certificatePassword: '',
      });
    }
  }, [currentCompany]);
  
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
          if (currentCompany && currentCompany.id) {
            // Update existing company
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
            // Create new company
            console.log('Creating new company');
            await dispatch(createCompany(completeCompanyData)).unwrap();
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Información Básica</Text>
      <Text style={styles.subtitle}>Configure los datos básicos de su empresa</Text>

      <View style={styles.form}>
        {/* NIT - Optional */}
        <View style={styles.fieldContainer}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.label}>NIT (Opcional)</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={fiscalData.nit}
            onChangeText={(text) => setFiscalData({...fiscalData, nit: text})}
            placeholder="NIT (Opcional)"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>Campo opcional - requerido para integración con Ministerio de Hacienda</Text>
        </View>

        {/* Nombres y Apellidos - Required */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.requiredField]}>Nombres y Apellidos *</Text>
          <TextInput
            style={[styles.input, !fiscalData.nombre.trim() ? styles.errorField : null]}
            value={fiscalData.nombre}
            onChangeText={(text) => setFiscalData({...fiscalData, nombre: text})}
            placeholder="Nombres y Apellidos"
            keyboardType="default"
          />
        </View>

        {/* Nombre Comercial - Required */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.requiredField]}>Nombre Comercial *</Text>
          <TextInput
            style={[styles.input, !fiscalData.nombreComercial.trim() ? styles.errorField : null]}
            value={fiscalData.nombreComercial}
            onChangeText={(text) => setFiscalData({...fiscalData, nombreComercial: text})}
            placeholder="Nombre Comercial"
            keyboardType="default"
          />
        </View>

        {/* NRC - Optional */}
        <View style={styles.fieldContainer}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.label}>NRC (Opcional)</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.optionalField]}
            value={fiscalData.nrc}
            onChangeText={(text) => setFiscalData({...fiscalData, nrc: text})}
            placeholder="NRC (Opcional)"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>Campo opcional - requerido para configuración completa con Hacienda</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Datos de Contacto</Text>
      <Text style={styles.subtitle}>Información de contacto y ubicación</Text>

      <View style={styles.form}>
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

        {/* Department Dropdown */}
        <CatalogDropdown
          catalogId={GovernmentCatalogId.DEPARTMENTS}
          label="Departamento"
          value={generalData.departamentoCode}
          onSelect={(option) => {
            setGeneralData({
              ...generalData, 
              departamentoCode: option?.code || '',
              departamento: option?.description || '',
              municipioCode: '', // Reset municipality when department changes
              municipio: ''
            });
          }}
          required
        />

        {/* Municipality Dropdown */}
        <CatalogDropdown
          catalogId={GovernmentCatalogId.MUNICIPALITIES}
          label="Municipio"
          value={generalData.municipioCode}
          onSelect={(option) => setGeneralData({
            ...generalData, 
            municipioCode: option?.code || '',
            municipio: option?.description || ''
          })}
          filterBy={generalData.departamentoCode ? { field: 'departamento', value: generalData.departamentoCode } : undefined}
          required
        />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Información del Emisor</Text>
      <Text style={styles.subtitle}>Actividad económica y tipo de establecimiento</Text>

      <View style={styles.form}>
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuración de Certificado</Text>
      <Text style={styles.subtitle}>Configure el certificado para firmar documentos tributarios</Text>

      <View style={styles.form}>
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
    <View style={styles.wrapper}>
      {renderCurrentStep()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Omitir por ahora</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : (step === 4 ? 'Continuar' : 'Guardar y Continuar')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
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
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  skipButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    marginRight: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#3182CE',
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for Swift-like UI
  fieldContainer: {
    marginBottom: 16,
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
  linkText: {
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
});
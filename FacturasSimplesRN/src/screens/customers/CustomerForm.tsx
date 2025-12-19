import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomersStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { createCustomer, updateCustomerAsync, fetchCustomers } from '../../store/slices/customerSlice';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { useTheme } from '../../hooks/useTheme';
import { CustomerType, CustomerDocumentType } from '../../types/customer';
import { LocationDropdowns, LocationData } from '../../components/LocationDropdowns';
import { CatalogDropdown } from '../../components/CatalogDropdown';
import { GovernmentCatalogId } from '../../types/catalog';

type RouteProps = RouteProp<CustomersStackParamList, 'CustomerForm'>;

const CustomerForm: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { currentCompany } = useAppSelector(state => state.companies);

  const mode = route.params?.mode ?? 'create';
  const customerId = route.params?.customerId;

  const existing = customerId ? useAppSelector(selectCustomerById(customerId)) : null;

  // Basic info
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [nationalId, setNationalId] = useState(existing?.nationalId ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  
  // Address info - includes both codes and descriptions for location
  const [departmentCode, setDepartmentCode] = useState(existing?.departmentCode ?? '');
  const [department, setDepartment] = useState(existing?.department ?? '');
  const [municipalityCode, setMunicipalityCode] = useState(existing?.municipalityCode ?? '');
  const [municipality, setMunicipality] = useState(existing?.municipality ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  
  // Business info
  const [hasInvoiceSettings, setHasInvoiceSettings] = useState(existing?.customerType === CustomerType.Business || false);
  const [company, setCompany] = useState(existing?.businessName ?? '');
  const [nit, setNit] = useState(existing?.nit ?? '');
  const [nrc, setNrc] = useState(existing?.nrc ?? '');
  const [codActividad, setCodActividad] = useState(existing?.codActividad ?? '');
  const [descActividad, setDescActividad] = useState(existing?.descActividad ?? '');
  const [hasContributorRetention, setHasContributorRetention] = useState(existing?.hasContributorRetention ?? false);
  
  // Export info
  const [hasExportInvoiceSettings, setHasExportInvoiceSettings] = useState(false);
  const [codPais, setCodPais] = useState('');
  const [tipoPersona, setTipoPersona] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setEmail(existing.email);
      setPhone(existing.phone);
      setNationalId(existing.nationalId);
      setCompany(existing.businessName || '');
      setNit(existing.nit || '');
      setNrc(existing.nrc || '');
      setCodActividad(existing.codActividad || '');
      setDescActividad(existing.descActividad || '');
      setHasContributorRetention(existing.hasContributorRetention);
      setAddress(existing.address || '');
      setDepartmentCode(existing.departmentCode || '');
      setDepartment(existing.department || '');
      setMunicipalityCode(existing.municipalityCode || '');
      setMunicipality(existing.municipality || '');
      setHasInvoiceSettings(existing.customerType === CustomerType.Business);
    }
  }, [existing]);

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validación', 'Nombre y apellido son obligatorios');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validación', 'Email es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Ensure we have a company selected (like Swift's selectedCompanyId check)
    if (!currentCompany?.id) {
      Alert.alert('Error', 'No hay empresa seleccionada. Por favor seleccione una empresa primero.');
      return;
    }

    const customerData = {
      firstName,
      lastName,
      nationalId,
      documentType: CustomerDocumentType.DUI,
      email,
      phone,
      nit: nit || nationalId,
      customerType: hasInvoiceSettings ? CustomerType.Business : CustomerType.Individual,
      companyId: currentCompany.id, // Link to current company (like Swift's companyOwnerId)
      businessName: hasInvoiceSettings ? company : undefined,
      nrc: hasInvoiceSettings ? nrc : undefined,
      codActividad: hasInvoiceSettings ? codActividad : undefined,
      descActividad: hasInvoiceSettings ? descActividad : undefined,
      hasContributorRetention: hasInvoiceSettings ? hasContributorRetention : false,
      address,
      departmentCode,
      department,
      municipalityCode,
      municipality,
      // Export information
      codPais: hasExportInvoiceSettings ? codPais : undefined,
      tipoPersona: hasExportInvoiceSettings ? tipoPersona : undefined,
      tipoDocumento: hasExportInvoiceSettings ? tipoDocumento : undefined,
      shouldSyncToCloud: !currentCompany.isTestAccount, // Like Swift: isProductionCompany
    };

    console.log('📝 Creating/updating customer with companyId:', currentCompany.id);

    try {
      if (mode === 'create') {
        // Use async createCustomer and refresh list
        await dispatch(createCustomer(customerData)).unwrap();
        await dispatch(fetchCustomers({ refresh: true }));
        console.log('✅ Customer created and list refreshed');
        
        Alert.alert(
          'Éxito',
          'Cliente creado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (mode === 'edit' && customerId) {
        // Use async updateCustomerAsync
        await dispatch(updateCustomerAsync({
          id: customerId,
          ...customerData,
        } as any)).unwrap();
        console.log('✅ Customer updated');
        
        Alert.alert(
          'Éxito',
          'Cliente actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error saving customer:', error);
      Alert.alert('Error', error || 'No se pudo guardar el cliente');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
        </Text>
      </View>

      {/* Cliente Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>Cliente</Text>
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="Nombre"
            placeholderTextColor={theme.colors.text.secondary}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="Apellido"
            placeholderTextColor={theme.colors.text.secondary}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="DUI"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="number-pad"
            value={nationalId}
            onChangeText={setNationalId}
          />
        </View>
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="Teléfono"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      {/* Dirección Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>Dirección</Text>
        
        {/* Location Dropdowns - Department and Municipality with cascade logic */}
        {/* Matches Swift's .onChange(of: departamentoCode) behavior */}
        <LocationDropdowns
          value={{
            departamentoCode: departmentCode,
            departamento: department,
            municipioCode: municipalityCode,
            municipio: municipality,
          }}
          onChange={(locationData: LocationData) => {
            setDepartmentCode(locationData.departamentoCode);
            setDepartment(locationData.departamento);
            setMunicipalityCode(locationData.municipioCode);
            setMunicipality(locationData.municipio);
          }}
        />
        
        <View style={styles.field}>
          <TextInput 
            style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
            placeholder="Dirección"
            placeholderTextColor={theme.colors.text.secondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>
      </View>

      {/* Información del Negocio Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>Información del Negocio</Text>
        
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
            Configuración de Facturación
          </Text>
          <Switch
            value={hasInvoiceSettings}
            onValueChange={setHasInvoiceSettings}
            trackColor={{ false: theme.colors.border.light, true: theme.colors.primary }}
            thumbColor={hasInvoiceSettings ? '#fff' : '#f4f3f4'}
          />
        </View>

        {hasInvoiceSettings && (
          <>
            <View style={styles.field}>
              <TextInput 
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
                placeholder="Empresa"
                placeholderTextColor={theme.colors.text.secondary}
                value={company}
                onChangeText={setCompany}
              />
            </View>
            
            <View style={styles.field}>
              <TextInput 
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
                placeholder="NIT"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="number-pad"
                value={nit}
                onChangeText={setNit}
              />
            </View>
            
            <View style={styles.field}>
              <TextInput 
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
                placeholder="NRC"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="number-pad"
                value={nrc}
                onChangeText={setNrc}
              />
            </View>

            <CatalogDropdown
              catalogId={GovernmentCatalogId.ECONOMIC_ACTIVITIES}
              label="Actividad Económica"
              placeholder="Seleccionar Actividad Económica"
              value={codActividad}
              onSelect={(option) => {
                setCodActividad(option?.code || '');
                setDescActividad(option?.description || '');
              }}
            />

            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
                Gran Contribuyente
              </Text>
              <Switch
                value={hasContributorRetention}
                onValueChange={setHasContributorRetention}
                trackColor={{ false: theme.colors.border.light, true: theme.colors.primary }}
                thumbColor={hasContributorRetention ? '#fff' : '#f4f3f4'}
              />
            </View>

            {hasContributorRetention && (
              <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>
                La categoría de gran contribuyente en el Ministerio de Hacienda es requerida
              </Text>
            )}
          </>
        )}
      </View>

      {/* Información de Exportación Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>Información de Exportación</Text>
        
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
            Configuración de Facturación
          </Text>
          <Switch
            value={hasExportInvoiceSettings}
            onValueChange={setHasExportInvoiceSettings}
            trackColor={{ false: theme.colors.border.light, true: theme.colors.primary }}
            thumbColor={hasExportInvoiceSettings ? '#fff' : '#f4f3f4'}
          />
        </View>

        {hasExportInvoiceSettings && (
          <>
            <CatalogDropdown
              catalogId={GovernmentCatalogId.COUNTRIES}
              label="País"
              placeholder="Seleccionar País"
              value={codPais}
              onSelect={(option) => {
                setCodPais(option?.code || '');
              }}
            />

            <CatalogDropdown
              catalogId={GovernmentCatalogId.DOCUMENT_TYPES}
              label="Tipo de Persona"
              placeholder="Seleccionar Tipo de Persona"
              value={tipoPersona}
              onSelect={(option) => {
                setTipoPersona(option?.code || '');
              }}
            />

            <CatalogDropdown
              catalogId={GovernmentCatalogId.DOCUMENT_TYPES}
              label="Tipo de Documento"
              placeholder="Seleccionar Tipo de Documento"
              value={tipoDocumento}
              onSelect={(option) => {
                setTipoDocumento(option?.code || '');
              }}
            />
          </>
        )}
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.saveText}>{mode === 'create' ? 'Guardar' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  field: { 
    marginBottom: 16
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    fontSize: 16,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    padding: 20,
  },
  saveButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  saveText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600' 
  },
});

export default CustomerForm;

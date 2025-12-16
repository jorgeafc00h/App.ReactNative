import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomersStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { addCustomer, updateCustomer } from '../../store/slices/customerSlice';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { useTheme } from '../../hooks/useTheme';
import { CustomerType, CustomerDocumentType } from '../../types/customer';

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
  
  // Address info
  const [departmentCode, setDepartmentCode] = useState(existing?.departmentCode ?? '');
  const [municipalityCode, setMunicipalityCode] = useState(existing?.municipalityCode ?? '');
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
  const [nombrePais, setNombrePais] = useState('');
  const [tipoPersona, setTipoPersona] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  
  // UI state
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);

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
      setMunicipalityCode(existing.municipalityCode || '');
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

  const handleSubmit = () => {
    if (!validate()) return;

    const customerData = {
      firstName,
      lastName,
      nationalId,
      documentType: CustomerDocumentType.DUI,
      email,
      phone,
      nit: nit || nationalId,
      customerType: hasInvoiceSettings ? CustomerType.Business : CustomerType.Individual,
      companyId: currentCompany?.id || '',
      businessName: hasInvoiceSettings ? company : undefined,
      nrc: hasInvoiceSettings ? nrc : undefined,
      codActividad: hasInvoiceSettings ? codActividad : undefined,
      descActividad: hasInvoiceSettings ? descActividad : undefined,
      hasContributorRetention: hasInvoiceSettings ? hasContributorRetention : false,
      address,
      departmentCode,
      municipalityCode,
    };

    if (mode === 'create') {
      dispatch(addCustomer(customerData));
      navigation.goBack();
    } else if (mode === 'edit' && customerId) {
      dispatch(
        updateCustomer({
          id: customerId,
          ...customerData,
        } as any)
      );
      navigation.goBack();
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
        
        <TouchableOpacity 
          style={[styles.picker, { borderColor: theme.colors.border.light }]}
          onPress={() => setShowDepartmentPicker(true)}
        >
          <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
            {departmentCode ? `Departamento: ${departmentCode}` : 'Departamento'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.picker, { borderColor: theme.colors.border.light }]}
          onPress={() => setShowMunicipalityPicker(true)}
        >
          <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
            {municipalityCode ? `Municipio: ${municipalityCode}` : 'Municipio'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
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

            <TouchableOpacity 
              style={[styles.picker, { borderColor: theme.colors.border.light }]}
              onPress={() => setShowActivityPicker(true)}
            >
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {descActividad || 'Actividad Económica'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

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
            <TouchableOpacity style={[styles.picker, { borderColor: theme.colors.border.light }]}>
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {nombrePais || 'Seleccionar País'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.picker, { borderColor: theme.colors.border.light }]}>
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {tipoPersona || 'Tipo de Persona'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.picker, { borderColor: theme.colors.border.light }]}>
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {tipoDocumento || 'Tipo de Documento'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.field}>
              <TextInput 
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border.light }]}
                placeholder="Descripción Actividad Económica"
                placeholderTextColor={theme.colors.text.secondary}
                value={descActividad}
                onChangeText={setDescActividad}
              />
            </View>
          </>
        )}
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.saveText}>{mode === 'create' ? 'Guardar' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={showActivityPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Actividad Económica</Text>
            <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
              <Text style={[styles.modalCancel, { color: theme.colors.primary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomerForm;

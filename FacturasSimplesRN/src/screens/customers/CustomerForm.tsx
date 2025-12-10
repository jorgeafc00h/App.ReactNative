import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CustomersStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { addCustomer, updateCustomer } from '../../store/slices/customerSlice';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { useTheme } from '../../hooks/useTheme';
import { CustomerType } from '../../types/customer';
import { DEFAULT_COMPANY_ID } from '../../data/fixtures';

type RouteProps = RouteProp<CustomersStackParamList, 'CustomerForm'>;

const CustomerForm: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  const mode = route.params?.mode ?? 'create';
  const customerId = route.params?.customerId;

  const existing = customerId ? useAppSelector(selectCustomerById(customerId)) : null;

  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [nationalId, setNationalId] = useState(existing?.nationalId ?? '');
  const [customerType, setCustomerType] = useState<CustomerType>(existing?.customerType ?? CustomerType.Individual);

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setEmail(existing.email);
      setPhone(existing.phone);
      setNationalId(existing.nationalId);
      setCustomerType(existing.customerType);
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

    if (mode === 'create') {
      dispatch(
        addCustomer({
          firstName,
          lastName,
          nationalId,
          documentType: 'OTHER' as any,
          email,
          phone,
          customerType,
          companyId: DEFAULT_COMPANY_ID,
        })
      );
      navigation.goBack();
    } else if (mode === 'edit' && customerId) {
      dispatch(
        updateCustomer({
          id: customerId,
          firstName,
          lastName,
          nationalId,
          email,
          phone,
        } as any)
      );
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Nombre</Text>
        <TextInput style={[styles.input, { color: theme.colors.text.primary }]} value={firstName} onChangeText={setFirstName} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Apellido</Text>
        <TextInput style={[styles.input, { color: theme.colors.text.primary }]} value={lastName} onChangeText={setLastName} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Correo</Text>
        <TextInput keyboardType="email-address" style={[styles.input, { color: theme.colors.text.primary }]} value={email} onChangeText={setEmail} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Teléfono</Text>
        <TextInput keyboardType="phone-pad" style={[styles.input, { color: theme.colors.text.primary }]} value={phone} onChangeText={setPhone} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Documento</Text>
        <TextInput style={[styles.input, { color: theme.colors.text.primary }]} value={nationalId} onChangeText={setNationalId} />
      </View>

      <View style={{ padding: 20 }}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.saveText}>{mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  field: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  saveButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});

export default CustomerForm;

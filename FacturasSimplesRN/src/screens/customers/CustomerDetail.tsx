import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { CustomersStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { deleteCustomer } from '../../store/slices/customerSlice';
import { useTheme } from '../../hooks/useTheme';

type RouteProps = RouteProp<CustomersStackParamList, 'CustomerDetail'>;

const CustomerDetail: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { customerId } = route.params;
  const customer = useAppSelector(selectCustomerById(customerId));

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
        <Text style={{ color: theme.colors.text.primary }}>Cliente no encontrado</Text>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate('CustomerForm' as any, { mode: 'edit', customerId });
  };

  const handleDelete = () => {
    Alert.alert('Eliminar cliente', '¿Estás seguro de eliminar este cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          dispatch(deleteCustomer(customerId));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{customer.businessName || `${customer.firstName} ${customer.lastName}`}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleEdit} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { marginLeft: 8, borderColor: theme.colors.error, borderWidth: 1 }]}> 
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Documento</Text>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{customer.documentType} • {customer.nationalId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{customer.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Teléfono</Text>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{customer.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Dirección</Text>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{customer.address}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '600' },
  section: { marginTop: 12 },
  label: { fontSize: 12, textTransform: 'uppercase', fontWeight: '500' },
  value: { fontSize: 16, marginTop: 6 },
});

export default CustomerDetail;

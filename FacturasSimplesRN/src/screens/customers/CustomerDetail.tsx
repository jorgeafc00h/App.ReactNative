import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
    (navigation as any).navigate('CustomerForm', { mode: 'edit', customerId });
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

  const fullName = customer.businessName || `${customer.firstName} ${customer.lastName}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header Section with Profile Picture */}
      <View style={[styles.profileSection, { backgroundColor: theme.colors.surface.primary }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons 
            name="person-circle" 
            size={60} 
            color={theme.colors.primary}
          />
        </View>
        
        <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
          {fullName}
        </Text>

        {/* Personal Information */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Teléfono</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{customer.phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>DUI</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{customer.nationalId}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{customer.email}</Text>
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          onPress={handleEdit} 
          style={[styles.updateButton, { borderColor: theme.colors.primary }]}
        >
          <Ionicons name="pencil" size={16} color={theme.colors.primary} />
          <Text style={[styles.updateButtonText, { color: theme.colors.primary }]}>
            Actualizar datos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
          Dirección
        </Text>
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {customer.department || 'No especificado'}
          </Text>
          <Text style={[styles.sectionSubtext, { color: theme.colors.text.secondary }]}>
            {customer.municipality || ''}
          </Text>
          <Text style={[styles.sectionSubtext, { color: theme.colors.text.secondary }]}>
            {customer.address || 'Dirección no especificada'}
          </Text>
        </View>
      </View>

      {/* Business Information Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
          Información de Negocio
        </Text>
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {customer.businessName || fullName}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>NIT</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{customer.nit || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>NRC</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{customer.nrc || 'No especificado'}</Text>
          </View>
          
          <Text style={[styles.activityLabel, { color: theme.colors.text.secondary }]}>
            Actividad Económica
          </Text>
          <View style={[styles.activityContainer, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.activityDescription, { color: theme.colors.text.primary }]}>
              {customer.descActividad || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.activityCode, { color: theme.colors.text.tertiary }]}>Cod Actividad</Text>
            <Text style={[styles.activityCode, { color: theme.colors.text.tertiary }]}>{customer.codActividad || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          onPress={handleDelete} 
          style={[styles.deleteButton, { borderColor: theme.colors.error }]}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
            Eliminar Cliente
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtext: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  activityContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  activityCode: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerDetail;

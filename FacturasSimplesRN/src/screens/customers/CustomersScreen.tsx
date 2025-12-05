import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';

export const CustomersScreen: React.FC = () => {
  const { theme } = useTheme();

  const customers = [
    {
      name: 'Cliente Ejemplo S.A.',
      email: 'contacto@ejemplo.com',
      phone: '+503 7123-4567',
      document: 'NIT: 1234567891234',
      type: 'Empresa',
      lastInvoice: '2 días',
    },
    {
      name: 'Empresa ABC',
      email: 'ventas@abc.com',
      phone: '+503 7987-6543',
      document: 'NIT: 9876543210987',
      type: 'Empresa',
      lastInvoice: '1 semana',
    },
    {
      name: 'Juan Carlos Pérez',
      email: 'jperez@email.com',
      phone: '+503 7555-1234',
      document: 'DUI: 123456789',
      type: 'Persona',
      lastInvoice: '3 días',
    },
    {
      name: 'Comercial XYZ Ltda.',
      email: 'info@xyz.com',
      phone: '+503 7444-9876',
      document: 'NIT: 5555666677778',
      type: 'Empresa',
      lastInvoice: '1 día',
    },
  ];

  const getTypeIcon = (type: string) => {
    return type === 'Empresa' ? '🏢' : '👤';
  };

  const getTypeColor = (type: string) => {
    return type === 'Empresa' ? '#3B82F6' : '#10B981';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Clientes
        </Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border }]}>
          <Text style={[styles.searchIcon, { color: theme.colors.text.secondary }]}>🔍</Text>
          <TextInput
            placeholder="Buscar por nombre, email o documento..."
            placeholderTextColor={theme.colors.text.secondary}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['Todos', 'Empresas', 'Personas', 'Recientes'].map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterTab,
              index === 0 && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.border }
            ]}
          >
            <Text
              style={[
                styles.filterText,
                index === 0 
                  ? { color: 'white' }
                  : { color: theme.colors.text.secondary }
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Customers List */}
      <ScrollView style={styles.listContainer}>
        {customers.map((customer, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.customerCard, { backgroundColor: theme.colors.surface.primary }]}
            activeOpacity={0.7}
          >
            <View style={styles.customerHeader}>
              <View style={styles.customerInfo}>
                <View style={styles.customerNameRow}>
                  <Text style={styles.typeIcon}>{getTypeIcon(customer.type)}</Text>
                  <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                    {customer.name}
                  </Text>
                </View>
                <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
                  {customer.document}
                </Text>
              </View>
              
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(customer.type) + '20' }]}>
                <Text style={[styles.typeText, { color: getTypeColor(customer.type) }]}>
                  {customer.type}
                </Text>
              </View>
            </View>

            <View style={styles.customerDetails}>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactItem, { color: theme.colors.text.secondary }]}>
                  📧 {customer.email}
                </Text>
                <Text style={[styles.contactItem, { color: theme.colors.text.secondary }]}>
                  📞 {customer.phone}
                </Text>
              </View>
            </View>

            <View style={styles.customerFooter}>
              <Text style={[styles.lastInvoice, { color: theme.colors.text.secondary }]}>
                Última factura: {customer.lastInvoice}
              </Text>
              
              <TouchableOpacity style={styles.moreButton}>
                <Text style={[styles.moreText, { color: theme.colors.text.secondary }]}>⋯</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  customerDocument: {
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerDetails: {
    marginBottom: 12,
  },
  contactInfo: {
    gap: 4,
  },
  contactItem: {
    fontSize: 14,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastInvoice: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
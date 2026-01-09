// Customer Picker Component - matches SwiftUI CustomerPicker functionality
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Customer } from '../../types/customer';

// Matches SwiftUI CustomerSearchScope enum
export enum CustomerSearchScope {
  Name = 'Nombre',
  DUI = 'DUI',
  NIT = 'NIT',
  NRC = 'NRC',
}

interface CustomerPickerProps {
  visible: boolean;
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  visible,
  customers,
  onSelect,
  onClose,
}) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [searchScope, setSearchScope] = useState<CustomerSearchScope>(CustomerSearchScope.Name);

  // Filter customers based on search criteria (matches SwiftUI filteredCustomers)
  const filteredCustomers = useMemo(() => {
    if (!searchText.trim()) {
      return customers;
    }

    const searchLower = searchText.toLowerCase();
    
    return customers.filter(customer => {
      switch (searchScope) {
        case CustomerSearchScope.Name:
          return customer.firstName.toLowerCase().includes(searchLower) ||
                 customer.lastName.toLowerCase().includes(searchLower);
        case CustomerSearchScope.DUI:
          return customer.nationalId.toLowerCase().includes(searchLower);
        case CustomerSearchScope.NIT:
          return customer.nit?.toLowerCase().includes(searchLower) || false;
        case CustomerSearchScope.NRC:
          return customer.nrc?.toLowerCase().includes(searchLower) || false;
        default:
          return false;
      }
    });
  }, [customers, searchText, searchScope]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    onSelect(customer);
    setSearchText('');
    setSearchScope(CustomerSearchScope.Name);
  };

  // Handle close
  const handleClose = () => {
    setSearchText('');
    setSearchScope(CustomerSearchScope.Name);
    onClose();
  };

  // Generate customer initials (matches SwiftUI customer.initials)
  const getCustomerInitials = (customer: Customer): string => {
    const firstInitial = customer.firstName.charAt(0).toUpperCase();
    const lastInitial = customer.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  // Generate customer color (simplified version of SwiftUI customer.color)
  const getCustomerColor = (customer: Customer): string => {
    // Simple hash-based color generation
    const hash = customer.firstName.charCodeAt(0) + customer.lastName.charCodeAt(0);
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#FF6348', '#2ED573', '#3742FA', '#A55EEA', '#26DE81'
    ];
    return colors[hash % colors.length];
  };

  // Format phone number for display
  const formatPhone = (phone: string): string => {
    // Simple phone formatting
    return phone?.replace(/(\d{4})(\d{4})/, '$1-$2') || '';
  };

  // Render customer item (matches SwiftUI CustomerPickerItem)
  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const initials = getCustomerInitials(item);
    const customerColor = getCustomerColor(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.customerItem,
          { backgroundColor: theme.colors.surface.primary }
        ]}
        onPress={() => handleCustomerSelect(item)}
        activeOpacity={0.7}
      >
        {/* Avatar Circle */}
        <View style={[styles.avatar, { backgroundColor: customerColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.customerEmail, { color: theme.colors.text.secondary }]}>
            {item.email}
          </Text>
        </View>

        {/* Contact Details */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactText, { color: theme.colors.text.secondary }]}>
            {formatPhone(item.phone)}
          </Text>
          <Text style={[styles.contactText, { color: theme.colors.text.secondary }]}>
            {item.nationalId}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render search scope picker
  const renderSearchScope = (scope: CustomerSearchScope) => {
    const isSelected = searchScope === scope;
    
    return (
      <TouchableOpacity
        key={scope}
        style={[
          styles.scopeButton,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface.primary,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border.light,
          }
        ]}
        onPress={() => setSearchScope(scope)}
      >
        <Text style={[
          styles.scopeText,
          {
            color: isSelected ? '#FFFFFF' : theme.colors.text.primary
          }
        ]}>
          {scope}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {searchText ? 'Sin resultados' : 'Sin clientes'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {searchText 
          ? `No se encontraron clientes para "${searchText}"`
          : 'No hay clientes disponibles'
        }
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Seleccione Cliente
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface.primary }]}>
          <View style={[styles.searchBar, { 
            backgroundColor: theme.colors.background.primary,
            borderColor: theme.colors.border.light 
          }]}>
            <Text style={[styles.searchIcon, { color: theme.colors.text.secondary }]}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Buscar Cliente"
              placeholderTextColor={theme.colors.text.secondary}
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />
          </View>
          
          {/* Search Scopes */}
          <View style={styles.scopesContainer}>
            {Object.values(CustomerSearchScope).map(renderSearchScope)}
          </View>
        </View>

        {/* Customers List */}
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          style={styles.customersList}
          contentContainerStyle={styles.customersListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '400',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60, // Match cancel button width
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scopesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  scopeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customersList: {
    flex: 1,
  },
  customersListContent: {
    padding: 20,
    paddingTop: 8,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    lineHeight: 18,
  },
  contactInfo: {
    alignItems: 'flex-end',
  },
  contactText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default CustomerPicker;
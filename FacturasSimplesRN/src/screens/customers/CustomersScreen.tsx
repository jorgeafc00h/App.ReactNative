import React, { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectFilteredCustomers,
  selectCustomerStats,
  selectCustomersLoading,
  selectCustomerSearchTerm,
  selectCustomerFilters,
} from '../../store/selectors/customerSelectors';
import { setSearchTerm, setFilters, setCurrentCustomer, deleteCustomer, fetchCustomers } from '../../store/slices/customerSlice';
import { CustomerType, Customer } from '../../types/customer';
import { CustomersStackParamList } from '../../navigation/types';
import { CustomersListItem } from '../../components/customers/CustomersListItem';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CustomersNavigation = StackNavigationProp<CustomersStackParamList, 'CustomersList'>;

type FilterKey = 'all' | 'business' | 'individual';

const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'business', label: 'Empresas' },
  { key: 'individual', label: 'Personas' },
];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString();
};

export const CustomersScreen: React.FC = () => {
  const navigation = useNavigation<CustomersNavigation>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const customers = useAppSelector(selectFilteredCustomers);
  const stats = useAppSelector(selectCustomerStats);
  const loading = useAppSelector(selectCustomersLoading);
  const searchTerm = useAppSelector(selectCustomerSearchTerm);
  const filters = useAppSelector(selectCustomerFilters);
  const { currentCompany } = useAppSelector(state => state.companies);
  const { invoices } = useAppSelector(state => state.invoices);

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Set company filter when current company changes
  useEffect(() => {
    if (currentCompany?.id && filters.companyId !== currentCompany.id) {
      console.log('CustomersScreen: Setting company filter to:', currentCompany.id);
      dispatch(setFilters({ companyId: currentCompany.id }));
    }
  }, [currentCompany?.id, filters.companyId, dispatch]);

  // Configure navigation header with toolbar buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleFilters}
          >
            <Ionicons 
              name={showFilters ? 'filter' : 'filter-outline'} 
              size={22} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButtonPrimary, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddCustomer}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme, showFilters]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  // Translate the current filter selection into a tab value to mirror Swift UI chips
  const activeFilter = useMemo<FilterKey>(() => {
    const selectedTypes = filters.customerType ?? [];
    if (selectedTypes.length === 0) {
      return 'all';
    }
    if (
      selectedTypes.includes(CustomerType.Business) &&
      !selectedTypes.includes(CustomerType.Individual)
    ) {
      return 'business';
    }
    if (
      selectedTypes.includes(CustomerType.Individual) &&
      !selectedTypes.includes(CustomerType.Business)
    ) {
      return 'individual';
    }
    return 'all';
  }, [filters.customerType]);

  const handleSelectCustomer = (customerId: string) => {
    dispatch(setCurrentCustomer(customerId));
    navigation.navigate('CustomerDetail', { customerId });
  };

  const handleSearchChange = (text: string) => {
    dispatch(setSearchTerm(text));
  };

  const handleAddCustomer = () => {
    navigation.navigate('CustomerForm', { mode: 'create' });
  };

  const applyFilter = (filterKey: FilterKey) => {
    switch (filterKey) {
      case 'business':
        dispatch(setFilters({ customerType: [CustomerType.Business] }));
        break;
      case 'individual':
        dispatch(setFilters({ customerType: [CustomerType.Individual] }));
        break;
      default:
        dispatch(setFilters({ customerType: [] }));
        break;
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // Check if customer has associated invoices (matching Swift logic)
    const customerInvoices = invoices.filter(invoice => invoice.customerId === customer.id);
    
    if (customerInvoices.length > 0) {
      Alert.alert(
        'Error',
        `No se puede eliminar un cliente con ${customerInvoices.length} facturas asociadas`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Eliminar Cliente',
      `¿Está seguro que desea eliminar el cliente: ${customer.businessName || `${customer.firstName} ${customer.lastName}`} de manera permanente?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCustomer(customer.id));
          },
        },
      ]
    );
  };

  const renderRightActions = (customer: Customer) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteCustomer(customer)}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        rightThreshold={40}
      >
        <CustomersListItem
          customer={item}
          onPress={() => handleSelectCustomer(item.id)}
        />
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name="people" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Clientes</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        Los nuevos clientes aparecerán aquí.
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddCustomer}
      >
        <Text style={styles.emptyButtonText}>Agregar Cliente</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {currentCompany ? currentCompany.nombreComercial : 'Clientes'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {stats.total} clientes registrados
          </Text>
        </View>
      </View>

      {/* Collapsible Summary & Search Section */}
      {showFilters && (
        <>
          <View
            style={[
              styles.summaryContainer,
              { borderColor: theme.colors.border.light },
            ]}
          >
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{stats.total}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{stats.actives}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Activos</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{stats.businesses}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Empresas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{stats.withRetention}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Retención</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.colors.surface.primary,
                  borderColor: theme.colors.border.light,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.colors.text.secondary} style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar por nombre, email o documento..."
                placeholderTextColor={theme.colors.text.secondary}
                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                value={searchTerm}
                onChangeText={handleSearchChange}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.filterRow}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? theme.colors.primary : 'transparent',
                      borderColor: isActive ? theme.colors.primary : theme.colors.border.light,
                    },
                  ]}
                  onPress={() => applyFilter(tab.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? '#FFFFFF' : theme.colors.text.secondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Collapsed indicator bar */}
      {!showFilters && (
        <TouchableOpacity 
          style={[styles.collapsedBar, { backgroundColor: theme.colors.surface.secondary }]}
          onPress={toggleFilters}
        >
          <View style={styles.collapsedContent}>
            <Ionicons name="funnel-outline" size={14} color={theme.colors.text.secondary} />
            <Text style={[styles.collapsedText, { color: theme.colors.text.secondary }]}>
              {searchTerm ? `Búsqueda: "${searchTerm}"` : `${activeFilter === 'all' ? 'Todos' : activeFilter === 'business' ? 'Empresas' : 'Personas'}`}
            </Text>
            <Text style={[styles.collapsedCount, { color: theme.colors.primary }]}>
              {customers.length} resultados
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              console.log('🔄 Refreshing customers list...');
              dispatch(fetchCustomers({ refresh: true }));
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  collapsedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedText: {
    fontSize: 13,
  },
  collapsedCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  deleteButton: {
    width: 70,
    height: '90%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default CustomersScreen;

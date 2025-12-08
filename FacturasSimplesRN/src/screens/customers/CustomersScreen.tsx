import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
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
import { setSearchTerm, setFilters, setCurrentCustomer } from '../../store/slices/customerSlice';
import { CustomerType, Customer } from '../../types/customer';
import { CustomersStackParamList } from '../../navigation/types';

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

  const renderCustomer = ({ item }: { item: Customer }) => {
    const isBusiness = item.customerType === CustomerType.Business;
    const displayName = item.businessName || `${item.firstName} ${item.lastName}`;
    const accentColor = isBusiness ? '#3B82F6' : '#10B981';

    return (
      <TouchableOpacity
        style={[styles.customerCard, { backgroundColor: theme.colors.surface.primary }]}
        activeOpacity={0.7}
        onPress={() => handleSelectCustomer(item.id)}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.customerNameRow}>
              <Text style={styles.typeIcon}>{isBusiness ? '🏢' : '👤'}</Text>
              <Text style={[styles.customerName, { color: theme.colors.text.primary }]}>
                {displayName}
              </Text>
            </View>
            <Text style={[styles.customerDocument, { color: theme.colors.text.secondary }]}>
              {`${item.documentType}: ${item.nationalId}`}
            </Text>
          </View>

          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${accentColor}20` },
            ]}
          >
            <Text style={[styles.typeText, { color: accentColor }]}>
              {isBusiness ? 'Empresa' : 'Persona'}
            </Text>
          </View>
        </View>

        <View style={styles.customerDetails}>
          <Text style={[styles.contactItem, { color: theme.colors.text.secondary }]}>📧 {item.email}</Text>
          <Text style={[styles.contactItem, { color: theme.colors.text.secondary }]}>📞 {item.phone}</Text>
          {item.city ? (
            <Text style={[styles.contactItem, { color: theme.colors.text.secondary }]}>📍 {item.city}</Text>
          ) : null}
        </View>

        <View style={styles.customerFooter}>
          <Text style={[styles.lastUpdated, { color: theme.colors.text.secondary }]}>
            Actualizado {formatDate(item.updatedAt)}
          </Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleSelectCustomer(item.id)}
          >
            <Text style={[styles.moreText, { color: theme.colors.text.secondary }]}>⋯</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Sin clientes</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        Agrega un nuevo cliente para comenzar a facturar
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { borderColor: theme.colors.primary }]}
        onPress={handleAddCustomer}
      >
        <Text style={[styles.emptyButtonText, { color: theme.colors.primary }]}>Agregar cliente</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Base de clientes</Text>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Clientes</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddCustomer}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.summaryContainer,
          { borderColor: theme.colors.border.light },
        ]}
      >
        <View>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Total</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{stats.total}</Text>
        </View>
        <View>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Activos</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{stats.actives}</Text>
        </View>
        <View>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Empresas</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{stats.businesses}</Text>
        </View>
        <View>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Retención</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {stats.withRetention}
          </Text>
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
          <Text style={[styles.searchIcon, { color: theme.colors.text.secondary }]}>🔍</Text>
          <TextInput
            placeholder="Buscar por nombre, email o documento..."
            placeholderTextColor={theme.colors.text.secondary}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            value={searchTerm}
            onChangeText={handleSearchChange}
          />
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
              // TODO: integrate sync workflow when backend is available
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  customerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
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
  },
  customerDocument: {
    fontSize: 14,
  },
  typeBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  customerDetails: {
    marginTop: 12,
    gap: 4,
  },
  contactItem: {
    fontSize: 14,
  },
  customerFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 24,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomersScreen;

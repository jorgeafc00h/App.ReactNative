import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedCompany, setDefaultCompany, deleteCompany } from '../../store/slices/companySlice';
import { Company, CompanyEnvironment } from '../../types/company';
import { CompaniesListItem } from '../../components/companies/CompaniesListItem';

type CompaniesNavigation = StackNavigationProp<any>;

const CompaniesScreen: React.FC = () => {
  const navigation = useNavigation<CompaniesNavigation>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { companies, currentCompany, loading } = useAppSelector(state => state.companies);
  const { invoices } = useAppSelector(state => state.invoices);

  const [searchText, setSearchText] = useState('');
  const [showTestEnvironments, setShowTestEnvironments] = useState(true);

  // Filter companies based on search and environment toggle (matching Swift logic)
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Filter by test environment toggle
    if (!showTestEnvironments) {
      filtered = filtered.filter(company => company.environment !== CompanyEnvironment.Development);
    }

    // Filter by search text (NIT, NRC, nombre)
    if (searchText.trim()) {
      const searchTerm = searchText.toLowerCase();
      filtered = filtered.filter(company => 
        (company.nit?.toLowerCase().includes(searchTerm)) ||
        (company.nrc?.toLowerCase().includes(searchTerm)) ||
        company.nombre.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [companies, searchText, showTestEnvironments]);

  const handleSelectCompany = (company: Company) => {
    dispatch(setSelectedCompany(company.id));
    navigation.navigate('CompanyDetails', { companyId: company.id });
  };

  const handleSetAsDefault = (company: Company) => {
    Alert.alert(
      '¿Desea establecer esta empresa como predeterminada?',
      'Esta empresa se utilizará por defecto para gestionar facturas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            dispatch(setDefaultCompany(company.id));
            dispatch(setSelectedCompany(company.id));
          }
        },
      ]
    );
  };

  const handleAddCompany = () => {
    // Navigate to company creation screen
    navigation.navigate('CreateCompany');
  };

  const handleDeleteCompany = (company: Company) => {
    // Check if company has associated invoices (matching Swift logic)
    const companyInvoices = invoices.filter(invoice => invoice.companyId === company.id);
    
    if (companyInvoices.length > 0) {
      Alert.alert(
        'No se puede eliminar la empresa',
        `La empresa tiene ${companyInvoices.length} facturas asociadas y no puede ser eliminada. Elimine todas las facturas primero.`,
        [{ text: 'Aceptar', style: 'default' }]
      );
      return;
    }

    // Don't allow deleting the currently selected company
    if (currentCompany?.id === company.id) {
      Alert.alert(
        'Error',
        'No se puede eliminar la empresa actualmente seleccionada',
        [{ text: 'Aceptar', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      '¿Está seguro que desea eliminar esta empresa?',
      'Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCompany(company.id));
          },
        },
      ]
    );
  };

  const renderCompanyItem = ({ item }: { item: Company }) => {
    const isSelected = currentCompany?.id === item.id;

    return (
      <CompaniesListItem
        company={item}
        isSelected={isSelected}
        onPress={() => handleSelectCompany(item)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name="business" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Empresas</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        El primer paso de configuración es agregar una empresa luego crear clientes.
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddCompany}
      >
        <Text style={styles.emptyButtonText}>Agregar Empresa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Empresas
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={() => setShowTestEnvironments(!showTestEnvironments)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={theme.colors.text.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddCompany}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
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
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            placeholder="Buscar por NIT, NRC o nombre..."
            placeholderTextColor={theme.colors.text.secondary}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {!showTestEnvironments && (
        <View style={styles.filterNotice}>
          <Text style={[styles.filterNoticeText, { color: theme.colors.text.secondary }]}>
            Mostrando solo empresas en ambiente productivo
          </Text>
        </View>
      )}

      <FlatList
        data={filteredCompanies}
        keyExtractor={(item) => item.id}
        renderItem={renderCompanyItem}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterNotice: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterNoticeText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
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
});

export default CompaniesScreen;
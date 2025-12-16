import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSearchTerm, setInvoiceFilters } from '../../store/slices/invoiceSlice';
import { Invoice, InvoiceStatus, InvoiceType } from '../../types/invoice';
import { InvoicesStackParamList } from '../../navigation/types';

type InvoicesScreenNavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoicesList'>;

// Search scope options matching Swift InvoiceSearchScope
enum InvoiceSearchScope {
  Nombre = 'Nombre',
  NIT = 'NIT',
  DUI = 'DUI',
  NRC = 'NRC',
  Factura = 'Factura',
  CCF = 'CCF',
}

// Filter options
type FilterStatus = 'Todas' | 'Completadas' | 'Pendientes' | 'Anuladas';

interface SearchSuggestion {
  id: string;
  text: string;
  icon: string;
  category: string;
  secondaryText?: string;
}

export const InvoicesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<InvoicesScreenNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { invoices, loading } = useAppSelector(state => state.invoices);
  const { currentCompany } = useAppSelector(state => state.companies);

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [searchScope, setSearchScope] = useState<InvoiceSearchScope>(InvoiceSearchScope.Nombre);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('Todas');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Search scopes for the horizontal picker
  const searchScopes = Object.values(InvoiceSearchScope);
  
  // Filter tabs
  const filterTabs: FilterStatus[] = ['Todas', 'Completadas', 'Pendientes', 'Anuladas'];

  // Load invoices on mount - no async fetch needed, invoices come from redux store
  useEffect(() => {
    // Filter invoices by company if needed
    if (currentCompany?.id) {
      dispatch(setInvoiceFilters({ companyId: currentCompany.id }));
    }
  }, [dispatch, currentCompany?.id]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulated refresh - in real implementation, would fetch from API
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Get color for search scope
  const getColorForScope = (scope: InvoiceSearchScope): string => {
    switch (scope) {
      case InvoiceSearchScope.Nombre:
        return '#3B82F6';
      case InvoiceSearchScope.NIT:
        return '#10B981';
      case InvoiceSearchScope.DUI:
        return '#8B5CF6';
      case InvoiceSearchScope.NRC:
        return '#F59E0B';
      case InvoiceSearchScope.Factura:
        return '#EF4444';
      case InvoiceSearchScope.CCF:
        return '#06B6D4';
      default:
        return theme.colors.primary;
    }
  };

  // Get icon for search scope
  const getIconForScope = (scope: InvoiceSearchScope): string => {
    switch (scope) {
      case InvoiceSearchScope.Nombre:
        return '👤';
      case InvoiceSearchScope.NIT:
        return '🏢';
      case InvoiceSearchScope.DUI:
        return '🪪';
      case InvoiceSearchScope.NRC:
        return '📋';
      case InvoiceSearchScope.Factura:
        return '📄';
      case InvoiceSearchScope.CCF:
        return '📑';
      default:
        return '🔍';
    }
  };

  // Load search suggestions based on scope and text
  const loadSearchSuggestions = useCallback(async () => {
    if (searchText.trim() === '') {
      setSearchSuggestions([]);
      return;
    }

    const suggestions: SearchSuggestion[] = [];
    const searchLower = searchText.toLowerCase();

    (invoices || []).forEach((invoice: Invoice) => {
      let matches = false;
      let text = '';
      let secondaryText = '';

      switch (searchScope) {
        case InvoiceSearchScope.Factura:
          if (invoice.invoiceType === InvoiceType.Factura && 
              invoice.invoiceNumber.toLowerCase().includes(searchLower)) {
            matches = true;
            text = invoice.invoiceNumber;
            secondaryText = new Date(invoice.date).toLocaleDateString();
          }
          break;
        case InvoiceSearchScope.CCF:
          if (invoice.invoiceType === InvoiceType.CCF && 
              invoice.invoiceNumber.toLowerCase().includes(searchLower)) {
            matches = true;
            text = invoice.invoiceNumber;
            secondaryText = new Date(invoice.date).toLocaleDateString();
          }
          break;
        default:
          if (invoice.invoiceNumber.toLowerCase().includes(searchLower)) {
            matches = true;
            text = invoice.invoiceNumber;
          }
      }

      if (matches && suggestions.length < 5) {
        suggestions.push({
          id: invoice.id,
          text,
          icon: getIconForScope(searchScope),
          category: searchScope,
          secondaryText,
        });
      }
    });

    setSearchSuggestions(suggestions);
  }, [searchText, searchScope, invoices]);

  // Update suggestions when search text or scope changes
  useEffect(() => {
    loadSearchSuggestions();
  }, [searchText, searchScope, loadSearchSuggestions]);

  // Filter invoices based on search and filter
  const filteredInvoices = useMemo(() => {
    let result = [...(invoices || [])];

    // Apply status filter
    switch (selectedFilter) {
      case 'Completadas':
        result = result.filter(inv => inv.status === InvoiceStatus.Completada);
        break;
      case 'Pendientes':
        result = result.filter(inv => inv.status === InvoiceStatus.Nueva || inv.status === InvoiceStatus.Sincronizando);
        break;
      case 'Anuladas':
        result = result.filter(inv => inv.status === InvoiceStatus.Anulada);
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(inv => {
        switch (searchScope) {
          case InvoiceSearchScope.Factura:
            return inv.invoiceType === InvoiceType.Factura && 
                   inv.invoiceNumber.toLowerCase().includes(searchLower);
          case InvoiceSearchScope.CCF:
            return inv.invoiceType === InvoiceType.CCF && 
                   inv.invoiceNumber.toLowerCase().includes(searchLower);
          default:
            return inv.invoiceNumber.toLowerCase().includes(searchLower);
        }
      });
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [invoices, selectedFilter, searchText, searchScope]);

  // Get status color
  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Completada:
        return '#10B981';
      case InvoiceStatus.Nueva:
      case InvoiceStatus.Sincronizando:
        return '#F59E0B';
      case InvoiceStatus.Anulada:
        return '#EF4444';
      case InvoiceStatus.Modificada:
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  // Get status text
  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return 'Nueva';
      case InvoiceStatus.Sincronizando:
        return 'Sincronizando';
      case InvoiceStatus.Completada:
        return 'Completada';
      case InvoiceStatus.Anulada:
        return 'Anulada';
      case InvoiceStatus.Modificada:
        return 'Modificada';
      default:
        return 'Desconocido';
    }
  };

  // Get invoice type icon (matches Swift getTypeIcon)
  const getTypeIcon = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura:
        return '📄';
      case InvoiceType.CCF:
        return '📋';
      case InvoiceType.NotaCredito:
        return '➖';
      case InvoiceType.NotaDebito:
        return '➕';
      case InvoiceType.NotaRemision:
        return '🚚';
      case InvoiceType.SujetoExcluido:
        return '🔒';
      case InvoiceType.ComprobanteLiquidacion:
        return '📑';
      case InvoiceType.FacturaExportacion:
        return '🌍';
      default:
        return '📄';
    }
  };

  // Get invoice type name
  const getTypeName = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura:
        return 'Factura';
      case InvoiceType.CCF:
        return 'CCF';
      case InvoiceType.NotaCredito:
        return 'Nota Crédito';
      case InvoiceType.NotaDebito:
        return 'Nota Débito';
      case InvoiceType.NotaRemision:
        return 'Nota Remisión';
      case InvoiceType.SujetoExcluido:
        return 'Sujeto Excluido';
      case InvoiceType.ComprobanteLiquidacion:
        return 'Comprobante Liquidación';
      case InvoiceType.FacturaExportacion:
        return 'Factura Exportación';
      default:
        return 'Documento';
    }
  };

  // Navigate to invoice detail
  const handleInvoicePress = (invoice: Invoice) => {
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
  };

  // Navigate to add invoice
  const handleAddInvoice = () => {
    navigation.navigate('AddInvoice');
  };

  // Select suggestion
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
    setShowSearchSuggestions(false);
    navigation.navigate('InvoiceDetail', { invoiceId: suggestion.id });
  };

  // Render invoice list item (matches Swift InvoiceListItem)
  const renderInvoiceItem = (invoice: Invoice) => {
    const statusColor = getStatusColor(invoice.status);
    const totalAmount = invoice.totals?.totalAmount || invoice.totalAmountIncludingTax || 0;
    const totalItems = invoice.items?.length || invoice.totals?.totalItems || 0;

    return (
      <TouchableOpacity
        key={invoice.id}
        style={[styles.invoiceCard, { backgroundColor: theme.colors.surface.primary }]}
        activeOpacity={0.7}
        onPress={() => handleInvoicePress(invoice)}
      >
        {/* Invoice Header - Number and Date */}
        <View style={styles.invoiceHeader}>
          <Text style={[styles.invoiceNumber, { color: theme.colors.text.primary }]}>
            #  {invoice.invoiceNumber}
          </Text>
          <Text style={[styles.invoiceDate, { color: theme.colors.text.secondary }]}>
            {new Date(invoice.date).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Customer Info and Amount */}
        <View style={styles.customerRow}>
          <View style={[styles.customerAvatar, { backgroundColor: theme.colors.primary + '30' }]}>
            <Text style={[styles.customerInitials, { color: theme.colors.primary }]}>
              {getTypeIcon(invoice.invoiceType)}
            </Text>
          </View>
          
          <Text style={[styles.customerName, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {getTypeName(invoice.invoiceType)}
          </Text>
          
          <Text style={[styles.totalAmount, { color: theme.colors.text.primary }]}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Invoice Footer - Type and Status */}
        <View style={styles.invoiceFooter}>
          <View style={styles.footerLeft}>
            <Text style={[styles.invoiceType, { color: theme.colors.text.secondary }]}>
              {getTypeName(invoice.invoiceType)}
            </Text>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusText(invoice.status)}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={[styles.totalItems, { color: theme.colors.text.secondary }]}>
            Total Productos: {totalItems}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Facturas
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleAddInvoice}
        >
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.light }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder={`Buscar por ${searchScope}`}
            placeholderTextColor={theme.colors.text.secondary}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Scope Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scopeContainer}
        contentContainerStyle={styles.scopeContent}
      >
        {searchScopes.map((scope) => (
          <TouchableOpacity
            key={scope}
            style={[
              styles.scopeTab,
              { 
                borderColor: searchScope === scope ? getColorForScope(scope) : theme.colors.border.light,
                backgroundColor: searchScope === scope ? getColorForScope(scope) + '15' : 'transparent',
              }
            ]}
            onPress={() => setSearchScope(scope)}
          >
            <Text
              style={[
                styles.scopeText,
                { color: searchScope === scope ? getColorForScope(scope) : theme.colors.text.secondary }
              ]}
            >
              {scope}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Suggestions Dropdown */}
      {showSearchSuggestions && searchSuggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border.light }]}>
          {searchSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionSelect(suggestion)}
            >
              <View style={[styles.suggestionIconContainer, { backgroundColor: getColorForScope(searchScope) + '15' }]}>
                <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={[styles.suggestionText, { color: theme.colors.text.primary }]}>
                  {suggestion.text}
                </Text>
                {suggestion.secondaryText && (
                  <Text style={[styles.suggestionSecondary, { color: theme.colors.text.secondary }]}>
                    {suggestion.secondaryText}
                  </Text>
                )}
              </View>
              <View style={[styles.suggestionCategory, { backgroundColor: getColorForScope(searchScope) + '15' }]}>
                <Text style={[styles.suggestionCategoryText, { color: getColorForScope(searchScope) }]}>
                  {suggestion.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterTabs.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { 
                borderColor: theme.colors.border.light,
                backgroundColor: selectedFilter === filter ? theme.colors.primary : 'transparent',
              }
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === filter ? 'white' : theme.colors.text.secondary }
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoices List */}
      <ScrollView 
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              Cargando facturas...
            </Text>
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
              No hay facturas
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
              {searchText 
                ? 'No se encontraron facturas con los criterios de búsqueda'
                : 'Comienza creando tu primera factura'}
            </Text>
            {!searchText && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddInvoice}
              >
                <Text style={styles.emptyButtonText}>Crear Factura</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filteredInvoices.map(renderInvoiceItem)}
            <View style={styles.bottomSpacing} />
          </>
        )}
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
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    fontSize: 16,
    padding: 4,
  },
  scopeContainer: {
    marginBottom: 8,
    maxHeight: 44,
  },
  scopeContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  scopeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  scopeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionIcon: {
    fontSize: 14,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  suggestionCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  suggestionCategoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  filterContainer: {
    marginBottom: 16,
    maxHeight: 44,
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
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  invoiceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 4,
  },
  invoiceNumber: {
    fontSize: 17,
    fontWeight: '600',
  },
  invoiceDate: {
    fontSize: 14,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  customerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerInitials: {
    fontSize: 14,
  },
  customerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  invoiceType: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalItems: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});
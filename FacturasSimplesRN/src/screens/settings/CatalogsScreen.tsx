import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import { syncCatalogs, setSearchTerm } from '../../store/slices/catalogSlice';
import { Catalog } from '../../types/catalog';
import { RootStackParamList } from '../../types';

type CatalogsNavigationProp = StackNavigationProp<RootStackParamList>;

const LAST_SYNC_KEY = 'catalog_last_sync_date';

/**
 * CatalogsScreen - Matches Swift CatalogsView
 * Displays government catalogs from Hacienda with sync functionality
 */
export const CatalogsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<CatalogsNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { catalogs, loading, error } = useAppSelector(state => state.catalogs);
  
  const [searchText, setSearchText] = useState('');
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load last sync date on mount
  useEffect(() => {
    loadLastSyncDate();
  }, []);

  const loadLastSyncDate = async () => {
    try {
      const storedDate = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (storedDate) {
        setLastSyncDate(new Date(storedDate));
      }
    } catch (error) {
      console.error('Error loading last sync date:', error);
    }
  };

  const saveLastSyncDate = async (date: Date) => {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, date.toISOString());
      setLastSyncDate(date);
    } catch (error) {
      console.error('Error saving last sync date:', error);
    }
  };

  // Filter catalogs based on search text - matches Swift filteredCatalogs
  const filteredCatalogs = useMemo(() => {
    // Filter out invalid catalogs (matching Swift logic)
    const validCatalogs = catalogs.filter(catalog => 
      catalog.name && 
      catalog.name.trim().length > 0 &&
      catalog.options && 
      catalog.options.length > 0
    );

    if (!searchText.trim()) {
      return validCatalogs;
    }

    const term = searchText.toLowerCase();
    return validCatalogs.filter(catalog =>
      catalog.name.toLowerCase().includes(term)
    );
  }, [catalogs, searchText]);

  // Sync catalogs from API - matches Swift syncCatalogs
  const handleSyncCatalogs = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await dispatch(syncCatalogs({ force: true })).unwrap();
      await saveLastSyncDate(new Date());
      Alert.alert('Sincronización exitosa', 'Los catálogos se han actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', `Error al sincronizar catálogos: ${error.message || error}`);
    } finally {
      setIsSyncing(false);
      setRefreshing(false);
    }
  }, [dispatch, isSyncing]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    handleSyncCatalogs();
  }, [handleSyncCatalogs]);

  // Navigate to catalog detail
  const handleCatalogPress = (catalog: Catalog) => {
    navigation.navigate('CatalogDetail', { catalogId: catalog.id, catalogName: catalog.name });
  };

  // Format relative date - matches Swift formattedDate
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Render header with sync info - matches Swift HeaderView
  const renderHeader = () => (
    <View style={[styles.headerSection, { backgroundColor: theme.colors.surface.primary }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Catálogos Oficiales
          </Text>
          {lastSyncDate ? (
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Última sincronización: {formatRelativeDate(lastSyncDate)}
            </Text>
          ) : (
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
              Sin sincronizar
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.syncButton,
            { backgroundColor: theme.colors.primary },
            isSyncing && styles.syncButtonDisabled
          ]}
          onPress={handleSyncCatalogs}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="sync" size={16} color="white" />
              <Text style={styles.syncButtonText}>Sincronizar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render search bar - matches Swift SearchBarView
  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.secondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Buscar catálogos..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={[styles.clearButton, { color: theme.colors.primary }]}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render catalog card - matches Swift CatalogCardView
  const renderCatalogCard = (catalog: Catalog, index: number) => (
    <TouchableOpacity
      key={catalog.id}
      style={[styles.catalogCard, { backgroundColor: theme.colors.surface.primary }]}
      onPress={() => handleCatalogPress(catalog)}
      activeOpacity={0.7}
    >
      <View style={[styles.catalogIcon, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name="list" size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.catalogInfo}>
        <Text 
          style={[styles.catalogName, { color: theme.colors.text.primary }]}
          numberOfLines={2}
        >
          {catalog.name || 'Catálogo sin nombre'}
        </Text>
        <Text style={[styles.catalogOptions, { color: theme.colors.text.secondary }]}>
          {catalog.options?.length || 0} opciones
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  // Render empty state - matches Swift EmptyStateView
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.background.secondary }]}>
        <Ionicons name="file-tray-outline" size={64} color={theme.colors.text.tertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
        No hay catálogos disponibles
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.text.tertiary }]}>
        Presiona 'Sincronizar' para obtener los catálogos oficiales de Hacienda
      </Text>
    </View>
  );

  // Render loading state - matches Swift LoadingView
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
        Cargando catálogos...
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Navigation Header */}
      <View style={[styles.navHeader, { 
        backgroundColor: theme.colors.surface.primary,
        borderBottomColor: theme.colors.border.light 
      }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.navTitle, { color: theme.colors.text.primary }]}>
          Catálogos Hacienda
        </Text>
        
        <TouchableOpacity 
          onPress={handleSyncCatalogs}
          disabled={isSyncing}
          style={styles.navSyncButton}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="sync" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Header with sync info */}
      {renderHeader()}

      {/* Loading State */}
      {loading && filteredCatalogs.length === 0 ? (
        renderLoadingState()
      ) : (
        <>
          {/* Search Bar */}
          {renderSearchBar()}

          {/* Catalogs List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          >
            {filteredCatalogs.length === 0 ? (
              renderEmptyState()
            ) : (
              filteredCatalogs.map((catalog, index) => renderCatalogCard(catalog, index))
            )}
            
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </>
      )}

      {/* Error display */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20' }]}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  navSyncButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  catalogIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  catalogInfo: {
    flex: 1,
  },
  catalogName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  catalogOptions: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default CatalogsScreen;

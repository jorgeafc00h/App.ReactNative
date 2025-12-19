import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useAppSelector } from '../../store';
import { CatalogOption } from '../../types/catalog';
import { RootStackParamList } from '../../types';

type CatalogDetailNavigationProp = StackNavigationProp<RootStackParamList, 'CatalogDetail'>;
type CatalogDetailRouteProp = RouteProp<RootStackParamList, 'CatalogDetail'>;

/**
 * CatalogDetailScreen - Matches Swift CatalogDetailView
 * Displays all options for a specific catalog
 */
export const CatalogDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<CatalogDetailNavigationProp>();
  const route = useRoute<CatalogDetailRouteProp>();
  
  const { catalogId, catalogName } = route.params;
  
  const { catalogs } = useAppSelector(state => state.catalogs);
  const catalog = catalogs.find(c => c.id === catalogId);
  
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Get unique departments for filtering (for municipality catalog)
  const departments = useMemo(() => {
    if (!catalog?.options) return [];
    
    const depts = new Set<string>();
    catalog.options.forEach(option => {
      if (option.departamento) {
        depts.add(option.departamento);
      }
    });
    return Array.from(depts).sort();
  }, [catalog]);

  // Filter options based on search and department
  const filteredOptions = useMemo(() => {
    if (!catalog?.options) return [];

    let options = catalog.options;

    // Filter by department if selected
    if (selectedDepartment) {
      options = options.filter(option => option.departamento === selectedDepartment);
    }

    // Filter by search text
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      options = options.filter(option =>
        option.code.toLowerCase().includes(term) ||
        option.description.toLowerCase().includes(term)
      );
    }

    return options;
  }, [catalog, searchText, selectedDepartment]);

  // Render search bar
  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.secondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Buscar por código o descripción..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render department filter (for municipality catalog)
  const renderDepartmentFilter = () => {
    if (departments.length === 0) return null;

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedDepartment && { backgroundColor: theme.colors.primary },
              selectedDepartment && { backgroundColor: theme.colors.surface.secondary }
            ]}
            onPress={() => setSelectedDepartment(null)}
          >
            <Text style={[
              styles.filterChipText,
              !selectedDepartment && { color: 'white' },
              selectedDepartment && { color: theme.colors.text.primary }
            ]}>
              Todos
            </Text>
          </TouchableOpacity>

          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.filterChip,
                selectedDepartment === dept && { backgroundColor: theme.colors.primary },
                selectedDepartment !== dept && { backgroundColor: theme.colors.surface.secondary }
              ]}
              onPress={() => setSelectedDepartment(dept)}
            >
              <Text style={[
                styles.filterChipText,
                selectedDepartment === dept && { color: 'white' },
                selectedDepartment !== dept && { color: theme.colors.text.primary }
              ]}>
                Depto. {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render option item
  const renderOptionItem = ({ item, index }: { item: CatalogOption; index: number }) => (
    <View 
      style={[
        styles.optionCard, 
        { backgroundColor: theme.colors.surface.primary },
        index === filteredOptions.length - 1 && styles.lastCard
      ]}
    >
      <View style={[styles.codeContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        <Text style={[styles.codeText, { color: theme.colors.primary }]}>
          {item.code}
        </Text>
      </View>
      
      <View style={styles.optionInfo}>
        <Text 
          style={[styles.optionDescription, { color: theme.colors.text.primary }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
        {item.departamento && (
          <Text style={[styles.optionDepartment, { color: theme.colors.text.tertiary }]}>
            Departamento: {item.departamento}
          </Text>
        )}
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
        No se encontraron resultados
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.text.tertiary }]}>
        Intenta con otros términos de búsqueda
      </Text>
    </View>
  );

  // Render stats header
  const renderStatsHeader = () => (
    <View style={[styles.statsHeader, { backgroundColor: theme.colors.surface.primary }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.primary }]}>
          {catalog?.options?.length || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
          Total
        </Text>
      </View>
      
      <View style={[styles.statDivider, { backgroundColor: theme.colors.border.light }]} />
      
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.primary }]}>
          {filteredOptions.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
          Filtrados
        </Text>
      </View>
      
      {departments.length > 0 && (
        <>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border.light }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {departments.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Deptos.
            </Text>
          </View>
        </>
      )}
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
        
        <View style={styles.navTitleContainer}>
          <Text 
            style={[styles.navTitle, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {catalogName}
          </Text>
          <Text style={[styles.navSubtitle, { color: theme.colors.text.secondary }]}>
            {catalogId}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* Stats Header */}
      {renderStatsHeader()}

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Department Filter */}
      {renderDepartmentFilter()}

      {/* Options List */}
      <FlatList
        data={filteredOptions}
        renderItem={renderOptionItem}
        keyExtractor={(item, index) => `${item.code}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
      />
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
    width: 40,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
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
  filterContainer: {
    paddingBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastCard: {
    marginBottom: 0,
  },
  codeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionInfo: {
    flex: 1,
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 20,
  },
  optionDepartment: {
    fontSize: 12,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CatalogDetailScreen;

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { deleteProduct } from '../../store/slices/productSlice';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../types/product';
import { debounce } from '../../utils';

export const ProductsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  
  // Redux state
  const products = useSelector((state: RootState) => state.product.products);
  const loading = useSelector((state: RootState) => state.product.loading);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('name');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  // Categories derived from products
  const categories = useMemo(() => {
    const uniqueCategories = ['Todos', ...new Set(products.map(p => p.category || 'Sin categoría'))];
    return uniqueCategories;
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.code?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(product => 
        (product.category || 'Sin categoría') === selectedCategory
      );
    }

    // Sort products
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'date':
          return new Date(b.updatedAt || b.createdAt || '').getTime() - 
                 new Date(a.updatedAt || a.createdAt || '').getTime();
        default:
          return 0;
      }
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Handler functions
  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const handleEditProduct = (product: Product) => {
    navigation.navigate('EditProduct', { productId: product.id });
  };

  const handleViewProduct = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Está seguro que desea eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteProduct(product.id));
          },
        },
      ]
    );
  };

  const handleSearch = (text: string) => {
    debouncedSearch(text);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface.primary }]}
      activeOpacity={0.7}
      onPress={() => handleViewProduct(item)}
    >
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
          {item.code && (
            <Text style={[styles.productCode, { color: theme.colors.text.secondary }]}>
              {item.code}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => showProductActions(item)}
        >
          <Text style={[styles.moreText, { color: theme.colors.text.secondary }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text 
          style={[styles.productDescription, { color: theme.colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}

      <View style={styles.productDetails}>
        {item.category && (
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
              {item.category}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.productFooter}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.colors.text.primary }]}>
            {formatCurrency(item.price)}
          </Text>
          {item.stockQuantity !== undefined && (
            <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>
              Stock: {item.isService ? '∞' : item.stockQuantity}
            </Text>
          )}
        </View>
        
        <View style={styles.taxIndicator}>
          {item.taxIncluded && (
            <Text style={[styles.taxText, { color: theme.colors.success }]}>
              IVA incluido
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const showProductActions = (product: Product) => {
    Alert.alert(
      product.name,
      'Seleccione una acción',
      [
        { text: 'Ver detalles', onPress: () => handleViewProduct(product) },
        { text: 'Editar', onPress: () => handleEditProduct(product) },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteProduct(product) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {searchQuery.trim() ? 'Sin resultados' : 'No hay productos'}
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
        {searchQuery.trim() 
          ? `No se encontraron productos que coincidan con "${searchQuery}"`
          : 'Comience agregando su primer producto o servicio'
        }
      </Text>
      {!searchQuery.trim() && (
        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddProduct}>
          <Text style={styles.emptyButtonText}>Agregar Primer Producto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Productos
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddProduct}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Sort */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border }]}>
          <Text style={[styles.searchIcon, { color: theme.colors.text.secondary }]}>🔍</Text>
          <TextInput
            placeholder="Buscar productos o servicios..."
            placeholderTextColor={theme.colors.text.secondary}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            onChangeText={handleSearch}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.sortButton, { backgroundColor: theme.colors.surface.primary, borderColor: theme.colors.border }]}
          onPress={() => {
            Alert.alert(
              'Ordenar por',
              'Seleccione criterio de ordenamiento',
              [
                { text: 'Nombre', onPress: () => setSortBy('name') },
                { text: 'Precio', onPress: () => setSortBy('price') },
                { text: 'Fecha', onPress: () => setSortBy('date') },
                { text: 'Cancelar', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={[styles.sortText, { color: theme.colors.text.secondary }]}>⌃⌄</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.border }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category 
                  ? { color: 'white' }
                  : { color: theme.colors.text.secondary }
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => {
            // Refresh products if needed
          }}
        />
      )}
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  sortButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  sortText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  productDetails: {
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 14,
  },
  taxIndicator: {
    alignItems: 'flex-end',
  },
  taxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
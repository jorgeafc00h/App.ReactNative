// Product Selector Component - matches SwiftUI ProductPicker functionality
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../types/product';

interface ProductSelectorProps {
  visible: boolean;
  products: Product[];
  onSelect: (products: Product[]) => void;
  onClose: () => void;
  allowMultiple?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  visible,
  products,
  onSelect,
  onClose,
  allowMultiple = true,
}) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const search = searchTerm.toLowerCase();
    return products.filter(product =>
      product.productName.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search)
    );
  }, [products, searchTerm]);

  // Handle product selection
  const handleProductToggle = (product: Product) => {
    if (allowMultiple) {
      setSelectedProducts(prev => {
        const isSelected = prev.some(p => p.id === product.id);
        if (isSelected) {
          return prev.filter(p => p.id !== product.id);
        } else {
          return [...prev, product];
        }
      });
    } else {
      onSelect([product]);
    }
  };

  // Handle confirm selection (for multiple selection)
  const handleConfirmSelection = () => {
    onSelect(selectedProducts);
    setSelectedProducts([]);
    setSearchTerm('');
  };

  // Handle close
  const handleClose = () => {
    setSelectedProducts([]);
    setSearchTerm('');
    onClose();
  };

  // Check if product is selected
  const isProductSelected = (product: Product) => {
    return selectedProducts.some(p => p.id === product.id);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const isSelected = isProductSelected(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          {
            backgroundColor: theme.colors.surface.primary,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border.light,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleProductToggle(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
              {item.productName}
            </Text>
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.selectedText}>✓</Text>
              </View>
            )}
          </View>
          
          {item.description && (
            <Text style={[styles.productDescription, { color: theme.colors.text.secondary }]}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.productDetails}>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            
            {item.hasInventory && (
              <Text style={[styles.productStock, { color: theme.colors.text.secondary }]}>
                Stock: {item.stockQuantity || 0}
              </Text>
            )}
          </View>
          
          {item.taxRate && (
            <Text style={[styles.taxInfo, { color: theme.colors.text.secondary }]}>
              IVA: {(item.taxRate * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {searchTerm ? 'Sin resultados' : 'Sin productos'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {searchTerm 
          ? `No se encontraron productos para "${searchTerm}"`
          : 'No hay productos disponibles'
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
            Seleccionar Productos
          </Text>
          
          {allowMultiple && selectedProducts.length > 0 ? (
            <TouchableOpacity onPress={handleConfirmSelection}>
              <Text style={[styles.confirmButton, { color: theme.colors.primary }]}>
                Agregar ({selectedProducts.length})
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
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
              placeholder="Buscar productos..."
              placeholderTextColor={theme.colors.text.secondary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          style={styles.productsList}
          contentContainerStyle={styles.productsListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
        />

        {/* Selection Summary */}
        {allowMultiple && selectedProducts.length > 0 && (
          <View style={[styles.selectionSummary, { 
            backgroundColor: theme.colors.surface.primary,
            borderTopColor: theme.colors.border.light 
          }]}>
            <Text style={[styles.selectionText, { color: theme.colors.text.primary }]}>
              {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.addSelectedButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleConfirmSelection}
            >
              <Text style={styles.addSelectedButtonText}>
                Agregar Seleccionados
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  confirmButton: {
    fontSize: 16,
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
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  productsList: {
    flex: 1,
  },
  productsListContent: {
    padding: 20,
    paddingTop: 8,
  },
  productItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  productStock: {
    fontSize: 14,
    fontWeight: '500',
  },
  taxInfo: {
    fontSize: 12,
    fontWeight: '500',
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
  selectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addSelectedButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addSelectedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductSelector;
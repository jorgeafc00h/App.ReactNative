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

export const ProductsScreen: React.FC = () => {
  const { theme } = useTheme();

  const products = [
    {
      name: 'Consultoría Técnica',
      category: 'Servicios',
      price: '$150.00',
      stock: '∞',
      code: 'SERV-001',
    },
    {
      name: 'Desarrollo Software',
      category: 'Servicios',
      price: '$2,500.00',
      stock: '∞',
      code: 'SERV-002',
    },
    {
      name: 'Hosting Web',
      category: 'Servicios',
      price: '$25.00',
      stock: '∞',
      code: 'SERV-003',
    },
    {
      name: 'Licencia Software',
      category: 'Productos',
      price: '$599.00',
      stock: '50',
      code: 'PROD-001',
    },
  ];

  const categories = ['Todos', 'Servicios', 'Productos', 'Favoritos'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Productos
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
            placeholder="Buscar productos o servicios..."
            placeholderTextColor={theme.colors.text.secondary}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryTab,
              index === 0 && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.border }
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                index === 0 
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
      <ScrollView style={styles.listContainer}>
        {products.map((product, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.productCard, { backgroundColor: theme.colors.surface.primary }]}
            activeOpacity={0.7}
          >
            <View style={styles.productHeader}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
                  {product.name}
                </Text>
                <Text style={[styles.productCode, { color: theme.colors.text.secondary }]}>
                  {product.code}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.favoriteButton}>
                <Text style={styles.favoriteIcon}>⭐</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productDetails}>
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                  {product.category}
                </Text>
              </View>
            </View>

            <View style={styles.productFooter}>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: theme.colors.text.primary }]}>
                  {product.price}
                </Text>
                <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>
                  Stock: {product.stock}
                </Text>
              </View>
              
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
    paddingHorizontal: 20,
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
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
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
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
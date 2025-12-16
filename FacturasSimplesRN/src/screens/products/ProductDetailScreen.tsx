// Product Detail Screen - View and manage individual products
// Shows comprehensive product information with edit and delete options

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState } from '../../store';
import { deleteProduct } from '../../store/slices/productSlice';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils';
import { BaseScreen } from '../../components/common/BaseScreen';

export const ProductDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  
  const productId = route.params?.productId;
  const product = useSelector((state: RootState) => 
    state.products.products.find(p => p.id === productId)
  );

  if (!product) {
    return (
      <BaseScreen style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            Producto no encontrado
          </Text>
        </View>
      </BaseScreen>
    );
  }

  const handleEdit = () => {
    navigation.navigate('EditProduct', { productId: product.id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Producto',
      `¿Está seguro que desea eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteProduct(product.id));
            navigation.goBack();
            Alert.alert('Producto eliminado', `"${product.name}" ha sido eliminado`);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-SV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <BaseScreen style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.colors.text.secondary }]}>
            ← Volver
          </Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEdit}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: '#E53E3E' }]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Header */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <View style={styles.productHeader}>
            <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
              {product.name}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.typeBadge, { 
                backgroundColor: product.isService ? '#38A169' : '#3182CE' 
              }]}>
                <Text style={styles.typeBadgeText}>
                  {product.isService ? 'Servicio' : 'Producto'}
                </Text>
              </View>
              {product.category && (
                <View style={[styles.categoryBadge, { 
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary
                }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                    {product.category}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {product.description && (
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {product.description}
            </Text>
          )}

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.text.primary }]}>
              {formatCurrency(product.price)}
            </Text>
            {product.taxIncluded && (
              <Text style={[styles.taxInfo, { color: theme.colors.success }]}>
                IVA incluido
              </Text>
            )}
          </View>
        </View>

        {/* Product Details */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Detalles
          </Text>
          
          <View style={styles.detailsList}>
            {product.code && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Código:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {product.code}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Unidad de medida:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {product.unitOfMeasure || 'UNIDAD'}
              </Text>
            </View>

            {product.taxCode && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Código tributario:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {product.taxCode}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Estado:
              </Text>
              <Text style={[
                styles.detailValue, 
                { color: product.isActive ? theme.colors.success : '#E53E3E' }
              ]}>
                {product.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Information (Products only) */}
        {!product.isService && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Inventario
            </Text>
            
            <View style={styles.stockContainer}>
              <View style={styles.stockItem}>
                <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>
                  Stock actual
                </Text>
                <Text style={[styles.stockValue, { color: theme.colors.text.primary }]}>
                  {product.stockQuantity ?? 0}
                </Text>
              </View>

              {product.minimumStock !== undefined && (
                <View style={styles.stockItem}>
                  <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>
                    Stock mínimo
                  </Text>
                  <Text style={[styles.stockValue, { color: theme.colors.text.primary }]}>
                    {product.minimumStock}
                  </Text>
                </View>
              )}

              {product.minimumStock !== undefined && product.stockQuantity !== undefined && (
                <View style={styles.stockStatus}>
                  <Text style={[
                    styles.stockStatusText,
                    { color: product.stockQuantity <= product.minimumStock ? '#E53E3E' : theme.colors.success }
                  ]}>
                    {product.stockQuantity <= product.minimumStock 
                      ? '⚠️ Stock bajo' 
                      : '✅ Stock suficiente'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Información del registro
          </Text>
          
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Creado:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatDate(product.createdAt)}
              </Text>
            </View>

            {product.updatedAt && product.updatedAt !== product.createdAt && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Última modificación:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {formatDate(product.updatedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  taxInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  stockContainer: {
    gap: 16,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 16,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockStatus: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  stockStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});

export default ProductDetailScreen;
// Product Detail Editor Component - matches SwiftUI ProductDetailEditView functionality
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { InvoiceDetailInput, InvoiceType } from '../../types/invoice';

interface ProductDetailEditorProps {
  item: InvoiceDetailInput;
  invoiceType: InvoiceType;
  onUpdate: (updates: Partial<InvoiceDetailInput>) => void;
  onRemove: () => void;
}

export const ProductDetailEditor: React.FC<ProductDetailEditorProps> = ({
  item,
  invoiceType,
  onUpdate,
  onRemove,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate product total
  const productTotal = item.quantity * (item.unitPrice || 0);

  // Handle quantity change with stepper
  const handleQuantityChange = (increment: boolean) => {
    const newQuantity = increment 
      ? Math.min(item.quantity + 1, 100) 
      : Math.max(item.quantity - 1, 1);
    
    onUpdate({ quantity: newQuantity });
  };

  // Handle unit price change
  const handleUnitPriceChange = (text: string) => {
    const price = parseFloat(text) || 0;
    onUpdate({ unitPrice: price });
  };

  // Handle observation change (for ComprobanteLiquidacion)
  const handleObservationChange = (text: string) => {
    onUpdate({ obsItem: text });
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface.primary,
      borderColor: theme.colors.border.light 
    }]}>
      
      {/* Product Header */}
      <View style={styles.productHeader}>
        <View style={styles.productTitleContainer}>
          <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
            {item.productName}
          </Text>
          <TouchableOpacity 
            style={[styles.removeButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={onRemove}
          >
            <Text style={[styles.removeButtonText, { color: theme.colors.error }]}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quantity and Price Controls */}
      <View style={styles.controlsRow}>
        
        {/* Unit Price (editable) */}
        <View style={styles.priceContainer}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            Precio Unit.
          </Text>
          <TouchableOpacity
            style={[styles.priceButton, { borderColor: theme.colors.border.light }]}
            onPress={() => setIsEditing(true)}
          >
            {isEditing ? (
              <TextInput
                style={[styles.priceInput, { color: theme.colors.text.primary }]}
                value={item.unitPrice?.toString() || '0'}
                onChangeText={handleUnitPriceChange}
                onBlur={() => setIsEditing(false)}
                onSubmitEditing={() => setIsEditing(false)}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Text style={[styles.priceText, { color: theme.colors.text.primary }]}>
                {formatCurrency(item.unitPrice || 0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quantity Stepper */}
        <View style={styles.quantityContainer}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            Cantidad
          </Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepperButton, { 
                borderColor: theme.colors.border.light,
                backgroundColor: item.quantity <= 1 ? theme.colors.border.light : theme.colors.surface.primary
              }]}
              onPress={() => handleQuantityChange(false)}
              disabled={item.quantity <= 1}
            >
              <Text style={[styles.stepperButtonText, { 
                color: item.quantity <= 1 ? theme.colors.text.secondary : theme.colors.primary 
              }]}>
                −
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.quantityDisplay, { borderColor: theme.colors.border.light }]}>
              <Text style={[styles.quantityText, { color: theme.colors.text.primary }]}>
                {item.quantity}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.stepperButton, { 
                borderColor: theme.colors.border.light,
                backgroundColor: item.quantity >= 100 ? theme.colors.border.light : theme.colors.surface.primary
              }]}
              onPress={() => handleQuantityChange(true)}
              disabled={item.quantity >= 100}
            >
              <Text style={[styles.stepperButtonText, { 
                color: item.quantity >= 100 ? theme.colors.text.secondary : theme.colors.primary 
              }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Observation Field (for ComprobanteLiquidacion) */}
      {invoiceType === InvoiceType.ComprobanteLiquidacion && (
        <View style={styles.observationContainer}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            Observación del producto
          </Text>
          <TextInput
            style={[styles.observationInput, { 
              color: theme.colors.text.primary,
              borderColor: theme.colors.border.light 
            }]}
            value={item.obsItem || ''}
            onChangeText={handleObservationChange}
            placeholder="Observación del producto"
            placeholderTextColor={theme.colors.text.secondary}
            multiline
          />
        </View>
      )}

      {/* Total Display */}
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>
          Total del producto:
        </Text>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          {formatCurrency(productTotal)}
        </Text>
      </View>

      {/* Item Details */}
      <View style={styles.detailsRow}>
        <Text style={[styles.detailsText, { color: theme.colors.text.secondary }]}>
          {formatCurrency(item.unitPrice || 0)} × {item.quantity}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productHeader: {
    marginBottom: 16,
  },
  productTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
    marginRight: 16,
  },
  quantityContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  priceInput: {
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  priceText: {
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  observationContainer: {
    marginBottom: 12,
  },
  observationInput: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    minHeight: 36,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailsRow: {
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 12,
  },
});

export default ProductDetailEditor;
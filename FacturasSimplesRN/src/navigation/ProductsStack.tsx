import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProductsScreen } from '../screens/products/ProductsScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { AddProductScreen } from '../screens/products/AddProductScreen';
import { ProductsStackParamList } from './types';

const Stack = createStackNavigator<ProductsStackParamList>();

export const ProductsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={AddProductScreen} />
    </Stack.Navigator>
  );
};

export default ProductsStack;
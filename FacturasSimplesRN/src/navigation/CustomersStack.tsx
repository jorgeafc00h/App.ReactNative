import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetail from '../screens/customers/CustomerDetail';
import CustomerForm from '../screens/customers/CustomerForm';
import { CustomersStackParamList } from './types';

const Stack = createStackNavigator<CustomersStackParamList>();

export const CustomersStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
      <Stack.Screen name="CustomerForm" component={CustomerForm} />
    </Stack.Navigator>
  );
};

export default CustomersStack;

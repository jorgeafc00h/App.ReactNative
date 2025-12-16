import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetail from '../screens/customers/CustomerDetail';
import CustomerForm from '../screens/customers/CustomerForm';
import { CustomersStackParamList } from './types';

const Stack = createStackNavigator<CustomersStackParamList>();

export const CustomersStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CustomersList" 
        component={CustomersScreen}
        options={{ title: 'Clientes' }}
      />
      <Stack.Screen 
        name="CustomerDetail" 
        component={CustomerDetail}
        options={{ 
          title: 'Cliente',
          headerBackTitle: 'Clientes'
        }}
      />
      <Stack.Screen 
        name="CustomerForm" 
        component={CustomerForm}
        options={{ 
          title: 'Cliente',
          headerBackTitle: 'Atrás'
        }}
      />
    </Stack.Navigator>
  );
};

export default CustomersStack;

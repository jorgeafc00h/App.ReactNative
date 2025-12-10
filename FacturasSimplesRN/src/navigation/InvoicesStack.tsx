import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InvoicesScreen } from '../screens/invoices/InvoicesScreen';
import { InvoiceDetailScreen } from '../screens/invoices/InvoiceDetailScreen';
import { AddInvoiceScreen } from '../screens/invoices/AddInvoiceScreen';
import { EditInvoiceScreen } from '../screens/invoices/EditInvoiceScreen';
import { InvoicesStackParamList } from './types';

const Stack = createStackNavigator<InvoicesStackParamList>();

export const InvoicesStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InvoicesList" component={InvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="AddInvoice" component={AddInvoiceScreen} />
      <Stack.Screen name="EditInvoice" component={EditInvoiceScreen} />
    </Stack.Navigator>
  );
};

export default InvoicesStack;

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import InvoicesStack from './InvoicesStack';
import { ProductsScreen } from '../screens/products/ProductsScreen';
import CustomersStack from './CustomersStack';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Home':
              iconName = '🏠';
              break;
            case 'Invoices':
              iconName = '📄';
              break;
            case 'Products':
              iconName = '📦';
              break;
            case 'Customers':
              iconName = '👥';
              break;
          }

          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.primary,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Invoices" 
        component={InvoicesStack}
        options={{ 
          tabBarLabel: 'Facturas',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ 
          tabBarLabel: 'Productos',
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersStack}
        options={{ 
          tabBarLabel: 'Clientes',
        }}
      />
    </Tab.Navigator>
  );
};
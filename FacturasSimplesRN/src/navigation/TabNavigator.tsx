import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import InvoicesStack from './InvoicesStack';
import ProductsStack from './ProductsStack';
import CustomersStack from './CustomersStack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route?.name) {
            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
              case 'Customers':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'Invoices':
                iconName = focused ? 'receipt' : 'receipt-outline';
                break;
              case 'Products':
                iconName = focused ? 'grid' : 'grid-outline';
                break;
            }
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.primary,
          borderTopColor: theme.colors.border.light,
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
        name="Customers" 
        component={CustomersStack}
        options={{ 
          tabBarLabel: 'Clientes',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsStack}
        options={{ 
          tabBarLabel: 'Productos',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};
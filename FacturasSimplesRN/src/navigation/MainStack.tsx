import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { TabNavigator } from './TabNavigator';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import CompaniesScreen from '../screens/companies/CompaniesScreen';
import CompanyDetailsScreen from '../screens/companies/CompanyDetailsScreen';
import { CreateCompanyScreen } from '../screens/companies/CreateCompanyScreen';
import { CompanyConfigurationScreen } from '../screens/company/CompanyConfigurationScreen';
import { CatalogsScreen } from '../screens/settings/CatalogsScreen';
import { CatalogDetailScreen } from '../screens/settings/CatalogDetailScreen';
import { AccountSummaryScreen } from '../screens/account/AccountSummaryScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main Tab Navigator */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Settings Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen 
        name="ChatAssistant" 
        component={ChatScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
      
      {/* Company Management */}
      <Stack.Screen 
        name="Companies" 
        component={CompaniesScreen}
        options={{ title: 'Administración de Empresas', headerShown: true }}
      />
      <Stack.Screen 
        name="CompanyDetails" 
        component={CompanyDetailsScreen}
        options={{ title: 'Detalles de Empresa', headerShown: true }}
      />
      <Stack.Screen 
        name="CreateCompany" 
        component={CreateCompanyScreen}
        options={{ title: 'Crear Empresa', headerShown: false }}
      />
      
      {/* Company Configuration */}
      <Stack.Screen 
        name="CompanyConfiguration" 
        component={CompanyConfigurationScreen}
        options={{ title: 'Configuración Empresas', headerShown: false }}
      />
      <Stack.Screen 
        name="Purchases" 
        component={PlaceholderScreen}
        options={{ title: 'Compras' }}
      />
      <Stack.Screen 
        name="AccountSummary" 
        component={AccountSummaryScreen}
        options={{ title: 'Resumen Cuenta' }}
      />
      <Stack.Screen 
        name="BuyCredits" 
        component={PlaceholderScreen}
        options={{ title: 'Comprar Créditos' }}
      />
      <Stack.Screen 
        name="PurchaseHistory" 
        component={PlaceholderScreen}
        options={{ title: 'Historial de Compras' }}
      />
      <Stack.Screen 
        name="GovernmentCatalogs" 
        component={CatalogsScreen}
        options={{ title: 'Catálogos Hacienda' }}
      />
      <Stack.Screen 
        name="CatalogDetail" 
        component={CatalogDetailScreen}
        options={{ title: 'Detalle de Catálogo' }}
      />
      <Stack.Screen 
        name="Certificates" 
        component={PlaceholderScreen}
        options={{ title: 'Certificados' }}
      />
      <Stack.Screen 
        name="Sync" 
        component={PlaceholderScreen}
        options={{ title: 'Sincronización' }}
      />
    </Stack.Navigator>
  );
};

// Placeholder component for unimplemented screens
const PlaceholderScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Próximamente
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Esta función estará disponible en una próxima actualización.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainStack;
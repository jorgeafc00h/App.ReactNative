import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { ModernSettingsCard } from '../../components/ModernSettingsCard';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SettingsNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { user, isGuestMode } = useAppSelector(state => state.auth);
  const { currentCompany } = useAppSelector(state => state.companies);
  const [testEnvironment, setTestEnvironment] = useState(true);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showCatalogsView, setShowCatalogsView] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);

  useEffect(() => {
    // Simulate fetching user credits
    if (currentCompany && currentCompany.environment === 'production') {
      setAvailableCredits(150); // Mock credits
    }
  }, [currentCompany]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
          }
        }
      ]
    );
  };

  const getCreditsButtonSubtitle = () => {
    if (currentCompany && currentCompany.environment === 'production') {
      return `${availableCredits} créditos disponibles`;
    } else {
      return 'Selecciona empresa de producción';
    }
  };

  const handleCompanyConfiguration = () => {
    navigation.navigate('Companies');
  };

  const handlePurchases = () => {
    navigation.navigate('Purchases');
  };

  const handleiCloudSync = () => {
    navigation.navigate('Sync');
  };

  const handleTestEnvironmentToggle = () => {
    setTestEnvironment(!testEnvironment);
  };

  const handleAccountSummary = () => {
    navigation.navigate('AccountSummary');
  };

  const handleInfoAndHelp = () => {
    // For now, navigate to onboarding which has help content
    console.log('Navigate to info and help - could show onboarding');
  };

  const handleChatAssistant = () => {
    navigation.navigate('ChatAssistant', { 
      selectedCompanyId: currentCompany?.id || '' 
    });
  };

  const handleCompanyManagement = () => {
    navigation.navigate('Companies');
  };

  const handleBuyCredits = () => {
    if (!currentCompany || currentCompany.environment !== 'production') {
      Alert.alert(
        'Empresa de Producción Requerida',
        'Selecciona una empresa de producción para comprar créditos.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('BuyCredits');
  };

  const handlePurchaseHistory = () => {
    navigation.navigate('PurchaseHistory');
  };

  const handleGovernmentCatalogs = () => {
    navigation.navigate('GovernmentCatalogs');
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  };

  const CloudKitSyncStatusView = () => (
    <View style={styles.syncStatus}>
      <Ionicons 
        name="checkmark-circle" 
        size={12} 
        color={theme.colors.success} 
      />
      <Text style={[styles.syncStatusText, { color: theme.colors.success }]}>
        Sincronizado
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={[styles.welcomeText, { color: theme.colors.text.secondary }]}>
                {isGuestMode ? 'Modo Invitado' : `Hola, ${user?.firstName || 'Usuario'}`}
              </Text>
              <Text style={[styles.titleText, { color: theme.colors.text.primary }]}>
                Configuración
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.profileInitials}>
                    {getInitials()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Company Selector - Matches Swift UI */}
          {currentCompany && (
            <TouchableOpacity 
              style={[styles.companySelector, { backgroundColor: theme.colors.background.secondary }]}
              onPress={handleCompanyConfiguration}
            >
              <View style={styles.companyInfo}>
                <Text style={[styles.companyName, { color: theme.colors.text.primary }]}>
                  {currentCompany.nombreComercial}
                </Text>
                <Text style={[styles.companyEnvironment, { 
                  color: currentCompany.environment === 'production' ? theme.colors.success : theme.colors.warning 
                }]}>
                  {currentCompany.environment === 'production' ? 'Producción' : 'Desarrollo'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Menu - Matching Swift ProfileView.swift */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Configuración
          </Text>
          
          <View style={styles.settingsGrid}>
            {/* Company Configuration */}
            <ModernSettingsCard
              icon="business"
              title="Configuración Empresas"
              subtitle="Gestionar empresas registradas"
              iconColor="#FF9500"
              onPress={handleCompanyConfiguration}
            />
            
            {/* Company Management - Administracion de empresas */}
            <ModernSettingsCard
              icon="business-outline"
              title="Administración de Empresas"
              subtitle="Gestionar empresas y configuraciones avanzadas"
              iconColor="#007AFF"
              onPress={handleCompanyManagement}
            />
            
            {/* Purchases */}
            <ModernSettingsCard
              icon="bag"
              title="Compras"
              subtitle="Ver compras de la empresa seleccionada"
              iconColor="#AF52DE"
              onPress={handlePurchases}
            />
            
            {/* iCloud Sync */}
            <ModernSettingsCard
              icon="cloud"
              title="iCloud Sync"
              subtitle="Sincronización automática"
              iconColor="#007AFF"
              hasCustomContent={true}
              customContent={<CloudKitSyncStatusView />}
              onPress={handleiCloudSync}
            />
            
            {/* Test Environment Toggle */}
            <ModernSettingsCard
              icon="flask"
              title="Entorno Pruebas"
              subtitle={testEnvironment ? "Activado" : "Desactivado"}
              iconColor="#34C759"
              hasToggle={true}
              toggleValue={testEnvironment}
              onToggleChange={handleTestEnvironmentToggle}
            />
            
            {/* Account Summary */}
            <ModernSettingsCard
              icon="people"
              title="Resumen Cuenta"
              subtitle="Ver información de la cuenta"
              iconColor="#AF52DE"
              onPress={handleAccountSummary}
            />
            
            {/* Info & Help */}
            <ModernSettingsCard
              icon="information-circle"
              title="Info y Ayuda"
              subtitle="Guías y soporte técnico"
              iconColor="#00C7BE"
              onPress={handleInfoAndHelp}
            />
            
            {/* Chat Assistant */}
            <ModernSettingsCard
              icon="chatbubble"
              title="Asistente Facturas"
              subtitle="Chat Facturas Simples"
              iconColor="#32D74B"
              onPress={handleChatAssistant}
            />
            
            {/* Buy Credits */}
            <ModernSettingsCard
              icon="card"
              title="Comprar Créditos"
              subtitle={getCreditsButtonSubtitle()}
              iconColor="#5856D6"
              onPress={handleBuyCredits}
            />
            
            {/* Purchase History */}
            <ModernSettingsCard
              icon="document-text"
              title="Historial de Compras"
              subtitle="Ver transacciones anteriores"
              iconColor="#30B0C7"
              onPress={handlePurchaseHistory}
            />
            
            {/* Government Catalogs */}
            <ModernSettingsCard
              icon="list"
              title="Catálogos Hacienda"
              subtitle="Ver y sincronizar catálogos fiscales"
              iconColor="#007AFF"
              onPress={handleGovernmentCatalogs}
            />
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  companySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  companyEnvironment: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsGrid: {
    gap: 0,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;
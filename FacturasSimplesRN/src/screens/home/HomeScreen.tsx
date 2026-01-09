import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TabNavigatorParamList } from '../../navigation/types';
import { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/selectors/authSelectors';
import { initializeDefaultCompany } from '../../store/slices/companySlice';
import { useTheme } from '../../hooks/useTheme';
import { InvoiceStatus } from '../../types/invoice';
import { CompanyEnvironment } from '../../types/company';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabNavigatorParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in real app this would refetch data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const { currentCompany, selectedCompanyId, companies } = useAppSelector(state => state.companies);
  const { invoices } = useAppSelector(state => state.invoices);
  
  console.log('HomeScreen: State check', {
    companiesLength: companies.length,
    hasCurrentCompany: !!currentCompany,
    currentCompanyName: currentCompany?.nombreComercial,
    selectedCompanyId
  });
  
  // If we have companies but no current company selected, trigger company initialization and show loading
  if (companies.length > 0 && !currentCompany) {
    console.log('HomeScreen: Companies exist but no current company - triggering initialization');
    // Dispatch action to initialize default company if not already done
    React.useEffect(() => {
      dispatch(initializeDefaultCompany());
    }, [dispatch]);
    
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Inicializando empresa...
        </Text>
      </View>
    );
  }

  // If no companies exist (guest mode or new user), show welcome state
  if (companies.length === 0) {
    console.log('HomeScreen: Showing welcome state - no companies exist');
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, '#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.welcomeText}>
                {isAuthenticated ? `Hola, ${currentUser?.firstName || 'Usuario'}` : 'Bienvenido'}
              </Text>
              <Text style={styles.titleText}>
                Comienza Aquí
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => {
                console.log('Navigate to profile');
              }}
            >
              {currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.profileInitials}>
                    {currentUser ? `${currentUser.firstName?.charAt(0) || ''}${currentUser.lastName?.charAt(0) || ''}` : 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <View style={[styles.welcomeCard, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}>
              ¡Bienvenido a Facturas Simples!
            </Text>
            <Text style={[styles.welcomeDescription, { color: theme.colors.text.secondary }]}>
              Para comenzar a usar la aplicación, primero necesitas configurar tu empresa.
            </Text>
            <TouchableOpacity 
              style={[styles.setupCompanyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('CreateCompany')}
            >
              <Text style={styles.setupCompanyButtonText}>Configurar Primera Empresa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            ¿Qué puedes hacer?
          </Text>
          
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface.primary }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                Crear Facturas
              </Text>
              <Text style={[styles.infoDescription, { color: theme.colors.text.secondary }]}>
                Genera facturas electrónicas de manera rápida y fácil
              </Text>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface.primary }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                Cumplimiento MH
              </Text>
              <Text style={[styles.infoDescription, { color: theme.colors.text.secondary }]}>
                Todos los documentos cumplen con las normas del Ministerio de Hacienda
              </Text>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface.primary }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                <Ionicons name="bar-chart" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                Reportes
              </Text>
              <Text style={[styles.infoDescription, { color: theme.colors.text.secondary }]}>
                Visualiza estadísticas y reportes de tus facturas
              </Text>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface.primary }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="business" size={24} color={theme.colors.warning} />
              </View>
              <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                Multi-Empresa
              </Text>
              <Text style={[styles.infoDescription, { color: theme.colors.text.secondary }]}>
                Gestiona múltiples empresas desde una sola aplicación
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Note: Invoices will be loaded as users create them, initially empty

  const quickActions = [
    {
      title: 'Nueva Factura',
      subtitle: 'Crear factura rápida',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: theme.colors.primary,
      onPress: () => {
        // Navigate to Invoices tab first, then to AddInvoice screen
        navigation.navigate('Invoices');
      },
    },
    {
      title: 'Escanear QR',
      subtitle: 'Importar desde QR',
      icon: 'qr-code-outline' as keyof typeof Ionicons.glyphMap,
      color: theme.colors.success,
      onPress: () => {
        // TODO: Implement QR scanner functionality
        alert('Función de escaneo QR próximamente disponible');
      },
    },
    {
      title: 'Reportes',
      subtitle: 'Ver estadísticas',
      icon: 'bar-chart' as keyof typeof Ionicons.glyphMap,
      color: theme.colors.secondary,
      onPress: () => {
        // Navigate to invoices for now, could be a reports screen later
        navigation.navigate('Invoices');
      },
    },
    {
      title: 'Configuración',
      subtitle: 'Ajustes de empresa',
      icon: 'settings' as keyof typeof Ionicons.glyphMap,
      color: theme.colors.warning,
      onPress: () => {
        navigation.navigate('Settings');
      },
    },
  ];

  const recentInvoices = invoices.slice(0, 3);
  
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalAmountIncludingTax || 0), 0);
  const pendingInvoices = invoices.filter(invoice => invoice.status === InvoiceStatus.Nueva).length;

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Completada:
        return '#10B981';
      case InvoiceStatus.Nueva:
        return '#F59E0B';
      case InvoiceStatus.Sincronizando:
        return '#3B82F6';
      case InvoiceStatus.Anulada:
        return '#EF4444';
      case InvoiceStatus.Modificada:
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, '#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.welcomeText}>
              {isAuthenticated ? `Hola, ${currentUser?.firstName || 'Usuario'}` : 'Bienvenido'}
            </Text>
            <Text style={styles.titleText}>
              Panel Principal
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.profileInitials}>
                  {currentUser ? `${currentUser.firstName?.charAt(0) || ''}${currentUser.lastName?.charAt(0) || ''}` : 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Company Selector */}
        {currentCompany && (
          <TouchableOpacity 
            style={[styles.companySelector, { backgroundColor: theme.colors.background.secondary }]}
            onPress={() => {
              console.log('Open company selector');
            }}
          >
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: theme.colors.text.primary }]}>
                {currentCompany.nombreComercial || 'Empresa'}
              </Text>
              <Text style={[styles.companyEnvironment, { 
                color: currentCompany.environment === CompanyEnvironment.Production ? theme.colors.success : theme.colors.warning 
              }]}>
                {currentCompany.environment === CompanyEnvironment.Production ? 'Producción' : 'Desarrollo'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: theme.colors.background.secondary }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.summaryAmount}>${totalAmount.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total del Mes</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.summaryAmount, { color: theme.colors.text.primary }]}>{invoices.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Facturas</Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.summaryAmount, { color: theme.colors.warning }]}>{pendingInvoices}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Pendientes</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Acciones Rápidas
        </Text>
        
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.primary }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.text.secondary }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Actividad Reciente
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Invoices')}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              Ver todo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.activityContainer, { backgroundColor: theme.colors.surface.primary }]}>
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice, index) => (
              <TouchableOpacity
                key={invoice.id}
                style={[
                  styles.activityItem,
                  index < recentInvoices.length - 1 && styles.activityItemBorder,
                  { borderBottomColor: theme.colors.border.light }
                ]}
                onPress={() => {
                  navigation.navigate('Invoices', {
                    screen: 'InvoiceDetail',
                    params: { invoiceId: invoice.id }
                  } as any);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    <Text style={[styles.activityType, { color: theme.colors.text.primary }]}>
                      {invoice.invoiceType} {invoice.invoiceNumber}
                    </Text>
                    <Text style={[styles.activityDate, { color: theme.colors.text.secondary }]}>
                      {new Date(invoice.date).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  
                  <Text style={[styles.activityClient, { color: theme.colors.text.secondary }]}>
                    {invoice.receptor || 'Cliente no especificado'}
                  </Text>
                  
                  <View style={styles.activityFooter}>
                    <Text style={[styles.activityAmount, { color: theme.colors.text.primary }]}>
                      ${(invoice.totalAmountIncludingTax || 0).toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                        {invoice.status === InvoiceStatus.Completada ? 'Completada' : 
                         invoice.status === InvoiceStatus.Nueva ? 'Nueva' : 
                         invoice.status === InvoiceStatus.Sincronizando ? 'Sincronizando' : 
                         invoice.status === InvoiceStatus.Anulada ? 'Anulada' : 
                         invoice.status === InvoiceStatus.Modificada ? 'Modificada' : 'Desconocido'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                No hay facturas recientes
              </Text>
              <TouchableOpacity 
                style={[styles.createFirstButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Invoices')}
              >
                <Text style={styles.createFirstButtonText}>Crear Primera Factura</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingTop: 60, // Account for status bar
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -0.5,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  summaryContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 32,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryCardPrimary: {
    backgroundColor: '#3B82F6',
  },
  summaryCardSecondary: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 18,
  },
  activityContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 4,
  },
  activityItem: {
    padding: 20,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 14,
  },
  activityClient: {
    fontSize: 14,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  createFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  setupCompanyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  setupCompanyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    width: (width - 52) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
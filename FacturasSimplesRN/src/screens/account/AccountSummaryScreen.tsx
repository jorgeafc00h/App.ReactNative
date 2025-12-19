import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Company } from '../../types/company';
import { logout, deactivateAccount, deleteAccount } from '../../store/slices/authSlice';

type AccountNavigationProp = StackNavigationProp<RootStackParamList>;

export const AccountSummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<AccountNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { user, loading } = useAppSelector(state => state.auth);
  const { companies } = useAppSelector(state => state.companies);
  const invoices = useAppSelector(state => state.invoices.invoices);
  
  const [invoiceCountsByCompany, setInvoiceCountsByCompany] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  useEffect(() => {
    loadInvoiceCounts();
  }, [companies, invoices]);

  const loadInvoiceCounts = () => {
    setIsLoadingCounts(true);
    try {
      const counts: Record<string, number> = {};
      
      companies.forEach(company => {
        // Count invoices for each company
        const companyInvoices = invoices.filter(invoice => 
          invoice.companyId === company.id
        );
        counts[company.id] = companyInvoices.length;
      });
      
      setInvoiceCountsByCompany(counts);
    } catch (error) {
      console.error('Error loading invoice counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de que deseas desactivar tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deactivateAccount()).unwrap();
              Alert.alert(
                'Cuenta Desactivada',
                'Su cuenta ha sido desactivada correctamente. Para volver a usar esta increíble aplicación, necesitará reiniciar la app e iniciar sesión nuevamente.',
                [
                  {
                    text: 'Entendido',
                    style: 'destructive',
                    onPress: () => {
                      dispatch(logout());
                      // Navigate to auth screen
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo desactivar la cuenta');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAccount()).unwrap();
              Alert.alert(
                'Cuenta Eliminada',
                'Su cuenta ha sido eliminada permanentemente. Toda su información ha sido borrada de nuestros sistemas.',
                [
                  {
                    text: 'Entendido',
                    style: 'destructive',
                    onPress: () => {
                      dispatch(logout());
                      // Navigate to auth screen
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            }
          }
        }
      ]
    );
  };

  const getCompanyInitials = (company: Company): string => {
    const words = company.nombre.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
      return company.nombre.substring(0, 2).toUpperCase();
    }
  };

  const getUserInitials = (): string => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Gradient */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary || theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              {/* Profile Icon */}
              <View style={styles.profileIconContainer}>
                <View style={styles.profileIconBackground}>
                  <Ionicons name="person" size={35} color="white" />
                </View>
              </View>
              
              {/* Title */}
              <Text style={styles.headerTitle}>Mi Cuenta</Text>
            </View>
          </LinearGradient>
          
          {/* Curved bottom edge */}
          <View style={[styles.curvedBottom, { backgroundColor: theme.colors.background.secondary }]} />
        </View>

        {/* Company Data Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          {/* Section Header */}
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="business" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Mis Empresas
              </Text>
            </View>
            
            {companies.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.countBadgeText}>{companies.length}</Text>
              </View>
            )}
          </View>
          
          {/* Companies List or Empty State */}
          {companies.length === 0 ? (
            <View style={styles.emptyCompaniesContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.background.secondary }]}>
                <Ionicons name="business-outline" size={36} color={theme.colors.text.secondary} />
              </View>
              
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No hay empresas registradas
              </Text>
              
              <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
                Las empresas que registres aparecerán aquí con el resumen de facturas creadas
              </Text>
            </View>
          ) : (
            <View style={styles.companiesList}>
              {companies.map((company, index) => (
                <View key={company.id}>
                  <CompanyInvoiceSummary 
                    company={company}
                    invoicesCreated={invoiceCountsByCompany[company.id] || 0}
                    isLoading={isLoadingCounts}
                    theme={theme}
                  />
                  
                  {index < companies.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.colors.border.light }]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* User Info Card */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          {/* Section Header */}
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Información Personal
              </Text>
            </View>
          </View>
          
          {/* User Info Content */}
          <View style={styles.userInfoContent}>
            {/* Name Row */}
            <View style={styles.userInfoRow}>
              <View style={[styles.userInfoIcon, { backgroundColor: theme.colors.background.secondary }]}>
                <Ionicons name="person" size={18} color={theme.colors.primary} />
              </View>
              
              <View style={styles.userInfoText}>
                <Text style={[styles.userInfoLabel, { color: theme.colors.text.secondary }]}>
                  Nombre completo
                </Text>
                <Text style={[styles.userInfoValue, { color: theme.colors.text.primary }]}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : 'No especificado'
                  }
                </Text>
              </View>
            </View>
            
            {/* Email Row */}
            <View style={styles.userInfoRow}>
              <View style={[styles.userInfoIcon, { backgroundColor: theme.colors.background.secondary }]}>
                <Ionicons name="mail" size={16} color={theme.colors.primary} />
              </View>
              
              <View style={styles.userInfoText}>
                <Text style={[styles.userInfoLabel, { color: theme.colors.text.secondary }]}>
                  Correo electrónico
                </Text>
                <Text style={[styles.userInfoValue, { color: theme.colors.text.primary }]}>
                  {user?.email || 'No especificado'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          {/* Deactivate Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDeactivateAccount}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF9500', '#FFCC02']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="person-remove" size={18} color="white" />
              <Text style={styles.actionButtonText}>Desactivar Cuenta</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Delete Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <LinearGradient
              colors={['#E53E3E', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="trash" size={18} color="white" />
              <Text style={styles.actionButtonText}>Eliminar Cuenta</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// Company Invoice Summary Component
interface CompanyInvoiceSummaryProps {
  company: Company;
  invoicesCreated: number;
  isLoading: boolean;
  theme: any;
}

const CompanyInvoiceSummary: React.FC<CompanyInvoiceSummaryProps> = ({ 
  company, 
  invoicesCreated, 
  isLoading, 
  theme 
}) => {
  const getCompanyInitials = (companyName: string): string => {
    const words = companyName.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
      return companyName.substring(0, 2).toUpperCase();
    }
  };

  return (
    <View style={styles.companyRow}>
      {/* Company Avatar */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.companyAvatar}
      >
        <Text style={styles.companyInitials}>
          {getCompanyInitials(company.nombre)}
        </Text>
      </LinearGradient>
      
      {/* Company Info */}
      <View style={styles.companyInfo}>
        <Text style={[styles.companyName, { color: theme.colors.text.primary }]}>
          {company.nombre}
        </Text>
        
        <View style={styles.companyDetails}>
          <Text style={[styles.companyNitLabel, { color: theme.colors.text.secondary }]}>
            NIT:{' '}
          </Text>
          <Text style={[styles.companyNit, { color: theme.colors.text.primary }]}>
            {company.nit}
          </Text>
        </View>
        
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: company.isProduction ? '#38A169' : '#FF9500' }
          ]} />
          <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
            {company.isProduction ? 'Producción' : 'Pruebas'}
          </Text>
        </View>
      </View>
      
      {/* Invoice Count */}
      <View style={styles.invoiceCount}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Text style={[styles.invoiceNumber, { color: theme.colors.primary }]}>
              {invoicesCreated}
            </Text>
            <Text style={[styles.invoiceLabel, { color: theme.colors.text.secondary }]}>
              Facturas
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  gradientHeader: {
    height: 180,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileIconContainer: {
    marginBottom: 12,
  },
  profileIconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  curvedBottom: {
    height: 40,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginTop: -20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyCompaniesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  companiesList: {
    paddingBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  companyInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  companyInfo: {
    flex: 1,
    gap: 6,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600',
  },
  companyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyNitLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  companyNit: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceCount: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  invoiceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  userInfoContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoText: {
    flex: 1,
    gap: 4,
  },
  userInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  userInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AccountSummaryScreen;
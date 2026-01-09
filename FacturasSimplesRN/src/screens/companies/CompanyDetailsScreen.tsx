import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedCompany, deleteCompany, setDefaultCompany, updateCompany } from '../../store/slices/companySlice';
import { Company, CompanyEnvironment } from '../../types/company';
import { ModernSettingsCard } from '../../components/ModernSettingsCard';
import { InvoiceService } from '../../services/api/InvoiceService';
import { CertificateService } from '../../services/security/CertificateService';
import { SecureStorageService } from '../../services/security/SecureStorageService';
import { isProductionCompany } from '../../utils/companyEnvironment';

// Import modals
import {
  EditCompanyModal,
  CertificateCredentialsModal,
  HaciendaCredentialsModal,
  LogoEditorModal,
  PurchasesModuleModal,
  RequestProductionAccessModal,
  EmailReaderSettings,
} from '../../components/modals';

interface RouteParams {
  companyId: string;
}

const CompanyDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId } = route.params as RouteParams;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { companies, currentCompany } = useAppSelector(state => state.companies);
  const { invoices } = useAppSelector(state => state.invoices);

  const company = companies.find(c => c.id === companyId);
  const isSelected = currentCompany?.id === companyId;
  const isProduction = isProductionCompany(company);
  // Matches Swift semantics: true means test/development environment
  const isTestAccount = company?.isTestAccount === true || !isProduction;
  

  // Validation status states - matches Swift's viewModel states
  const [isLoadingCertificateStatus, setIsLoadingCertificateStatus] = useState(false);
  const [isLoadingCredentialsStatus, setIsLoadingCredentialsStatus] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [credentialsStatus, setCredentialsStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [requiresTestInvoices, setRequiresTestInvoices] = useState(true);

  // Modal visibility states
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showHaciendaCredentialsModal, setShowHaciendaCredentialsModal] = useState(false);
  const [showLogoEditorModal, setShowLogoEditorModal] = useState(false);
  const [showPurchasesModuleModal, setShowPurchasesModuleModal] = useState(false);
  const [showProductionAccessModal, setShowProductionAccessModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  /**
   * Validate certificate credentials on mount - matches Swift's validateCertificateCredentialsAsync
   */
  const validateCertificateCredentials = useCallback(async () => {
    if (!company?.nit) return;
    
    setIsLoadingCertificateStatus(true);
    setCertificateStatus('loading');
    
    try {
      const certificateService = new CertificateService(isProduction);
      const result = await certificateService.validateCertificate(
        company.nit,
        company.certificatePassword || ''
      );
      
      console.log('Certificate Validation Result:', result);
      
      if (!result || !result.isValid) {
        setCertificateStatus('invalid');
      } else {
        setCertificateStatus('valid');
      }
    } catch (error) {
      console.error('Certificate validation error:', error);
      setCertificateStatus('invalid');
    } finally {
      setIsLoadingCertificateStatus(false);
    }
  }, [company, isProduction]);

  /**
   * Validate Hacienda credentials on mount - matches Swift's validateCredentialsAsync
   */
  const validateCredentials = useCallback(async () => {
    if (!company?.nit) return;
    
    setIsLoadingCredentialsStatus(true);
    setCredentialsStatus('loading');
    
    try {
      // Get plain text credentials from secure storage (matches Swift implementation)
      const storedCredentials = await SecureStorageService.getCredentials(company.nit);
      if (!storedCredentials?.password) {
        setCredentialsStatus('invalid');
        return;
      }
      
      const invoiceService = new InvoiceService(isProduction);
      const isValid = await invoiceService.validateCredentials(
        company.nit,
        storedCredentials.password, // Use plain text password from storage
        false // forceRefresh
      );
      
      console.log('Credentials Validation Result:', isValid);
      
      if (!isValid) {
        setCredentialsStatus('invalid');
      } else {
        setCredentialsStatus('valid');
      }
    } catch (error) {
      console.error('Credentials validation error:', error);
      setCredentialsStatus('invalid');
    } finally {
      setIsLoadingCredentialsStatus(false);
    }
  }, [company]);

  // Validate credentials on mount and company change - matches Swift's refreshLabels()
  useEffect(() => {
    if (company) {
      validateCertificateCredentials();
      validateCredentials();
    }
  }, [company?.id, validateCertificateCredentials, validateCredentials]);

  if (!company) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          Empresa no encontrada
        </Text>
      </View>
    );
  }

  const companyInvoices = invoices.filter(invoice => invoice.companyId === company.id);
  const invoiceSummary = {
    total: companyInvoices.length,
    creditNotes: 0,
    fiscalDocuments: companyInvoices.length,
  };

  // Handler functions - matches Swift's button actions
  const handleSetAsDefault = () => {
    if (isSelected) return; // Already selected
    
    Alert.alert(
      '¿Desea establecer esta empresa como predeterminada para gestionar facturas?',
      '',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            dispatch(setDefaultCompany(company.id));
            dispatch(setSelectedCompany(company.id));
            Alert.alert('Éxito', 'Empresa predeterminada actualizada');
          },
        },
      ]
    );
  };

  const handleEditCompany = () => {
    setShowEditCompanyModal(true);
  };

  const handleCompanySaved = (updatedCompany: Company) => {
    dispatch(updateCompany(updatedCompany));
    // Revalidate after company update
    validateCertificateCredentials();
    validateCredentials();
  };

  const handleCertificateCredentials = () => {
    setShowCertificateModal(true);
  };

  const handleCertificateUpdated = (isValid: boolean) => {
    setCertificateStatus(isValid ? 'valid' : 'invalid');
    // Refresh validation
    validateCertificateCredentials();
  };

  const handleHaciendaCredentials = () => {
    setShowHaciendaCredentialsModal(true);
  };

  const handleCredentialsUpdated = (isValid: boolean) => {
    setCredentialsStatus(isValid ? 'valid' : 'invalid');
    // Refresh validation
    validateCredentials();
  };

  const handleProductionAccess = () => {
    setShowProductionAccessModal(true);
  };

  const handleProductionAccessCompletion = (productionCompany?: Company) => {
    // Set requiresTestInvoices to false to show green button
    setRequiresTestInvoices(false);
    console.log('✅ Production access process completed');
    
    if (productionCompany) {
      console.log('✅ Production company created:', productionCompany.nombreComercial);
      // TODO: Add production company to store if needed
    }
  };

  const handleLogoEditor = () => {
    setShowLogoEditorModal(true);
  };

  const handleLogoSaved = (updatedCompany: Company) => {
    dispatch(updateCompany(updatedCompany));
  };

  const handlePurchasesModule = () => {
    setShowPurchasesModuleModal(true);
  };

  const handlePurchasesSettingsSaved = (settings: EmailReaderSettings) => {
    // TODO: Save email reader settings to company or separate storage
    console.log('Email reader settings saved:', settings);
    Alert.alert('Éxito', 'Configuración de módulo de compras guardada');
  };

  const handleDeleteCompany = () => {
    if (companyInvoices.length > 0) {
      Alert.alert(
        'No se puede eliminar la empresa',
        `La empresa tiene ${companyInvoices.length} facturas asociadas y no puede ser eliminada. Elimine todas las facturas primero.`,
        [{ text: 'Aceptar', style: 'default' }]
      );
      return;
    }

    if (isSelected) {
      Alert.alert(
        'Error',
        'No se puede eliminar la empresa actualmente seleccionada',
        [{ text: 'Aceptar', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      '¿Está seguro que desea eliminar esta empresa?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCompany(company.id));
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Warning checks - matches Swift's hasAnyMissingField(), hasMissingInvoiceLogo(), etc.
  const hasAnyMissingField = () => {
    if (!company) return true;
    return !company.nit || !company.nrc || !company.codActividad || 
           !company.nombre || !company.nombreComercial;
  };

  const hasMissingInvoiceLogo = () => {
    if (!company) return true;
    return !company.invoiceLogo && !company.logoUrl;
  };

  const hasMissingEmailConfiguration = () => {
    if (!company) return true;
    return !company.correo;
  };

  const getWarningForField = (field: 'company' | 'certificate' | 'credentials' | 'logo' | 'email') => {
    switch (field) {
      case 'company':
        return hasAnyMissingField();
      case 'certificate':
        return certificateStatus === 'invalid';
      case 'credentials':
        return credentialsStatus === 'invalid';
      case 'logo':
        return hasMissingInvoiceLogo();
      case 'email':
        return !company.correo;
      default:
        return false;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.background.primary, opacity: fadeAnim }
      ]}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Company Header */}
          <View style={[styles.companyHeader, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.companyHeaderContent}>
              <View style={[
                styles.companyIcon,
                { backgroundColor: '#0EA5E9' }
              ]}>
                <Ionicons name="business" size={30} color="white" />
              </View>
              
              <View style={styles.companyHeaderInfo}>
                <View style={styles.environmentBadgeContainer}>
                  <View style={[
                    styles.environmentBadge,
                    { backgroundColor: isTestAccount ? '#F59E0B20' : '#10B98120' }
                  ]}>
                    <Text style={[
                      styles.environmentText,
                      { color: isTestAccount ? '#F59E0B' : '#10B981' }
                    ]}>
                      {isProduction ? 'Producción' : 'Desarrollo'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={isTestAccount ? 'warning' : 'checkmark-circle'} 
                    size={16} 
                    color={isTestAccount ? '#F59E0B' : '#10B981'} 
                  />
                </View>
                
                <Text style={[styles.companyName, { color: theme.colors.text.primary }]}>
                  {company.nombre}
                </Text>
                
                <Text style={[styles.companyEmail, { color: theme.colors.text.secondary }]}>
                  {company.correo}
                </Text>
                
                <View style={styles.divider} />
                
                <View style={styles.companyMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="business" size={14} color={theme.colors.text.tertiary} />
                    <Text style={[styles.metaText, { color: theme.colors.text.tertiary }]}>
                      {company.nit || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="call" size={14} color={theme.colors.text.tertiary} />
                    <Text style={[styles.metaText, { color: theme.colors.text.tertiary }]}>
                      {company.telefono || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Management Buttons */}
          <View style={styles.buttonsSection}>
            <ModernSettingsCard
              icon="checkmark-circle"
              title={isSelected ? "Empresa Predeterminada" : "Establecer Como predeterminada"}
              subtitle={isSelected ? "Esta empresa está seleccionada" : "Seleccionar para gestionar facturas"}
              iconColor={isSelected ? "#0EA5E9" : "#3B82F6"}
              onPress={handleSetAsDefault}
            />

            <ModernSettingsCard
              icon="create"
              title="Editar Datos de Empresa"
              subtitle="Actualizar información básica de la empresa"
              iconColor="#0EA5E9"
              hasCustomContent={getWarningForField('company')}
              customContent={getWarningForField('company') ? (
                <Text style={styles.warningText}>Actualice Datos Incompletos de Empresa</Text>
              ) : undefined}
              onPress={handleEditCompany}
            />

            <ModernSettingsCard
              icon="lock-closed"
              title="Credenciales de Certificado"
              subtitle="Configurar certificado para firmar documentos"
              iconColor="#0EA5E9"
              hasCustomContent={certificateStatus !== 'valid'}
              customContent={
                certificateStatus === 'loading' ? (
                  <Text style={styles.loadingText}>Verificando Certificado...</Text>
                ) : certificateStatus === 'invalid' ? (
                  <Text style={styles.warningText}>Actualice Certificado</Text>
                ) : undefined
              }
              onPress={handleCertificateCredentials}
            />

            <ModernSettingsCard
              icon="key"
              title="Credenciales Hacienda"
              subtitle="Configurar acceso a API de Hacienda"
              iconColor="#0EA5E9"
              hasCustomContent={credentialsStatus !== 'valid'}
              customContent={
                credentialsStatus === 'loading' ? (
                  <Text style={styles.loadingText}>Verificando Credenciales...</Text>
                ) : credentialsStatus === 'invalid' ? (
                  <Text style={styles.warningText}>Actualice Contraseña de API Hacienda</Text>
                ) : undefined
              }
              onPress={handleHaciendaCredentials}
            />

            {isTestAccount && (
              <ModernSettingsCard
                icon={requiresTestInvoices ? "checkmark-circle" : "checkmark-done-circle"}
                title={requiresTestInvoices ? "Solicitar Autorización a Producción" : "Proceso Completado ✓"}
                subtitle={requiresTestInvoices 
                  ? "Inicia proceso de autorización a producción" 
                  : "Proceso de autorización completado exitosamente"
                }
                iconColor={requiresTestInvoices ? "#0EA5E9" : "#10B981"}
                hasCustomContent={requiresTestInvoices}
                customContent={requiresTestInvoices ? (
                  <Text style={styles.warningText}>Inicia proceso de Autorización a Producción</Text>
                ) : undefined}
                onPress={handleProductionAccess}
              />
            )}

            <ModernSettingsCard
              icon="image"
              title="Edita Logo de Facturas"
              subtitle="Personalizar logo para documentos fiscales"
              iconColor="#0EA5E9"
              hasCustomContent={getWarningForField('logo')}
              customContent={getWarningForField('logo') ? (
                <Text style={styles.warningText}>Seleccione logo de facturas</Text>
              ) : undefined}
              onPress={handleLogoEditor}
            />

            <ModernSettingsCard
              icon="mail"
              title="Modulo Compras"
              subtitle="Configurar lectura de emails para compras"
              iconColor="#0EA5E9"
              hasCustomContent={getWarningForField('email')}
              customContent={getWarningForField('email') ? (
                <Text style={styles.warningText}>Configure Email para lectura de compras</Text>
              ) : undefined}
              onPress={handlePurchasesModule}
            />
          </View>

          {/* Status Section - Matches Swift's StatusSection */}
          <View style={[styles.statusSection, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Estado del Sistema
            </Text>
            
            {/* Certificate Status */}
            <View style={styles.statusItem}>
              {isLoadingCertificateStatus ? (
                <View style={styles.loadingStatusContainer}>
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <Text style={[styles.loadingStatusText, { color: '#0EA5E9' }]}>
                    Verificando Certificado...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[
                    styles.statusLabel, 
                    { color: certificateStatus === 'invalid' ? '#EF4444' : '#0EA5E9' }
                  ]}>
                    Certificado Hacienda
                  </Text>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: certificateStatus === 'invalid' ? '#EF4444' : '#0EA5E9' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { 
                        color: certificateStatus === 'invalid' ? '#EF4444' : '#0EA5E9',
                        backgroundColor: certificateStatus === 'invalid' 
                          ? 'rgba(239, 68, 68, 0.09)' 
                          : 'rgba(14, 165, 233, 0.09)'
                      }
                    ]}>
                      {certificateStatus === 'invalid' ? 'Invalido' : 'OK'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Credentials Status */}
            <View style={styles.statusItem}>
              {isLoadingCredentialsStatus ? (
                <View style={styles.loadingStatusContainer}>
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <Text style={[styles.loadingStatusText, { color: '#0EA5E9' }]}>
                    Verificando Credenciales...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[
                    styles.statusLabel, 
                    { color: credentialsStatus === 'invalid' ? '#EF4444' : '#0EA5E9' }
                  ]}>
                    Credenciales Hacienda
                  </Text>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: credentialsStatus === 'invalid' ? '#EF4444' : '#0EA5E9' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { 
                        color: credentialsStatus === 'invalid' ? '#EF4444' : '#0EA5E9',
                        backgroundColor: credentialsStatus === 'invalid' 
                          ? 'rgba(239, 68, 68, 0.09)' 
                          : 'rgba(14, 165, 233, 0.09)'
                      }
                    ]}>
                      {credentialsStatus === 'invalid' ? 'Invalido' : 'OK'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Company Details */}
          <View style={[styles.detailsSection, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Información Detallada
            </Text>
            
            <View style={styles.detailsGroup}>
              <Text style={[styles.groupTitle, { color: theme.colors.text.primary }]}>
                Dirección
              </Text>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Departamento
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.departamento || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Municipio
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.municipio || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Complemento
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.complemento || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGroup}>
              <Text style={[styles.groupTitle, { color: theme.colors.text.primary }]}>
                Información de Negocio
              </Text>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Nombre Comercial
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.nombreComercial}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  NIT
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.nit || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  NRC
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.nrc || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Actividad
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {company.descActividad || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Invoice Summary */}
          {companyInvoices.length > 0 ? (
            <View style={[styles.summarySection, { backgroundColor: theme.colors.surface.secondary }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Resumen de Facturas
              </Text>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Text style={styles.summaryIconText}>C</Text>
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryType, { color: theme.colors.text.primary }]}>
                    Total de Facturas
                  </Text>
                </View>
                <View style={styles.summaryCount}>
                  <Text style={[styles.summaryNumber, { color: theme.colors.text.primary }]}>
                    {invoiceSummary.total}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                    Total
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.emptySummary, { backgroundColor: theme.colors.surface.secondary }]}>
              <Ionicons name="document-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                Facturas
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Aun no tiene facturas.
              </Text>
            </View>
          )}

          {/* Delete Button */}
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  backgroundColor: '#EF4444',
                  opacity: isSelected ? 0.5 : 1,
                }
              ]}
              onPress={handleDeleteCompany}
              disabled={isSelected}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Eliminar Empresa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditCompanyModal
        visible={showEditCompanyModal}
        company={company}
        onClose={() => setShowEditCompanyModal(false)}
        onSave={handleCompanySaved}
      />

      <CertificateCredentialsModal
        visible={showCertificateModal}
        company={company}
        onClose={() => setShowCertificateModal(false)}
        onCredentialsUpdated={handleCertificateUpdated}
      />

      <HaciendaCredentialsModal
        visible={showHaciendaCredentialsModal}
        company={company}
        onClose={() => setShowHaciendaCredentialsModal(false)}
        onCredentialsUpdated={handleCredentialsUpdated}
      />

      <LogoEditorModal
        visible={showLogoEditorModal}
        company={company}
        onClose={() => setShowLogoEditorModal(false)}
        onSave={handleLogoSaved}
      />

      <PurchasesModuleModal
        visible={showPurchasesModuleModal}
        onClose={() => setShowPurchasesModuleModal(false)}
        onSave={handlePurchasesSettingsSaved}
      />

      {isTestAccount && (
        <RequestProductionAccessModal
          visible={showProductionAccessModal}
          company={company}
          onClose={() => setShowProductionAccessModal(false)}
          onCompletion={handleProductionAccessCompletion}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  companyHeader: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyHeaderInfo: {
    flex: 1,
  },
  environmentBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  environmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  environmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyEmail: {
    fontSize: 15,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  companyMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  buttonsSection: {
    gap: 12,
    marginBottom: 24,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  statusSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 30,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  loadingStatusText: {
    fontSize: 14,
  },
  detailsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summarySection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryType: {
    fontSize: 17,
    fontWeight: '600',
  },
  summaryCount: {
    alignItems: 'flex-end',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  emptySummary: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  deleteSection: {
    marginTop: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompanyDetailsScreen;
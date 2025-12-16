import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getCertificateService, CertificateFile, CertificateUploadResult } from '../services/security/CertificateService';
import { Company } from '../types/company';

interface CertificateUploadProps {
  onUploadSuccess: () => void;
  onSkip: () => void;
  company?: Company;
}

interface CertificateValidationState {
  hasFile: boolean;
  hasPassword: boolean;
  isValidating: boolean;
  isValid: boolean;
  message: string;
}

export const CertificateUpload: React.FC<CertificateUploadProps> = ({
  onUploadSuccess,
  onSkip,
  company,
}) => {
  // Redux state
  const selectedCompany = useSelector((state: RootState) => 
    company || state.companies.currentCompany
  );
  const isProduction = useSelector((state: RootState) => 
    state.app.environment === 'production'
  );

  // Local state
  const [selectedFile, setSelectedFile] = useState<CertificateFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState<CertificateValidationState>({
    hasFile: false,
    hasPassword: false,
    isValidating: false,
    isValid: false,
    message: ''
  });
  const [uploading, setUploading] = useState(false);

  // Initialize certificate service
  const [certificateService] = useState(() => getCertificateService(isProduction));

  // Update service environment when it changes
  useEffect(() => {
    certificateService.setEnvironment(isProduction);
  }, [isProduction, certificateService]);

  // Check if company already has certificate
  useEffect(() => {
    const checkExistingCertificate = async () => {
      if (selectedCompany?.nit) {
        try {
          const certInfo = await certificateService.getCertificateInfo(selectedCompany.nit);
          if (certInfo.hasPassword && certInfo.isValid) {
            setValidation(prev => ({
              ...prev,
              isValid: true,
              message: 'Certificado ya configurado y válido'
            }));
          }
        } catch (error) {
          console.warn('Could not check existing certificate:', error);
        }
      }
    };

    checkExistingCertificate();
  }, [selectedCompany, certificateService]);

  const handleFileSelect = async () => {
    try {
      console.log('📁 CertificateUpload: Opening file picker');
      
      const file = await certificateService.selectCertificateFile();
      
      if (file) {
        setSelectedFile(file);
        setValidation(prev => ({
          ...prev,
          hasFile: true,
          message: `Archivo seleccionado: ${file.name}`
        }));
        console.log(`✅ File selected: ${file.name} (${file.size} bytes)`);
      }
    } catch (error) {
      console.error('❌ Error selecting file:', error);
      Alert.alert(
        'Error',
        'No se pudo seleccionar el archivo. Verifique que el archivo sea un certificado válido (.p12 o .pfx).'
      );
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCompany) {
      Alert.alert('Error', 'Debe seleccionar un certificado y tener una empresa configurada');
      return;
    }

    setUploading(true);
    setValidation(prev => ({ ...prev, isValidating: true, message: 'Subiendo certificado...' }));

    try {
      // Step 1: Upload certificate file
      const uploadResult: CertificateUploadResult = await certificateService.uploadCertificate(
        selectedFile,
        selectedCompany
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Error al subir el certificado');
      }

      setValidation(prev => ({ 
        ...prev, 
        message: 'Certificado subido. Configurando contraseña...'
      }));

      // Step 2: Configure password if provided
      if (password || confirmPassword) {
        const passwordResult = await handlePasswordUpdate();
        
        if (!passwordResult.isValid) {
          throw new Error(passwordResult.message || 'Error al configurar la contraseña');
        }
      }

      // Success
      setValidation({
        hasFile: true,
        hasPassword: !!(password && confirmPassword),
        isValidating: false,
        isValid: true,
        message: '✅ Certificado configurado correctamente'
      });

      Alert.alert(
        'Éxito',
        'El certificado ha sido configurado correctamente y está listo para firmar documentos tributarios.',
        [{ text: 'OK', onPress: () => onUploadSuccess() }]
      );

    } catch (error) {
      console.error('❌ Certificate upload failed:', error);
      
      setValidation({
        hasFile: !!selectedFile,
        hasPassword: false,
        isValidating: false,
        isValid: false,
        message: error instanceof Error ? error.message : 'Error al configurar el certificado'
      });

      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo configurar el certificado'
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!selectedCompany) {
      return { isValid: false, message: 'No hay empresa seleccionada' };
    }

    return await certificateService.updateCertificatePassword(
      password,
      confirmPassword,
      selectedCompany
    );
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setValidation(prev => ({
      ...prev,
      hasPassword: !!(text && confirmPassword && text === confirmPassword),
      message: text ? 'Contraseña ingresada' : ''
    }));
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    const passwordsMatch = password === text;
    setValidation(prev => ({
      ...prev,
      hasPassword: !!(password && text && passwordsMatch),
      message: passwordsMatch ? 'Contraseñas coinciden' : 'Las contraseñas no coinciden'
    }));
  };

  const validateBeforeUpload = () => {
    if (!selectedCompany) {
      Alert.alert('Error', 'Debe seleccionar una empresa primero');
      return false;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Debe seleccionar un archivo de certificado');
      return false;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return false;
      }

      if (password.length < 1) {
        Alert.alert('Error', 'La contraseña no puede estar vacía');
        return false;
      }
    }

    return true;
  };

  const handleUploadWithValidation = () => {
    if (validateBeforeUpload()) {
      handleUpload();
    }
  };

  const openHaciendaPortal = () => {
    Alert.alert(
      'Portal de Hacienda',
      'En una aplicación real, esto abriría el navegador web para acceder al portal del Ministerio de Hacienda donde puede solicitar su certificado digital.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Portal', onPress: () => console.log('Opening Hacienda portal') }
      ]
    );
  };

  // Show success state if already configured
  if (validation.isValid && !uploading) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Certificado Configurado</Text>
          <Text style={styles.successMessage}>
            Su certificado digital está configurado correctamente para la empresa{' '}
            <Text style={styles.companyName}>{selectedCompany?.nombreComercial}</Text>
          </Text>
          
          <View style={styles.certificateDetails}>
            <Text style={styles.detailLabel}>Empresa: {selectedCompany?.nit}</Text>
            <Text style={styles.detailLabel}>Estado: ✅ Válido</Text>
            <Text style={styles.detailLabel}>Ambiente: {isProduction ? 'Producción' : 'Desarrollo'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={onUploadSuccess}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración de Certificado Digital</Text>
        <Text style={styles.subtitle}>
          El certificado es necesario para firmar documentos tributarios electrónicos
        </Text>
        
        {selectedCompany && (
          <View style={styles.companyBadge}>
            <Text style={styles.companyBadgeText}>
              📋 {selectedCompany.nombreComercial} • {isProduction ? 'Producción' : 'Desarrollo'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requisitos:</Text>
        <Text style={styles.requirement}>• Archivo de certificado (.p12 o .pfx)</Text>
        <Text style={styles.requirement}>• Contraseña del certificado (opcional)</Text>
        <Text style={styles.requirement}>• Certificado emitido por el Ministerio de Hacienda</Text>
        <Text style={styles.requirement}>• Certificado vigente (no expirado)</Text>
      </View>

      <View style={styles.uploadSection}>
        <TouchableOpacity 
          style={[
            styles.selectButton, 
            selectedFile && styles.selectButtonSelected,
            uploading && styles.selectButtonDisabled
          ]}
          onPress={handleFileSelect}
          disabled={uploading}
        >
          <Text style={styles.selectButtonText}>
            {selectedFile ? `📁 ${selectedFile.name}` : '📁 Seleccionar Certificado'}
          </Text>
          {selectedFile && (
            <Text style={styles.fileDetails}>
              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
            </Text>
          )}
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.passwordSection}>
            <Text style={styles.label}>Contraseña del certificado:</Text>
            <TextInput
              style={[
                styles.passwordInput,
                password && confirmPassword && password !== confirmPassword && styles.passwordInputError
              ]}
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Ingrese la contraseña (opcional)"
              secureTextEntry
              editable={!uploading}
            />
            
            {password && (
              <View style={styles.confirmPasswordContainer}>
                <Text style={styles.label}>Confirmar contraseña:</Text>
                <TextInput
                  style={[
                    styles.passwordInput,
                    password && confirmPassword && password !== confirmPassword && styles.passwordInputError
                  ]}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirme la contraseña"
                  secureTextEntry
                  editable={!uploading}
                />
              </View>
            )}
          </View>
        )}

        {/* Validation Status */}
        {validation.message && (
          <View style={[
            styles.statusContainer,
            validation.isValid && styles.statusSuccess,
            validation.message.includes('no coinciden') && styles.statusError
          ]}>
            <Text style={[
              styles.statusText,
              validation.isValid && styles.statusTextSuccess,
              validation.message.includes('no coinciden') && styles.statusTextError
            ]}>
              {validation.message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>¿No tienes certificado digital?</Text>
        <Text style={styles.helpText}>
          Puedes solicitar tu certificado digital en el portal del Ministerio de Hacienda
        </Text>
        <TouchableOpacity style={styles.helpButton} onPress={openHaciendaPortal}>
          <Text style={styles.helpButtonText}>🔗 Ir al Portal de Hacienda</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.skipButton, uploading && styles.buttonDisabled]} 
          onPress={onSkip}
          disabled={uploading}
        >
          <Text style={styles.skipButtonText}>Configurar más tarde</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.uploadButton, 
            (!selectedFile || uploading) && styles.uploadButtonDisabled
          ]}
          onPress={handleUploadWithValidation}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.uploadButtonText}>Configurando...</Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>Configurar Certificado</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  companyBadge: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3182CE',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    marginTop: 10,
  },
  companyBadgeText: {
    fontSize: 12,
    color: '#3182CE',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 15,
  },
  requirement: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 10,
    marginBottom: 8,
  },
  uploadSection: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButton: {
    backgroundColor: '#EDF2F7',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3182CE',
    borderStyle: 'solid',
  },
  selectButtonDisabled: {
    backgroundColor: '#F7FAFC',
    borderColor: '#CBD5E0',
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  fileDetails: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  passwordSection: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  passwordInputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  confirmPasswordContainer: {
    marginTop: 15,
  },
  statusContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusSuccess: {
    backgroundColor: '#F0FFF4',
    borderColor: '#68D391',
  },
  statusError: {
    backgroundColor: '#FED7D7',
    borderColor: '#E53E3E',
  },
  statusText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
  },
  statusTextSuccess: {
    color: '#38A169',
  },
  statusTextError: {
    color: '#E53E3E',
  },
  helpSection: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 15,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: '#38A169',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    marginRight: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#3182CE',
    marginLeft: 10,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  companyName: {
    fontWeight: '600',
    color: '#3182CE',
  },
  certificateDetails: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: '#38A169',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
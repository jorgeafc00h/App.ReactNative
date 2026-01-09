import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { Company } from '../../types/company';
import { CertificateService } from '../../services/security/CertificateService';
import { useAppDispatch } from '../../store';
import { updateCompanyLocal } from '../../store/slices/companySlice';
import { isProductionCompany } from '../../utils/companyEnvironment';

interface CertificateCredentialsModalProps {
  visible: boolean;
  company: Company;
  onClose: () => void;
  onCredentialsUpdated: (isValid: boolean) => void;
}

/**
 * CertificateCredentialsModal - Matches Swift's CertificateUpdate functionality
 * Allows updating certificate password and uploading new certificates
 */
export const CertificateCredentialsModal: React.FC<CertificateCredentialsModalProps> = ({
  visible,
  company,
  onClose,
  onCredentialsUpdated,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isProduction = isProductionCompany(company);
  const certificateService = new CertificateService(isProduction);

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setIsValidating(false);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndUpdatePassword = async () => {
    // Validation
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor ingrese y confirme su contraseña');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    // Confirm dialog
    Alert.alert(
      '¿Desea actualizar la contraseña del certificado?',
      '',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar Cambios',
          onPress: async () => {
            setIsValidating(true);
            try {
              const result = await certificateService.updateCertificatePassword(
                password,
                confirmPassword,
                company
              );

              if (result.isValid) {
                // Get the encrypted password to update company state (matches Swift: company.certificatePassword = encryptedPassword)
                const nit = company.nit;
                if (!nit) {
                  throw new Error('La empresa no tiene NIT configurado');
                }
                const encryptedPassword = await certificateService.getCertificatePassword(nit);
                
                // Update company in Redux state with encrypted password and certificate status
                dispatch(updateCompanyLocal({
                  id: company.id,
                  updates: {
                    certificatePassword: encryptedPassword || '',
                    hasValidCertificate: true,
                    updatedAt: new Date().toISOString()
                  }
                }));

                Alert.alert('Éxito', result.message);
                onCredentialsUpdated(true);
                handleClose();
              } else {
                Alert.alert('Error', result.message);
                onCredentialsUpdated(false);
              }
            } catch (error) {
              Alert.alert('Error', 'Error al actualizar la contraseña del certificado');
              onCredentialsUpdated(false);
            } finally {
              setIsValidating(false);
            }
          },
        },
      ]
    );
  };

  const handleUploadCertificate = async () => {
    Alert.alert(
      '¿Desea actualizar el certificado?',
      '',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Seleccionar Archivo',
          onPress: async () => {
            setIsUploading(true);
            try {
              const certificateFile = await certificateService.selectCertificateFile();
              
              if (!certificateFile) {
                Alert.alert('Info', 'No se seleccionó ningún archivo o la función no está disponible aún');
                return;
              }

              const result = await certificateService.uploadCertificate(certificateFile, company);
              
              if (result.success) {
                // Update company in Redux state when certificate is uploaded successfully
                dispatch(updateCompanyLocal({
                  id: company.id,
                  updates: {
                    certificatePath: certificateFile.name, // Store the certificate file name
                    updatedAt: new Date().toISOString()
                  }
                }));

                Alert.alert('Éxito', result.message);
                onCredentialsUpdated(true);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Error al cargar el certificado');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: '#1E3A5F' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close-circle" size={28} color="#0EA5E9" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Credenciales de Certificado</Text>
          
          <View style={styles.headerButton} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={55} color="#0EA5E9" />
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Ingrese su contraseña privada del certificado Hacienda (firma de DTE)
          </Text>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Introduce tu nueva contraseña"
                placeholderTextColor="rgba(174, 177, 185, 1)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#0EA5E9" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor="rgba(174, 177, 185, 1)"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#0EA5E9" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </View>

          {/* Update Password Button */}
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={validateAndUpdatePassword}
            disabled={isValidating}
          >
            {isValidating ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.buttonText}>Validando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Actualiza contraseña</Text>
            )}
          </TouchableOpacity>

          {/* Upload Certificate Button */}
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={handleUploadCertificate}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.buttonText}>Actualizando...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text style={styles.buttonText}>Sincronizar Certificado</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Certificate Status */}
          {company.certificatePath && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>Certificado Activo</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 42,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  instructions: {
    color: '#0EA5E9',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
  },
  eyeButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#0EA5E9',
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 3,
    borderColor: '#0EA5E9',
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  statusText: {
    color: '#10B981',
    fontSize: 14,
  },
});

export default CertificateCredentialsModal;

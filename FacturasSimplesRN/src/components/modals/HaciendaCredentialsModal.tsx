import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { Company } from '../../types/company';
import { useDispatch } from 'react-redux';
import { updateCompanyLocal } from '../../store/slices/companySlice';
import { InvoiceService } from '../../services/api/InvoiceService';
import { SecureStorageService } from '../../services/security/SecureStorageService';
import { isProductionCompany } from '../../utils/companyEnvironment';

interface HaciendaCredentialsModalProps {
  visible: boolean;
  company: Company;
  required?: boolean;
  onClose: () => void;
  onCredentialsUpdated: (isValid: boolean) => void;
}

/**
 * HaciendaCredentialsModal - Matches Swift's EditProfileView functionality
 * Allows updating Hacienda API credentials (password)
 */
export const HaciendaCredentialsModal: React.FC<HaciendaCredentialsModalProps> = ({
  visible,
  company,
  required = false,
  onClose,
  onCredentialsUpdated,
}) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCredentialsChecker, setShowCredentialsChecker] = useState(false);

  const isProduction = isProductionCompany(company);
  const invoiceService = new InvoiceService(isProduction);

  useEffect(() => {
    if (visible) {
      // Evaluate if we should show credentials checker or edit form
      evaluateDisplayCredentialsChecker();
    }
  }, [visible]);

  const evaluateDisplayCredentialsChecker = async () => {
    // Check if credentials are already configured
    const hasCredentials = company.credentials && company.credentials.length > 0;
    
    if (hasCredentials && !required) {
      setShowCredentialsChecker(true);
      verifyExistingCredentials();
    } else {
      setShowCredentialsChecker(false);
    }
  };

  const verifyExistingCredentials = async () => {
    if (!company.nit) return;
    
    setIsCheckingCredentials(true);
    try {
      const isValid = await invoiceService.validateCredentials(
        company.nit,
        company.credentials || '',
        false
      );
      
      if (isValid) {
        onCredentialsUpdated(true);
      } else {
        setShowCredentialsChecker(false);
        onCredentialsUpdated(false);
      }
    } catch (error) {
      console.error('Error verifying credentials:', error);
      setShowCredentialsChecker(false);
    } finally {
      setIsCheckingCredentials(false);
    }
  };

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setIsValidating(false);
    setShowCredentialsChecker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


  const validateAndUpdateCredentials = async () => {
    // Validation
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor ingrese y confirme su contraseña');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!company.nit) {
      Alert.alert('Error', 'El NIT de la empresa no está configurado');
      return;
    }

    // Confirm dialog
    Alert.alert(
      '¿Desea actualizar las credenciales de hacienda?',
      '',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar Cambios',
          onPress: async () => {
            setIsValidating(true);
            try {
              // Validate with government API using PLAIN TEXT password
              // Note: validateCredentials expects plain text, only certificate passwords are encrypted
              const isValid = await invoiceService.validateCredentials(
                company.nit!,
                password, // Send as plain text - matches Swift implementation
                true // Force refresh
              );

              if (isValid) {
                // Store government credentials as PLAIN TEXT (matches Swift implementation)
                // Note: Only certificate passwords are encrypted - government credentials are stored as plain text
                await SecureStorageService.storeCredentials(company.nit!, {
                  user: company.nit!,
                  password: password, // Store as plain text - matches Swift exactly
                });
                
                // Update Redux store with plain text password (matches Swift implementation)
                dispatch(updateCompanyLocal({
                  id: company.id,
                  updates: {
                    credentials: password, // Store as plain text in Redux - matches Swift
                    hasApiCredentials: true,
                    updatedAt: new Date().toISOString()
                  }
                }));
                
                Alert.alert('Éxito', 'Credenciales actualizadas correctamente');
                onCredentialsUpdated(true);
                handleClose();
              } else {
                Alert.alert(
                  'Error',
                  'Error al actualizar credenciales. Verifique su contraseña en el portal de Hacienda.'
                );
                onCredentialsUpdated(false);
              }
            } catch (error) {
              Alert.alert('Error', 'Error al actualizar las credenciales');
              onCredentialsUpdated(false);
            } finally {
              setIsValidating(false);
            }
          },
        },
      ]
    );
  };

  // Credentials Checker View (when credentials already exist)
  const renderCredentialsChecker = () => (
    <View style={styles.checkerContainer}>
      {isCheckingCredentials ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Verificando credenciales...</Text>
        </View>
      ) : (
        <View style={styles.checkerContent}>
          <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          <Text style={styles.checkerTitle}>Credenciales Configuradas</Text>
          <Text style={styles.checkerSubtitle}>
            Sus credenciales de Hacienda están configuradas correctamente.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => setShowCredentialsChecker(false)}
          >
            <Text style={styles.buttonText}>Actualizar Contraseña</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Edit Credentials View
  const renderEditCredentials = () => (
    <View style={styles.formContainer}>
      {/* Password Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Introduce tu contraseña de Hacienda (API)"
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
            placeholder="Confirma tu contraseña de Hacienda (API)"
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

      {/* Update Button */}
      <TouchableOpacity
        style={[
          styles.button, 
          styles.outlineButton,
          (!password || !confirmPassword) && styles.disabledButton
        ]}
        onPress={validateAndUpdateCredentials}
        disabled={isValidating || !password || !confirmPassword}
      >
        {isValidating ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.buttonText}>Actualizando...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Actualiza contraseña</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
          
          <Text style={styles.headerTitle}>Credenciales Hacienda</Text>
          
          <View style={styles.headerButton} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="key" size={40} color="#0EA5E9" />
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            {required 
              ? 'Aun no estan configuradas sus credenciales de Hacienda es importante para poder enviar DTE y poder emitir facturas'
              : 'Configurar credenciales'
            }
          </Text>

          {showCredentialsChecker ? renderCredentialsChecker() : renderEditCredentials()}

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
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 35,
    marginBottom: 18,
  },
  formContainer: {
    paddingHorizontal: 42,
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
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 3,
    borderColor: '#0EA5E9',
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkerContainer: {
    paddingHorizontal: 42,
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#0EA5E9',
    fontSize: 16,
    marginTop: 16,
  },
  checkerContent: {
    alignItems: 'center',
  },
  checkerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  checkerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});

export default HaciendaCredentialsModal;

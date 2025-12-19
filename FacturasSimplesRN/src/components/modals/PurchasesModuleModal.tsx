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
  Switch,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';

interface PurchasesModuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: EmailReaderSettings) => void;
}

export interface EmailReaderSettings {
  emailAddress: string;
  emailPassword: string;
  imapServer: string;
  imapPort: string;
  useSSL: boolean;
  isEnabled: boolean;
}

/**
 * PurchasesModuleModal - Matches Swift's EmailReaderSettings functionality
 * Allows configuring email reader settings for reading purchase invoices
 */
export const PurchasesModuleModal: React.FC<PurchasesModuleModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<EmailReaderSettings>({
    emailAddress: '',
    emailPassword: '',
    imapServer: 'imap.gmail.com',
    imapPort: '993',
    useSSL: true,
    isEnabled: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateSetting = <K extends keyof EmailReaderSettings>(
    key: K,
    value: EmailReaderSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const validateSettings = (): boolean => {
    if (!settings.emailAddress.trim()) {
      Alert.alert('Error', 'Por favor ingrese la dirección de email');
      return false;
    }
    if (!settings.emailPassword.trim()) {
      Alert.alert('Error', 'Por favor ingrese la contraseña');
      return false;
    }
    if (!settings.imapServer.trim()) {
      Alert.alert('Error', 'Por favor ingrese el servidor IMAP');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateSettings()) return;

    Alert.alert(
      '¿Guardar configuración?',
      'Se guardará la configuración del lector de emails para compras.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: () => {
            onSave(settings);
            onClose();
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
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Módulo Compras
          </Text>
          
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: theme.colors.surface.secondary }]}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              Configure su correo electrónico para leer automáticamente facturas de compra 
              recibidas por email. Esto le permitirá tener un registro de sus compras.
            </Text>
          </View>

          {/* Enable Toggle */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
                  Habilitar Módulo
                </Text>
                <Text style={[styles.toggleDescription, { color: theme.colors.text.secondary }]}>
                  Activar lectura automática de emails
                </Text>
              </View>
              <Switch
                value={settings.isEnabled}
                onValueChange={(value) => updateSetting('isEnabled', value)}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
              />
            </View>
          </View>

          {/* Email Settings */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Configuración de Email
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Dirección de Email
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surface.secondary,
                }]}
                value={settings.emailAddress}
                onChangeText={(text) => updateSetting('emailAddress', text)}
                placeholder="ejemplo@gmail.com"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Contraseña / App Password
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { 
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.surface.secondary,
                  }]}
                  value={settings.emailPassword}
                  onChangeText={(text) => updateSetting('emailPassword', text)}
                  placeholder="Contraseña de aplicación"
                  placeholderTextColor={theme.colors.text.tertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.helpText, { color: theme.colors.text.tertiary }]}>
                Para Gmail, use una "Contraseña de aplicación" en lugar de su contraseña normal.
              </Text>
            </View>
          </View>

          {/* Server Settings */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Configuración del Servidor
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Servidor IMAP
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surface.secondary,
                }]}
                value={settings.imapServer}
                onChangeText={(text) => updateSetting('imapServer', text)}
                placeholder="imap.gmail.com"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Puerto IMAP
              </Text>
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surface.secondary,
                }]}
                value={settings.imapPort}
                onChangeText={(text) => updateSetting('imapPort', text)}
                placeholder="993"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
                  Usar SSL/TLS
                </Text>
                <Text style={[styles.toggleDescription, { color: theme.colors.text.secondary }]}>
                  Conexión segura (recomendado)
                </Text>
              </View>
              <Switch
                value={settings.useSSL}
                onValueChange={(value) => updateSetting('useSSL', value)}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
              />
            </View>
          </View>

          {/* Common Servers Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Servidores Comunes
            </Text>
            
            <View style={styles.serverList}>
              <View style={styles.serverItem}>
                <Text style={[styles.serverName, { color: theme.colors.text.primary }]}>Gmail</Text>
                <Text style={[styles.serverInfo, { color: theme.colors.text.secondary }]}>
                  imap.gmail.com:993
                </Text>
              </View>
              <View style={styles.serverItem}>
                <Text style={[styles.serverName, { color: theme.colors.text.primary }]}>Outlook</Text>
                <Text style={[styles.serverInfo, { color: theme.colors.text.secondary }]}>
                  outlook.office365.com:993
                </Text>
              </View>
              <View style={styles.serverItem}>
                <Text style={[styles.serverName, { color: theme.colors.text.primary }]}>Yahoo</Text>
                <Text style={[styles.serverInfo, { color: theme.colors.text.secondary }]}>
                  imap.mail.yahoo.com:993
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 17,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  helpText: {
    fontSize: 12,
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  serverList: {
    gap: 12,
  },
  serverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  serverName: {
    fontSize: 15,
    fontWeight: '500',
  },
  serverInfo: {
    fontSize: 14,
  },
});

export default PurchasesModuleModal;

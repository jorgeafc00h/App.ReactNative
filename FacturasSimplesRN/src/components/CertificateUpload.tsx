import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

interface CertificateUploadProps {
  onUploadSuccess: (certificateData: CertificateData) => void;
  onSkip: () => void;
}

interface CertificateData {
  fileName: string;
  password: string;
  subject?: string;
  issuer?: string;
  expiryDate?: string;
}

export const CertificateUpload: React.FC<CertificateUploadProps> = ({
  onUploadSuccess,
  onSkip,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async () => {
    try {
      // In a real implementation, you would use DocumentPicker
      // For now, simulate file selection
      Alert.alert(
        'Seleccionar Certificado',
        'En una implementación real, aquí se abriría el selector de archivos para elegir un certificado .p12 o .pfx',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Simular Selección',
            onPress: () => {
              setSelectedFile('certificado_empresa.p12');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Debe seleccionar un certificado');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Debe ingresar la contraseña del certificado');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate certificate validation and upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const certificateData: CertificateData = {
        fileName: selectedFile,
        password: password,
        subject: 'CN=EMPRESA EJEMPLO S.A. DE C.V., O=EMPRESA EJEMPLO, C=SV',
        issuer: 'CN=MINISTERIO DE HACIENDA, O=GOBIERNO DE EL SALVADOR, C=SV',
        expiryDate: '2025-12-31',
      };
      
      Alert.alert(
        'Éxito',
        'Certificado validado y configurado correctamente',
        [{ text: 'OK', onPress: () => onUploadSuccess(certificateData) }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el certificado');
    } finally {
      setLoading(false);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración de Certificado Digital</Text>
      <Text style={styles.subtitle}>
        El certificado es necesario para firmar documentos tributarios electrónicos
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requisitos:</Text>
        <Text style={styles.requirement}>• Archivo de certificado (.p12 o .pfx)</Text>
        <Text style={styles.requirement}>• Contraseña del certificado</Text>
        <Text style={styles.requirement}>• Certificado emitido por el Ministerio de Hacienda</Text>
        <Text style={styles.requirement}>• Certificado vigente (no expirado)</Text>
      </View>

      <View style={styles.uploadSection}>
        <TouchableOpacity 
          style={[styles.selectButton, selectedFile && styles.selectButtonSelected]}
          onPress={handleFileSelect}
        >
          <Text style={styles.selectButtonText}>
            {selectedFile ? `📁 ${selectedFile}` : '📁 Seleccionar Certificado'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.passwordSection}>
            <Text style={styles.label}>Contraseña del certificado:</Text>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingrese la contraseña"
              secureTextEntry
            />
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
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Configurar más tarde</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.uploadButton, (!selectedFile || !password || loading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!selectedFile || !password || loading}
        >
          <Text style={styles.uploadButtonText}>
            {loading ? 'Procesando...' : 'Configurar Certificado'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 30,
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
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
    borderRadius: 12,
    marginBottom: 20,
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
  selectButtonText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
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
  helpSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
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
    marginTop: 'auto',
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
});
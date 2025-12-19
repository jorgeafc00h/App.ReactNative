import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { Company, CompanyEnvironment } from '../../types/company';

interface RequestProductionAccessModalProps {
  visible: boolean;
  company: Company;
  onClose: () => void;
  onCompletion: (productionCompany?: Company) => void;
}

// Document types for production authorization process
type DocumentType = 
  | 'factura' 
  | 'ccf' 
  | 'notaCredito' 
  | 'sujetoExcluido' 
  | 'notaDebito' 
  | 'facturaExportacion';

interface DocumentTypeConfig {
  id: DocumentType;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  dependency?: string;
}

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  { id: 'factura', name: 'Facturas', shortName: 'Facturas', icon: 'document-text', color: '#3B82F6' },
  { id: 'ccf', name: 'Créditos Fiscales', shortName: 'CCF', icon: 'document-text', color: '#10B981' },
  { id: 'notaCredito', name: 'Notas de Crédito', shortName: 'NC', icon: 'swap-horizontal', color: '#F59E0B', dependency: 'ccf' },
  { id: 'sujetoExcluido', name: 'Sujetos Excluidos', shortName: 'SE', icon: 'person-remove', color: '#8B5CF6' },
  { id: 'notaDebito', name: 'Notas de Débito', shortName: 'ND', icon: 'swap-horizontal', color: '#EF4444', dependency: 'ccf' },
  { id: 'facturaExportacion', name: 'Facturas de Exportación', shortName: 'FE', icon: 'globe', color: '#6366F1' },
];

/**
 * RequestProductionAccessModal - Matches Swift's RequestProductionView functionality
 * Guides user through the process of requesting production access by generating test invoices
 */
export const RequestProductionAccessModal: React.FC<RequestProductionAccessModalProps> = ({
  visible,
  company,
  onClose,
  onCompletion,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedTypes, setProcessedTypes] = useState<Set<DocumentType>>(new Set());
  const [processingProgress, setProcessingProgress] = useState<{ [key: string]: number }>({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Handle close confirmation alert in useEffect
  useEffect(() => {
    if (showCloseConfirm) {
      Alert.alert(
        '¿Cancelar proceso?',
        'Se perderá el progreso actual.',
        [
          { 
            text: 'Continuar proceso', 
            style: 'cancel',
            onPress: () => setShowCloseConfirm(false),
          },
          {
            text: 'Cancelar',
            style: 'destructive',
            onPress: () => {
              setShowCloseConfirm(false);
              onClose();
            },
          },
        ]
      );
    }
  }, [showCloseConfirm, onClose]);

  const handleClose = () => {
    if (isProcessing) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const openHaciendaPortal = async () => {
    const url = 'https://admin.factura.gob.sv/login';
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el portal de Hacienda');
    }
  };

  const processDocumentType = async (docType: DocumentType) => {
    const config = DOCUMENT_TYPES.find(d => d.id === docType);
    if (!config) return;

    // Check dependency
    if (config.dependency && !processedTypes.has(config.dependency as DocumentType)) {
      Alert.alert(
        'Dependencia requerida',
        `Primero debe procesar ${DOCUMENT_TYPES.find(d => d.id === config.dependency)?.name || 'el documento base'}`
      );
      return;
    }

    Alert.alert(
      `¿Procesar ${config.name}?`,
      'Se generarán documentos de prueba para el proceso de autorización.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Procesar',
          onPress: async () => {
            setIsProcessing(true);
            setProcessingProgress(prev => ({ ...prev, [docType]: 0 }));

            try {
              // Simulate processing with progress
              for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                setProcessingProgress(prev => ({ ...prev, [docType]: i }));
              }

              // TODO: Implement actual document generation logic
              // This would call the API to generate test documents

              setProcessedTypes(prev => new Set([...prev, docType]));
              Alert.alert('Éxito', `${config.name} procesados correctamente`);
            } catch (error) {
              Alert.alert('Error', `Error al procesar ${config.name}`);
            } finally {
              setIsProcessing(false);
              setProcessingProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[docType];
                return newProgress;
              });
            }
          },
        },
      ]
    );
  };

  const processAllDocuments = async () => {
    Alert.alert(
      '¿Procesar todos los documentos?',
      'Se generarán todos los documentos de prueba necesarios para el proceso de autorización a producción.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Procesar Todo',
          onPress: async () => {
            setIsProcessing(true);

            try {
              for (const docType of DOCUMENT_TYPES) {
                if (processedTypes.has(docType.id)) continue;
                
                // Check dependency
                if (docType.dependency && !processedTypes.has(docType.dependency as DocumentType)) {
                  continue;
                }

                setProcessingProgress(prev => ({ ...prev, [docType.id]: 0 }));
                
                for (let i = 0; i <= 100; i += 10) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                  setProcessingProgress(prev => ({ ...prev, [docType.id]: i }));
                }

                setProcessedTypes(prev => new Set([...prev, docType.id]));
                setProcessingProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[docType.id];
                  return newProgress;
                });
              }

              Alert.alert('Éxito', 'Todos los documentos han sido procesados correctamente');
            } catch (error) {
              Alert.alert('Error', 'Error al procesar los documentos');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const completeProcess = () => {
    Alert.alert(
      '¿Completar proceso?',
      'Una vez completado, deberá solicitar la autorización a producción en el portal de Hacienda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: () => {
            // Create production company with isTestAccount = false
            const productionCompany: Company = {
              ...company,
              id: `${company.id}_prod`,
              environment: CompanyEnvironment.Production,
              isTestAccount: false, // This is the key field - false means production
            };
            
            onCompletion(productionCompany);
            onClose();
          },
        },
      ]
    );
  };

  const allProcessed = DOCUMENT_TYPES.every(d => 
    processedTypes.has(d.id) || (d.dependency && !processedTypes.has(d.dependency as DocumentType))
  );

  // Steps content
  const renderIntroStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.imageContainer}>
        <View style={[styles.imagePlaceholder, { backgroundColor: '#F59E0B20' }]}>
          <Ionicons name="shield-checkmark" size={80} color="#F59E0B" />
        </View>
      </View>

      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Proceso de Autorización a Producción
      </Text>
      
      <Text style={[styles.stepSubtitle, { color: theme.colors.text.secondary }]}>
        Para solicitar autorización a producción en Hacienda, debe generar documentos de prueba 
        para cada tipo de DTE que desea emitir.
      </Text>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={openHaciendaPortal}
      >
        <Ionicons name="open" size={16} color={theme.colors.primary} />
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          Ir al portal de Hacienda Facturación Electrónica
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: '#1E293B' }]}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.continueButtonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Generar Documentos de Prueba
      </Text>
      
      <Text style={[styles.stepSubtitle, { color: theme.colors.text.secondary }]}>
        Seleccione cada tipo de documento para generar las pruebas necesarias.
      </Text>

      <View style={styles.documentList}>
        {DOCUMENT_TYPES.map((docType) => {
          const isProcessed = processedTypes.has(docType.id);
          const hasDependency = docType.dependency && !processedTypes.has(docType.dependency as DocumentType);
          const isCurrentlyProcessing = processingProgress[docType.id] !== undefined;
          const progress = processingProgress[docType.id] || 0;

          return (
            <TouchableOpacity
              key={docType.id}
              style={[
                styles.documentItem,
                { backgroundColor: theme.colors.surface.primary },
                isProcessed && styles.documentItemProcessed,
                hasDependency && styles.documentItemDisabled,
              ]}
              onPress={() => !hasDependency && !isCurrentlyProcessing && processDocumentType(docType.id)}
              disabled={hasDependency || isCurrentlyProcessing}
            >
              <View style={[styles.documentIcon, { backgroundColor: `${docType.color}20` }]}>
                <Ionicons name={docType.icon as any} size={24} color={docType.color} />
              </View>
              
              <View style={styles.documentInfo}>
                <Text style={[
                  styles.documentName, 
                  { color: hasDependency ? theme.colors.text.tertiary : theme.colors.text.primary }
                ]}>
                  {docType.name}
                </Text>
                {docType.dependency && (
                  <Text style={[styles.documentDependency, { color: theme.colors.text.tertiary }]}>
                    Requiere: {DOCUMENT_TYPES.find(d => d.id === docType.dependency)?.shortName}
                  </Text>
                )}
                {isCurrentlyProcessing && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: docType.color }]} />
                  </View>
                )}
              </View>

              <View style={styles.documentStatus}>
                {isProcessed ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : isCurrentlyProcessing ? (
                  <ActivityIndicator size="small" color={docType.color} />
                ) : (
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={hasDependency ? theme.colors.text.tertiary : theme.colors.text.secondary} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Process All Button */}
      <TouchableOpacity
        style={[
          styles.processAllButton,
          { 
            backgroundColor: isProcessing ? theme.colors.surface.secondary : theme.colors.primary,
            opacity: isProcessing ? 0.7 : 1,
          }
        ]}
        onPress={processAllDocuments}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="rocket" size={20} color="white" />
            <Text style={styles.processAllText}>Procesar Todos</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Complete Button */}
      {processedTypes.size > 0 && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: '#10B981' }]}
          onPress={completeProcess}
        >
          <Ionicons name="checkmark-done" size={20} color="white" />
          <Text style={styles.completeButtonText}>Completar Proceso</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: '#FEF3C7' }]}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 0 && (
            <TouchableOpacity 
              onPress={() => setCurrentStep(prev => prev - 1)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Ionicons name="close-circle" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {currentStep === 0 ? renderIntroStep() : renderProcessStep()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 30,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: width * 0.4,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  documentList: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  documentItemProcessed: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  documentItemDisabled: {
    opacity: 0.5,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentDependency: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  documentStatus: {
    width: 30,
    alignItems: 'center',
  },
  processAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
  processAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequestProductionAccessModal;

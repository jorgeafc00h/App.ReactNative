// Contingency Status Banner Component
// Shows contingency mode status and pending requests

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useContingencyRequests } from '../../hooks/useContingencyRequests';
import { ContingencyRequest } from '../../services/contingency/ContingencyService';

interface ContingencyStatusBannerProps {
  showDetails?: boolean;
  onRequestsChange?: (pendingCount: number) => void;
}

export const ContingencyStatusBanner: React.FC<ContingencyStatusBannerProps> = ({
  showDetails = false,
  onRequestsChange,
}) => {
  const { theme } = useTheme();
  const {
    isContingencyMode,
    pendingRequests,
    allRequests,
    stats,
    submitPendingRequests,
    removeRequest,
    cleanupOldRequests,
    isAutoSubmissionActive,
    startAutoSubmission,
    stopAutoSubmission,
    refreshRequests,
    checkContingencyMode,
  } = useContingencyRequests();

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notify parent of pending requests count changes
  React.useEffect(() => {
    onRequestsChange?.(stats.pendingRequests);
  }, [stats.pendingRequests, onRequestsChange]);

  const handleSubmitPending = async () => {
    if (stats.pendingRequests === 0) return;

    setIsSubmitting(true);
    
    try {
      const result = await submitPendingRequests();
      
      if (result.success) {
        Alert.alert(
          'Envío Completado',
          `Se enviaron ${result.submitted} facturas correctamente.${result.failed > 0 ? ` ${result.failed} fallaron.` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error en Envío',
          `No se pudieron enviar las facturas pendientes. ${result.failed} intentos fallaron.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Ocurrió un error al enviar las facturas pendientes.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshRequests(),
      checkContingencyMode(),
    ]);
    setIsRefreshing(false);
  };

  const handleRemoveRequest = async (requestId: string, invoiceNumber: string) => {
    Alert.alert(
      'Eliminar Solicitud',
      `¿Está seguro que desea eliminar la solicitud de contingencia para la factura ${invoiceNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeRequest(requestId);
            if (!success) {
              Alert.alert('Error', 'No se pudo eliminar la solicitud.');
            }
          },
        },
      ]
    );
  };

  const handleCleanup = async () => {
    const removedCount = await cleanupOldRequests();
    if (removedCount > 0) {
      Alert.alert(
        'Limpieza Completada',
        `Se eliminaron ${removedCount} solicitudes antiguas.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Sin Cambios',
        'No se encontraron solicitudes antiguas para eliminar.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRequestStatusColor = (request: ContingencyRequest): string => {
    if (request.isSubmitted) return '#10B981';
    if (request.submissionAttempts >= 5) return '#EF4444';
    if (request.submissionAttempts > 0) return '#F59E0B';
    return '#3B82F6';
  };

  const getRequestStatusText = (request: ContingencyRequest): string => {
    if (request.isSubmitted) return 'Enviada';
    if (request.submissionAttempts >= 5) return 'Falló';
    if (request.submissionAttempts > 0) return `Reintentando (${request.submissionAttempts})`;
    return 'Pendiente';
  };

  // Don't show banner if there's nothing to show
  if (!isContingencyMode && stats.pendingRequests === 0 && !showDetails) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      <TouchableOpacity
        style={[
          styles.banner,
          {
            backgroundColor: isContingencyMode 
              ? theme.colors.error + '15' 
              : stats.pendingRequests > 0 
                ? theme.colors.warning + '15'
                : theme.colors.success + '15',
            borderColor: isContingencyMode 
              ? theme.colors.error 
              : stats.pendingRequests > 0
                ? theme.colors.warning
                : theme.colors.success,
          }
        ]}
        onPress={() => setShowModal(true)}
        disabled={!showDetails && stats.pendingRequests === 0}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerIcon}>
            {isContingencyMode ? '🚨' : stats.pendingRequests > 0 ? '📤' : '✅'}
          </Text>
          
          <View style={styles.bannerTextContainer}>
            <Text
              style={[
                styles.bannerTitle,
                {
                  color: isContingencyMode 
                    ? theme.colors.error 
                    : stats.pendingRequests > 0
                      ? theme.colors.warning
                      : theme.colors.success,
                }
              ]}
            >
              {isContingencyMode 
                ? 'Modo Contingencia Activo'
                : stats.pendingRequests > 0
                  ? `${stats.pendingRequests} Facturas Pendientes`
                  : 'Sistema Normal'
              }
            </Text>
            
            <Text style={[styles.bannerSubtitle, { color: theme.colors.text.secondary }]}>
              {isContingencyMode
                ? 'API del gobierno no disponible'
                : stats.pendingRequests > 0
                  ? `Auto-envío ${isAutoSubmissionActive ? 'activo' : 'inactivo'}`
                  : 'Todas las facturas enviadas'
              }
            </Text>
          </View>

          {/* Quick Action Button */}
          {stats.pendingRequests > 0 && (
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmitPending}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.quickActionText}>Enviar</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Detailed Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border.light }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.colors.primary }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Estado de Contingencia
            </Text>
            
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={[styles.modalRefreshButton, { color: theme.colors.primary }]}>
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
          >
            {/* Status Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Estado del Sistema
              </Text>
              
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
                  API del Gobierno:
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: isContingencyMode ? theme.colors.error : theme.colors.success }
                  ]}
                >
                  {isContingencyMode ? 'No Disponible' : 'Disponible'}
                </Text>
              </View>
              
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
                  Auto-envío:
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: isAutoSubmissionActive ? theme.colors.success : theme.colors.text.secondary }
                  ]}
                >
                  {isAutoSubmissionActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>

            {/* Statistics Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Estadísticas
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                    {stats.totalRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Total
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                    {stats.pendingRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Pendientes
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                    {stats.submittedRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Enviadas
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                    {stats.failedRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    Fallidas
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Acciones
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: theme.colors.primary + '15',
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={handleSubmitPending}
                disabled={stats.pendingRequests === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                    📤 Enviar Pendientes ({stats.pendingRequests})
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: isAutoSubmissionActive 
                      ? theme.colors.error + '15' 
                      : theme.colors.success + '15',
                    borderColor: isAutoSubmissionActive 
                      ? theme.colors.error 
                      : theme.colors.success 
                  }
                ]}
                onPress={isAutoSubmissionActive ? stopAutoSubmission : startAutoSubmission}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { 
                      color: isAutoSubmissionActive 
                        ? theme.colors.error 
                        : theme.colors.success 
                    }
                  ]}
                >
                  {isAutoSubmissionActive ? '🛑 Detener Auto-envío' : '▶️ Iniciar Auto-envío'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: theme.colors.text.secondary + '15',
                    borderColor: theme.colors.text.secondary 
                  }
                ]}
                onPress={handleCleanup}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.text.secondary }]}>
                  🧹 Limpiar Solicitudes Antiguas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Requests List */}
            {allRequests.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Solicitudes de Contingencia
                </Text>
                
                {allRequests.map((request) => (
                  <View key={request.id} style={[styles.requestItem, { borderColor: theme.colors.border.light }]}>
                    <View style={styles.requestHeader}>
                      <Text style={[styles.requestInvoice, { color: theme.colors.text.primary }]}>
                        {request.invoice.invoiceNumber}
                      </Text>
                      
                      <View style={styles.requestStatusContainer}>
                        <View
                          style={[
                            styles.requestStatusDot,
                            { backgroundColor: getRequestStatusColor(request) }
                          ]}
                        />
                        <Text
                          style={[
                            styles.requestStatus,
                            { color: getRequestStatusColor(request) }
                          ]}
                        >
                          {getRequestStatusText(request)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.requestDate, { color: theme.colors.text.secondary }]}>
                      Creada: {formatDate(request.createdAt)}
                    </Text>
                    
                    {request.lastAttemptAt && (
                      <Text style={[styles.requestDate, { color: theme.colors.text.secondary }]}>
                        Último intento: {formatDate(request.lastAttemptAt)}
                      </Text>
                    )}
                    
                    {request.lastError && (
                      <Text style={[styles.requestError, { color: theme.colors.error }]}>
                        Error: {request.lastError}
                      </Text>
                    )}
                    
                    {!request.isSubmitted && (
                      <TouchableOpacity
                        style={styles.requestRemoveButton}
                        onPress={() => handleRemoveRequest(request.id, request.invoice.invoiceNumber)}
                      >
                        <Text style={[styles.requestRemoveText, { color: theme.colors.error }]}>
                          🗑️ Eliminar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
  },
  quickActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalRefreshButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestInvoice: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  requestError: {
    fontSize: 12,
    marginTop: 4,
  },
  requestRemoveButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  requestRemoveText: {
    fontSize: 14,
  },
});

export default ContingencyStatusBanner;
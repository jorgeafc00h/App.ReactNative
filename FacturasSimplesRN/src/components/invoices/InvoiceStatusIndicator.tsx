// Real-time Invoice Status Indicator Component
// Shows live status updates and tracking progress

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useInvoiceStatusTracking } from '../../hooks/useInvoiceStatusTracking';
import { Invoice, InvoiceStatus } from '../../types/invoice';

interface InvoiceStatusIndicatorProps {
  invoice: Invoice;
  showTrackingControls?: boolean;
  showLastUpdate?: boolean;
  compact?: boolean;
  onStatusUpdate?: (newStatus: InvoiceStatus) => void;
}

export const InvoiceStatusIndicator: React.FC<InvoiceStatusIndicatorProps> = ({
  invoice,
  showTrackingControls = false,
  showLastUpdate = false,
  compact = false,
  onStatusUpdate,
}) => {
  const { theme } = useTheme();
  const {
    isTracking,
    trackedInvoices,
    startTracking,
    stopTracking,
    lastStatusUpdate,
  } = useInvoiceStatusTracking();

  const [pulseAnimation] = useState(new Animated.Value(1));
  const [lastKnownStatus, setLastKnownStatus] = useState(invoice.status);

  const isThisInvoiceTracked = trackedInvoices.includes(invoice.id);
  const canBeTracked = invoice.status === InvoiceStatus.Sincronizando && invoice.controlNumber;

  // Handle status changes
  useEffect(() => {
    if (lastStatusUpdate && lastStatusUpdate.invoiceId === invoice.id) {
      setLastKnownStatus(lastStatusUpdate.newStatus);
      onStatusUpdate?.(lastStatusUpdate.newStatus);
      
      // Flash animation on status update
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 0.7, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [lastStatusUpdate, invoice.id, onStatusUpdate, pulseAnimation]);

  // Pulsing animation for tracking status
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation;
    
    if (isThisInvoiceTracked && invoice.status === InvoiceStatus.Sincronizando) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnimation, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
    }
    
    return () => {
      pulseLoop?.stop();
    };
  }, [isThisInvoiceTracked, invoice.status, pulseAnimation]);

  // Get status color
  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return '#F59E0B';
      case InvoiceStatus.Sincronizando:
        return '#3B82F6';
      case InvoiceStatus.Completada:
        return '#10B981';
      case InvoiceStatus.Anulada:
        return '#EF4444';
      case InvoiceStatus.Modificada:
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  // Get status text
  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return 'Nueva';
      case InvoiceStatus.Sincronizando:
        return isThisInvoiceTracked ? 'Sincronizando...' : 'Sincronizando';
      case InvoiceStatus.Completada:
        return 'Completada';
      case InvoiceStatus.Anulada:
        return 'Anulada';
      case InvoiceStatus.Modificada:
        return 'Modificada';
      default:
        return 'Desconocido';
    }
  };

  // Get status icon
  const getStatusIcon = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Nueva:
        return '📝';
      case InvoiceStatus.Sincronizando:
        return isThisInvoiceTracked ? '🔄' : '⏳';
      case InvoiceStatus.Completada:
        return '✅';
      case InvoiceStatus.Anulada:
        return '❌';
      case InvoiceStatus.Modificada:
        return '🔄';
      default:
        return '❓';
    }
  };

  const handleTrackingToggle = () => {
    if (isThisInvoiceTracked) {
      stopTracking(invoice.id);
    } else if (canBeTracked) {
      startTracking(invoice);
    }
  };

  const statusColor = getStatusColor(lastKnownStatus);
  const statusText = getStatusText(lastKnownStatus);
  const statusIcon = getStatusIcon(lastKnownStatus);

  if (compact) {
    return (
      <Animated.View 
        style={[
          styles.compactContainer, 
          { backgroundColor: statusColor + '15', transform: [{ scale: pulseAnimation }] }
        ]}
      >
        <View style={[styles.compactDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.compactText, { color: statusColor }]}>
          {statusText}
        </Text>
        {isThisInvoiceTracked && (
          <ActivityIndicator size="small" color={statusColor} style={styles.compactSpinner} />
        )}
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}>
      {/* Main Status Display */}
      <Animated.View 
        style={[
          styles.statusContainer, 
          { borderColor: statusColor + '30', transform: [{ scale: pulseAnimation }] }
        ]}
      >
        <View style={[styles.statusIconContainer, { backgroundColor: statusColor + '15' }]}>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
          {isThisInvoiceTracked && (
            <View style={[styles.trackingIndicator, { backgroundColor: statusColor }]}>
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>
        
        <View style={styles.statusTextContainer}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
            {isThisInvoiceTracked && (
              <View style={[styles.trackingBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.trackingBadgeText}>EN VIVO</Text>
              </View>
            )}
          </View>
          
          {/* Control Number */}
          {invoice.controlNumber && (
            <Text style={[styles.controlNumber, { color: theme.colors.text.secondary }]}>
              Control: {invoice.controlNumber}
            </Text>
          )}
          
          {/* Last Update Time */}
          {showLastUpdate && lastStatusUpdate && lastStatusUpdate.invoiceId === invoice.id && (
            <Text style={[styles.lastUpdate, { color: theme.colors.text.secondary }]}>
              Actualizado: {new Date(lastStatusUpdate.timestamp).toLocaleTimeString('es-ES')}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Tracking Controls */}
      {showTrackingControls && canBeTracked && (
        <View style={styles.trackingControls}>
          <TouchableOpacity
            style={[
              styles.trackingButton,
              {
                backgroundColor: isThisInvoiceTracked 
                  ? theme.colors.error + '15' 
                  : theme.colors.primary + '15',
                borderColor: isThisInvoiceTracked 
                  ? theme.colors.error 
                  : theme.colors.primary,
              }
            ]}
            onPress={handleTrackingToggle}
            disabled={!canBeTracked}
          >
            <Text
              style={[
                styles.trackingButtonText,
                {
                  color: isThisInvoiceTracked 
                    ? theme.colors.error 
                    : theme.colors.primary,
                }
              ]}
            >
              {isThisInvoiceTracked ? '🛑 Detener seguimiento' : '📡 Seguir en tiempo real'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Details for Syncing Status */}
      {lastKnownStatus === InvoiceStatus.Sincronizando && isThisInvoiceTracked && (
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>
              Sincronización en Progreso
            </Text>
            <ActivityIndicator size="small" color={statusColor} />
          </View>
          
          <Text style={[styles.progressDescription, { color: theme.colors.text.secondary }]}>
            Esperando confirmación del Ministerio de Hacienda...
          </Text>
          
          <View style={styles.progressSteps}>
            <View style={styles.progressStep}>
              <View style={[styles.progressStepDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.progressStepText, { color: theme.colors.text.secondary }]}>
                Enviado
              </Text>
            </View>
            <View style={styles.progressStepLine} />
            <View style={styles.progressStep}>
              <ActivityIndicator size="small" color={statusColor} />
              <Text style={[styles.progressStepText, { color: theme.colors.text.secondary }]}>
                Procesando
              </Text>
            </View>
            <View style={styles.progressStepLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressStepDot, { backgroundColor: theme.colors.border.light }]} />
              <Text style={[styles.progressStepText, { color: theme.colors.text.secondary }]}>
                Completado
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactSpinner: {
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  statusIcon: {
    fontSize: 20,
  },
  trackingIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trackingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  controlNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  lastUpdate: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  trackingControls: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  trackingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
  },
  progressStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressStepText: {
    fontSize: 10,
  },
  progressStepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 8,
  },
});

export default InvoiceStatusIndicator;
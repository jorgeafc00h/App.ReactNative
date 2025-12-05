import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector } from '../../store';
import { selectIsAuthenticated } from '../../store/selectors/authSelectors';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const quickActions = [
    {
      title: 'Nueva Factura',
      subtitle: 'Crear factura rápida',
      icon: '📄',
      color: '#3B82F6',
    },
    {
      title: 'Escanear QR',
      subtitle: 'Importar desde QR',
      icon: '📱',
      color: '#10B981',
    },
    {
      title: 'Reportes',
      subtitle: 'Ver estadísticas',
      icon: '📊',
      color: '#8B5CF6',
    },
    {
      title: 'Configuración',
      subtitle: 'Ajustes de empresa',
      icon: '⚙️',
      color: '#F59E0B',
    },
  ];

  const recentActivity = [
    {
      type: 'Factura',
      number: 'FAC-001-2024',
      client: 'Cliente Ejemplo S.A.',
      amount: '$1,250.00',
      date: 'Hoy',
      status: 'Completada',
    },
    {
      type: 'CCF',
      number: 'CCF-002-2024',
      client: 'Empresa ABC',
      amount: '$850.50',
      date: 'Ayer',
      status: 'Pendiente',
    },
    {
      type: 'Factura',
      number: 'FAC-003-2024',
      client: 'Comercial XYZ',
      amount: '$2,100.00',
      date: '2 días',
      status: 'Completada',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completada':
        return '#10B981';
      case 'Pendiente':
        return '#F59E0B';
      case 'Anulada':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.colors.text.secondary }]}>
          Bienvenido de vuelta
        </Text>
        <Text style={[styles.titleText, { color: theme.colors.text.primary }]}>
          Panel Principal
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
          <Text style={styles.summaryAmount}>$15,750.00</Text>
          <Text style={styles.summaryLabel}>Total del Mes</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
            <Text style={styles.summaryAmount}>24</Text>
            <Text style={styles.summaryLabel}>Facturas</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
            <Text style={styles.summaryAmount}>3</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Acciones Rápidas
        </Text>
        
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.primary }]}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.text.secondary }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Actividad Reciente
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              Ver todo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.activityContainer, { backgroundColor: theme.colors.surface.primary }]}>
          {recentActivity.map((activity, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.activityItem,
                index < recentActivity.length - 1 && styles.activityItemBorder,
                { borderBottomColor: theme.colors.border }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={[styles.activityType, { color: theme.colors.text.primary }]}>
                    {activity.type} {activity.number}
                  </Text>
                  <Text style={[styles.activityDate, { color: theme.colors.text.secondary }]}>
                    {activity.date}
                  </Text>
                </View>
                
                <Text style={[styles.activityClient, { color: theme.colors.text.secondary }]}>
                  {activity.client}
                </Text>
                
                <View style={styles.activityFooter}>
                  <Text style={[styles.activityAmount, { color: theme.colors.text.primary }]}>
                    {activity.amount}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}>
                      {activity.status}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  summaryCardPrimary: {
    backgroundColor: '#3B82F6',
  },
  summaryCardSecondary: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  activityContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    padding: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 14,
  },
  activityClient: {
    fontSize: 14,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
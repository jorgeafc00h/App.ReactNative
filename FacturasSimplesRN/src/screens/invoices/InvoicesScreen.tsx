import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';

export const InvoicesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const invoices = [
    {
      number: 'FAC-001-2024',
      client: 'Cliente Ejemplo S.A.',
      amount: '$1,250.00',
      date: '05 Dic 2024',
      status: 'Completada',
      type: 'Factura',
    },
    {
      number: 'CCF-002-2024',
      client: 'Empresa ABC',
      amount: '$850.50',
      date: '04 Dic 2024',
      status: 'Pendiente',
      type: 'CCF',
    },
    {
      number: 'FAC-003-2024',
      client: 'Comercial XYZ',
      amount: '$2,100.00',
      date: '03 Dic 2024',
      status: 'Completada',
      type: 'Factura',
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Factura':
        return '📄';
      case 'CCF':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Facturas
        </Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('AddInvoice' as any)}>
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['Todas', 'Completadas', 'Pendientes', 'Anuladas'].map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterTab,
              index === 0 && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.border }
            ]}
          >
            <Text
              style={[
                styles.filterText,
                index === 0 
                  ? { color: 'white' }
                  : { color: theme.colors.text.secondary }
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoices List */}
      <ScrollView style={styles.listContainer}>
        {invoices.map((invoice, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.invoiceCard, { backgroundColor: theme.colors.surface.primary }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('InvoiceDetail' as any, { invoiceId: invoice.id })}
          >
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.typeIcon}>{getTypeIcon(invoice.type)}</Text>
                <View style={styles.invoiceDetails}>
                  <Text style={[styles.invoiceNumber, { color: theme.colors.text.primary }]}>
                    {invoice.number}
                  </Text>
                  <Text style={[styles.invoiceClient, { color: theme.colors.text.secondary }]}>
                    {invoice.client}
                  </Text>
                </View>
              </View>
              
              <View style={styles.invoiceAmount}>
                <Text style={[styles.amount, { color: theme.colors.text.primary }]}>
                  {invoice.amount}
                </Text>
                <Text style={[styles.date, { color: theme.colors.text.secondary }]}>
                  {invoice.date}
                </Text>
              </View>
            </View>

            <View style={styles.invoiceFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                  {invoice.status}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.moreButton}>
                <Text style={[styles.moreText, { color: theme.colors.text.secondary }]}>⋯</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  invoiceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  invoiceClient: {
    fontSize: 14,
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
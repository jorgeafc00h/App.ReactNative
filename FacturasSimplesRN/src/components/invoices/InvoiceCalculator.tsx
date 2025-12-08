// Invoice Calculator Component - matches SwiftUI TotalSection functionality
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { InvoiceType } from '../../types/invoice';
import { Customer } from '../../types/customer';

interface TaxCalculations {
  totalAmount: number;
  tax: number;
  subTotal: number;
  reteRenta: number;
  totalPagar: number;
  ivaRete1: number;
  totalWithoutTax: number;
  isCCF: boolean;
}

interface InvoiceCalculatorProps {
  calculations: TaxCalculations;
  invoiceType: InvoiceType;
  customer: Customer | null;
}

export const InvoiceCalculator: React.FC<InvoiceCalculatorProps> = ({
  calculations,
  invoiceType,
  customer,
}) => {
  const { theme } = useTheme();

  // Format currency (matches SwiftUI currency formatting)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Render calculation row
  const renderCalculationRow = (label: string, amount: number, isTotal = false) => (
    <View style={styles.calculationRow}>
      <Text style={[
        styles.calculationLabel,
        { 
          color: theme.colors.text.primary,
          fontWeight: isTotal ? '600' : '400',
        }
      ]}>
        {label}
      </Text>
      <Text style={[
        styles.calculationAmount,
        { 
          color: theme.colors.text.primary,
          fontWeight: isTotal ? '600' : '400',
          fontSize: isTotal ? 18 : 16,
        }
      ]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );

  // Render different calculation layouts based on invoice type (matches SwiftUI TotalSection)
  const renderCalculations = () => {
    switch (invoiceType) {
      case InvoiceType.SujetoExcluido:
        return (
          <>
            {renderCalculationRow('Sub Total', calculations.totalAmount)}
            {renderCalculationRow('Renta Retenida', calculations.reteRenta)}
            {renderCalculationRow('Total', calculations.totalPagar, true)}
          </>
        );

      case InvoiceType.FacturaExportacion:
        return (
          <>
            {renderCalculationRow('Total', calculations.totalPagar, true)}
          </>
        );

      default: // Factura, CCF
        return (
          <>
            {renderCalculationRow('Sub Total', calculations.subTotal)}
            {calculations.tax > 0 && renderCalculationRow('IVA (13%)', calculations.tax)}
            {customer?.hasContributorRetention && calculations.ivaRete1 > 0 && 
              renderCalculationRow('IVA Retenido (1%)', calculations.ivaRete1)}
            {renderCalculationRow('Total', calculations.totalAmount, true)}
          </>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Totales
      </Text>
      
      <View style={[styles.calculationsContainer, { borderColor: theme.colors.border.light }]}>
        {renderCalculations()}
        
        {/* Additional info for CCF */}
        {invoiceType === InvoiceType.CCF && (
          <View style={styles.ccfInfo}>
            <Text style={[styles.ccfText, { color: theme.colors.text.secondary }]}>
              Crédito Fiscal: {formatCurrency(calculations.tax)}
            </Text>
          </View>
        )}
      </View>

      {/* Tax breakdown details */}
      {invoiceType !== InvoiceType.FacturaExportacion && invoiceType !== InvoiceType.SujetoExcluido && (
        <View style={styles.taxBreakdown}>
          <Text style={[styles.breakdownText, { color: theme.colors.text.secondary }]}>
            Base Gravable: {formatCurrency(calculations.totalWithoutTax)}
          </Text>
          {customer?.hasContributorRetention && (
            <Text style={[styles.breakdownText, { color: theme.colors.text.secondary }]}>
              * Sujeto a retención de IVA (1%)
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  calculationsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 16,
  },
  calculationAmount: {
    fontSize: 16,
    textAlign: 'right',
  },
  ccfInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  ccfText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  taxBreakdown: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  breakdownText: {
    fontSize: 12,
    marginBottom: 2,
  },
});

export default InvoiceCalculator;
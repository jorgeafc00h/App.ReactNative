// Invoice PDF Preview - Matches Swift InvoicePDFPreview
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useTheme } from '../../hooks/useTheme';
import { Invoice, InvoiceType } from '../../types/invoice';

interface InvoicePDFPreviewProps {
  visible: boolean;
  invoice: Invoice;
  onClose: () => void;
}

// PDF Generation states matching Swift
enum PDFState {
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}

export const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  const { theme } = useTheme();
  const [pdfState, setPdfState] = useState<PDFState>(PDFState.Loading);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const getTypeName = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura:
        return 'Factura';
      case InvoiceType.CCF:
        return 'CCF';
      case InvoiceType.NotaCredito:
        return 'Nota de Crédito';
      case InvoiceType.NotaDebito:
        return 'Nota de Débito';
      case InvoiceType.NotaRemision:
        return 'Nota de Remisión';
      case InvoiceType.SujetoExcluido:
        return 'Sujeto Excluido';
      case InvoiceType.ComprobanteLiquidacion:
        return 'Comprobante de Liquidación';
      case InvoiceType.FacturaExportacion:
        return 'Factura de Exportación';
      default:
        return 'Documento';
    }
  };

  const generatePDFHTML = useCallback((inv: Invoice): string => {
    const totalAmount = inv.totals?.totalAmount || inv.totalAmountIncludingTax || 0;
    const subtotal = inv.totals?.subTotal || 0;
    const iva = inv.totals?.tax || 0;
    
    // Generate items HTML using correct InvoiceDetail properties
    const itemsHTML = (inv.items || []).map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.quantity}</td>
        <td>${item.productName || 'Producto'}</td>
        <td class="text-right">$${(item.unitPrice || 0).toFixed(2)}</td>
        <td class="text-right">$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 40px;
          color: #333;
          background: #fff;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0066cc;
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          color: #0066cc;
          margin-bottom: 8px;
        }
        .doc-type { 
          font-size: 22px; 
          color: #333;
          margin-bottom: 5px;
        }
        .doc-number { 
          font-size: 16px; 
          color: #666;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-box {
          width: 48%;
        }
        .info-box h3 {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .info-box p {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f5f5f5;
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 12px 8px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        .text-right { text-align: right; }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .totals-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #0066cc;
          border-bottom: none;
          border-top: 2px solid #0066cc;
          margin-top: 10px;
          padding-top: 15px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .control-info {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .control-info p {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .control-info strong {
          color: #333;
        }
        .qr-placeholder {
          width: 120px;
          height: 120px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ddd;
          margin: 20px auto;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FacturasSimples</div>
        <div class="doc-type">${getTypeName(inv.invoiceType)}</div>
        <div class="doc-number">${inv.invoiceNumber}</div>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Emisor</h3>
          <p>
            <strong>Nombre Comercial</strong><br>
            NIT: 0000-000000-000-0<br>
            NRC: 000000-0<br>
            Dirección de la empresa
          </p>
        </div>
        <div class="info-box">
          <h3>Receptor</h3>
          <p>
            <strong>Cliente</strong><br>
            ID: ${inv.customerId || 'No especificado'}
          </p>
        </div>
      </div>

      <div class="control-info">
        <p><strong>Fecha de Emisión:</strong> ${new Date(inv.date).toLocaleDateString('es-SV')}</p>
        ${inv.controlNumber ? `<p><strong>Número de Control:</strong> ${inv.controlNumber}</p>` : ''}
        ${inv.generationCode ? `<p><strong>Código de Generación:</strong> ${inv.generationCode}</p>` : ''}
        ${inv.receptionSeal ? `<p><strong>Sello de Recepción:</strong> ${inv.receptionSeal}</p>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th style="width: 60px">Cant.</th>
            <th>Descripción</th>
            <th style="width: 100px" class="text-right">P. Unit.</th>
            <th style="width: 100px" class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML || `
            <tr>
              <td colspan="5" style="text-align: center; color: #999; padding: 20px;">
                No hay productos registrados
              </td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>IVA (13%):</span>
          <span>$${iva.toFixed(2)}</span>
        </div>
        <div class="totals-row total">
          <span>Total:</span>
          <span>$${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="qr-placeholder">
        QR Code
      </div>

      <div class="footer">
        <p>Documento Tributario Electrónico generado por FacturasSimples</p>
        <p>Este documento es una representación impresa de un DTE</p>
      </div>
    </body>
    </html>
    `;
  }, []);

  const loadPDF = useCallback(async () => {
    setPdfState(PDFState.Loading);
    
    try {
      const html = generatePDFHTML(invoice);
      
      // Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html,
        width: 612, // Letter size
        height: 792,
      });

      setPdfUri(uri);
      
      // For the new expo-file-system API, we skip base64 conversion
      // and show HTML preview directly
      setPdfBase64(null);
      
      setPdfState(PDFState.Ready);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfState(PDFState.Error);
    }
  }, [invoice, generatePDFHTML]);

  useEffect(() => {
    if (visible) {
      loadPDF();
    }
  }, [visible, loadPDF]);

  const handleShare = async () => {
    if (!pdfUri) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Compartir ${getTypeName(invoice.invoiceType)}`,
        });
      } else {
        // Fallback to Share API
        await Share.share({
          title: `${getTypeName(invoice.invoiceType)} - ${invoice.invoiceNumber}`,
          message: `Compartiendo documento: ${invoice.invoiceNumber}`,
          url: pdfUri,
        });
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'No se pudo compartir el documento');
    }
  };

  const handlePrint = async () => {
    try {
      const html = generatePDFHTML(invoice);
      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'No se pudo imprimir el documento');
    }
  };

  const handleDownload = async () => {
    if (!pdfUri) return;

    try {
      const fileName = `${getTypeName(invoice.invoiceType)}_${invoice.invoiceNumber}.pdf`;
      
      // Copy to documents directory using new File API
      const sourceFile = new File(pdfUri);
      const destFile = new File(Paths.document, fileName);
      await sourceFile.copy(destFile);
      
      Alert.alert(
        'Descargado',
        `El documento se ha guardado como ${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'No se pudo descargar el documento');
    }
  };

  const renderContent = () => {
    switch (pdfState) {
      case PDFState.Loading:
        return (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              Generando documento...
            </Text>
          </View>
        );

      case PDFState.Error:
        return (
          <View style={styles.centerContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
              Error al generar el documento
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadPDF}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        );

      case PDFState.Ready:
        // Show HTML preview (WebView)
        return (
          <WebView
            originWhitelist={['*']}
            source={{ 
              html: generatePDFHTML(invoice),
            }}
            style={styles.webView}
            scalesPageToFit={true}
            bounces={false}
          />
        );

      default:
        return null;
    }
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
              Cerrar
            </Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Vista Previa
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              {invoice.invoiceNumber}
            </Text>
          </View>
          
          <View style={styles.closeButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Action Buttons */}
        {pdfState === PDFState.Ready && (
          <View style={[styles.actionBar, { 
            backgroundColor: theme.colors.surface.primary,
            borderTopColor: theme.colors.border.light 
          }]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Compartir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
              <Text style={styles.actionIcon}>🖨️</Text>
              <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Imprimir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Text style={styles.actionIcon}>💾</Text>
              <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  closeButton: {
    width: 60,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
  },
});

export default InvoicePDFPreview;

// Invoice PDF Preview - Matches Swift InvoicePDFGenerator exactly
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
import { useAppSelector } from '../../store';
import { selectCustomerById } from '../../store/selectors/customerSelectors';
import { Invoice, InvoiceType, InvoiceCalculations } from '../../types/invoice';
import { Company } from '../../types/company';
import { Customer } from '../../types/customer';

interface InvoicePDFPreviewProps {
  visible: boolean;
  invoice: Invoice;
  company?: Company | null;
  onClose: () => void;
}

// PDF Generation states matching Swift
enum PDFState {
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}

// Constants matching Swift InvoicePDFGenerator
const ENVIRONMENT_CODE_PROD = '01';
const ENVIRONMENT_CODE_TEST = '00';
const QR_URL_PROD = 'https://admin.factura.gob.sv/consultaPublica/';
const QR_URL_TEST = 'https://test7.mh.gob.sv/ssc/consulta/fe/';

export const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({
  visible,
  invoice,
  company: propCompany,
  onClose,
}) => {
  const { theme } = useTheme();
  const [pdfState, setPdfState] = useState<PDFState>(PDFState.Loading);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  // Get company and customer from Redux if not provided
  const reduxCompany = useAppSelector(state => state.companies.currentCompany);
  const company = propCompany || reduxCompany;
  const isProduction = company?.environment === 'PRODUCTION' || !company?.isTestAccount;
  
  // Get customer data using selector
  const customerSelector = useCallback(
    (state: any) => invoice.customerId ? selectCustomerById(invoice.customerId)(state) : null,
    [invoice.customerId]
  );
  const customer = useAppSelector(customerSelector);

  // Get invoice type name (matches Swift InvoiceType.stringValue())
  const getTypeName = (type: InvoiceType): string => {
    switch (type) {
      case InvoiceType.Factura:
        return 'FACTURA';
      case InvoiceType.CCF:
        return 'COMPROBANTE DE CRÉDITO FISCAL';
      case InvoiceType.NotaCredito:
        return 'NOTA DE CRÉDITO';
      case InvoiceType.NotaDebito:
        return 'NOTA DE DÉBITO';
      case InvoiceType.NotaRemision:
        return 'NOTA DE REMISIÓN';
      case InvoiceType.SujetoExcluido:
        return 'FACTURA DE SUJETO EXCLUIDO';
      case InvoiceType.ComprobanteLiquidacion:
        return 'COMPROBANTE DE LIQUIDACIÓN';
      case InvoiceType.FacturaExportacion:
        return 'FACTURA DE EXPORTACIÓN';
      default:
        return 'DOCUMENTO';
    }
  };

  // Get customer full name (matches Swift Customer.fullName)
  const getCustomerFullName = (cust: Customer | null): string => {
    if (!cust) return 'N/A';
    if (cust.businessName) return cust.businessName;
    return `${cust.firstName} ${cust.lastName}`.trim() || 'N/A';
  };

  // Get document number based on customer settings (matches Swift logic)
  const getCustomerDocumentNumber = (cust: Customer | null): string => {
    if (!cust) return 'N/A';
    // If customer has NIT and uses invoice settings, use NIT, otherwise nationalId
    if (cust.nit && cust.nit.length > 0) {
      return cust.nit;
    }
    return cust.nationalId || 'N/A';
  };

  // Split text for PDF layout (matches Swift SplitText)
  const splitText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text || '';
    return `${text.substring(0, maxLength)}...<br/>${text.substring(maxLength)}`;
  };

  // Number to words in Spanish (matches Swift numberToWords)
  const numberToWords = (amount: number): string => {
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount * 100) % 100);

    // Spanish number-to-words conversion
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    const convertToWords = (num: number): string => {
      if (num === 0) return 'cero';
      if (num === 1) return 'uno';
      if (num === 100) return 'cien';
      
      let result = '';
      
      if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        if (thousands === 1) {
          result += 'mil ';
        } else {
          result += convertToWords(thousands) + ' mil ';
        }
        num %= 1000;
      }
      
      if (num >= 100) {
        result += hundreds[Math.floor(num / 100)] + ' ';
        num %= 100;
      }
      
      if (num >= 20) {
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        if (unit === 0) {
          result += tens[ten];
        } else if (ten === 2) {
          result += 'veinti' + units[unit];
        } else {
          result += tens[ten] + ' y ' + units[unit];
        }
      } else if (num >= 10) {
        result += teens[num - 10];
      } else if (num > 0) {
        result += units[num];
      }
      
      return result.trim();
    };

    let result = convertToWords(integerPart) + ' DÓLARES';
    if (decimalPart > 0) {
      result += ' Y ' + convertToWords(decimalPart) + ' CENTAVOS';
    }
    return result.toUpperCase();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date (matches Swift dateFormatter)
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Format date for QR (dd-MM-yyyy)
  const formatDateForQR = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Generate QR URL (matches Swift qrUrlFormat)
  const generateQRUrl = (): string => {
    if (!invoice.generationCode) return '';
    const qrBase = isProduction ? QR_URL_PROD : QR_URL_TEST;
    const envCode = isProduction ? ENVIRONMENT_CODE_PROD : ENVIRONMENT_CODE_TEST;
    const dateStr = formatDateForQR(invoice.date);
    return `${qrBase}?ambiente=${envCode}&codGen=${invoice.generationCode}&fechaEmi=${dateStr}`;
  };

  // Check if CCF type
  const isCCF = invoice.invoiceType === InvoiceType.CCF;

  // Get version (matches Swift invoice.version)
  const getVersion = (): number => {
    return isCCF ? 3 : 1;
  };

  // Calculate total to pay based on retention (matches Swift logic)
  const calculateTotalToPay = (): number => {
    const totals = invoice.totals;
    if (!totals) return invoice.totalAmountIncludingTax || 0;
    
    if (customer?.hasContributorRetention) {
      return totals.totalWithoutTax - totals.ivaRete1;
    }
    if (isCCF) {
      return totals.totalWithoutTax;
    }
    return totals.totalAmount;
  };

  const generatePDFHTML = useCallback((): string => {
    const totals = invoice.totals;
    const totalAmount = totals?.totalAmount || invoice.totalAmountIncludingTax || 0;
    const subTotal = totals?.subTotal || 0;
    const tax = totals?.tax || 0;
    const reteRenta = totals?.reteRenta || 0;
    const ivaRete1 = totals?.ivaRete1 || 0;
    const totalWithoutTax = totals?.totalWithoutTax || 0;
    const totalPagar = calculateTotalToPay();
    const qrUrl = generateQRUrl();
    const version = getVersion();
    
    // Generate items HTML matching Swift table columns exactly
    // Columns: N°, Cant., Descripción, Precio Unitario, Descuento ítem, Ventas no sujetas, Ventas exentas, Ventas gravadas
    const itemsHTML = (invoice.items || []).map((item, index) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      const ventasGravadas = isCCF ? (itemTotal / 1.13).toFixed(2) : itemTotal.toFixed(2);
      const isEven = index % 2 === 0;
      
      return `
        <tr style="background-color: ${isEven ? '#f5f5f5' : 'white'};">
          <td style="padding: 4px 2px; font-size: 7pt;">${index + 1}</td>
          <td style="padding: 4px 2px; font-size: 7pt;">${item.quantity}</td>
          <td style="padding: 4px 2px; font-size: 7pt;">${splitText(item.productName || 'Producto', 50)}</td>
          <td style="padding: 4px 2px; font-size: 7pt; text-align: right;">${formatCurrency(item.unitPrice || 0)}</td>
          <td style="padding: 4px 2px; font-size: 7pt; text-align: right;">$0.00</td>
          <td style="padding: 4px 2px; font-size: 7pt; text-align: right;">$0.00</td>
          <td style="padding: 4px 2px; font-size: 7pt; text-align: right;">$0.00</td>
          <td style="padding: 4px 2px; font-size: 7pt; text-align: right;">$${ventasGravadas}</td>
        </tr>
      `;
    }).join('');

    // Generate Extension rows (matches Swift extensionRows)
    const extensionRows = [
      ['Plazo:', ''],
      ['Condición Operación:', 'Contado'],
      ['Responsable:', company?.nombre || ''],
      ['Venta a Cta de:', ''],
      ['Doc Relacionado:', invoice.relatedDocumentNumber || ''],
    ];

    // Generate Resumen rows based on invoice type (matches Swift summaryRows logic)
    let resumenRowsHTML = '';
    if (isCCF) {
      // CCF specific summary
      const ventasExentas = 0;
      const ventasNoSujetas = 0;
      const ventasGravadas = totalWithoutTax;
      const subTotalVentas = ventasExentas + ventasNoSujetas + ventasGravadas;
      const montoImpuesto = tax;
      const ivaPercibido = 0;
      const subTotalFinal = subTotalVentas + montoImpuesto + ivaPercibido;
      const ivaRetenido = customer?.hasContributorRetention ? ivaRete1 : 0;
      const retencionRenta = 0;
      
      resumenRowsHTML = `
        <tr><td style="font-size: 7pt; padding: 3px;">Ventas Exentas:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(ventasExentas)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Ventas No Sujetas:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(ventasNoSujetas)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Ventas Gravadas:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(ventasGravadas)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Sub Total Ventas:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(subTotalVentas)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Monto Imp. IVA:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(montoImpuesto)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">IVA Percibido:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(ivaPercibido)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Sub Total:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(subTotalFinal)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">(-) IVA Retenido:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(ivaRetenido)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">(-) Retención Renta:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(retencionRenta)}</td></tr>
        <tr style="background-color: #333; color: white;"><td style="font-size: 8pt; font-weight: bold; padding: 5px;">TOTAL A PAGAR:</td><td style="font-size: 8pt; font-weight: bold; text-align: right; padding: 5px;">${formatCurrency(totalPagar)}</td></tr>
      `;
    } else {
      // Regular invoice summary
      resumenRowsHTML = `
        <tr><td style="font-size: 7pt; padding: 3px;">Total Operaciones:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(totalAmount)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Descuento:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">$0.00</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">Sub Total:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(subTotal)}</td></tr>
        <tr><td style="font-size: 7pt; padding: 3px;">IVA 13%:</td><td style="font-size: 7pt; text-align: right; padding: 3px;">${formatCurrency(tax)}</td></tr>
        <tr style="background-color: #333; color: white;"><td style="font-size: 8pt; font-weight: bold; padding: 5px;">TOTAL A PAGAR:</td><td style="font-size: 8pt; font-weight: bold; text-align: right; padding: 5px;">${formatCurrency(totalPagar)}</td></tr>
      `;
    }

    // Generate total in words
    const totalInWords = numberToWords(totalPagar);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        @page { size: letter; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Helvetica, Arial, sans-serif; 
          width: 612pt;
          height: 792pt;
          padding: 0;
          color: #333;
          background: #fff;
          font-size: 9pt;
        }
        .dark-gray { color: #555; }
        .gray-text { color: #888; }
        .section-header {
          background-color: #555;
          color: white;
          padding: 5px 10px;
          font-size: 8pt;
          font-weight: bold;
          text-align: center;
        }
        .metadata-bg {
          background-color: #f5f5f5;
        }
        table { border-collapse: collapse; }
        .items-table th {
          background-color: #555;
          color: white;
          font-size: 7pt;
          padding: 5px 2px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <!-- Company Header -->
      <div style="padding: 10px 30px; position: relative;">
        <div style="font-weight: bold; font-size: 8pt; color: #555;">${(company?.nombreComercial || 'EMPRESA').toUpperCase()}</div>
        <div style="font-size: 9pt; margin-top: 2px;">NIT: ${company?.nit || 'N/A'}  NRC: ${company?.nrc || 'N/A'}</div>
        <div style="font-size: 9pt; margin-top: 2px;">Actividad Económica: ${company?.descActividad || 'N/A'}</div>
        <div style="font-size: 9pt; margin-top: 2px;">Dirección: ${company?.complemento || company?.direccion || 'N/A'}</div>
        <div style="font-size: 9pt; margin-top: 2px;">Correo Electrónico: ${company?.correo || 'N/A'}</div>
        <div style="font-size: 9pt; margin-top: 2px;">Teléfono: ${company?.telefono || 'N/A'}      Tipo de Establecimiento: ${company?.establecimiento || 'N/A'}</div>
        
        <!-- Logo placeholder (top right) -->
        <div style="position: absolute; top: 5px; right: 40px; width: 75px; height: 75px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #999;">
          ${company?.invoiceLogo ? `<img src="data:image/png;base64,${company.invoiceLogo}" style="max-width: 75px; max-height: 75px;" />` : 'LOGO'}
        </div>
      </div>

      <!-- Document Title Section -->
      <div style="background-color: #555; padding: 5px; margin-top: 5px;">
        <div style="color: white; font-size: 8pt; font-weight: bold; text-align: center;">DOCUMENTO TRIBUTARIO ELECTRÓNICO</div>
        <div style="color: white; font-size: 8pt; font-weight: bold; text-align: center; margin-top: 2px;">${getTypeName(invoice.invoiceType)}</div>
      </div>

      <!-- Metadata Section -->
      <div style="background-color: #f5f5f5; padding: 5px 10px; display: flex;">
        <!-- QR Code (left) -->
        <div style="width: 80px; height: 80px; margin: 5px 10px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
          ${qrUrl ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=75x75&data=${encodeURIComponent(qrUrl)}" style="width: 75px; height: 75px;" />` : '<span style="font-size: 8pt; color: #999;">QR</span>'}
        </div>
        
        <!-- Metadata Grid -->
        <div style="flex: 1; display: flex; font-size: 7pt;">
          <!-- Column 1 -->
          <div style="flex: 1; padding: 5px;">
            <div class="gray-text">Modelo de Facturación:</div>
            <div>MODELO FACTURACIÓN PREVIO</div>
            <div class="gray-text" style="margin-top: 8px;">Código de Generación:</div>
            <div style="word-break: break-all;">${invoice.generationCode || 'N/A'}</div>
            <div class="gray-text" style="margin-top: 8px;">Número de Control:</div>
            <div style="word-break: break-all;">${invoice.controlNumber || 'N/A'}</div>
            <div class="gray-text" style="margin-top: 8px;">Sello de Recepción:</div>
            <div style="word-break: break-all;">${invoice.receptionSeal || 'N/A'}</div>
          </div>
          
          <!-- Column 2 -->
          <div style="flex: 1; padding: 5px;">
            <div class="gray-text">Tipo de Transmisión:</div>
            <div>TRANSMISIÓN NORMAL</div>
            <div class="gray-text" style="margin-top: 8px;">Versión de JSON:</div>
            <div>${version}</div>
          </div>
          
          <!-- Column 3 -->
          <div style="flex: 1; padding: 5px;">
            <div class="gray-text">Fecha y Hora de Generación:</div>
            <div>${formatDate(invoice.date)}</div>
          </div>
        </div>
      </div>

      <!-- Receptor Section Header -->
      <div class="section-header">RECEPTOR</div>

      <!-- Receptor Content -->
      <div style="background-color: #f5f5f5; padding: 10px; display: flex; font-size: 7pt;">
        <!-- Column 1 -->
        <div style="flex: 1; padding: 0 5px;">
          <div class="gray-text">Nombre ó Razón Social:</div>
          <div>${getCustomerFullName(customer)}</div>
          <div class="gray-text" style="margin-top: 8px;">NRC:</div>
          <div>${customer?.nrc || ''}</div>
        </div>
        
        <!-- Column 2 -->
        <div style="flex: 1; padding: 0 5px;">
          <div class="gray-text">Tipo de Documento:</div>
          <div>DUI/NIT</div>
          <div class="gray-text" style="margin-top: 8px;">Actividad Económica:</div>
          <div>${splitText(customer?.descActividad || '', 35)}</div>
        </div>
        
        <!-- Column 3 -->
        <div style="flex: 1; padding: 0 5px;">
          <div class="gray-text">N° Documento:</div>
          <div>${getCustomerDocumentNumber(customer)}</div>
          <div class="gray-text" style="margin-top: 8px;">Dirección:</div>
          <div>${splitText(customer?.address || '', 40)}</div>
        </div>
      </div>

      <!-- Table Section Header -->
      <div class="section-header">CUERPO DEL DOCUMENTO</div>

      <!-- Items Table -->
      <table class="items-table" style="width: 100%; margin-top: 5px;">
        <thead>
          <tr>
            <th style="width: 25px;">N°</th>
            <th style="width: 35px;">Cant.</th>
            <th style="width: 220px; text-align: left;">Descripción</th>
            <th style="width: 60px;">Precio<br/>Unitario</th>
            <th style="width: 60px;">Descuento<br/>ítem</th>
            <th style="width: 60px;">Ventas no<br/>sujetas</th>
            <th style="width: 60px;">Ventas<br/>exentas</th>
            <th style="width: 60px;">Ventas<br/>gravadas</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">No hay productos</td></tr>'}
        </tbody>
      </table>

      <!-- Footer Tables (positioned at bottom) -->
      <div style="position: absolute; bottom: 30px; left: 0; right: 0; display: flex;">
        <!-- Extension / Total en Letras (Left) -->
        <div style="width: 50%;">
          <div class="section-header">EXTENSIÓN / TOTAL EN LETRAS</div>
          <div style="background-color: #f5f5f5; padding: 10px; font-size: 7pt;">
            ${extensionRows.map(([label, value]) => `
              <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 100px; color: #888;">${label}</span>
                <span>${value}</span>
              </div>
            `).join('')}
            <div style="margin-top: 10px;">
              <span style="color: #888;">Total en Letras:</span>
              <div style="font-size: 6pt; margin-top: 3px;">${splitText(totalInWords, 60)}</div>
            </div>
          </div>
          <div style="margin-top: 5px; margin-left: 3px; display: flex; align-items: center;">
            <span style="font-size: 6pt; color: #888;">📄 Facturas Simples</span>
          </div>
        </div>

        <!-- Resumen (Right) -->
        <div style="width: 50%;">
          <div class="section-header">RESUMEN</div>
          <div style="background-color: #f5f5f5; padding: 5px;">
            <table style="width: 100%;">
              ${resumenRowsHTML}
            </table>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }, [invoice, company, customer, isCCF, isProduction]);

  const loadPDF = useCallback(async () => {
    setPdfState(PDFState.Loading);
    
    try {
      const html = generatePDFHTML();
      
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
      const html = generatePDFHTML();
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
              html: generatePDFHTML(),
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

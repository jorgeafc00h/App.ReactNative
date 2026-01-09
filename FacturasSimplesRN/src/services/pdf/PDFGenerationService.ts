// PDF Generation Service for Legal Invoice Documents
// Based on SwiftUI InvoicePDFGenerator implementation

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';
import { Invoice, InvoiceType } from '../../types/invoice';
import { Company } from '../../types/company';
import { Customer } from '../../types/customer';

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  pdfData?: string; // Base64 encoded
  message?: string;
}

export interface PDFShareOptions {
  fileName?: string;
  subject?: string;
  body?: string;
}

export class PDFGenerationService {
  private isProduction: boolean;

  constructor(isProduction: boolean = false) {
    this.isProduction = isProduction;
  }

  /**
   * Get environment code (matches Swift implementation)
   */
  private getEnvironmentCode(): string {
    return this.isProduction ? '01' : '00';
  }

  /**
   * Get QR URL base (matches Swift implementation)
   */
  private getQRUrlBase(): string {
    return this.isProduction 
      ? 'https://admin.factura.gob.sv/consultaPublica/'
      : 'https://test7.mh.gob.sv/ssc/consulta/fe/';
  }

  /**
   * Generate QR code URL for invoice verification (matches Swift implementation)
   */
  private generateQRUrl(invoice: Invoice): string {
    if (!invoice.generationCode) {
      return '';
    }

    const date = new Date(invoice.date);
    const formattedDate = date.toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '-');

    return `${this.getQRUrlBase()}?ambiente=${this.getEnvironmentCode()}&codGen=${invoice.generationCode}&fechaEmi=${formattedDate}`;
  }

  /**
   * Generate QR code as Base64 data URL
   */
  private async generateQRCode(url: string): Promise<string> {
    try {
      if (!url) {
        return '';
      }
      
      return await QRCode.toDataURL(url, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  /**
   * Convert number to words in Spanish (matches Swift implementation)
   */
  private numberToWords(amount: number): string {
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount * 100) % 100);

    // Basic Spanish number-to-words conversion
    // This is a simplified version - in production, you'd want a more comprehensive implementation
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    let result = this.convertNumberToWords(integerPart) + ' DÓLARES';

    if (decimalPart > 0) {
      result += ' Y ' + this.convertNumberToWords(decimalPart) + ' CENTAVOS';
    }

    return result.toUpperCase();
  }

  /**
   * Helper function for number to words conversion
   */
  private convertNumberToWords(num: number): string {
    if (num === 0) return 'cero';
    if (num === 1) return 'un';
    if (num < 10) return ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][num];
    // Add more comprehensive conversion as needed
    return num.toString(); // Fallback
  }

  /**
   * Convert invoice type enum to string (matches Swift implementation)
   */
  private getInvoiceTypeString(invoiceType: InvoiceType): string {
    switch (invoiceType) {
      case InvoiceType.Factura:
        return 'Factura';
      case InvoiceType.CCF:
        return 'CCF';
      case InvoiceType.NotaCredito:
        return 'NotaCredito';
      case InvoiceType.SujetoExcluido:
        return 'SujetoExcluido';
      case InvoiceType.NotaDebito:
        return 'NotaDebito';
      case InvoiceType.NotaRemision:
        return 'NotaRemision';
      case InvoiceType.ComprobanteLiquidacion:
        return 'ComprobanteLiquidacion';
      case InvoiceType.FacturaExportacion:
        return 'FacturaExportacion';
      default:
        return 'Factura';
    }
  }

  /**
   * Split long text for PDF layout (matches Swift implementation)
   */
  private splitText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...\n${text.substring(maxLength)}`;
  }

  /**
   * Format currency (matches Swift formatting)
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Generate PDF HTML content (matches Swift layout)
   */
  private async generatePDFHTML(invoice: Invoice, company: Company, customer?: Customer): Promise<string> {
    const qrUrl = this.generateQRUrl(invoice);
    const qrCodeDataUrl = await this.generateQRCode(qrUrl);

    const formattedDate = new Date(invoice.date).toLocaleString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Calculate totals (matches Swift calculations)
    const totalAmount = invoice.totals?.totalAmount || 0;
    const tax = invoice.totals?.tax || 0;
    const subTotal = invoice.totals?.subTotal || 0;
    const reteRenta = invoice.totals?.reteRenta || 0;
    const ivaRete1 = invoice.totals?.ivaRete1 || 0;
    const totalPagar = invoice.totals?.totalPagar || 0;
    const totalWithoutTax = invoice.totals?.totalWithoutTax || 0;

    const customerDocumentNumber = (customer?.hasContributorRetention && customer?.taxRegistrationNumber) 
      ? customer.taxRegistrationNumber 
      : customer?.nationalId || '';
      
    // Get retention flag from customer data
    const hasRetention = customer?.hasContributorRetention || false;

    const totalInWords = this.numberToWords(totalPagar);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${invoice.invoiceType} - ${invoice.invoiceNumber}</title>
    <style>
        @page {
            size: letter;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 7pt;
            line-height: 1.2;
            color: #333;
            width: 612pt;
            height: 792pt;
            padding: 30pt;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10pt;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 8pt;
            font-weight: bold;
            color: #555;
            text-transform: uppercase;
            margin-bottom: 3pt;
        }
        .company-details {
            font-size: 9pt;
            line-height: 1.3;
        }
        .logo {
            width: 75pt;
            height: 75pt;
            flex-shrink: 0;
        }
        .document-title {
            background-color: #555;
            color: white;
            padding: 8pt;
            text-align: center;
            margin: 10pt 0;
        }
        .title-main {
            font-size: 8pt;
            font-weight: bold;
        }
        .title-sub {
            font-size: 8pt;
            margin-top: 5pt;
        }
        .metadata-section {
            background-color: #f5f5f5;
            padding: 10pt;
            display: flex;
            margin-bottom: 5pt;
        }
        .qr-container {
            width: 75pt;
            margin-right: 20pt;
        }
        .qr-code {
            width: 75pt;
            height: 75pt;
        }
        .metadata-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15pt;
        }
        .metadata-item {
            margin-bottom: 8pt;
        }
        .label {
            color: #666;
            font-size: 6.5pt;
            margin-bottom: 2pt;
        }
        .value {
            font-size: 7pt;
        }
        .section-header {
            background-color: #555;
            color: white;
            padding: 5pt;
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
        }
        .receptor-section {
            background-color: #f5f5f5;
            padding: 10pt;
            margin-bottom: 5pt;
        }
        .receptor-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15pt;
        }
        .table-container {
            margin: 10pt 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
        }
        .items-table th {
            background-color: #f0f0f0;
            padding: 5pt 3pt;
            text-align: left;
            font-size: 6.5pt;
            font-weight: bold;
            border: 1pt solid #ddd;
        }
        .items-table td {
            padding: 4pt 3pt;
            font-size: 7pt;
            border: 1pt solid #ddd;
        }
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer-tables {
            position: absolute;
            bottom: 30pt;
            left: 30pt;
            right: 30pt;
            display: flex;
            gap: 0;
        }
        .footer-table {
            flex: 1;
        }
        .footer-header {
            background-color: #555;
            color: white;
            padding: 3pt;
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
        }
        .footer-content {
            background-color: #f5f5f5;
            padding: 8pt;
            font-size: 6.5pt;
            min-height: 100pt;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3pt;
            padding: 2pt 0;
        }
        .summary-row:nth-child(even) {
            background-color: #f9f9f9;
        }
        .extension-item {
            margin-bottom: 3pt;
        }
        .total-words {
            margin-top: 8pt;
            font-size: 6pt;
            line-height: 1.2;
        }
        .brand-footer {
            position: absolute;
            bottom: 10pt;
            left: 30pt;
            font-size: 6pt;
            color: #666;
        }
        .small-logo {
            width: 10pt;
            height: 13pt;
            vertical-align: middle;
            margin-right: 5pt;
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        <div class="company-info">
            <div class="company-name">${company.nombreComercial.toUpperCase()}</div>
            <div class="company-details">
                <div>NIT: ${company.nit} &nbsp;&nbsp; NRC: ${company.nrc}</div>
                <div>Actividad Económica: ${company.descActividad}</div>
                <div>Dirección: ${company.complemento}</div>
                <div>Correo Electrónico: ${company.correo}</div>
                <div>Teléfono: ${company.telefono} &nbsp;&nbsp; Tipo de Establecimiento: ${company.establecimiento}</div>
            </div>
        </div>
        <div class="logo">
            ${company.invoiceLogo ? 
              `<img src="data:image/png;base64,${company.invoiceLogo}" alt="Logo" style="width: 75pt; height: 75pt;">` :
              `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMDA3M0U3Ii8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TEciIGR5PSIuMzVlbSI+TG9nbzwvdGV4dD4KPHN2Zz4=" alt="Logo" style="width: 40pt; height: 50pt;">`
            }
        </div>
    </div>

    <!-- Document Title -->
    <div class="document-title">
        <div class="title-main">DOCUMENTO TRIBUTARIO ELECTRÓNICO</div>
        <div class="title-sub">${invoice.invoiceType === InvoiceType.CCF ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA'}</div>
    </div>

    <!-- Metadata Section -->
    <div class="metadata-section">
        <div class="qr-container">
            ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">` : ''}
        </div>
        <div class="metadata-grid">
            <div>
                <div class="metadata-item">
                    <div class="label">Modelo de Facturación:</div>
                    <div class="value">MODELO FACTURACIÓN PREVIO</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Código de Generación:</div>
                    <div class="value">${invoice.generationCode || ''}</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Número de Control:</div>
                    <div class="value">${invoice.controlNumber || ''}</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Sello de Recepción:</div>
                    <div class="value">${invoice.receptionSeal || ''}</div>
                </div>
            </div>
            <div>
                <div class="metadata-item">
                    <div class="label">Tipo de Transmisión:</div>
                    <div class="value">TRANSMISIÓN NORMAL</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Versión de JSON:</div>
                    <div class="value">${invoice.totals?.version || 1}</div>
                </div>
            </div>
            <div>
                <div class="metadata-item">
                    <div class="label">Fecha y Hora de Generación:</div>
                    <div class="value">${formattedDate}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Receptor Section -->
    <div class="section-header">RECEPTOR</div>
    <div class="receptor-section">
        <div class="receptor-grid">
            <div>
                <div class="metadata-item">
                    <div class="label">Nombre ó Razón Social:</div>
                    <div class="value">${customer ? `${customer.firstName} ${customer.lastName}` : 'N/A'}</div>
                </div>
                <div class="metadata-item">
                    <div class="label">NRC:</div>
                    <div class="value">${customer?.nrc || ''}</div>
                </div>
            </div>
            <div>
                <div class="metadata-item">
                    <div class="label">Tipo de Documento:</div>
                    <div class="value">DUI/NIT</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Actividad Económica:</div>
                    <div class="value">${this.splitText(customer?.descActividad || '', 35)}</div>
                </div>
            </div>
            <div>
                <div class="metadata-item">
                    <div class="label">N° Documento:</div>
                    <div class="value">${customerDocumentNumber}</div>
                </div>
                <div class="metadata-item">
                    <div class="label">Dirección:</div>
                    <div class="value">${this.splitText(customer?.address || '', 40)}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <div class="section-header">CUERPO DEL DOCUMENTO</div>
    <div class="table-container">
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 25pt;">N°</th>
                    <th style="width: 35pt;">Cant.</th>
                    <th style="width: 220pt;">Descripción</th>
                    <th style="width: 60pt;">Precio<br>Unitario</th>
                    <th style="width: 60pt;">Descuento<br>ítem</th>
                    <th style="width: 60pt;">Ventas no<br>sujetas</th>
                    <th style="width: 60pt;">Ventas<br>exentas</th>
                    <th style="width: 60pt;">Ventas<br>gravadas</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items?.map((item, index) => {
                  const unitPrice = invoice.totals?.isCCF ? (item.unitPrice / 1.13) : item.unitPrice;
                  const totalPrice = invoice.totals?.isCCF ? (item.quantity * item.unitPrice / 1.13) : (item.quantity * item.unitPrice);
                  
                  return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.quantity}</td>
                        <td>${item.productName || ''}</td>
                        <td>${this.formatCurrency(unitPrice)}</td>
                        <td>$0.00</td>
                        <td>$0.00</td>
                        <td>$0.00</td>
                        <td>${this.formatCurrency(totalPrice)}</td>
                    </tr>
                  `;
                }).join('') || ''}
            </tbody>
        </table>
    </div>

    <!-- Footer Tables -->
    <div class="footer-tables">
        <!-- Extension Table -->
        <div class="footer-table">
            <div class="footer-header">EXTENSIÓN / TOTAL EN LETRAS</div>
            <div class="footer-content">
                <div class="extension-item">
                    <strong>Nombre Entrega:</strong> ${invoice.nombEntrega || '-'}
                </div>
                <div class="extension-item">
                    <strong>N° Documento:</strong> ${invoice.docuEntrega || '-'}
                </div>
                <div class="extension-item">
                    <strong>Nombre Recibe:</strong> ${invoice.receptor || '-'}
                </div>
                <div class="extension-item">
                    <strong>N° Documento:</strong> ${invoice.receptorDocu || '-'}
                </div>
                <div class="total-words">
                    <strong>Total en Letras:</strong><br>
                    ${totalInWords}
                </div>
            </div>
        </div>

        <!-- Summary Table -->
        <div class="footer-table">
            <div class="footer-header">RESUMEN</div>
            <div class="footer-content">
                <div class="summary-row">
                    <span>Sumatoria de Ventas:</span>
                    <span>${this.formatCurrency(totalAmount)}</span>
                </div>
                <div class="summary-row">
                    <span>Descuentos a Ventas No Sujetas:</span>
                    <span>$0.00</span>
                </div>
                <div class="summary-row">
                    <span>Descuentos a Ventas Exentas:</span>
                    <span>$0.00</span>
                </div>
                <div class="summary-row">
                    <span>Descuentos a Ventas Gravadas:</span>
                    <span>$0.00</span>
                </div>
                <div class="summary-row">
                    <span>Impuesto al Valor Agregado 13%:</span>
                    <span>${this.formatCurrency(invoice.totals?.isCCF ? tax : 0)}</span>
                </div>
                <div class="summary-row">
                    <span>Sub Total:</span>
                    <span>${this.formatCurrency(invoice.totals?.isCCF ? subTotal : totalAmount)}</span>
                </div>
                <div class="summary-row">
                    <span>(-) IVA Retenido:</span>
                    <span>${this.formatCurrency(hasRetention ? ivaRete1 : 0)}</span>
                </div>
                <div class="summary-row">
                    <span>(-) Retención Renta:</span>
                    <span>${this.formatCurrency(invoice.invoiceType === InvoiceType.SujetoExcluido ? reteRenta : 0)}</span>
                </div>
                <div class="summary-row">
                    <span>Monto Total de la Operación:</span>
                    <span>${this.formatCurrency(totalAmount)}</span>
                </div>
                <div class="summary-row">
                    <span>Total Otros Montos No Afectos:</span>
                    <span>$0.00</span>
                </div>
                <div class="summary-row">
                    <span><strong>Total a Pagar:</strong></span>
                    <span><strong>${this.formatCurrency(totalPagar)}</strong></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Brand Footer -->
    <div class="brand-footer">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTMiIHZpZXdCb3g9IjAgMCAxMCAxMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEzIiBmaWxsPSIjMDA3M0U3Ii8+Cjx0ZXh0IHg9IjUiIHk9IjYuNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjM1ZW0iPkY8L3RleHQ+Cjwvc3ZnPg==" alt="Small Logo" class="small-logo">
        Facturas Simples
    </div>
</body>
</html>`;
  }

  /**
   * Generate PDF from invoice and company data
   * Main PDF generation method matching Swift functionality
   */
  async generatePDF(invoice: Invoice, company: Company, customer?: Customer): Promise<PDFGenerationResult> {
    try {
      console.log('📄 PDFGenerationService: Generating PDF for invoice:', invoice.invoiceNumber);

      // Generate HTML content
      const htmlContent = await this.generatePDFHTML(invoice, company, customer);
      
      // Generate PDF using expo-print
      const options = {
        html: htmlContent,
        base64: true,
        width: 612,
        height: 792,
        margins: {
          left: 30,
          top: 30,
          right: 30,
          bottom: 30,
        },
      };

      console.log('📄 PDFGenerationService: Generating PDF with expo-print');
      const result = await Print.printToFileAsync(options);
      
      // Read the generated PDF as base64
      const pdfData = await FileSystem.readAsStringAsync(result.uri, {
        encoding: 'base64',
      });

      const fileName = `${this.getInvoiceTypeString(invoice.invoiceType)}-${invoice.invoiceNumber}.pdf`;
      
      console.log('✅ PDFGenerationService: PDF generated successfully');
      return {
        success: true,
        filePath: result.uri,
        fileName,
        pdfData,
        message: 'PDF generated successfully',
      };
    } catch (error) {
      console.error('❌ PDFGenerationService: PDF generation failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      };
    }
  }

  /**
   * Generate and save PDF to device storage
   * Matches Swift's generateAndSavePDF functionality
   */
  async generateAndSavePDF(invoice: Invoice, company: Company, customer?: Customer): Promise<PDFGenerationResult> {
    try {
      // Generate PDF
      const result = await this.generatePDF(invoice, company, customer);
      
      if (!result.success || !result.pdfData) {
        throw new Error(result.message || 'PDF generation failed');
      }

      // Create a permanent file path using expo-file-system
      const fileName = `Factura-${invoice.invoiceNumber}.pdf`;
      const documentsDirectory = FileSystem.cacheDirectory!;
      const filePath = `${documentsDirectory}${fileName}`;
      
      // Copy the temporary PDF to permanent location
      if (result.filePath) {
        await FileSystem.copyAsync(result.filePath, filePath);
        console.log('💾 PDFGenerationService: PDF saved to permanent location');
      }

      return {
        success: true,
        filePath,
        fileName,
        pdfData: result.pdfData,
        message: 'PDF generated and saved successfully',
      };
    } catch (error) {
      console.error('❌ PDFGenerationService: Save PDF failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save PDF',
      };
    }
  }

  /**
   * Share PDF using native sharing
   * Matches Swift's SharePDFSheet functionality
   */
  async sharePDF(
    invoice: Invoice, 
    company: Company, 
    customer?: Customer,
    options: PDFShareOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      console.log('📤 PDFGenerationService: Sharing PDF');

      // Generate PDF
      const result = await this.generatePDF(invoice, company, customer);
      
      if (!result.success || !result.filePath) {
        throw new Error(result.message || 'PDF generation failed');
      }

      // Share using expo-sharing
      const shareOptions = {
        fileName: options.fileName || `${invoice.controlNumber || invoice.invoiceNumber}.pdf`,
        subject: options.subject || `Factura ${invoice.invoiceNumber}`,
        body: options.body || `Adjunto factura ${invoice.invoiceNumber}`,
      };

      // Share using expo-sharing
      if (result.filePath) {
        await Sharing.shareAsync(result.filePath, {
          mimeType: 'application/pdf',
          dialogTitle: shareOptions.subject,
        });
        console.log('✅ PDFGenerationService: PDF shared successfully');
      }

      return {
        ...result,
        message: 'PDF shared successfully',
      };
    } catch (error) {
      console.error('❌ PDFGenerationService: Share PDF failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to share PDF',
      };
    }
  }

  /**
   * Preview PDF in a modal (for UI integration)
   */
  async previewPDF(invoice: Invoice, company: Company, customer?: Customer): Promise<PDFGenerationResult> {
    try {
      console.log('👁️ PDFGenerationService: Preparing PDF preview');

      const result = await this.generatePDF(invoice, company, customer);
      
      if (!result.success) {
        throw new Error(result.message || 'PDF generation failed');
      }

      return {
        ...result,
        message: 'PDF ready for preview',
      };
    } catch (error) {
      console.error('❌ PDFGenerationService: Preview preparation failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare PDF preview',
      };
    }
  }

  /**
   * Generate PDF from raw data (for server-generated PDFs)
   * Matches Swift's generateAndSavePDF(from data:) functionality
   */
  async savePDFFromData(pdfData: string, invoiceNumber: string): Promise<PDFGenerationResult> {
    try {
      console.log('💾 PDFGenerationService: Saving PDF from data');

      const fileName = `Factura-${invoiceNumber}.pdf`;
      const documentsDirectory = FileSystem.cacheDirectory!;
      const filePath = `${documentsDirectory}${fileName}`;
      
      // Write PDF data to file
      await FileSystem.writeAsStringAsync(filePath, pdfData, {
        encoding: 'base64',
      });
      console.log('✅ PDFGenerationService: PDF saved from data successfully');

      return {
        success: true,
        filePath,
        fileName,
        pdfData,
        message: 'PDF saved successfully',
      };
    } catch (error) {
      console.error('❌ PDFGenerationService: Save from data failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save PDF from data',
      };
    }
  }

  /**
   * Clean up temporary PDF file (matches Swift cleanup functionality)
   */
  async cleanupTemporaryPDF(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log('🧹 PDFGenerationService: Temporary PDF cleaned up successfully');
      }
    } catch (error) {
      console.warn('⚠️ PDFGenerationService: Failed to cleanup temporary PDF:', error);
    }
  }

  /**
   * Set environment (production/development)
   */
  setEnvironment(isProduction: boolean): void {
    this.isProduction = isProduction;
  }
}

// Singleton instance
let pdfGenerationServiceInstance: PDFGenerationService | null = null;

export const getPDFGenerationService = (isProduction?: boolean): PDFGenerationService => {
  if (!pdfGenerationServiceInstance || 
      (isProduction !== undefined && pdfGenerationServiceInstance['isProduction'] !== isProduction)) {
    pdfGenerationServiceInstance = new PDFGenerationService(isProduction);
  }
  return pdfGenerationServiceInstance;
};

export default PDFGenerationService;
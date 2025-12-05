// Invoice types matching Swift implementation

export enum InvoiceStatus {
  Nueva = 0,
  Sincronizando = 1,
  Completada = 2,
  Anulada = 3,
  Modificada = 4
}

export enum InvoiceType {
  Factura = 0,
  CCF = 1,
  NotaCredito = 2,
  SujetoExcluido = 3,
  NotaDebito = 4,
  NotaRemision = 5,
  ComprobanteLiquidacion = 6,
  FacturaExportacion = 7
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  status: InvoiceStatus;
  customerId?: string;
  invoiceType: InvoiceType;
  documentType: string;
  generationCode?: string;
  controlNumber?: string;
  receptionSeal?: string;
  relatedDocumentNumber?: string;
  relatedDocumentType?: string;
  relatedInvoiceType?: InvoiceType;
  relatedId?: string;
  relatedDocumentDate?: Date;
  invalidatedViaApi: boolean;
  isHelperForCreditNote: boolean;
  // Delivery info for remission notes
  nombEntrega: string;
  docuEntrega: string;
  observaciones: string;
  receptor: string;
  receptorDocu: string;
  shouldSyncToCloud: boolean;
  companyId: string;
  items: InvoiceDetail[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDetail {
  id: string;
  quantity: number;
  productId: string;
  invoiceId: string;
  obsItem: string;
  exportaciones?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDetailInput {
  quantity: number;
  productId: string;
  obsItem?: string;
  exportaciones?: number;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  date: Date;
  customerId?: string;
  invoiceType: InvoiceType;
  companyId: string;
  items: InvoiceDetailInput[];
  // Delivery info for remission notes
  nombEntrega?: string;
  docuEntrega?: string;
  observaciones?: string;
  receptor?: string;
  receptorDocu?: string;
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  id: string;
  status?: InvoiceStatus;
  generationCode?: string;
  controlNumber?: string;
  receptionSeal?: string;
}

// Computed properties helpers
export interface InvoiceCalculations {
  totalAmount: number;
  tax: number;
  subTotal: number;
  reteRenta: number;
  totalPagar: number;
  ivaRete1: number;
  totalWithoutTax: number;
  isCCF: boolean;
  totalItems: number;
  version: number;
}

// Invoice summary for lists
export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  date: Date;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  totalAmount: number;
  customerName?: string;
  companyId: string;
}

// Invoice search and filter types
export interface InvoiceFilters {
  status?: InvoiceStatus[];
  invoiceType?: InvoiceType[];
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  companyId?: string;
}

export interface InvoiceSearchParams extends InvoiceFilters {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'invoiceNumber' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

// Invoice state for Redux
export interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: InvoiceFilters;
  pendingSync: string[]; // Invoice IDs pending cloud sync
  lastSyncDate?: Date;
}
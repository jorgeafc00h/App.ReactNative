// Invoice slice aligned with SwiftUI functionality

import { PayloadAction, createSlice, nanoid } from '@reduxjs/toolkit';
import {
  InvoiceState,
  Invoice,
  InvoiceDetail,
  InvoiceFilters,
  InvoiceStatus,
  InvoiceType,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceCalculations,
} from '../../types';
import { DEFAULT_COMPANY_ID, seedInvoices } from '../../data/fixtures';

const TAX_FACTOR = 1.13;

const round = (value: number, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const computeTotals = (
  items: InvoiceDetail[],
  invoiceType: InvoiceType,
  hasRetention?: boolean
): InvoiceCalculations => {
  const totalAmount = round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const tax = round(totalAmount - totalAmount / TAX_FACTOR);
  const subTotal = round(totalAmount - tax);
  const reteRenta = round(totalAmount > 0 ? totalAmount * 0.1 : 0);
  const totalWithoutTax = round(totalAmount / TAX_FACTOR);
  const ivaRete1 = round(hasRetention ? totalWithoutTax * 0.01 : 0);
  const totalPagar = round(
    invoiceType === InvoiceType.SujetoExcluido ? totalAmount - reteRenta : totalAmount
  );

  return {
    totalAmount,
    tax,
    subTotal,
    reteRenta,
    ivaRete1,
    totalPagar,
    totalWithoutTax,
    isCCF: invoiceType === InvoiceType.CCF,
    totalItems: items.length,
    version: invoiceType === InvoiceType.CCF ? 3 : 1,
  };
};

const normalizeInvoiceDetails = (
  invoiceId: string,
  items: InvoiceDetail[] | CreateInvoiceInput['items']
): InvoiceDetail[] => {
  return items.map((item, index) => {
    const detailId = 'id' in item ? item.id : `${invoiceId}_detail_${index + 1}`;
    const productName = 'productName' in item && item.productName ? item.productName : 'Producto';
    const unitPrice = 'unitPrice' in item && item.unitPrice !== undefined ? item.unitPrice : 0;
    const quantity = item.quantity ?? 0;

    return {
      id: detailId,
      invoiceId,
      productId: item.productId,
      productName,
      quantity,
      unitPrice,
      obsItem: item.obsItem ?? '',
      exportaciones: item.exportaciones,
      createdAt: 'createdAt' in item && item.createdAt ? item.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

const stamp = () => new Date().toISOString();

const buildInvoice = (input: CreateInvoiceInput): Invoice => {
  const invoiceId = `inv_${nanoid(8)}`;
  const createdAt = stamp();
  const items = normalizeInvoiceDetails(invoiceId, input.items);
  const totals = computeTotals(items, input.invoiceType, input.customerHasRetention);

  return {
    id: invoiceId,
    invoiceNumber: input.invoiceNumber,
    date: input.date,
    status: InvoiceStatus.Nueva,
    customerId: input.customerId,
    invoiceType: input.invoiceType,
    documentType: input.documentType ?? (input.invoiceType === InvoiceType.CCF ? '03' : '11'),
    generationCode: undefined,
    controlNumber: undefined,
    receptionSeal: undefined,
    relatedDocumentNumber: undefined,
    relatedDocumentType: undefined,
    relatedInvoiceType: undefined,
    relatedId: undefined,
    relatedDocumentDate: undefined,
    invalidatedViaApi: false,
    isHelperForCreditNote: false,
    nombEntrega: input.nombEntrega ?? '',
    docuEntrega: input.docuEntrega ?? '',
    observaciones: input.observaciones ?? '',
    receptor: input.receptor ?? '',
    receptorDocu: input.receptorDocu ?? '',
    shouldSyncToCloud: true,
    companyId: input.companyId,
    items,
    totals,
    createdAt,
    updatedAt: createdAt,
  };
};

const seededInvoices = seedInvoices.map(invoice => {
  const items = normalizeInvoiceDetails(invoice.id, invoice.items);
  return {
    ...invoice,
    items,
    totals: computeTotals(items, invoice.invoiceType),
  };
});

const initialState: InvoiceState = {
  invoices: seededInvoices,
  currentInvoice: seededInvoices.length ? seededInvoices[0] : null,
  selectedInvoiceId: seededInvoices.length ? seededInvoices[0].id : null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {
    companyId: DEFAULT_COMPANY_ID,
  },
  pendingSync: [],
  lastSyncDate: stamp(),
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setInvoiceFilters(state, action: PayloadAction<InvoiceFilters>) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    addInvoice: {
      reducer(state, action: PayloadAction<Invoice>) {
        state.invoices.unshift(action.payload);
        state.currentInvoice = action.payload;
        state.selectedInvoiceId = action.payload.id;
        state.lastSyncDate = stamp();
      },
      prepare(input: CreateInvoiceInput) {
        return { payload: buildInvoice(input) };
      },
    },
    updateInvoice(state, action: PayloadAction<UpdateInvoiceInput>) {
      const { id, ...updates } = action.payload;
      const index = state.invoices.findIndex(inv => inv.id === id);
      if (index === -1) {
        state.error = 'Factura no encontrada';
        return;
      }

      const current = state.invoices[index];
      const updatedItems = updates.items
        ? normalizeInvoiceDetails(id, updates.items)
        : current.items;
      const totals = computeTotals(
        updatedItems,
        updates.invoiceType ?? current.invoiceType,
        updates.customerHasRetention
      );

      const updated: Invoice = {
        ...current,
        ...updates,
        items: updatedItems,
        totals,
        invoiceNumber: updates.invoiceNumber ?? current.invoiceNumber,
        status: updates.status ?? current.status,
        updatedAt: stamp(),
      };

      state.invoices[index] = updated;

      if (state.currentInvoice?.id === id) {
        state.currentInvoice = updated;
      }

      state.lastSyncDate = updated.updatedAt;
    },
    setInvoiceStatus(state, action: PayloadAction<{ id: string; status: InvoiceStatus }>) {
      const { id, status } = action.payload;
      const invoice = state.invoices.find(inv => inv.id === id);
      if (!invoice) {
        state.error = 'Factura no encontrada';
        return;
      }
      invoice.status = status;
      invoice.updatedAt = stamp();

      if (invoice.totals) {
        invoice.totals = {
          ...invoice.totals,
          totalAmount: invoice.totals.totalAmount,
        };
      }

      if (state.currentInvoice?.id === id) {
        state.currentInvoice = { ...invoice };
      }
    },
    deleteInvoice(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.invoices = state.invoices.filter(inv => inv.id !== id);

      if (state.currentInvoice?.id === id) {
        state.currentInvoice = null;
      }

      if (state.selectedInvoiceId === id) {
        state.selectedInvoiceId = state.invoices.length ? state.invoices[0].id : null;
      }

      state.lastSyncDate = stamp();
    },
    setCurrentInvoice(state, action: PayloadAction<string | null>) {
      state.selectedInvoiceId = action.payload;
      state.currentInvoice = action.payload
        ? state.invoices.find(inv => inv.id === action.payload) || null
        : null;
    },
    enqueuePendingSync(state, action: PayloadAction<string>) {
      if (!state.pendingSync.includes(action.payload)) {
        state.pendingSync.push(action.payload);
      }
    },
    dequeuePendingSync(state, action: PayloadAction<string>) {
      state.pendingSync = state.pendingSync.filter(id => id !== action.payload);
    },
    hydrateInvoices(state, action: PayloadAction<Invoice[]>) {
      state.invoices = action.payload.map(inv => ({
        ...inv,
        totals: inv.totals ?? computeTotals(inv.items, inv.invoiceType),
      }));
      state.currentInvoice = state.invoices.find(inv => inv.id === state.selectedInvoiceId) || null;
      state.loading = false;
      state.error = null;
      state.lastSyncDate = stamp();
    },
    resetInvoices() {
      return initialState;
    },
  },
});

export const {
  clearError,
  setSearchTerm,
  setInvoiceFilters,
  addInvoice,
  updateInvoice,
  setInvoiceStatus,
  deleteInvoice,
  setCurrentInvoice,
  enqueuePendingSync,
  dequeuePendingSync,
  hydrateInvoices,
  resetInvoices,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
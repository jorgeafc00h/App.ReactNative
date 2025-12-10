import invoiceReducer, { addInvoice, updateInvoice, deleteInvoice } from '../invoiceSlice';
import { seedInvoices } from '../../../data/fixtures';

describe('invoiceSlice', () => {
  it('should add an invoice', () => {
    const initialState = { invoices: [...seedInvoices], currentInvoice: null, selectedInvoiceId: null, loading: false, error: null, searchTerm: '', filters: {}, pendingSync: [], lastSyncDate: undefined } as any;

    const action = addInvoice({
      invoiceNumber: 'TEST-001',
      date: new Date().toISOString(),
      customerId: seedInvoices[0].customerId,
      invoiceType: seedInvoices[0].invoiceType,
      items: [
        { productId: 'prod_001', quantity: 1, unitPrice: 100 },
      ],
      companyId: '1',
    } as any);

    const next = invoiceReducer(initialState, action);
    expect(next.invoices.length).toBe(initialState.invoices.length + 1);
  });

  it('should update an invoice', () => {
    const initialState = { invoices: [...seedInvoices], currentInvoice: seedInvoices[0], selectedInvoiceId: seedInvoices[0].id, loading: false, error: null, searchTerm: '', filters: {}, pendingSync: [], lastSyncDate: undefined } as any;

    const action = updateInvoice({ id: seedInvoices[0].id, invoiceNumber: 'UPDATED-001' } as any);
    const next = invoiceReducer(initialState, action);
    const updated = next.invoices.find((i: any) => i.id === seedInvoices[0].id);
    expect(updated.invoiceNumber).toBe('UPDATED-001');
  });

  it('should delete an invoice', () => {
    const initialState = { invoices: [...seedInvoices], currentInvoice: seedInvoices[0], selectedInvoiceId: seedInvoices[0].id, loading: false, error: null, searchTerm: '', filters: {}, pendingSync: [], lastSyncDate: undefined } as any;

    const action = deleteInvoice(seedInvoices[0].id);
    const next = invoiceReducer(initialState, action);
    expect(next.invoices.find((i: any) => i.id === seedInvoices[0].id)).toBeUndefined();
  });
});

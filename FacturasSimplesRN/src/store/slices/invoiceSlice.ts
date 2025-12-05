// Invoice slice - placeholder for Phase 2

import { createSlice } from '@reduxjs/toolkit';
import { InvoiceState } from '../../types';

const initialState: InvoiceState = {
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
  pendingSync: [],
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    // Placeholder reducers - will be implemented in Phase 2
    clearError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetInvoices: () => initialState,
  },
});

export const { clearError, setSearchTerm, resetInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;
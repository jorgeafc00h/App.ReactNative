// Customer slice - placeholder for Phase 2

import { createSlice } from '@reduxjs/toolkit';
import { CustomerState } from '../../types';

const initialState: CustomerState = {
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // Placeholder reducers - will be implemented in Phase 2
    clearError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetCustomers: () => initialState,
  },
});

export const { clearError, setSearchTerm, resetCustomers } = customerSlice.actions;
export default customerSlice.reducer;
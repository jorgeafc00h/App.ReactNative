// Product slice - placeholder for Phase 2

import { createSlice } from '@reduxjs/toolkit';
import { ProductState } from '../../types';

const initialState: ProductState = {
  products: [],
  categories: [],
  brands: [],
  suppliers: [],
  currentProduct: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Placeholder reducers - will be implemented in Phase 2
    clearError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetProducts: () => initialState,
  },
});

export const { clearError, setSearchTerm, resetProducts } = productSlice.actions;
export default productSlice.reducer;
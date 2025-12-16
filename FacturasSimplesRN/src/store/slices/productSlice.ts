// Product slice - complete implementation

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductState } from '../../types';
import { Product } from '../../types/product';

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
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Search and filters
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },

    // Product CRUD operations
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
      
      // Add category if it doesn't exist
      if (action.payload.category && !state.categories.includes(action.payload.category)) {
        state.categories.push(action.payload.category);
      }
    },
    
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
        
        // Update category if it doesn't exist
        if (action.payload.category && !state.categories.includes(action.payload.category)) {
          state.categories.push(action.payload.category);
        }
      }
    },
    
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },

    // Bulk operations
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      
      // Extract unique categories
      const categories = new Set<string>();
      action.payload.forEach(product => {
        if (product.category) {
          categories.add(product.category);
        }
      });
      state.categories = Array.from(categories);
    },

    // Current product selection
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },

    // Categories management
    addCategory: (state, action: PayloadAction<string>) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload);
      }
    },

    // Reset state
    resetProducts: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setSearchTerm,
  setFilters,
  addProduct,
  updateProduct,
  deleteProduct,
  setProducts,
  setCurrentProduct,
  addCategory,
  resetProducts
} = productSlice.actions;

export default productSlice.reducer;
// Product selectors - placeholder for Phase 2

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectProducts = (state: RootState) => state.products;

export const selectAllProducts = createSelector(
  [selectProducts],
  (products) => products.products
);

export const selectCurrentProduct = createSelector(
  [selectProducts],
  (products) => products.currentProduct
);

export const selectProductsLoading = createSelector(
  [selectProducts],
  (products) => products.loading
);

export const selectProductsError = createSelector(
  [selectProducts],
  (products) => products.error
);

// Placeholder - will be expanded in Phase 2
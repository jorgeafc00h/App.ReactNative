// Invoice selectors - placeholder for Phase 2

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectInvoices = (state: RootState) => state.invoices;

export const selectAllInvoices = createSelector(
  [selectInvoices],
  (invoices) => invoices.invoices
);

export const selectCurrentInvoice = createSelector(
  [selectInvoices],
  (invoices) => invoices.currentInvoice
);

export const selectInvoicesLoading = createSelector(
  [selectInvoices],
  (invoices) => invoices.loading
);

export const selectInvoicesError = createSelector(
  [selectInvoices],
  (invoices) => invoices.error
);

// Placeholder - will be expanded in Phase 2
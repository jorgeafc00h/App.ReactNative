// Customer selectors - placeholder for Phase 2

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectCustomers = (state: RootState) => state.customers;

export const selectAllCustomers = createSelector(
  [selectCustomers],
  (customers) => customers.customers
);

export const selectCurrentCustomer = createSelector(
  [selectCustomers],
  (customers) => customers.currentCustomer
);

export const selectCustomersLoading = createSelector(
  [selectCustomers],
  (customers) => customers.loading
);

export const selectCustomersError = createSelector(
  [selectCustomers],
  (customers) => customers.error
);

// Placeholder - will be expanded in Phase 2
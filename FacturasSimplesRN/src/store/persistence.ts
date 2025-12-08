// Redux persistence configuration

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import appSlice from './slices/appSlice';
import companySlice from './slices/companySlice';
import invoiceReducer from './slices/invoiceSlice';
import customerReducer from './slices/customerSlice';
import productSlice from './slices/productSlice';
import catalogSlice from './slices/catalogSlice';

// Auth persist config (for sensitive data)
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'selectedCompanyId'], // Only persist user and selected company
  blacklist: ['token', 'refreshToken'], // Don't persist tokens for security
};

// App persist config
const appPersistConfig = {
  key: 'app',
  storage: AsyncStorage,
  whitelist: ['currentTheme', 'language', 'lastSyncDate'], // Persist user preferences
  blacklist: ['notifications', 'isOnline'], // Don't persist runtime state
};

// Company persist config
const companyPersistConfig = {
  key: 'companies',
  storage: AsyncStorage,
  whitelist: ['companies', 'selectedCompanyId'], // Persist company data
  blacklist: ['loading', 'error'], // Don't persist loading state
};

// Catalog persist config
const catalogPersistConfig = {
  key: 'catalogs',
  storage: AsyncStorage,
  whitelist: ['catalogs', 'syncInfo', 'lastFullSync'], // Persist catalog data
  blacklist: ['loading', 'error', 'searchTerm', 'filters'], // Don't persist UI state
};

const customerPersistConfig = {
  key: 'customers',
  storage: AsyncStorage,
  whitelist: ['customers', 'selectedCustomerId', 'lastUpdatedAt'],
  blacklist: ['loading', 'error', 'searchTerm'],
};

const invoicePersistConfig = {
  key: 'invoices',
  storage: AsyncStorage,
  whitelist: ['invoices', 'selectedInvoiceId', 'pendingSync', 'lastSyncDate'],
  blacklist: ['loading', 'error', 'searchTerm'],
};

// Create root reducer with persistence
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  app: persistReducer(appPersistConfig, appSlice),
  companies: persistReducer(companyPersistConfig, companySlice),
  invoices: persistReducer(invoicePersistConfig, invoiceReducer),
  customers: persistReducer(customerPersistConfig, customerReducer),
  products: productSlice, // No persistence for now (Phase 2)
  catalogs: persistReducer(catalogPersistConfig, catalogSlice),
});

export { rootReducer };

// Create persistor (will be used in updated store configuration)
export const createPersistor = (store: any) => {
  return persistStore(store);
};
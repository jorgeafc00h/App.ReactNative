// Customer slice aligned with SwiftUI functionality

import { PayloadAction, createSlice, nanoid } from '@reduxjs/toolkit';
import {
  CustomerState,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
} from '../../types';
import { DEFAULT_COMPANY_ID } from '../../data/fixtures';

const now = () => new Date().toISOString();

const buildCustomer = (input: CreateCustomerInput): Customer => {
  const timestamp = now();
  return {
    id: input?.companyId ? `${input.companyId}_${nanoid(6)}` : `cust_${nanoid(8)}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    businessName: input.businessName?.trim() || `${input.firstName} ${input.lastName}`,
    nationalId: input.nationalId.trim(),
    nit: input.nit.trim(), // Added missing nit property
    documentType: input.documentType,
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    address: input.address?.trim(),
    city: input.city?.trim(),
    department: input.department?.trim(),
    departmentCode: input.departmentCode,
    municipality: input.municipality?.trim() ?? input.city?.trim(),
    municipalityCode: input.municipalityCode,
    country: input.country ?? 'El Salvador',
    postalCode: input.postalCode,
    hasContributorRetention: !!input.hasContributorRetention,
    customerType: input.customerType,
    isActive: true,
    companyId: input.companyId,
    codActividad: input.codActividad,
    descActividad: input.descActividad,
    taxRegistrationNumber: input.taxRegistrationNumber,
    nrc: input.nrc,
    documentTypeCatalogCode: input.documentTypeCatalogCode,
    shouldSyncToCloud: input.shouldSyncToCloud ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const initialState: CustomerState = {
  customers: [], // Start with empty customers array
  currentCustomer: null,
  selectedCustomerId: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {
    companyId: DEFAULT_COMPANY_ID,
    isActive: true,
  },
  lastUpdatedAt: now(),
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setFilters(state, action: PayloadAction<CustomerFilters>) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    addCustomer: {
      reducer(state, action: PayloadAction<Customer>) {
        state.customers.push(action.payload);
        state.currentCustomer = action.payload;
        state.selectedCustomerId = action.payload.id;
        state.lastUpdatedAt = now();
      },
      prepare(input: CreateCustomerInput) {
        return { payload: buildCustomer(input) };
      },
    },
    updateCustomer(state, action: PayloadAction<UpdateCustomerInput>) {
      const { id, ...updates } = action.payload;
      const customerIndex = state.customers.findIndex(c => c.id === id);
      if (customerIndex === -1) {
        state.error = 'Cliente no encontrado';
        return;
      }

      const existing = state.customers[customerIndex];
      const updatedCustomer: Customer = {
        ...existing,
        ...updates,
        businessName: updates.businessName?.trim() ?? existing.businessName,
        firstName: updates.firstName?.trim() ?? existing.firstName,
        lastName: updates.lastName?.trim() ?? existing.lastName,
        email: updates.email?.trim().toLowerCase() ?? existing.email,
        updatedAt: now(),
      };

      state.customers[customerIndex] = updatedCustomer;

      if (state.currentCustomer?.id === id) {
        state.currentCustomer = updatedCustomer;
      }
      state.lastUpdatedAt = updatedCustomer.updatedAt;
    },
    deleteCustomer(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.customers = state.customers.filter(customer => customer.id !== id);

      if (state.currentCustomer?.id === id) {
        state.currentCustomer = null;
      }

      if (state.selectedCustomerId === id) {
        state.selectedCustomerId = state.customers.length ? state.customers[0].id : null;
      }

      state.lastUpdatedAt = now();
    },
    setCurrentCustomer(state, action: PayloadAction<string | null>) {
      state.selectedCustomerId = action.payload;
      state.currentCustomer = action.payload
        ? state.customers.find(customer => customer.id === action.payload) || null
        : null;
    },
    hydrateCustomers(state, action: PayloadAction<Customer[]>) {
      state.customers = action.payload;
      state.currentCustomer = action.payload.find(c => c.id === state.selectedCustomerId) || null;
      state.loading = false;
      state.error = null;
      state.lastUpdatedAt = now();
    },
    resetCustomers() {
      return initialState;
    },
  },
});

export const {
  clearError,
  setSearchTerm,
  setFilters,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setCurrentCustomer,
  hydrateCustomers,
  resetCustomers,
} = customerSlice.actions;

export default customerSlice.reducer;
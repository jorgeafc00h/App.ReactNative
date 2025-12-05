// Customer types matching Swift implementation

export enum CustomerType {
  Individual = 0,
  Business = 1,
  Government = 2
}

export enum CustomerDocumentType {
  DUI = 'DUI',
  NIT = 'NIT',
  PASSPORT = 'PASSPORT',
  CARNET_RESIDENTE = 'CARNET_RESIDENTE',
  OTHER = 'OTHER'
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string; // For business customers
  nationalId: string; // DUI, NIT, etc.
  documentType: CustomerDocumentType;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  postalCode?: string;
  hasContributorRetention: boolean;
  customerType: CustomerType;
  isActive: boolean;
  companyId: string; // Associated company
  // Tax information
  taxRegistrationNumber?: string;
  economicActivity?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  businessName?: string;
  nationalId: string;
  documentType: CustomerDocumentType;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  postalCode?: string;
  hasContributorRetention?: boolean;
  customerType: CustomerType;
  companyId: string;
  taxRegistrationNumber?: string;
  economicActivity?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string;
  isActive?: boolean;
}

// Customer summary for lists and pickers
export interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  nationalId: string;
  email: string;
  phone: string;
  customerType: CustomerType;
  isActive: boolean;
}

// Customer search and filter types
export interface CustomerFilters {
  customerType?: CustomerType[];
  hasContributorRetention?: boolean;
  isActive?: boolean;
  companyId?: string;
  city?: string;
  department?: string;
}

export interface CustomerSearchParams extends CustomerFilters {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'businessName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Customer state for Redux
export interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: CustomerFilters;
}

// Customer validation types
export interface CustomerValidationErrors {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  nationalId?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentType?: string;
}

// Helper function types
export interface CustomerDisplayInfo {
  displayName: string;
  subtitle: string;
  initials: string;
}
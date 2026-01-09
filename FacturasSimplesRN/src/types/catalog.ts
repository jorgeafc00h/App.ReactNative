// Government catalog types matching Swift implementation

export interface CatalogOption {
  id: string;
  code: string;
  description: string;
  departamento?: string;
  municipality?: string;
  catalogId: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface Catalog {
  id: string;
  name: string;
  description?: string;
  version?: string;
  lastUpdated?: string;
  isActive: boolean;
  options: CatalogOption[];
  totalOptions: number;
}

// Government catalog IDs (from the API)
export enum GovernmentCatalogId {
  DEPARTMENTS = 'CAT-012', // Departments (departamentos) - matches Swift
  MUNICIPALITIES = 'CAT-013', // Municipalities (municipios) - matches Swift  
  ECONOMIC_ACTIVITIES = 'CAT-019', // Economic activities
  DOCUMENT_TYPES = 'CAT-022', // Document types - fixed to match Swift
  PAYMENT_FORMS = 'CAT-016', // Payment forms
  PAYMENT_METHODS = 'CAT-018', // Payment methods
  UNIT_OF_MEASURE = 'CAT-014', // Units of measure
  TAX_CODES = 'CAT-015', // Tax codes
  ITEM_TYPES = 'CAT-002', // Item types
  COUNTRIES = 'CAT-020', // Countries - fixed to match Swift
  PERSON_TYPES = 'CAT-029', // Person types (Tipo de Persona) - added from Swift  
  CURRENCIES = 'CAT-021', // Currencies
  INVALID_REASONS = 'CAT-025', // Invalidation reasons
  CONTINGENCY_TYPES = 'CAT-026', // Contingency types
  ESTABLISHMENT_TYPES = 'CAT-008', // Establishment types
}

// DTO for API responses
export interface CatalogOptionDTO {
  code: string;
  description: string;
  departamento?: string;
  municipality?: string;
}

export interface CatalogDTO {
  id: string;
  name: string;
  options: CatalogOptionDTO[];
}

export interface CatalogCollection {
  catalogs: CatalogDTO[];
}

// Catalog sync information
export interface CatalogSyncInfo {
  catalogId: string;
  lastSyncDate: string;
  version?: string;
  status: 'SYNCING' | 'SUCCESS' | 'FAILED';
  error?: string;
  recordCount: number;
}

// Specific catalog types for easier use

// Municipality
export interface Municipality {
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
}

// Economic Activity
export interface EconomicActivity {
  code: string;
  description: string;
  category?: string;
}

// Document Type
export interface DocumentType {
  code: string;
  description: string;
  requiresNumber: boolean;
  maxLength?: number;
}

// Payment Form
export interface PaymentForm {
  code: string;
  description: string;
  requiresDetails: boolean;
}

// Payment Method
export interface PaymentMethod {
  code: string;
  description: string;
  paymentFormCode: string;
}

// Unit of Measure
export interface UnitOfMeasureOption {
  code: string;
  description: string;
  symbol?: string;
  type: 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'QUANTITY' | 'TIME' | 'AREA';
}

// Tax Code
export interface TaxCode {
  code: string;
  description: string;
  rate?: number;
  type: 'IVA' | 'EXEMPT' | 'EXPORT' | 'OTHER';
}

// Item Type
export interface ItemType {
  code: string;
  description: string;
  category: 'GOODS' | 'SERVICES';
}

// Country
export interface Country {
  code: string;
  name: string;
  iso2: string;
  iso3: string;
}

// Department
export interface Department {
  code: string;
  name: string;
  countryCode: string;
}

// Currency
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

// Invalidation Reason
export interface InvalidationReason {
  code: string;
  description: string;
  requiresDocuments: boolean;
}

// Contingency Type
export interface ContingencyType {
  code: string;
  description: string;
  maxDays: number;
}

// Catalog search and filter types
export interface CatalogFilters {
  catalogId?: string;
  isActive?: boolean;
  hasOptions?: boolean;
  lastUpdatedFrom?: string;
  lastUpdatedTo?: string;
}

export interface CatalogSearchParams extends CatalogFilters {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'lastUpdated' | 'totalOptions';
  sortOrder?: 'asc' | 'desc';
}

export interface CatalogOptionFilters {
  catalogId: string;
  departamento?: string;
  isActive?: boolean;
}

export interface CatalogOptionSearchParams extends CatalogOptionFilters {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'code' | 'description' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

// Catalog state for Redux
export interface CatalogState {
  catalogs: Catalog[];
  syncInfo: { [catalogId: string]: CatalogSyncInfo };
  loading: boolean;
  error: string | null;
  lastFullSync?: string;
  searchTerm: string;
  filters: CatalogFilters;
}

// Helper types for specific catalog lookups
export interface CatalogLookupResult {
  found: boolean;
  option?: CatalogOption;
  catalog?: Catalog;
}

// Validation types
export interface CatalogValidationErrors {
  catalogId?: string;
  code?: string;
  description?: string;
}
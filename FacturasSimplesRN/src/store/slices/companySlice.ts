// Company slice for multi-company management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CompanyState, Company, CreateCompanyInput, UpdateCompanyInput, CompanyEnvironment, CompanyStatus } from '../../types';

// Initial state
const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  selectedCompanyId: null,
  companySettings: null,
  companyStats: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
};

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async (params: { refresh?: boolean } = {}, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // const companies = await companiesService.getCompanies();
      
      // Mock data for now - using new Swift-style structure
      const companies: Company[] = [
        {
          id: '1',
          // Basic Info
          nit: '1234-567890-123-4',
          nombre: 'Juan Carlos Pérez',
          nombreComercial: 'Empresa Demo S.A. de C.V.',
          nrc: '123456',
          // Contact & Location 
          correo: 'demo@empresa.com',
          telefono: '2234-5678',
          complemento: 'Calle Principal #123, Col. Centro',
          departamentoCode: '06',
          departamento: 'San Salvador',
          municipioCode: '0606',
          municipio: 'San Salvador',
          // Economic Activity & Establishment
          codActividad: '62020',
          descActividad: 'Servicios de consultoría en informática',
          tipoEstablecimiento: '01',
          establecimiento: 'Local Comercial',
          // MH codes with defaults
          codEstableMH: 'M001',
          codEstable: '',
          codPuntoVentaMH: 'P001',
          codPuntoVenta: '',
          // Certificate
          certificatePath: '',
          certificatePassword: '',
          // System fields
          environment: CompanyEnvironment.Development,
          hasValidCertificate: false,
          logoUrl: undefined,
          primaryColor: '#007AFF',
          ivaPercentage: 13,
          currentInvoiceNumber: 1,
          currentCCFNumber: 1,
          hasApiCredentials: false,
          status: CompanyStatus.Active,
          isDefault: true,
          userId: 'user1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
        } as Company
      ];
      
      return companies;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'companies/fetchCompanyById',
  async (companyId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // const company = await companiesService.getCompanyById(companyId);
      
      // Mock data for now - using new Swift-style structure
      const company: Company = {
        id: companyId,
        // Basic Info
        nit: '1234-567890-123-4',
        nombre: 'Juan Carlos Pérez',
        nombreComercial: 'Empresa Demo S.A. de C.V.',
        nrc: '123456',
        // Contact & Location 
        correo: 'demo@empresa.com',
        telefono: '2234-5678',
        complemento: 'Calle Principal #123, Col. Centro',
        departamentoCode: '06',
        departamento: 'San Salvador',
        municipioCode: '0606',
        municipio: 'San Salvador',
        // Economic Activity & Establishment
        codActividad: '62020',
        descActividad: 'Servicios de consultoría en informática',
        tipoEstablecimiento: '01',
        establecimiento: 'Local Comercial',
        // MH codes with defaults
        codEstableMH: 'M001',
        codEstable: '',
        codPuntoVentaMH: 'P001',
        codPuntoVenta: '',
        // Certificate
        certificatePath: '',
        certificatePassword: '',
        // System fields
        environment: CompanyEnvironment.Development,
        hasValidCertificate: false,
        logoUrl: undefined,
        primaryColor: '#007AFF',
        ivaPercentage: 13,
        currentInvoiceNumber: 1,
        currentCCFNumber: 1,
        hasApiCredentials: false,
        status: CompanyStatus.Active,
        isDefault: true,
        userId: 'user1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      } as Company;
      
      return company;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData: CreateCompanyInput, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // const company = await companiesService.createCompany(companyData);
      
      // Mock creation
      const newCompany: Company = {
        id: `company_${Date.now()}`,
        ...companyData,
        hasValidCertificate: false,
        hasApiCredentials: false,
        currentInvoiceNumber: 1,
        currentCCFNumber: 1,
        status: CompanyStatus.Active,
        isDefault: false,
        userId: 'user1', // TODO: Get from auth state
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Company;
      
      return newCompany;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async (companyData: UpdateCompanyInput, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // const company = await companiesService.updateCompany(companyData);
      
      // Mock update - using new Swift-style structure
      const updatedCompany: Company = {
        id: companyData.id,
        // Basic Info
        nombre: companyData.nombre || 'Updated Name',
        nombreComercial: companyData.nombreComercial || 'Updated Company',
        nit: companyData.nit || '1234-567890-123-4',
        nrc: companyData.nrc,
        // Contact & Location
        correo: companyData.correo || 'updated@empresa.com',
        telefono: companyData.telefono || '2234-5678',
        complemento: companyData.complemento || 'Updated Address',
        departamentoCode: companyData.departamentoCode || '06',
        departamento: companyData.departamento || 'San Salvador',
        municipioCode: companyData.municipioCode || '0606',
        municipio: companyData.municipio || 'San Salvador',
        // Economic Activity & Establishment
        codActividad: companyData.codActividad || '62020',
        descActividad: companyData.descActividad || 'Business',
        tipoEstablecimiento: companyData.tipoEstablecimiento || '01',
        establecimiento: companyData.establecimiento || 'Local Comercial',
        // MH codes
        codEstableMH: companyData.codEstableMH || 'M001',
        codEstable: companyData.codEstable || '',
        codPuntoVentaMH: companyData.codPuntoVentaMH || 'P001',
        codPuntoVenta: companyData.codPuntoVenta || '',
        // Certificate
        certificatePath: companyData.certificatePath || '',
        certificatePassword: companyData.certificatePassword || '',
        // System fields
        environment: companyData.environment || CompanyEnvironment.Development,
        hasValidCertificate: false,
        logoUrl: companyData.logoUrl,
        primaryColor: companyData.primaryColor || '#007AFF',
        ivaPercentage: companyData.ivaPercentage || 13,
        currentInvoiceNumber: 1,
        currentCCFNumber: 1,
        hasApiCredentials: false,
        status: CompanyStatus.Active,
        isDefault: false,
        userId: 'user1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      } as Company;
      
      return updatedCompany;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // await companiesService.deleteCompany(companyId);
      
      return companyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete company');
    }
  }
);

export const setDefaultCompany = createAsyncThunk(
  'companies/setDefaultCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      // const companiesService = getCompaniesService();
      // await companiesService.setDefaultCompany(companyId);
      
      return companyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set default company');
    }
  }
);

export const validateCredentials = createAsyncThunk(
  'companies/validateCredentials',
  async (
    { companyId, credentials }: { 
      companyId: string; 
      credentials: { nit: string; password: string } 
    }, 
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement actual API call to validate credentials
      // const authService = getAuthService();
      // const isValid = await authService.validateCredentials(credentials.nit, credentials.password);
      
      // Mock validation
      const isValid = true;
      
      return { companyId, isValid };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to validate credentials');
    }
  }
);

// Slice
const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set search term
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    
    // Set filters
    setFilters: (state, action: PayloadAction<CompanyState['filters']>) => {
      state.filters = action.payload;
    },
    
    // Set selected company
    setSelectedCompany: (state, action: PayloadAction<string | null>) => {
      state.selectedCompanyId = action.payload;
      state.currentCompany = action.payload 
        ? state.companies.find(c => c.id === action.payload) || null
        : null;
    },
    
    // Update company locally (for optimistic updates)
    updateCompanyLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Company> }>) => {
      const { id, updates } = action.payload;
      const companyIndex = state.companies.findIndex(c => c.id === id);
      
      if (companyIndex !== -1) {
        state.companies[companyIndex] = { ...state.companies[companyIndex], ...updates };
        
        // Update current company if it's the one being updated
        if (state.currentCompany?.id === id) {
          state.currentCompany = { ...state.currentCompany, ...updates };
        }
      }
    },
    
    // Reset company state
    resetCompanies: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Fetch companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
        
        // Set default company if none selected
        if (!state.selectedCompanyId) {
          const defaultCompany = action.payload.find(c => c.isDefault);
          if (defaultCompany) {
            state.selectedCompanyId = defaultCompany.id;
            state.currentCompany = defaultCompany;
          }
        }
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch company by ID
    builder
      .addCase(fetchCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCompany = action.payload;
        
        // Update in companies array if exists
        const existingIndex = state.companies.findIndex(c => c.id === action.payload.id);
        if (existingIndex !== -1) {
          state.companies[existingIndex] = action.payload;
        }
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create company
    builder
      .addCase(createCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies.push(action.payload);
        state.currentCompany = action.payload;
        state.selectedCompanyId = action.payload.id;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update company
    builder
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCompany = action.payload;
        const index = state.companies.findIndex(c => c.id === updatedCompany.id);
        
        if (index !== -1) {
          state.companies[index] = updatedCompany;
        }
        
        if (state.currentCompany?.id === updatedCompany.id) {
          state.currentCompany = updatedCompany;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete company
    builder
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.companies = state.companies.filter(c => c.id !== deletedId);
        
        if (state.selectedCompanyId === deletedId) {
          state.selectedCompanyId = null;
          state.currentCompany = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Set default company
    builder
      .addCase(setDefaultCompany.fulfilled, (state, action) => {
        const newDefaultId = action.payload;
        
        // Remove default from all companies
        state.companies.forEach(company => {
          company.isDefault = false;
        });
        
        // Set new default
        const newDefaultCompany = state.companies.find(c => c.id === newDefaultId);
        if (newDefaultCompany) {
          newDefaultCompany.isDefault = true;
        }
      });

    // Validate credentials
    builder
      .addCase(validateCredentials.fulfilled, (state, action) => {
        const { companyId, isValid } = action.payload;
        const company = state.companies.find(c => c.id === companyId);
        
        if (company) {
          company.hasApiCredentials = isValid;
        }
      });
  },
});

// Actions
export const {
  clearError,
  setSearchTerm,
  setFilters,
  setSelectedCompany,
  updateCompanyLocal,
  resetCompanies,
} = companySlice.actions;

export default companySlice.reducer;
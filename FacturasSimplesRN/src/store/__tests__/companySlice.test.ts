import { configureStore } from '@reduxjs/toolkit';
import companySlice, { 
  createCompany, 
  fetchCompanies, 
  setSelectedCompany 
} from '../slices/companySlice';
import { CompanyEnvironment, CompanyStatus, CreateCompanyInput } from '../../types/company';

describe('Company Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        companies: companySlice,
      },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().companies;
      expect(state).toEqual({
        companies: [],
        currentCompany: null,
        selectedCompanyId: null,
        companySettings: null,
        companyStats: null,
        loading: false,
        error: null,
        searchTerm: '',
        filters: {},
      });
    });
  });

  describe('Synchronous Actions', () => {
    it('should set selected company', () => {
      const companyId = 'company_123';
      
      // First add a company to the store
      const mockCompany = {
        id: companyId,
        nombre: 'Test User',
        nombreComercial: 'Test Company',
        correo: 'test@example.com',
        complemento: 'Test Address',
        departamentoCode: '06',
        departamento: 'San Salvador',
        municipioCode: '0606',
        municipio: 'San Salvador',
        codActividad: '62020',
        descActividad: 'Test Activity',
        tipoEstablecimiento: '01',
        establecimiento: 'Local',
        codEstableMH: 'M001',
        codEstable: '',
        codPuntoVentaMH: 'P001',
        codPuntoVenta: '',
        environment: CompanyEnvironment.Development,
      };

      // Manually set companies array for testing
      store.dispatch({
        type: 'companies/fetchCompanies/fulfilled',
        payload: [mockCompany],
      });

      // Test setSelectedCompany
      store.dispatch(setSelectedCompany(companyId));
      
      const state = store.getState().companies;
      expect(state.selectedCompanyId).toBe(companyId);
      expect(state.currentCompany?.id).toBe(companyId);
    });

    it('should clear selected company when null is passed', () => {
      store.dispatch(setSelectedCompany(null));
      
      const state = store.getState().companies;
      expect(state.selectedCompanyId).toBeNull();
      expect(state.currentCompany).toBeNull();
    });
  });

  describe('Async Actions', () => {
    it('should handle fetchCompanies pending state', async () => {
      const action = store.dispatch(fetchCompanies({}));
      
      const state = store.getState().companies;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();

      // Cleanup
      action.abort();
    });

    it('should handle createCompany with valid data', async () => {
      const companyData: CreateCompanyInput = {
        nombre: 'Juan Perez',
        nombreComercial: 'Test Company S.A. de C.V.',
        nit: '1234-567890-123-4',
        nrc: '123456',
        correo: 'juan@testcompany.com',
        telefono: '2234-5678',
        complemento: 'Calle Principal #123',
        departamentoCode: '06',
        departamento: 'San Salvador',
        municipioCode: '0606',
        municipio: 'San Salvador',
        codActividad: '62020',
        descActividad: 'Servicios de consultoría',
        tipoEstablecimiento: '01',
        establecimiento: 'Local Comercial',
        codEstableMH: 'M001',
        codEstable: '',
        codPuntoVentaMH: 'P001',
        codPuntoVenta: '',
        environment: CompanyEnvironment.Development,
        ivaPercentage: 13,
      };

      const result = await store.dispatch(createCompany(companyData));
      
      expect(result.type).toBe('companies/createCompany/fulfilled');
      expect(result.payload).toMatchObject({
        nombre: companyData.nombre,
        nombreComercial: companyData.nombreComercial,
        correo: companyData.correo,
        environment: CompanyEnvironment.Development,
      });

      const state = store.getState().companies;
      expect(state.companies).toHaveLength(1);
      expect(state.currentCompany?.nombreComercial).toBe(companyData.nombreComercial);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle rejected actions', async () => {
      // Mock a failing action by calling with invalid parameters
      const invalidAction = store.dispatch(
        createCompany({} as CreateCompanyInput)
      );

      const result = await invalidAction;
      const state = store.getState().companies;
      
      expect(state.loading).toBe(false);
      // Error handling depends on implementation
    });
  });
});
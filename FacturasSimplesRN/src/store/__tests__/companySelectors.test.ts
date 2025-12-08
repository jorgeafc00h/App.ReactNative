import { 
  selectCurrentCompanyCustomers,
  selectCustomersByCompanyId,
} from '../selectors/customerSelectors';
import { 
  selectCurrentCompanyInvoices,
  selectCompanyRevenueStats,
} from '../selectors/invoiceSelectors';
import { CompanyEnvironment, CompanyStatus } from '../../types/company';
import { CustomerType, CustomerDocumentType } from '../../types/customer';
import { InvoiceStatus, InvoiceType } from '../../types/invoice';
import { RootState } from '../index';

// Mock state
const mockState: Partial<RootState> = {
  companies: {
    companies: [
      {
        id: 'company_1',
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
        hasValidCertificate: false,
        ivaPercentage: 13,
        currentInvoiceNumber: 1,
        currentCCFNumber: 1,
        hasApiCredentials: false,
        status: CompanyStatus.Active,
        isDefault: true,
        userId: 'user_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    selectedCompanyId: 'company_1',
    currentCompany: null,
    companySettings: null,
    companyStats: null,
    loading: false,
    error: null,
    searchTerm: '',
    filters: {},
  },
  customers: {
    customers: [
      {
        id: 'customer_1',
        firstName: 'Juan',
        lastName: 'Pérez',
        nationalId: '12345678-9',
        documentType: CustomerDocumentType.DUI,
        email: 'juan@example.com',
        phone: '2234-5678',
        companyId: 'company_1',
        customerType: CustomerType.Individual,
        isActive: true,
        hasContributorRetention: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'customer_2', 
        firstName: 'María',
        lastName: 'González',
        nationalId: '98765432-1',
        documentType: CustomerDocumentType.DUI,
        email: 'maria@example.com',
        phone: '2345-6789',
        companyId: 'company_2', // Different company
        customerType: CustomerType.Individual,
        isActive: true,
        hasContributorRetention: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    selectedCustomerId: null,
    currentCustomer: null,
    loading: false,
    error: null,
    searchTerm: '',
    filters: {},
  },
  invoices: {
    invoices: [
      {
        id: 'invoice_1',
        invoiceNumber: '001',
        date: '2024-12-01',
        status: InvoiceStatus.Completada,
        companyId: 'company_1',
        customerId: 'customer_1',
        invoiceType: InvoiceType.Factura,
        documentType: 'DTE',
        invalidatedViaApi: false,
        isHelperForCreditNote: false,
        nombEntrega: '',
        docuEntrega: '',
        observaciones: '',
        receptor: '',
        receptorDocu: '',
        shouldSyncToCloud: false,
        items: [],
        totalAmountIncludingTax: 113.0,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      },
      {
        id: 'invoice_2',
        invoiceNumber: '002', 
        date: '2024-12-02',
        status: InvoiceStatus.Nueva,
        companyId: 'company_1',
        customerId: 'customer_1',
        invoiceType: InvoiceType.Factura,
        documentType: 'DTE',
        invalidatedViaApi: false,
        isHelperForCreditNote: false,
        nombEntrega: '',
        docuEntrega: '',
        observaciones: '',
        receptor: '',
        receptorDocu: '',
        shouldSyncToCloud: false,
        items: [],
        totalAmountIncludingTax: 226.0,
        createdAt: '2024-12-02T00:00:00Z',
        updatedAt: '2024-12-02T00:00:00Z',
      },
      {
        id: 'invoice_3',
        invoiceNumber: '001',
        date: '2024-12-01',
        status: InvoiceStatus.Completada,
        companyId: 'company_2', // Different company
        customerId: 'customer_2',
        invoiceType: InvoiceType.Factura,
        documentType: 'DTE',
        invalidatedViaApi: false,
        isHelperForCreditNote: false,
        nombEntrega: '',
        docuEntrega: '',
        observaciones: '',
        receptor: '',
        receptorDocu: '',
        shouldSyncToCloud: false,
        items: [],
        totalAmountIncludingTax: 339.0,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      },
    ],
    selectedInvoiceId: null,
    currentInvoice: null,
    loading: false,
    error: null,
    searchTerm: '',
    filters: {},
    pendingSync: [],
    lastSyncDate: null,
  },
} as RootState;

describe('Company Selectors', () => {
  describe('Customer Selectors', () => {
    it('should select customers by company ID', () => {
      const customers = selectCustomersByCompanyId('company_1')(mockState);
      
      expect(customers).toHaveLength(1);
      expect(customers[0].id).toBe('customer_1');
      expect(customers[0].companyId).toBe('company_1');
    });

    it('should select current company customers', () => {
      const customers = selectCurrentCompanyCustomers(mockState);
      
      expect(customers).toHaveLength(1);
      expect(customers[0].id).toBe('customer_1');
      expect(customers[0].firstName).toBe('Juan');
    });

    it('should return empty array when no company selected', () => {
      const stateWithoutSelectedCompany = {
        ...mockState,
        companies: {
          ...mockState.companies!,
          selectedCompanyId: null,
        },
      };
      
      const customers = selectCurrentCompanyCustomers(stateWithoutSelectedCompany);
      expect(customers).toHaveLength(0);
    });
  });

  describe('Invoice Selectors', () => {
    it('should select current company invoices', () => {
      const invoices = selectCurrentCompanyInvoices(mockState);
      
      expect(invoices).toHaveLength(2);
      expect(invoices[0].companyId).toBe('company_1');
      expect(invoices[1].companyId).toBe('company_1');
    });

    it('should calculate company revenue stats correctly', () => {
      const stats = selectCompanyRevenueStats(mockState);
      
      expect(stats.totalInvoices).toBe(2);
      expect(stats.completedInvoices).toBe(1);
      expect(stats.totalRevenue).toBe(113.0);
      expect(stats.averageInvoiceAmount).toBe(113.0);
      expect(stats.monthlyRevenue).toEqual([
        { month: '2024-12', revenue: 113.0 }
      ]);
    });

    it('should handle empty invoice list', () => {
      const stateWithNoInvoices = {
        ...mockState,
        invoices: {
          ...mockState.invoices!,
          invoices: [],
        },
      };
      
      const stats = selectCompanyRevenueStats(stateWithNoInvoices);
      
      expect(stats.totalInvoices).toBe(0);
      expect(stats.completedInvoices).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.averageInvoiceAmount).toBe(0);
      expect(stats.monthlyRevenue).toEqual([]);
    });
  });
});
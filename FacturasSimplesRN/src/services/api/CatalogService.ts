// Catalog service implementation matching Swift CatalogSyncService

import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from '../../config/api';
import { 
  Catalog, 
  CatalogOption, 
  CatalogDTO, 
  CatalogCollection,
  GovernmentCatalogId 
} from '../../types/catalog';

export class CatalogService {
  private httpClient: HttpClient;

  constructor(isProduction: boolean = false) {
    this.httpClient = new HttpClient(isProduction);
  }

  /**
   * Fetch all catalogs from the government API
   * Matches Swift getCatalogs method
   */
  async getCatalogs(): Promise<Catalog[]> {
    try {
      console.log('📋 CatalogService: Fetching catalogs from API');
      
      const response = await this.httpClient.get<CatalogCollection>(
        API_ENDPOINTS.CATALOG,
        { skipAuth: true } // Catalog endpoint doesn't require auth
      );
      
      const catalogs = response.catalogs.map(this.mapCatalogDTOToCatalog);

      // Log specific catalog info (matching Swift logging)
      const cat012 = catalogs.find(c => c.id === GovernmentCatalogId.MUNICIPALITIES);
      if (cat012) {
        console.log(`🔍 CAT-012 options count: ${cat012.options.length}`);
        console.log(`🔍 CAT-012 codes: ${cat012.options.map(o => o.code).sort()}`);
      }

      console.log(`✅ CatalogService: Successfully fetched ${catalogs.length} catalogs`);
      return catalogs;
      
    } catch (error) {
      console.error('❌ CatalogService: Failed to fetch catalogs', error);
      throw error;
    }
  }

  /**
   * Get a specific catalog by ID
   */
  async getCatalogById(catalogId: string): Promise<Catalog | null> {
    try {
      const catalogs = await this.getCatalogs();
      return catalogs.find(catalog => catalog.id === catalogId) || null;
    } catch (error) {
      console.error(`❌ CatalogService: Failed to get catalog ${catalogId}`, error);
      throw error;
    }
  }

  /**
   * Search catalog options
   */
  async searchCatalogOptions(
    catalogId: string, 
    searchTerm: string,
    departamento?: string
  ): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(catalogId);
      if (!catalog) {
        return [];
      }

      let options = catalog.options;

      // Filter by department if specified
      if (departamento) {
        options = options.filter(option => 
          option.departamento?.toLowerCase() === departamento.toLowerCase()
        );
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        options = options.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      }

      return options;
    } catch (error) {
      console.error(`❌ CatalogService: Failed to search catalog options`, error);
      throw error;
    }
  }

  /**
   * Get municipalities for a specific department
   */
  async getMunicipalitiesByDepartment(departmentCode: string): Promise<CatalogOption[]> {
    try {
      return await this.searchCatalogOptions(
        GovernmentCatalogId.MUNICIPALITIES,
        '',
        departmentCode
      );
    } catch (error) {
      console.error(`❌ CatalogService: Failed to get municipalities for department ${departmentCode}`, error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.DEPARTMENTS);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get departments', error);
      throw error;
    }
  }

  /**
   * Get economic activities
   */
  async getEconomicActivities(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.ECONOMIC_ACTIVITIES);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get economic activities', error);
      throw error;
    }
  }

  /**
   * Get units of measure
   */
  async getUnitsOfMeasure(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.UNIT_OF_MEASURE);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get units of measure', error);
      throw error;
    }
  }

  /**
   * Get tax codes
   */
  async getTaxCodes(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.TAX_CODES);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get tax codes', error);
      throw error;
    }
  }

  /**
   * Get item types
   */
  async getItemTypes(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.ITEM_TYPES);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get item types', error);
      throw error;
    }
  }

  /**
   * Get payment forms
   */
  async getPaymentForms(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.PAYMENT_FORMS);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get payment forms', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.PAYMENT_METHODS);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get payment methods', error);
      throw error;
    }
  }

  /**
   * Get invalidation reasons
   */
  async getInvalidationReasons(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.INVALID_REASONS);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get invalidation reasons', error);
      throw error;
    }
  }

  /**
   * Get contingency types
   */
  async getContingencyTypes(): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.CONTINGENCY_TYPES);
      return catalog?.options || [];
    } catch (error) {
      console.error('❌ CatalogService: Failed to get contingency types', error);
      throw error;
    }
  }

  /**
   * Find a specific catalog option by code
   */
  async findOptionByCode(catalogId: string, code: string): Promise<CatalogOption | null> {
    try {
      const catalog = await this.getCatalogById(catalogId);
      if (!catalog) {
        return null;
      }

      return catalog.options.find(option => option.code === code) || null;
    } catch (error) {
      console.error(`❌ CatalogService: Failed to find option ${code} in catalog ${catalogId}`, error);
      return null;
    }
  }

  /**
   * Get catalog statistics
   */
  async getCatalogStats(): Promise<{ [catalogId: string]: number }> {
    try {
      const catalogs = await this.getCatalogs();
      const stats: { [catalogId: string]: number } = {};
      
      catalogs.forEach(catalog => {
        stats[catalog.id] = catalog.options.length;
      });

      return stats;
    } catch (error) {
      console.error('❌ CatalogService: Failed to get catalog stats', error);
      throw error;
    }
  }

  /**
   * Check if catalogs are available offline
   */
  isAvailableOffline(): boolean {
    // TODO: Check local storage for cached catalogs
    return false;
  }

  /**
   * Get cached catalogs (offline mode)
   */
  async getCachedCatalogs(): Promise<Catalog[]> {
    // TODO: Implement local cache retrieval
    return [];
  }

  /**
   * Helper method to map DTO to domain model
   */
  private mapCatalogDTOToCatalog(catalogDto: CatalogDTO): Catalog {
    return {
      id: catalogDto.id,
      name: catalogDto.name,
      description: catalogDto.name,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      isActive: true,
      totalOptions: catalogDto.options.length,
      options: catalogDto.options.map((optionDto, index) => ({
        id: `${catalogDto.id}_${optionDto.code}`,
        code: optionDto.code,
        description: optionDto.description,
        departamento: optionDto.departamento,
        municipality: optionDto.municipality,
        catalogId: catalogDto.id,
        isActive: true,
        sortOrder: index
      }))
    };
  }

  /**
   * Check if catalog sync is needed (based on 24-hour refresh cycle)
   */
  async shouldSync(): Promise<boolean> {
    try {
      // TODO: Implement actual sync check logic
      // For now, return true to always sync when requested
      return true;
    } catch (error) {
      console.error('❌ CatalogService: Failed to check if sync is needed', error);
      return true; // Default to sync if we can't determine
    }
  }

  /**
   * Set environment for API calls
   */
  setEnvironment(isProduction: boolean): void {
    this.httpClient.setEnvironment(isProduction);
  }
}

// Singleton instance
let catalogServiceInstance: CatalogService | null = null;

export const getCatalogService = (isProduction?: boolean): CatalogService => {
  if (!catalogServiceInstance || (isProduction !== undefined)) {
    catalogServiceInstance = new CatalogService(isProduction);
  }
  return catalogServiceInstance;
};

export default CatalogService;
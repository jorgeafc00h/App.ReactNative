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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Optionally accepts cached catalogs to avoid API call
   */
  async getCatalogById(
    catalogId: string, 
    cachedCatalogs?: Catalog[]
  ): Promise<Catalog | null> {
    try {
      // First try to find in cached catalogs if provided
      if (cachedCatalogs && cachedCatalogs.length > 0) {
        const cachedCatalog = cachedCatalogs.find(catalog => catalog.id === catalogId);
        if (cachedCatalog) {
          console.log(`📋 CatalogService: Found ${catalogId} in cache`);
          return cachedCatalog;
        }
      }
      
      // If not in cache or no cache provided, fetch from API
      console.log(`📋 CatalogService: Fetching ${catalogId} from API`);
      const catalogs = await this.getCatalogs();
      return catalogs.find(catalog => catalog.id === catalogId) || null;
    } catch (error) {
      console.error(`❌ CatalogService: Failed to get catalog ${catalogId}`, error);
      throw error;
    }
  }

  /**
   * Search catalog options
   * Optionally accepts cached catalogs to avoid API call
   */
  async searchCatalogOptions(
    catalogId: string, 
    searchTerm: string,
    departamento?: string,
    cachedCatalogs?: Catalog[]
  ): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(catalogId, cachedCatalogs);
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
   * Optionally accepts cached catalogs to avoid API call
   */
  async getMunicipalitiesByDepartment(
    departmentCode: string,
    cachedCatalogs?: Catalog[]
  ): Promise<CatalogOption[]> {
    try {
      return await this.searchCatalogOptions(
        GovernmentCatalogId.MUNICIPALITIES,
        '',
        departmentCode,
        cachedCatalogs
      );
    } catch (error) {
      console.error(`❌ CatalogService: Failed to get municipalities for department ${departmentCode}`, error);
      throw error;
    }
  }

  /**
   * Get all departments
   * Optionally accepts cached catalogs to avoid API call
   */
  async getDepartments(cachedCatalogs?: Catalog[]): Promise<CatalogOption[]> {
    try {
      const catalog = await this.getCatalogById(GovernmentCatalogId.DEPARTMENTS, cachedCatalogs);
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
   * Optionally accepts cached catalogs to avoid API call
   */
  async findOptionByCode(
    catalogId: string, 
    code: string,
    cachedCatalogs?: Catalog[]
  ): Promise<CatalogOption | null> {
    try {
      const catalog = await this.getCatalogById(catalogId, cachedCatalogs);
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
   * Checks Redux store for existing catalogs
   */
  isAvailableOffline(): boolean {
    // This method would need access to Redux store
    // For now, we'll implement this logic in the Redux slice
    return false;
  }

  /**
   * Get cached catalogs (offline mode)
   * Returns catalogs from Redux store (to be implemented in Redux slice)
   */
  async getCachedCatalogs(): Promise<Catalog[]> {
    // This method would need access to Redux store
    // For now, we'll implement this logic in the Redux slice
    return [];
  }

  /**
   * Update last sync date after successful sync
   * Matches Swift saveLastSyncDate() implementation
   */
  async updateLastSyncDate(): Promise<void> {
    try {
      const now = new Date();
      await AsyncStorage.setItem('CatalogLastSyncDate', now.toISOString());
      console.log(`📋 CatalogService: Last sync date updated to ${now.toISOString()}`);
    } catch (error) {
      console.error('❌ CatalogService: Failed to update last sync date', error);
    }
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
   * Matches Swift CatalogSyncService.shouldSync() implementation
   */
  async shouldSync(): Promise<boolean> {
    try {
      const lastSyncDateStr = await AsyncStorage.getItem('CatalogLastSyncDate');
      
      if (!lastSyncDateStr) {
        console.log('📋 CatalogService: No last sync date found, sync needed');
        return true;
      }
      
      const lastSyncDate = new Date(lastSyncDateStr);
      const hoursSinceLastSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
      
      const shouldSync = hoursSinceLastSync > 24;
      
      if (shouldSync) {
        console.log(`📋 CatalogService: Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago, sync needed`);
      } else {
        console.log(`📋 CatalogService: Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago, sync not needed`);
      }
      
      return shouldSync;
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
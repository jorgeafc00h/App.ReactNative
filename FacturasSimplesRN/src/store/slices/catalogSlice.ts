// Catalog slice for government catalog management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CatalogState, Catalog, CatalogSyncInfo } from '../../types';
import { getCatalogService } from '../../services/api/CatalogService';

// Initial state
const initialState: CatalogState = {
  catalogs: [],
  syncInfo: {},
  loading: false,
  error: null,
  lastFullSync: undefined,
  searchTerm: '',
  filters: {},
};

// Async thunks
export const syncCatalogs = createAsyncThunk(
  'catalogs/syncCatalogs',
  async (params: { force?: boolean } = {}, { rejectWithValue }) => {
    try {
      const catalogService = getCatalogService();
      
      // Check if sync is needed (unless forced)
      if (!params?.force) {
        const shouldSync = await catalogService.shouldSync();
        if (!shouldSync) {
          throw new Error('Catalogs are up to date');
        }
      }

      const catalogs = await catalogService.getCatalogs();
      
      return {
        catalogs,
        syncDate: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync catalogs');
    }
  }
);

export const fetchCatalogById = createAsyncThunk(
  'catalogs/fetchCatalogById',
  async (catalogId: string, { rejectWithValue }) => {
    try {
      const catalogService = getCatalogService();
      const catalog = await catalogService.getCatalogById(catalogId);
      
      if (!catalog) {
        throw new Error(`Catalog ${catalogId} not found`);
      }
      
      return catalog;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch catalog ${catalogId}`);
    }
  }
);

export const searchCatalogOptions = createAsyncThunk(
  'catalogs/searchCatalogOptions',
  async (
    { catalogId, searchTerm, departamento }: {
      catalogId: string;
      searchTerm: string;
      departamento?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const catalogService = getCatalogService();
      const options = await catalogService.searchCatalogOptions(catalogId, searchTerm, departamento);
      
      return {
        catalogId,
        options,
        searchTerm,
        departamento,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search catalog options');
    }
  }
);

export const getCatalogStats = createAsyncThunk(
  'catalogs/getCatalogStats',
  async (_, { rejectWithValue }) => {
    try {
      const catalogService = getCatalogService();
      const stats = await catalogService.getCatalogStats();
      
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get catalog stats');
    }
  }
);

// Slice
const catalogSlice = createSlice({
  name: 'catalogs',
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
    setFilters: (state, action: PayloadAction<CatalogState['filters']>) => {
      state.filters = action.payload;
    },
    
    // Update sync info for a specific catalog
    updateSyncInfo: (state, action: PayloadAction<CatalogSyncInfo>) => {
      state.syncInfo[action.payload.catalogId] = action.payload;
    },
    
    // Mark catalog sync as started
    startCatalogSync: (state, action: PayloadAction<string>) => {
      const catalogId = action.payload;
      state.syncInfo[catalogId] = {
        catalogId,
        lastSyncDate: new Date().toISOString(),
        status: 'SYNCING',
        recordCount: 0,
      };
    },
    
    // Mark catalog sync as completed
    completeCatalogSync: (state, action: PayloadAction<{ catalogId: string; recordCount: number }>) => {
      const { catalogId, recordCount } = action.payload;
      if (state.syncInfo[catalogId]) {
        state.syncInfo[catalogId].status = 'SUCCESS';
        state.syncInfo[catalogId].recordCount = recordCount;
      }
    },
    
    // Mark catalog sync as failed
    failCatalogSync: (state, action: PayloadAction<{ catalogId: string; error: string }>) => {
      const { catalogId, error } = action.payload;
      if (state.syncInfo[catalogId]) {
        state.syncInfo[catalogId].status = 'FAILED';
        state.syncInfo[catalogId].error = error;
      }
    },
    
    // Reset catalog state
    resetCatalogs: (state) => {
      Object.assign(state, initialState);
    },
    
    // Cache catalogs locally (for offline access)
    cacheCatalogs: (state, action: PayloadAction<Catalog[]>) => {
      // TODO: Implement local caching logic
      console.log('Caching catalogs locally:', action.payload.length);
    },
  },
  extraReducers: (builder) => {
    // Sync catalogs
    builder
      .addCase(syncCatalogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCatalogs.fulfilled, (state, action) => {
        state.loading = false;
        state.catalogs = action.payload.catalogs;
        state.lastFullSync = action.payload.syncDate;
        
        // Update sync info for all catalogs
        action.payload.catalogs.forEach(catalog => {
          state.syncInfo[catalog.id] = {
            catalogId: catalog.id,
            lastSyncDate: action.payload.syncDate,
            status: 'SUCCESS',
            recordCount: catalog.options.length,
          };
        });
      })
      .addCase(syncCatalogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch catalog by ID
    builder
      .addCase(fetchCatalogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogById.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update or add catalog
        const existingIndex = state.catalogs.findIndex(c => c.id === action.payload.id);
        if (existingIndex !== -1) {
          state.catalogs[existingIndex] = action.payload;
        } else {
          state.catalogs.push(action.payload);
        }
      })
      .addCase(fetchCatalogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search catalog options
    builder
      .addCase(searchCatalogOptions.fulfilled, (state, action) => {
        // Update catalog with search results
        const { catalogId, options } = action.payload;
        const catalog = state.catalogs.find(c => c.id === catalogId);
        
        if (catalog) {
          // Store search results (could be used for caching search results)
          console.log(`Search completed for ${catalogId}: ${options.length} results`);
        }
      });

    // Get catalog stats
    builder
      .addCase(getCatalogStats.fulfilled, (state, action) => {
        const stats = action.payload;
        
        // Update record counts in sync info
        Object.entries(stats).forEach(([catalogId, count]) => {
          if (state.syncInfo[catalogId]) {
            state.syncInfo[catalogId].recordCount = count;
          }
        });
      });
  },
});

// Actions
export const {
  clearError,
  setSearchTerm,
  setFilters,
  updateSyncInfo,
  startCatalogSync,
  completeCatalogSync,
  failCatalogSync,
  resetCatalogs,
  cacheCatalogs,
} = catalogSlice.actions;

export default catalogSlice.reducer;
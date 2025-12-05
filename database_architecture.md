# Database & Storage Architecture for React Native

## 📊 Data Model Migration from Swift to React Native

### Core Entity Relationships
```typescript
// TypeScript interfaces matching Swift models

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  status: InvoiceStatus;
  customerId?: string;
  invoiceType: InvoiceType;
  documentType: string;
  generationCode?: string;
  controlNumber?: string;
  receptionSeal?: string;
  relatedDocumentNumber?: string;
  relatedDocumentType?: string;
  relatedInvoiceType?: InvoiceType;
  relatedId?: string;
  relatedDocumentDate?: Date;
  invalidatedViaApi: boolean;
  isHelperForCreditNote: boolean;
  // Delivery info for remission notes
  nombEntrega: string;
  docuEntrega: string;
  observaciones: string;
  receptor: string;
  receptorDocu: string;
  shouldSyncToCloud: boolean;
  items: InvoiceDetail[];
  // Computed properties
  totalAmount: number;
  tax: number;
  subTotal: number;
  reteRenta: number;
  totalPagar: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phone: string;
  address?: string;
  hasContributorRetention: boolean;
  customerType: CustomerType;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  productName: string;
  description?: string;
  unitPrice: number;
  unitOfMeasure: string;
  productCode?: string;
  taxCategory: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Company {
  id: string;
  businessName: string;
  tradeName?: string;
  nit: string;
  dui?: string;
  email: string;
  phone: string;
  address: string;
  economicActivity: string;
  isProduction: boolean;
  hasValidCertificate: boolean;
  certificateExpiryDate?: Date;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Enums and Types
```typescript
enum InvoiceStatus {
  Nueva = 0,
  Sincronizando = 1,
  Completada = 2,
  Anulada = 3,
  Modificada = 4
}

enum InvoiceType {
  Factura = 0,
  CCF = 1,
  NotaCredito = 2,
  SujetoExcluido = 3,
  NotaDebito = 4,
  NotaRemision = 5,
  ComprobanteLiquidacion = 6,
  FacturaExportacion = 7
}

enum CustomerType {
  Individual = 0,
  Business = 1,
  Government = 2
}
```

## 🗄️ Database Implementation Strategy

### Option 1: Realm Database (Recommended)
```typescript
// realm/models/Invoice.ts
import Realm, {ObjectSchema} from 'realm';

export class InvoiceRealm extends Realm.Object<InvoiceRealm> {
  id!: string;
  invoiceNumber!: string;
  date!: Date;
  status!: number;
  customerId?: string;
  invoiceType!: number;
  // ... other properties

  static schema: ObjectSchema = {
    name: 'Invoice',
    primaryKey: 'id',
    properties: {
      id: 'string',
      invoiceNumber: 'string',
      date: 'date',
      status: 'int',
      customerId: 'string?',
      invoiceType: 'int',
      documentType: 'string',
      generationCode: 'string?',
      controlNumber: 'string?',
      receptionSeal: 'string?',
      relatedDocumentNumber: 'string?',
      relatedDocumentType: 'string?',
      relatedInvoiceType: 'int?',
      relatedId: 'string?',
      relatedDocumentDate: 'date?',
      invalidatedViaApi: 'bool',
      isHelperForCreditNote: 'bool',
      nombEntrega: 'string',
      docuEntrega: 'string',
      observaciones: 'string',
      receptor: 'string',
      receptorDocu: 'string',
      shouldSyncToCloud: 'bool',
      items: 'InvoiceDetail[]',
    },
  };
}

export class CustomerRealm extends Realm.Object<CustomerRealm> {
  id!: string;
  firstName!: string;
  lastName!: string;
  nationalId!: string;
  email!: string;
  phone!: string;
  address?: string;
  hasContributorRetention!: boolean;
  customerType!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: ObjectSchema = {
    name: 'Customer',
    primaryKey: 'id',
    properties: {
      id: 'string',
      firstName: 'string',
      lastName: 'string',
      nationalId: 'string',
      email: 'string',
      phone: 'string',
      address: 'string?',
      hasContributorRetention: 'bool',
      customerType: 'int',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
```

### Option 2: SQLite with TypeORM
```typescript
// entities/Invoice.ts
import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceNumber: string;

  @Column('datetime')
  date: Date;

  @Column('int')
  status: InvoiceStatus;

  @Column({nullable: true})
  customerId?: string;

  @Column('int')
  invoiceType: InvoiceType;

  @Column()
  documentType: string;

  @Column({nullable: true})
  generationCode?: string;

  @Column({nullable: true})
  controlNumber?: string;

  @Column({nullable: true})
  receptionSeal?: string;

  @Column({default: false})
  invalidatedViaApi: boolean;

  @Column({default: false})
  isHelperForCreditNote: boolean;

  @Column({default: true})
  shouldSyncToCloud: boolean;

  @OneToMany(() => InvoiceDetail, detail => detail.invoice, {cascade: true})
  items: InvoiceDetail[];

  @ManyToOne(() => Customer)
  customer?: Customer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties as getters
  get totalAmount(): number {
    return this.items.reduce((total, item) => total + item.productTotal, 0);
  }

  get tax(): number {
    return this.totalAmount - (this.totalAmount / 1.13);
  }
}
```

## ☁️ Cloud Synchronization Strategy

### Firebase Firestore Implementation (App Data Sync Only)
**Note**: PDF storage is handled by Azure Storage Account via the existing API.

```typescript
// services/firebase/FirebaseSync.ts
import firestore from '@react-native-firebase/firestore';
import {Invoice, Customer, Product, Company} from '../types';

export class FirebaseSync {
  private db = firestore();

  // Sync invoices to Firestore
  async syncInvoiceToCloud(invoice: Invoice): Promise<void> {
    if (!invoice.shouldSyncToCloud) return;

    try {
      await this.db
        .collection('companies')
        .doc(invoice.companyId)
        .collection('invoices')
        .doc(invoice.id)
        .set({
          ...invoice,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error('Failed to sync invoice:', error);
      throw error;
    }
  }

  // Listen to cloud changes
  subscribeToInvoiceChanges(
    companyId: string,
    onSnapshot: (invoices: Invoice[]) => void
  ) {
    return this.db
      .collection('companies')
      .doc(companyId)
      .collection('invoices')
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const invoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[];
        onSnapshot(invoices);
      });
  }

  // Offline-first sync strategy
  async syncPendingChanges(): Promise<void> {
    const pendingInvoices = await this.getLocalPendingSync();
    
    for (const invoice of pendingInvoices) {
      try {
        await this.syncInvoiceToCloud(invoice);
        await this.markSyncComplete(invoice.id);
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.id}:`, error);
      }
    }
  }
}
```

### Alternative: AWS AppSync with GraphQL
```typescript
// graphql/mutations.ts
export const createInvoice = /* GraphQL */ `
  mutation CreateInvoice(
    $input: CreateInvoiceInput!
    $condition: ModelInvoiceConditionInput
  ) {
    createInvoice(input: $input, condition: $condition) {
      id
      invoiceNumber
      date
      status
      customerId
      invoiceType
      items {
        id
        quantity
        productId
        product {
          id
          productName
          unitPrice
        }
      }
      customer {
        id
        firstName
        lastName
        nationalId
      }
      createdAt
      updatedAt
    }
  }
`;

// services/AppSyncService.ts
import {API, graphqlOperation} from 'aws-amplify';
import {createInvoice, updateInvoice} from '../graphql/mutations';

export class AppSyncService {
  async createInvoice(invoice: CreateInvoiceInput): Promise<Invoice> {
    try {
      const response = await API.graphql(
        graphqlOperation(createInvoice, { input: invoice })
      );
      return response.data.createInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async subscribeToInvoices(companyId: string) {
    return API.graphql(
      graphqlOperation(subscriptions.onCreateInvoice, { companyId })
    ).subscribe({
      next: ({ provider, value }) => {
        console.log('New invoice created:', value.data.onCreateInvoice);
      },
      error: error => console.warn(error)
    });
  }
}
```

## 📱 Local Storage Management

### Async Storage for App Settings
```typescript
// services/storage/AsyncStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageService {
  private static prefix = 'FacturasSimples_';

  static async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(this.prefix + key, jsonValue);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.prefix + key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  }

  // App-specific storage methods
  static async setLastSyncDate(date: Date): Promise<void> {
    await this.setItem('catalogLastSyncDate', date.toISOString());
  }

  static async getLastSyncDate(): Promise<Date | null> {
    const dateStr = await this.getItem<string>('catalogLastSyncDate');
    return dateStr ? new Date(dateStr) : null;
  }

  static async setSelectedCompany(companyId: string): Promise<void> {
    await this.setItem('selectedCompanyId', companyId);
  }

  static async getSelectedCompany(): Promise<string | null> {
    return await this.getItem<string>('selectedCompanyId');
  }
}
```

### Secure Storage for Credentials
```typescript
// services/security/SecureStorage.ts
import EncryptedStorage from 'react-native-encrypted-storage';

export class SecureStorage {
  private static prefix = 'FS_SECURE_';

  static async storeCredentials(
    nit: string,
    credentials: {
      user: string;
      password: string;
      certificateKey?: string;
    }
  ): Promise<void> {
    try {
      await EncryptedStorage.setItem(
        this.prefix + `credentials_${nit}`,
        JSON.stringify(credentials)
      );
    } catch (error) {
      console.error('Failed to store credentials:', error);
      throw new Error('Failed to store credentials securely');
    }
  }

  static async getCredentials(nit: string): Promise<{
    user: string;
    password: string;
    certificateKey?: string;
  } | null> {
    try {
      const credentialsStr = await EncryptedStorage.getItem(
        this.prefix + `credentials_${nit}`
      );
      return credentialsStr ? JSON.parse(credentialsStr) : null;
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  static async storeCertificate(
    nit: string,
    certificateData: string
  ): Promise<void> {
    try {
      await EncryptedStorage.setItem(
        this.prefix + `certificate_${nit}`,
        certificateData
      );
    } catch (error) {
      console.error('Failed to store certificate:', error);
      throw new Error('Failed to store certificate securely');
    }
  }

  static async getCertificate(nit: string): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem(
        this.prefix + `certificate_${nit}`
      );
    } catch (error) {
      console.error('Failed to retrieve certificate:', error);
      return null;
    }
  }

  static async clearCompanyData(nit: string): Promise<void> {
    try {
      await Promise.all([
        EncryptedStorage.removeItem(this.prefix + `credentials_${nit}`),
        EncryptedStorage.removeItem(this.prefix + `certificate_${nit}`)
      ]);
    } catch (error) {
      console.error('Failed to clear company data:', error);
    }
  }
}
```

## 🔄 Data Synchronization Patterns

### Redux Toolkit with RTK Query
```typescript
// store/slices/invoiceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, InvoiceStatus } from '../../types';

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  pendingSync: string[]; // Invoice IDs pending cloud sync
}

const initialState: InvoiceState = {
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
  pendingSync: [],
};

export const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload;
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.unshift(action.payload);
      if (action.payload.shouldSyncToCloud) {
        state.pendingSync.push(action.payload.id);
      }
    },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
        if (action.payload.shouldSyncToCloud && 
            !state.pendingSync.includes(action.payload.id)) {
          state.pendingSync.push(action.payload.id);
        }
      }
    },
    markSyncComplete: (state, action: PayloadAction<string>) => {
      state.pendingSync = state.pendingSync.filter(id => id !== action.payload);
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload;
    },
  },
});

// RTK Query API slice
export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/invoices',
  }),
  tagTypes: ['Invoice'],
  endpoints: (builder) => ({
    getInvoices: builder.query<Invoice[], {companyId: string, page?: number}>({
      query: ({companyId, page = 1}) => `?companyId=${companyId}&page=${page}`,
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation<Invoice, Partial<Invoice>>({
      query: (invoice) => ({
        url: '',
        method: 'POST',
        body: invoice,
      }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});
```

### Background Sync Service
```typescript
// services/sync/BackgroundSyncService.ts
import BackgroundJob from 'react-native-background-job';
import NetInfo from '@react-native-netinfo/netinfo';
import { store } from '../../store';
import { FirebaseSync } from '../firebase/FirebaseSync';
import { CatalogSyncService } from '../api/CatalogSyncService';

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private firebaseSync = new FirebaseSync();
  private catalogSync = new CatalogSyncService();

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  async startBackgroundSync(): Promise<void> {
    BackgroundJob.start({
      jobKey: 'myJob',
      period: 300000, // 5 minutes
    });

    BackgroundJob.register({
      jobKey: 'syncData',
      job: () => {
        this.performSync();
      }
    });
  }

  private async performSync(): Promise<void> {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      console.log('No internet connection - skipping sync');
      return;
    }

    try {
      // Sync pending invoices
      await this.firebaseSync.syncPendingChanges();
      
      // Check if catalog needs refresh (24 hours)
      const shouldSyncCatalog = await this.catalogSync.shouldSync();
      if (shouldSyncCatalog) {
        await this.catalogSync.syncCatalogs();
      }
      
      console.log('Background sync completed successfully');
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  stopBackgroundSync(): void {
    BackgroundJob.stop();
  }
}
```

## 📈 Performance Optimization

### Lazy Loading and Pagination
```typescript
// hooks/useInfiniteInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '../types';
import { InvoiceService } from '../services/InvoiceService';

export const useInfiniteInvoices = (companyId: string) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newInvoices = await InvoiceService.getInvoices(companyId, page);
      
      if (newInvoices.length === 0) {
        setHasMore(false);
      } else {
        setInvoices(prev => [...prev, ...newInvoices]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  const refresh = useCallback(() => {
    setInvoices([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, [loadMore]);

  return { invoices, loading, hasMore, loadMore, refresh };
};
```

This comprehensive database architecture provides the foundation for a robust React Native implementation that matches the Swift app's functionality while leveraging React Native's ecosystem strengths.
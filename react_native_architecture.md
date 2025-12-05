# React Native App Architecture Plan

## 📱 Project Structure

```
FacturasSimplesRN/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/
│   │   ├── forms/
│   │   ├── lists/
│   │   └── modals/
│   ├── screens/              # Screen components
│   │   ├── auth/
│   │   ├── invoices/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── companies/
│   │   └── settings/
│   ├── navigation/           # Navigation configuration
│   ├── services/             # API and business logic
│   │   ├── api/
│   │   ├── storage/
│   │   ├── security/
│   │   └── sync/
│   ├── store/                # Redux store and slices
│   │   ├── slices/
│   │   └── middleware/
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom hooks
│   ├── config/               # Configuration files
│   └── assets/               # Images, fonts, etc.
├── __tests__/                # Test files
├── android/                  # Android-specific code
├── ios/                      # iOS-specific code
└── package.json
```

## 🏗️ Core Architecture Patterns

### 1. State Management with Redux Toolkit

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authSlice } from './slices/authSlice';
import { invoiceSlice } from './slices/invoiceSlice';
import { customerSlice } from './slices/customerSlice';
import { productSlice } from './slices/productSlice';
import { companySlice } from './slices/companySlice';
import { catalogSlice } from './slices/catalogSlice';
import { apiSlice } from './api/apiSlice';

// Persist configuration for sensitive data
const authPersistConfig = {
  key: 'auth',
  storage: EncryptedStorage,
  whitelist: ['user', 'selectedCompanyId']
};

// Persist configuration for app data
const appDataPersistConfig = {
  key: 'appData',
  storage: AsyncStorage,
  whitelist: ['invoices', 'customers', 'products', 'companies']
};

const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authSlice.reducer),
    invoices: persistReducer(appDataPersistConfig, invoiceSlice.reducer),
    customers: customerSlice.reducer,
    products: productSlice.reducer,
    companies: companySlice.reducer,
    catalogs: catalogSlice.reducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
```

### 2. Navigation Structure

```typescript
// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { HomeScreen } from '../screens/home/HomeScreen';
import { InvoiceNavigator } from './InvoiceNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { ProductNavigator } from './ProductNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAppSelector } from '../hooks/redux';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = '';
        
        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Invoices':
            iconName = 'receipt';
            break;
          case 'Customers':
            iconName = 'people';
            break;
          case 'Products':
            iconName = 'inventory';
            break;
          case 'Profile':
            iconName = 'account-circle';
            break;
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen 
      name="Invoices" 
      component={InvoiceNavigator} 
      options={{ headerShown: false }}
    />
    <Tab.Screen 
      name="Customers" 
      component={CustomerNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen 
      name="Products" 
      component={ProductNavigator}
      options={{ headerShown: false }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileNavigator}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 3. Component Architecture

```typescript
// components/common/BaseScreen.tsx
import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  StyleSheet,
  StatusBar,
  RefreshControl 
} from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorModal } from './ErrorModal';

interface BaseScreenProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollable?: boolean;
  backgroundColor?: string;
}

export const BaseScreen: React.FC<BaseScreenProps> = ({
  children,
  loading = false,
  error = null,
  onRefresh,
  refreshing = false,
  scrollable = true,
  backgroundColor = '#f5f5f5'
}) => {
  const content = scrollable ? (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      ) : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.container}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {content}
      {loading && <LoadingSpinner />}
      {error && <ErrorModal message={error} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
});
```

## 🧩 Feature Modules

### Invoice Management Module

```typescript
// screens/invoices/InvoiceListScreen.tsx
import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchInvoices, selectInvoicesByStatus } from '../../store/slices/invoiceSlice';
import { InvoiceListItem } from '../../components/invoices/InvoiceListItem';
import { BaseScreen } from '../../components/common/BaseScreen';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterTabs } from '../../components/common/FilterTabs';
import { InvoiceStatus } from '../../types/invoice';

export const InvoiceListScreen = () => {
  const dispatch = useAppDispatch();
  const { invoices, loading, error, searchTerm, selectedFilter } = useAppSelector(
    state => state.invoices
  );
  const selectedCompanyId = useAppSelector(state => state.auth.selectedCompanyId);
  
  const filteredInvoices = useAppSelector(state => 
    selectInvoicesByStatus(state, selectedFilter)
  );

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(fetchInvoices({ companyId: selectedCompanyId }));
    }
  }, [selectedCompanyId, dispatch]);

  const filterTabs = [
    { key: 'all', label: 'Todas', count: invoices.length },
    { key: InvoiceStatus.Nueva, label: 'Nueva', count: 0 },
    { key: InvoiceStatus.Completada, label: 'Completada', count: 0 },
    { key: InvoiceStatus.Anulada, label: 'Anulada', count: 0 },
  ];

  const handleRefresh = () => {
    if (selectedCompanyId) {
      dispatch(fetchInvoices({ companyId: selectedCompanyId, refresh: true }));
    }
  };

  return (
    <BaseScreen 
      loading={loading} 
      error={error}
      onRefresh={handleRefresh}
      scrollable={false}
    >
      <View style={{ flex: 1 }}>
        <SearchBar
          placeholder="Buscar facturas..."
          value={searchTerm}
          onChangeText={(text) => dispatch(setSearchTerm(text))}
        />
        
        <FilterTabs
          tabs={filterTabs}
          selectedTab={selectedFilter}
          onSelectTab={(tab) => dispatch(setFilter(tab))}
        />

        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InvoiceListItem invoice={item} />}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={handleRefresh}
        />
      </View>
    </BaseScreen>
  );
};
```

### Invoice Creation Module

```typescript
// screens/invoices/CreateInvoiceScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createInvoice } from '../../store/slices/invoiceSlice';
import { BaseScreen } from '../../components/common/BaseScreen';
import { InputField } from '../../components/forms/InputField';
import { DatePicker } from '../../components/forms/DatePicker';
import { PickerField } from '../../components/forms/PickerField';
import { CustomerPicker } from '../../components/customers/CustomerPicker';
import { ProductSelector } from '../../components/products/ProductSelector';
import { Button } from '../../components/common/Button';
import { InvoiceType } from '../../types/invoice';

interface CreateInvoiceForm {
  invoiceNumber: string;
  date: Date;
  customerId: string;
  invoiceType: InvoiceType;
  items: InvoiceDetailInput[];
}

export const CreateInvoiceScreen = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.invoices);
  const { customers } = useAppSelector(state => state.customers);
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm<CreateInvoiceForm>({
    defaultValues: {
      invoiceNumber: '',
      date: new Date(),
      customerId: '',
      invoiceType: InvoiceType.Factura,
      items: [],
    },
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);

  const onSubmit = async (data: CreateInvoiceForm) => {
    if (invoiceItems.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return;
    }

    try {
      const invoiceData = {
        ...data,
        items: invoiceItems,
        customer: selectedCustomer,
      };

      await dispatch(createInvoice(invoiceData)).unwrap();
      Alert.alert('Éxito', 'Factura creada exitosamente');
      // Navigate back or reset form
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la factura');
    }
  };

  const invoiceTypeOptions = [
    { label: 'Factura', value: InvoiceType.Factura },
    { label: 'CCF', value: InvoiceType.CCF },
    { label: 'Sujeto Excluido', value: InvoiceType.SujetoExcluido },
    { label: 'Nota de Crédito', value: InvoiceType.NotaCredito },
  ];

  return (
    <BaseScreen loading={loading} scrollable>
      <View style={{ flex: 1, gap: 16 }}>
        <Controller
          control={control}
          name="invoiceNumber"
          rules={{ required: 'Número de factura requerido' }}
          render={({ field }) => (
            <InputField
              label="Número de Factura"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.invoiceNumber?.message}
              placeholder="Ingrese número de factura"
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              label="Fecha"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="invoiceType"
          render={({ field }) => (
            <PickerField
              label="Tipo de Documento"
              value={field.value}
              onValueChange={field.onChange}
              options={invoiceTypeOptions}
            />
          )}
        />

        <CustomerPicker
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          customers={customers}
        />

        <ProductSelector
          items={invoiceItems}
          onItemsChange={setInvoiceItems}
        />

        <Button
          title="Crear Factura"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={{ marginTop: 24 }}
        />
      </View>
    </BaseScreen>
  );
};
```

## 🎨 Theme and Styling

```typescript
// config/theme.ts
export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    info: '#5AC8FA',
    light: '#F2F2F7',
    dark: '#1C1C1E',
    text: {
      primary: '#000000',
      secondary: '#6D6D80',
      light: '#FFFFFF',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      dark: '#1C1C1E',
    },
    border: {
      light: '#E5E5EA',
      medium: '#C7C7CC',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 22,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 18,
    },
    small: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  }
};

// hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { theme as lightTheme } from '../config/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  
  // For future dark mode support
  const isDark = colorScheme === 'dark';
  
  return {
    theme: lightTheme, // Will switch based on isDark in future
    isDark,
  };
};
```

## 🔄 Data Flow Architecture

### RTK Query Integration

```typescript
// store/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const apiKey = process.env.REACT_APP_API_KEY;
      const credentials = state.auth.credentials;

      headers.set('apiKey', apiKey);
      if (credentials) {
        headers.set('mhUser', credentials.user);
        headers.set('mhKey', credentials.password);
        if (credentials.certificateKey) {
          headers.set('certificateKey', credentials.certificateKey);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Invoice', 'Customer', 'Product', 'Company', 'Catalog'],
  endpoints: (builder) => ({
    // Invoice endpoints
    getInvoices: builder.query({
      query: ({ companyId, page = 1 }) => 
        `/invoices?companyId=${companyId}&page=${page}`,
      providesTags: ['Invoice'],
    }),
    
    createInvoice: builder.mutation({
      query: (invoice) => ({
        url: '/invoices',
        method: 'POST',
        body: invoice,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // DTE submission
    submitDTE: builder.mutation({
      query: ({ dte, credentials }) => ({
        url: '/document/dte/sync',
        method: 'POST',
        body: dte,
        headers: {
          'mhUser': credentials.user,
          'mhKey': credentials.credential,
          'certificateKey': credentials.key,
          'invoiceNumber': credentials.invoiceNumber,
        },
      }),
    }),

    // Catalog endpoints
    getCatalogs: builder.query({
      query: () => '/catalog',
      providesTags: ['Catalog'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useSubmitDTEMutation,
  useGetCatalogsQuery,
} = apiSlice;
```

### Background Sync Hook

```typescript
// hooks/useBackgroundSync.ts
import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-netinfo/netinfo';
import { useAppDispatch, useAppSelector } from './redux';
import { syncPendingInvoices } from '../store/slices/invoiceSlice';
import { syncCatalogs } from '../store/slices/catalogSlice';

export const useBackgroundSync = () => {
  const dispatch = useAppDispatch();
  const pendingSync = useAppSelector(state => state.invoices.pendingSync);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        const netInfo = await NetInfo.fetch();
        
        if (netInfo.isConnected) {
          // Sync pending invoices
          if (pendingSync.length > 0) {
            dispatch(syncPendingInvoices());
          }
          
          // Check if catalogs need refresh
          dispatch(syncCatalogs());
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [dispatch, pendingSync]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && pendingSync.length > 0) {
        dispatch(syncPendingInvoices());
      }
    });

    return unsubscribe;
  }, [dispatch, pendingSync]);
};
```

## 📱 Platform-Specific Considerations

### iOS Integration

```typescript
// services/platform/IOSService.ts
import { Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

export class IOSService {
  static isIOS = Platform.OS === 'ios';

  static async pickCertificateFile(): Promise<string | null> {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      const fileContent = await RNFS.readFile(res[0].uri, 'base64');
      return fileContent;
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        return null;
      }
      throw err;
    }
  }

  static async shareInvoicePDF(pdfPath: string): Promise<void> {
    await Share.open({
      url: `file://${pdfPath}`,
      type: 'application/pdf',
    });
  }
}
```

### Android Integration

```typescript
// services/platform/AndroidService.ts
import { Platform, PermissionsAndroid } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

export class AndroidService {
  static isAndroid = Platform.OS === 'android';

  static async requestStoragePermission(): Promise<boolean> {
    if (Platform.Version >= 33) {
      return true; // Scoped storage
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permiso de almacenamiento',
          message: 'La aplicación necesita acceso al almacenamiento para guardar facturas',
          buttonNeutral: 'Preguntar más tarde',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }

  static async saveInvoicePDF(pdfData: string, fileName: string): Promise<string> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      throw new Error('Permiso de almacenamiento requerido');
    }

    const path = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
    await RNFetchBlob.fs.writeFile(path, pdfData, 'base64');
    return path;
  }
}
```

## 🧪 Testing Strategy

### Component Testing

```typescript
// __tests__/components/InvoiceListItem.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InvoiceListItem } from '../src/components/invoices/InvoiceListItem';
import { invoiceSlice } from '../src/store/slices/invoiceSlice';

const mockStore = configureStore({
  reducer: {
    invoices: invoiceSlice.reducer,
  },
});

const mockInvoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  date: new Date('2024-01-01'),
  status: 0, // Nueva
  totalAmount: 113.00,
  customer: { firstName: 'John', lastName: 'Doe' },
};

describe('InvoiceListItem', () => {
  it('renders invoice information correctly', () => {
    const { getByText } = render(
      <Provider store={mockStore}>
        <InvoiceListItem invoice={mockInvoice} />
      </Provider>
    );

    expect(getByText('INV-001')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('$113.00')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <InvoiceListItem invoice={mockInvoice} onPress={onPress} />
      </Provider>
    );

    fireEvent.press(getByTestId('invoice-item'));
    expect(onPress).toHaveBeenCalledWith(mockInvoice);
  });
});
```

### Service Testing

```typescript
// __tests__/services/InvoiceService.test.ts
import { InvoiceService } from '../src/services/api/InvoiceService';
import { HttpClient } from '../src/services/api/HttpClient';

jest.mock('../src/services/api/HttpClient');

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    service = new InvoiceService(false);
    mockHttpClient = new HttpClient() as jest.Mocked<HttpClient>;
  });

  it('should submit DTE successfully', async () => {
    const mockDTE = {
      identificacion: {
        tipoDte: '01',
        fecEmi: '2024-01-01'
      }
    };

    const mockCredentials = {
      user: 'testuser',
      credential: 'testpass',
      key: 'testkey',
      invoiceNumber: 'INV-001'
    };

    const expectedResponse = {
      success: true,
      codigoGeneracion: 'ABC123'
    };

    mockHttpClient.post.mockResolvedValue(expectedResponse);

    const result = await service.submitDTE(mockDTE, mockCredentials);

    expect(result).toEqual(expectedResponse);
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/document/dte/sync',
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'mhUser': 'testuser',
          'mhKey': 'testpass',
          'certificateKey': 'testkey'
        })
      })
    );
  });
});
```

## 🚀 Development Workflow

### Environment Configuration

```typescript
// config/env.ts
export const config = {
  development: {
    API_URL: 'https://k-invoices-api-dev.azurewebsites.net',
    API_KEY: process.env.DEV_API_KEY,
    ENVIRONMENT: 'development',
    LOGGING_LEVEL: 'debug',
  },
  production: {
    API_URL: 'https://k-invoices-api.azurewebsites.net',
    API_KEY: process.env.PROD_API_KEY,
    ENVIRONMENT: 'production',
    LOGGING_LEVEL: 'error',
  }
};

export const getConfig = () => {
  return __DEV__ ? config.development : config.production;
};
```

### Build Scripts

```json
{
  "scripts": {
    "android:dev": "react-native run-android --variant=debug",
    "android:prod": "react-native run-android --variant=release",
    "ios:dev": "react-native run-ios --scheme FacturasSimplesRN",
    "ios:prod": "react-native run-ios --scheme FacturasSimplesRN --configuration Release",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace FacturasSimplesRN.xcworkspace -scheme FacturasSimplesRN -configuration Release archive"
  }
}
```

This comprehensive architecture provides a solid foundation for building a professional, scalable React Native application that matches the functionality of the Swift version while leveraging modern React Native development practices.
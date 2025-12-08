import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CatalogDropdown } from '../CatalogDropdown';
import catalogSlice from '../../store/slices/catalogSlice';
import { GovernmentCatalogId } from '../../types/catalog';

// Mock store with catalog data
const mockStore = configureStore({
  reducer: {
    catalogs: catalogSlice,
  },
  preloadedState: {
    catalogs: {
      catalogs: [
        {
          id: GovernmentCatalogId.DEPARTMENTS,
          name: 'Departamentos',
          isActive: true,
          totalOptions: 2,
          options: [
            {
              id: 'dep_1',
              code: '06',
              description: 'San Salvador',
              catalogId: GovernmentCatalogId.DEPARTMENTS,
              isActive: true,
            },
            {
              id: 'dep_2',
              code: '14',
              description: 'La Libertad',
              catalogId: GovernmentCatalogId.DEPARTMENTS,
              isActive: true,
            },
          ],
        },
        {
          id: GovernmentCatalogId.MUNICIPALITIES,
          name: 'Municipios',
          isActive: true,
          totalOptions: 3,
          options: [
            {
              id: 'mun_1',
              code: '0606',
              description: 'San Salvador',
              departamento: '06',
              catalogId: GovernmentCatalogId.MUNICIPALITIES,
              isActive: true,
            },
            {
              id: 'mun_2',
              code: '0607',
              description: 'Mejicanos',
              departamento: '06',
              catalogId: GovernmentCatalogId.MUNICIPALITIES,
              isActive: true,
            },
            {
              id: 'mun_3',
              code: '1401',
              description: 'Santa Tecla',
              departamento: '14',
              catalogId: GovernmentCatalogId.MUNICIPALITIES,
              isActive: true,
            },
          ],
        },
      ],
      syncInfo: {},
      loading: false,
      error: null,
      searchTerm: '',
      filters: {},
    },
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};

describe('CatalogDropdown', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with placeholder text', () => {
    const { getByText } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label="Test Dropdown"
        onSelect={mockOnSelect}
        placeholder="Select option..."
      />
    );

    expect(getByText('Test Dropdown')).toBeTruthy();
    expect(getByText('Select option...')).toBeTruthy();
  });

  it('should show selected value', () => {
    const { getByText } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label="Test Dropdown"
        value="06"
        onSelect={mockOnSelect}
      />
    );

    expect(getByText('San Salvador')).toBeTruthy();
  });

  it('should open modal when pressed', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label="Test Dropdown"
        onSelect={mockOnSelect}
      />
    );

    // Press the dropdown to open modal
    fireEvent.press(getByText('Seleccionar...'));

    await waitFor(() => {
      expect(getByText('Test Dropdown')).toBeTruthy(); // Modal title
    });
  });

  it('should filter options correctly', () => {
    const { getByText, queryByText } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.MUNICIPALITIES}
        label="Municipios"
        onSelect={mockOnSelect}
        filterBy={{ field: 'departamento', value: '06' }}
      />
    );

    fireEvent.press(getByText('Seleccionar...'));

    // Should show municipalities for department 06
    expect(getByText('San Salvador')).toBeTruthy();
    expect(getByText('Mejicanos')).toBeTruthy();
    // Should NOT show municipality from department 14
    expect(queryByText('Santa Tecla')).toBeFalsy();
  });

  it('should call onSelect when option is selected', async () => {
    const { getByText } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label="Test Dropdown"
        onSelect={mockOnSelect}
      />
    );

    // Open modal
    fireEvent.press(getByText('Seleccionar...'));

    // Select an option
    await waitFor(() => {
      fireEvent.press(getByText('San Salvador'));
    });

    expect(mockOnSelect).toHaveBeenCalledWith({
      id: 'dep_1',
      code: '06',
      description: 'San Salvador',
      catalogId: GovernmentCatalogId.DEPARTMENTS,
      isActive: true,
    });
  });

  it('should show loading state when catalog is not available', () => {
    const emptyStore = configureStore({
      reducer: {
        catalogs: catalogSlice,
      },
      preloadedState: {
        catalogs: {
          catalogs: [],
          syncInfo: {},
          loading: false,
          error: null,
          searchTerm: '',
          filters: {},
        },
      },
    });

    const { getByText } = render(
      <Provider store={emptyStore}>
        <CatalogDropdown
          catalogId={GovernmentCatalogId.DEPARTMENTS}
          label="Test Dropdown"
          onSelect={mockOnSelect}
        />
      </Provider>
    );

    expect(getByText('Cargando catálogo...')).toBeTruthy();
  });

  it('should show required indicator', () => {
    const { getByText } = renderWithProvider(
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label="Test Dropdown"
        onSelect={mockOnSelect}
        required={true}
      />
    );

    expect(getByText('Test Dropdown *')).toBeTruthy();
  });
});
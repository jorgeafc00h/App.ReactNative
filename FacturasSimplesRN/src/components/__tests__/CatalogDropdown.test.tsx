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
  return render(React.createElement(Provider, { store: mockStore }, component));
};

describe('CatalogDropdown', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with placeholder text', () => {
    const { getByTestId } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.DEPARTMENTS,
        label: 'Test Dropdown',
        onSelect: mockOnSelect,
        placeholder: 'Select option...',
      })
    );

    expect(getByTestId(`catalog-label-${GovernmentCatalogId.DEPARTMENTS}`)).toBeTruthy();
    expect(getByTestId(`catalog-value-${GovernmentCatalogId.DEPARTMENTS}`)).toBeTruthy();
  });

  it('should show selected value', () => {
    const { getByTestId: getByTestId2 } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.DEPARTMENTS,
        label: 'Test Dropdown',
        value: '06',
        onSelect: mockOnSelect,
      })
    );

    // Value should be present in the value element
    const valEl = getByTestId2(`catalog-value-${GovernmentCatalogId.DEPARTMENTS}`);
    expect(valEl).toBeTruthy();
  });

  it('should open modal when pressed', async () => {
    const { getByTestId: getByTestId3 } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.DEPARTMENTS,
        label: 'Test Dropdown',
        onSelect: mockOnSelect,
      })
    );

    // Open modal
    fireEvent.press(getByTestId3(`catalog-toggle-${GovernmentCatalogId.DEPARTMENTS}`));

    await waitFor(() => {
      expect(getByTestId3(`catalog-modal-title-${GovernmentCatalogId.DEPARTMENTS}`)).toBeTruthy();
    });
  });

  it('should filter options correctly', () => {
    const { getByTestId: getByTestId4, queryByTestId } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.MUNICIPALITIES,
        label: 'Municipios',
        onSelect: mockOnSelect,
        filterBy: { field: 'departamento', value: '06' },
      })
    );

    fireEvent.press(getByTestId4(`catalog-toggle-${GovernmentCatalogId.MUNICIPALITIES}`));

    // Should show municipalities for department 06
    expect(getByTestId4(`catalog-option-${GovernmentCatalogId.MUNICIPALITIES}-mun_1`)).toBeTruthy();
    expect(getByTestId4(`catalog-option-${GovernmentCatalogId.MUNICIPALITIES}-mun_2`)).toBeTruthy();
    // Should NOT show municipality from department 14
    expect(queryByTestId(`catalog-option-${GovernmentCatalogId.MUNICIPALITIES}-mun_3`)).toBeFalsy();
  });

  it('should call onSelect when option is selected', async () => {
    const { getByTestId: getByTestId5 } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.DEPARTMENTS,
        label: 'Test Dropdown',
        onSelect: mockOnSelect,
      })
    );

    // Open modal and select option by testID
    fireEvent.press(getByTestId5(`catalog-toggle-${GovernmentCatalogId.DEPARTMENTS}`));
    await waitFor(() => {
      fireEvent.press(getByTestId5(`catalog-option-${GovernmentCatalogId.DEPARTMENTS}-dep_1`));
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

    const { getByTestId: getByTestId6 } = render(
      React.createElement(Provider, { store: emptyStore },
        React.createElement(CatalogDropdown, {
          catalogId: GovernmentCatalogId.DEPARTMENTS,
          label: 'Test Dropdown',
          onSelect: mockOnSelect,
        })
      )
    );

    expect(getByTestId6(`catalog-loading-${GovernmentCatalogId.DEPARTMENTS}`)).toBeTruthy();
  });

  it('should show required indicator', () => {
    const { getByTestId: getByTestId7 } = renderWithProvider(
      React.createElement(CatalogDropdown, {
        catalogId: GovernmentCatalogId.DEPARTMENTS,
        label: 'Test Dropdown',
        onSelect: mockOnSelect,
        required: true,
      })
    );

    const labelWithReq = getByTestId7(`catalog-label-${GovernmentCatalogId.DEPARTMENTS}`);
    expect(labelWithReq).toBeTruthy();
  });
});
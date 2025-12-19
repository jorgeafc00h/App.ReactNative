import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { CatalogDropdown } from './CatalogDropdown';
import { GovernmentCatalogId, CatalogOption } from '../types/catalog';

/**
 * LocationDropdowns - Reusable component for Department and Municipality selection
 * 
 * Matches Swift behavior:
 * - .onChange(of: company.departamentoCode) triggers reset of municipio
 * - .onChange(of: company.municipioCode) updates the selection
 * 
 * Used in:
 * - CompanyConfigurationScreen (Step 2)
 * - CustomerForm
 * - Any form requiring location selection
 */

export interface LocationData {
  departamentoCode: string;
  departamento: string;
  municipioCode: string;
  municipio: string;
}

interface LocationDropdownsProps {
  /** Current location values */
  value: LocationData;
  /** Callback when any location field changes */
  onChange: (data: LocationData) => void;
  /** Whether fields are required */
  required?: boolean;
  /** Custom labels */
  labels?: {
    departamento?: string;
    municipio?: string;
  };
  /** Placeholder texts */
  placeholders?: {
    departamento?: string;
    municipio?: string;
  };
}

export const LocationDropdowns: React.FC<LocationDropdownsProps> = ({
  value,
  onChange,
  required = false,
  labels = {},
  placeholders = {},
}) => {
  const {
    departamentoCode,
    departamento,
    municipioCode,
    municipio,
  } = value;

  /**
   * Handler for department change - matches Swift's onDepartamentoChange()
   * When department changes, reset municipality (matching Swift behavior)
   */
  const handleDepartmentChange = useCallback((option: CatalogOption | null) => {
    const newDepartamentoCode = option?.code || '';
    const newDepartamento = option?.description || '';
    
    // When department changes, always reset municipality
    // This matches Swift's behavior: .onChange(of: company.departamentoCode) { onDepartamentoChange() }
    if (newDepartamentoCode !== departamentoCode) {
      onChange({
        departamentoCode: newDepartamentoCode,
        departamento: newDepartamento,
        municipioCode: '', // Reset municipality
        municipio: '',
      });
    }
  }, [departamentoCode, onChange]);

  /**
   * Handler for municipality change - matches Swift's onMunicipioChange()
   */
  const handleMunicipalityChange = useCallback((option: CatalogOption | null) => {
    onChange({
      departamentoCode,
      departamento,
      municipioCode: option?.code || '',
      municipio: option?.description || '',
    });
  }, [departamentoCode, departamento, onChange]);

  return (
    <View style={styles.container}>
      {/* Department Dropdown */}
      <CatalogDropdown
        catalogId={GovernmentCatalogId.DEPARTMENTS}
        label={labels.departamento || 'Departamento'}
        placeholder={placeholders.departamento || 'Seleccione Departamento'}
        value={departamentoCode}
        onSelect={handleDepartmentChange}
        required={required}
      />

      {/* Municipality Dropdown - filtered by selected department */}
      <CatalogDropdown
        catalogId={GovernmentCatalogId.MUNICIPALITIES}
        label={labels.municipio || 'Municipio'}
        placeholder={placeholders.municipio || 'Seleccione Municipio'}
        value={municipioCode}
        onSelect={handleMunicipalityChange}
        filterBy={departamentoCode ? { 
          field: 'departamento', 
          value: departamentoCode 
        } : undefined}
        required={required}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No extra styling needed - CatalogDropdown handles its own spacing
  },
});

export default LocationDropdowns;

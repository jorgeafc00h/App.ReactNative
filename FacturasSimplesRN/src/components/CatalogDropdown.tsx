import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useAppSelector } from '../store';
import { selectCatalogById } from '../store/selectors/catalogSelectors';
import { CatalogOption } from '../types/catalog';

interface CatalogDropdownProps {
  catalogId: string;
  label: string;
  placeholder?: string;
  value?: string;
  onSelect: (option: CatalogOption | null) => void;
  required?: boolean;
  filterBy?: {
    field: string;
    value: string;
  };
}

export const CatalogDropdown: React.FC<CatalogDropdownProps> = ({
  catalogId,
  label,
  placeholder = "Seleccionar...",
  value,
  onSelect,
  required = false,
  filterBy,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const catalog = useAppSelector(state => selectCatalogById(catalogId)(state));
  
  const filteredOptions = useMemo(() => {
    if (!catalog) return [];
    
    let options = [...catalog.options];
    
    // Apply filter if specified (e.g., municipalities filtered by department)
    if (filterBy) {
      options = options.filter(option => {
        const fieldValue = (option as any)[filterBy.field];
        return fieldValue === filterBy.value;
      });
    }
    
    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      options = options.filter(option => 
        option.description.toLowerCase().includes(search) ||
        option.code.toLowerCase().includes(search)
      );
    }
    
    return options;
  }, [catalog, filterBy, searchText]);
  
  const selectedOption = useMemo(() => {
    if (!value || !catalog) return null;
    return catalog.options.find(option => option.code === value) || null;
  }, [value, catalog]);

  const handleSelect = (option: CatalogOption) => {
    onSelect(option);
    setIsVisible(false);
    setSearchText('');
  };

  const handleClear = () => {
    onSelect(null);
    setIsVisible(false);
    setSearchText('');
  };

  if (!catalog) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label} {required && '*'}
        </Text>
        <View style={[styles.dropdown, styles.dropdownDisabled]}>
          <Text style={styles.disabledText}>Cargando catálogo...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.dropdownText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.description : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearButton}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar..."
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  item.code === value && styles.selectedOption,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[
                  styles.optionText,
                  item.code === value && styles.selectedOptionText,
                ]}>
                  {item.description}
                </Text>
                <Text style={[
                  styles.optionCode,
                  item.code === value && styles.selectedOptionCode,
                ]}>
                  {item.code}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText.trim() ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    minHeight: 48,
  },
  dropdownDisabled: {
    backgroundColor: '#F7FAFC',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2D3748',
    flex: 1,
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  disabledText: {
    color: '#A0AEC0',
    fontSize: 16,
  },
  arrow: {
    fontSize: 12,
    color: '#4A5568',
    marginLeft: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#4A5568',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  clearButton: {
    fontSize: 16,
    color: '#E53E3E',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  optionItem: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedOption: {
    backgroundColor: '#EBF8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#3182CE',
    fontWeight: '500',
  },
  optionCode: {
    fontSize: 12,
    color: '#4A5568',
  },
  selectedOptionCode: {
    color: '#2B6CB0',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
  },
});
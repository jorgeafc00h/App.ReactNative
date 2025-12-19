import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch } from '../../store';
import { updateCompany } from '../../store/slices/companySlice';
import { Company } from '../../types/company';
import { CatalogDropdown } from '../CatalogDropdown';
import { LocationDropdowns, LocationData } from '../LocationDropdowns';
import { GovernmentCatalogId, CatalogOption } from '../../types/catalog';

interface EditCompanyModalProps {
  visible: boolean;
  company: Company;
  onClose: () => void;
  onSave: (updatedCompany: Company) => void;
}

/**
 * EditCompanyModal - Matches Swift's EmisorEditView functionality
 * Allows editing of company information including:
 * - General information (nombre, nombreComercial, NIT, NRC)
 * - Address (departamento, municipio, complemento)
 * - Contact (correo, telefono)
 * - Economic activity (codActividad, descActividad, tipoEstablecimiento)
 * - MH Codes (codEstableMH, codEstable, codPuntoVentaMH, codPuntoVenta)
 */
export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  visible,
  company,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state - initialized from company prop
  const [formData, setFormData] = useState({
    nombre: company.nombre || '',
    nombreComercial: company.nombreComercial || '',
    nit: company.nit || '',
    nrc: company.nrc || '',
    correo: company.correo || '',
    telefono: company.telefono || '',
    complemento: company.complemento || '',
    codActividad: company.codActividad || '',
    descActividad: company.descActividad || '',
    tipoEstablecimiento: company.tipoEstablecimiento || '',
    descTipoEstablecimiento: company.descTipoEstablecimiento || '',
    codEstableMH: company.codEstableMH || '',
    codEstable: company.codEstable || '',
    codPuntoVentaMH: company.codPuntoVentaMH || '',
    codPuntoVenta: company.codPuntoVenta || '',
  });

  // Location state
  const [locationData, setLocationData] = useState<LocationData>({
    departamentoCode: company.departamentoCode || '',
    departamento: company.departamento || '',
    municipioCode: company.municipioCode || '',
    municipio: company.municipio || '',
  });

  // Reset form when company changes
  useEffect(() => {
    setFormData({
      nombre: company.nombre || '',
      nombreComercial: company.nombreComercial || '',
      nit: company.nit || '',
      nrc: company.nrc || '',
      correo: company.correo || '',
      telefono: company.telefono || '',
      complemento: company.complemento || '',
      codActividad: company.codActividad || '',
      descActividad: company.descActividad || '',
      tipoEstablecimiento: company.tipoEstablecimiento || '',
      descTipoEstablecimiento: company.descTipoEstablecimiento || '',
      codEstableMH: company.codEstableMH || '',
      codEstable: company.codEstable || '',
      codPuntoVentaMH: company.codPuntoVentaMH || '',
      codPuntoVenta: company.codPuntoVenta || '',
    });
    setLocationData({
      departamentoCode: company.departamentoCode || '',
      departamento: company.departamento || '',
      municipioCode: company.municipioCode || '',
      municipio: company.municipio || '',
    });
    setValidationErrors([]);
  }, [company, visible]);

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.nombre.trim()) {
      errors.push('• El nombre es requerido');
    }
    if (!formData.nombreComercial.trim()) {
      errors.push('• El nombre comercial es requerido');
    }
    if (!formData.nit.trim()) {
      errors.push('• El NIT es requerido');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Campos Requeridos', validationErrors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      const updatedCompany: Company = {
        ...company,
        ...formData,
        departamentoCode: locationData.departamentoCode,
        departamento: locationData.departamento,
        municipioCode: locationData.municipioCode,
        municipio: locationData.municipio,
      };

      // Dispatch update to Redux store
      dispatch(updateCompany(updatedCompany));
      
      onSave(updatedCompany);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar los cambios. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivitySelect = (option: CatalogOption | null) => {
    updateFormField('codActividad', option?.code || '');
    updateFormField('descActividad', option?.description || '');
  };

  const handleEstablecimientoSelect = (option: CatalogOption | null) => {
    updateFormField('tipoEstablecimiento', option?.code || '');
    updateFormField('descTipoEstablecimiento', option?.description || '');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Editar Información
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.saveText, { color: theme.colors.primary }]}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* General Information Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Información General
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Nombre *
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.nombre}
                onChangeText={(text) => updateFormField('nombre', text)}
                placeholder="Nombre de la empresa"
                placeholderTextColor={theme.colors.text.tertiary}
              />
              {!formData.nombre.trim() && (
                <Text style={styles.errorText}>Este campo es requerido</Text>
              )}
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Nombre Comercial / Razón Social *
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.nombreComercial}
                onChangeText={(text) => updateFormField('nombreComercial', text)}
                placeholder="Nombre comercial"
                placeholderTextColor={theme.colors.text.tertiary}
              />
              {!formData.nombreComercial.trim() && (
                <Text style={styles.errorText}>Este campo es requerido</Text>
              )}
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                NIT *
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.nit}
                onChangeText={(text) => updateFormField('nit', text)}
                placeholder="NIT"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="numeric"
              />
              {!formData.nit.trim() && (
                <Text style={styles.errorText}>Este campo es requerido</Text>
              )}
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                NRC
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.nrc}
                onChangeText={(text) => updateFormField('nrc', text)}
                placeholder="NRC"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.footerText, { color: theme.colors.text.tertiary }]}>
              Los campos marcados con * son obligatorios
            </Text>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Dirección
            </Text>
            
            <LocationDropdowns
              value={locationData}
              onChange={setLocationData}
            />

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Dirección / Complemento
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.complemento}
                onChangeText={(text) => updateFormField('complemento', text)}
                placeholder="Dirección completa"
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
              />
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Contacto
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Correo Electrónico
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.correo}
                onChangeText={(text) => updateFormField('correo', text)}
                placeholder="email@ejemplo.com"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Teléfono
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.telefono}
                onChangeText={(text) => updateFormField('telefono', text)}
                placeholder="0000-0000"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Economic Activity Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Actividad Económica
            </Text>
            
            <CatalogDropdown
              catalogId={GovernmentCatalogId.ECONOMIC_ACTIVITIES}
              label="Actividad Económica"
              placeholder="Seleccionar Actividad Económica"
              value={formData.codActividad}
              onSelect={handleActivitySelect}
            />

            <CatalogDropdown
              catalogId={GovernmentCatalogId.ESTABLISHMENT_TYPES}
              label="Tipo Establecimiento"
              placeholder="Seleccionar Tipo"
              value={formData.tipoEstablecimiento}
              onSelect={handleEstablecimientoSelect}
            />
          </View>

          {/* MH Codes Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Códigos MH (Ministerio de Hacienda)
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Código Establecimiento MH
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.codEstableMH}
                onChangeText={(text) => updateFormField('codEstableMH', text)}
                placeholder="Código Establecimiento MH"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Código Establecimiento
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.codEstable}
                onChangeText={(text) => updateFormField('codEstable', text)}
                placeholder="Código Establecimiento"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Código Punto Venta MH
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.codPuntoVentaMH}
                onChangeText={(text) => updateFormField('codPuntoVentaMH', text)}
                placeholder="Código Punto Venta MH"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                Código Punto Venta
              </Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={formData.codPuntoVenta}
                onChangeText={(text) => updateFormField('codPuntoVenta', text)}
                placeholder="Código Punto Venta"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 17,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    marginTop: 8,
  },
});

export default EditCompanyModal;

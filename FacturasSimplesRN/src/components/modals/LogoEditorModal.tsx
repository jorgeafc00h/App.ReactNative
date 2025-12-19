import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
// @ts-ignore - Expo vector icons are available at runtime
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch } from '../../store';
import { updateCompany } from '../../store/slices/companySlice';
import { Company } from '../../types/company';

interface LogoEditorModalProps {
  visible: boolean;
  company: Company;
  onClose: () => void;
  onSave: (updatedCompany: Company) => void;
}

/**
 * LogoEditorModal - Matches Swift's LogoEditorView functionality
 * Allows selecting and editing company logo for invoices
 */
export const LogoEditorModal: React.FC<LogoEditorModalProps> = ({
  visible,
  company,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(company.invoiceLogo || null);
  const [logoWidth, setLogoWidth] = useState<number>(company.logoWidth || 150);
  const [logoHeight, setLogoHeight] = useState<number>(company.logoHeight || 50);

  const handleSelectImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Necesitamos acceso a tu galería para seleccionar una imagen.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.base64) {
          setLogoBase64(asset.base64);
          
          // Update dimensions based on image if available
          if (asset.width && asset.height) {
            const aspectRatio = asset.width / asset.height;
            setLogoWidth(Math.round(150 * aspectRatio));
            setLogoHeight(150);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedCompany: Company = {
        ...company,
        invoiceLogo: logoBase64 || '',
        logoWidth: logoWidth,
        logoHeight: logoHeight,
      };

      // Update in Redux store
      dispatch(updateCompany(updatedCompany));
      
      Alert.alert('Éxito', 'Logo actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            onSave(updatedCompany);
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLogo = () => {
    Alert.alert(
      '¿Eliminar logo?',
      'Se eliminará el logo actual de las facturas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setLogoBase64(null),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Editar Logo
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
        >
          {/* Logo Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Logo Facturas
            </Text>
            
            <View style={styles.logoContent}>
              {/* Select Image Button */}
              <TouchableOpacity
                style={[styles.selectButton, { borderColor: theme.colors.primary }]}
                onPress={handleSelectImage}
              >
                <Ionicons name="image" size={20} color={theme.colors.primary} />
                <Text style={[styles.selectButtonText, { color: theme.colors.primary }]}>
                  Seleccionar Imagen
                </Text>
              </TouchableOpacity>

              {/* Logo Preview */}
              {logoBase64 ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: `data:image/png;base64,${logoBase64}` }}
                    style={[styles.logoPreview, { maxWidth: logoWidth, maxHeight: logoHeight }]}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearLogo}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={styles.clearButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.emptyPreview, { backgroundColor: theme.colors.surface.secondary }]}>
                  <Ionicons name="image" size={32} color={theme.colors.text.tertiary} />
                  <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
                    Sin logo seleccionado
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Dimensions Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Dimensiones del Logo
            </Text>
            
            <View style={styles.dimensionRow}>
              <View style={styles.dimensionItem}>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.text.secondary} />
                <Text style={[styles.dimensionLabel, { color: theme.colors.text.secondary }]}>
                  Ancho
                </Text>
              </View>
              <View style={styles.dimensionValue}>
                <TouchableOpacity 
                  style={styles.dimensionButton}
                  onPress={() => setLogoWidth(Math.max(50, logoWidth - 10))}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.dimensionText, { color: theme.colors.text.primary }]}>
                  {logoWidth}
                </Text>
                <TouchableOpacity 
                  style={styles.dimensionButton}
                  onPress={() => setLogoWidth(Math.min(300, logoWidth + 10))}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dimensionRow}>
              <View style={styles.dimensionItem}>
                <Ionicons name="arrow-down" size={18} color={theme.colors.text.secondary} />
                <Text style={[styles.dimensionLabel, { color: theme.colors.text.secondary }]}>
                  Alto
                </Text>
              </View>
              <View style={styles.dimensionValue}>
                <TouchableOpacity 
                  style={styles.dimensionButton}
                  onPress={() => setLogoHeight(Math.max(30, logoHeight - 10))}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.dimensionText, { color: theme.colors.text.primary }]}>
                  {logoHeight}
                </Text>
                <TouchableOpacity 
                  style={styles.dimensionButton}
                  onPress={() => setLogoHeight(Math.min(200, logoHeight + 10))}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  logoContent: {
    alignItems: 'center',
    gap: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoPreview: {
    width: 200,
    height: 100,
    borderRadius: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 14,
  },
  emptyPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dimensionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimensionLabel: {
    fontSize: 16,
  },
  dimensionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dimensionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  dimensionText: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LogoEditorModal;

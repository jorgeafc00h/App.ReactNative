import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateProfile } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const dispatch = useAppDispatch();
  
  const { user, isGuestMode, loading } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  };

  if (isGuestMode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface.primary, borderBottomColor: theme.colors.border.light }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Perfil
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Guest Mode Message */}
        <View style={styles.guestContainer}>
          <View style={[styles.guestIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="person-outline" size={48} color={theme.colors.primary} />
          </View>
          
          <Text style={[styles.guestTitle, { color: theme.colors.text.primary }]}>
            Modo Invitado
          </Text>
          
          <Text style={[styles.guestMessage, { color: theme.colors.text.secondary }]}>
            Estás usando la aplicación en modo invitado. Para acceder a todas las funciones y sincronizar tus datos, crea una cuenta o inicia sesión.
          </Text>
          
          <TouchableOpacity 
            style={[styles.signUpButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // Navigate to sign up
              console.log('Navigate to sign up');
            }}
          >
            <Text style={styles.signUpButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => {
              // Navigate to sign in
              console.log('Navigate to sign in');
            }}
          >
            <Text style={[styles.signInButtonText, { color: theme.colors.primary }]}>
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface.primary, borderBottomColor: theme.colors.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Perfil
        </Text>
        <TouchableOpacity onPress={isEditing ? handleCancel : () => setIsEditing(true)}>
          <Text style={[styles.editButton, { color: theme.colors.primary }]}>
            {isEditing ? 'Cancelar' : 'Editar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <View style={[styles.photoSection, { backgroundColor: theme.colors.surface.primary }]}>
          <View style={styles.photoContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.profileInitials}>{getInitials()}</Text>
              </View>
            )}
            
            {isEditing && (
              <TouchableOpacity 
                style={[styles.photoEditButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('Change profile photo');
                }}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          {!isEditing && (
            <View style={styles.basicInfo}>
              <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.displayEmail, { color: theme.colors.text.secondary }]}>
                {user?.email}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            INFORMACIÓN PERSONAL
          </Text>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Nombre</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { 
                  borderColor: theme.colors.border.medium,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary 
                }]}
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Nombre"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
                {user?.firstName || 'No especificado'}
              </Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Apellido</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { 
                  borderColor: theme.colors.border.medium,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary 
                }]}
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Apellido"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
                {user?.lastName || 'No especificado'}
              </Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Correo Electrónico</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { 
                  borderColor: theme.colors.border.medium,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary 
                }]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
                {user?.email || 'No especificado'}
              </Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Teléfono</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { 
                  borderColor: theme.colors.border.medium,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary 
                }]}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Número de teléfono"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
                {user?.phone || 'No especificado'}
              </Text>
            )}
          </View>
        </View>

        {/* Account Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            INFORMACIÓN DE CUENTA
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Estado del Email</Text>
            <View style={styles.verificationBadge}>
              <Ionicons 
                name={user?.isEmailVerified ? "checkmark-circle" : "alert-circle"} 
                size={16} 
                color={user?.isEmailVerified ? theme.colors.success : theme.colors.warning} 
              />
              <Text style={[
                styles.verificationText, 
                { color: user?.isEmailVerified ? theme.colors.success : theme.colors.warning }
              ]}>
                {user?.isEmailVerified ? 'Verificado' : 'No verificado'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Miembro desde</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Última actualización</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-ES') : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  basicInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  displayEmail: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    marginTop: 16,
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  fieldContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  guestMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  signUpButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;
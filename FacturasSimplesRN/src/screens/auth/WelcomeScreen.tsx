import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGoogleSignIn: () => void;
  onContinueWithoutAccount: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGoogleSignIn, onContinueWithoutAccount }) => {
  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#6366f1', '#8b5cf6']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
      
      {/* Header Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/AppLogo.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />
      </View>

      {/* App Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Facturas Simples</Text>
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
        <Text style={styles.welcomeSubtitle}>
          Inicia sesión con tu cuenta Google para acceder a todas las funciones de la aplicación
        </Text>

        {/* Feature Items */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📄</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Gestión de Facturas</Text>
              <Text style={styles.featureDescription}>
                Crea y organiza tus facturas fácilmente
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>☁️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Sincronización Google</Text>
              <Text style={styles.featureDescription}>
                Accede a tus datos desde cualquier dispositivo
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🛡️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Seguro y Confiable</Text>
              <Text style={styles.featureDescription}>
                Tu información protegida con Google ID
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Without Account Button */}
        <TouchableOpacity 
          style={styles.continueWithoutAccountButton}
          onPress={onContinueWithoutAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.continueWithoutAccountText}>Continuar sin cuenta</Text>
        </TouchableOpacity>

        {/* Google Sign In Button */}
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={onGoogleSignIn}
          activeOpacity={0.8}
        >
          <View style={styles.signInButtonContent}>
            <Image
              source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
              style={styles.googleIcon}
            />
            <Text style={styles.signInButtonText}>Iniciar sesión con Google</Text>
          </View>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  illustrationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  appLogo: {
    width: 180,
    height: 180,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Marker Felt',
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  continueWithoutAccountButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueWithoutAccountText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
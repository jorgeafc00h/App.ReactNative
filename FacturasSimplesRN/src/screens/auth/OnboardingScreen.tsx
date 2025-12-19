import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
// import {
//   PanGestureHandler,
//   PanGestureHandlerGestureEvent,
//   State,
// } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { CompanyConfigurationForm } from '../../components/forms/CompanyConfigurationForm';
import { useAppDispatch } from '../../store';
import { completeOnboarding, setGuestMode } from '../../store/slices/authSlice';
import { CreateCompanyInput, CompanyEnvironment } from '../../types/company';

const { width, height } = Dimensions.get('window');

// Initial company data state - matches Swift's Company model structure
const initialCompanyData: Partial<CreateCompanyInput> = {
  environment: CompanyEnvironment.Development,
  nit: '',
  nombre: '',
  nombreComercial: '',
  nrc: '',
  correo: '',
  telefono: '',
  complemento: '',
  departamentoCode: '',
  departamento: '',
  municipioCode: '',
  municipio: '',
  codActividad: '',
  descActividad: '',
  tipoEstablecimiento: '',
  establecimiento: '',
  codEstableMH: 'M001',
  codEstable: '',
  codPuntoVentaMH: 'P001',
  codPuntoVenta: '',
  certificatePath: '',
  certificatePassword: '',
  ivaPercentage: 13,
};

interface OnboardingItem {
  id: string;
  title: string;
  subTitle: string;
  introAssetImage: string;
  backgroundColor: string[];
  displaysAction?: boolean;
  companyStep1?: boolean;
  companyStep2?: boolean;
  companyStep3?: boolean;
  companyStep4?: boolean;
  canContinue?: boolean;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    introAssetImage: 'OnboardingImage1.png',
    title: 'Bienvenido a Facturas Simples',
    subTitle: 'Gestiona tus documentos tributarios electrónicos, de manera fácil y rápida, sin complicaciones...',
    backgroundColor: ['#FEB2B2', '#FED7D7'], // .onboarding1 color
    canContinue: true
  },
  {
    id: '2',
    introAssetImage: 'page1', // Will use a default image for missing page1
    title: 'Gestiona Facturas para Múltiples Empresas',
    subTitle: 'Podrá centralizar la facturación electrónica para múltiples emisores...',
    backgroundColor: ['#FFFFFF', '#F8F9FA'], // .white color
    canContinue: true
  },
  {
    id: '3',
    introAssetImage: 'OnboardingImage1.png',
    title: 'Proceso Automatizado de Pruebas',
    subTitle: 'Solicite acceso a produccion con el ministeriod de Hacienda de forma facil y automatica...',
    backgroundColor: ['#FEB2B2', '#FED7D7'], // .onboarding1 color
    canContinue: true
  },
  {
    id: '4',
    introAssetImage: 'page2 1.png',
    title: 'Información de Registro Fiscal!!',
    subTitle: 'Configure la Aplicación con su información de contribuyente y comience a gestionar sus facturas...',
    backgroundColor: ['#FFFFFF', '#F8F9FA'],
    displaysAction: true,
    companyStep1: true,
    canContinue: true
  },
  {
    id: '5',
    introAssetImage: 'AppLogo.png',
    title: 'Datos Generales!',
    subTitle: 'Es la información que aparecerá en las factura y DTE enviados al ministerio de hacienda',
    backgroundColor: ['#FFFFFF', '#F8F9FA'],
    displaysAction: true,
    companyStep2: true,
    canContinue: true
  },
  {
    id: '6',
    introAssetImage: 'page1', // Will use a default image for missing page1
    title: 'Info de emisor',
    subTitle: 'Actividad economica, y tipo de establecimiento',
    backgroundColor: ['#FFFFFF', '#F8F9FA'],
    displaysAction: true,
    companyStep3: true,
    canContinue: true
  },
  {
    id: '7',
    introAssetImage: 'page2 1.png',
    title: 'Falta Poco!',
    subTitle: 'Configure el certificado es requerido para firmar documentos tributarios,si aun no lo tienes, accede a el formulario de solicitud de Hacienda en el siguiente link:',
    backgroundColor: ['#FFFFFF', '#F8F9FA'],
    displaysAction: true,
    companyStep4: true,
    canContinue: true
  }
];

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState<1 | 2 | 3 | 4>(1);
  const dispatch = useAppDispatch();

  // LIFTED STATE: Company data persists across all onboarding steps
  // This matches Swift's pattern: @State var company : Company in OnboardingView
  const [companyData, setCompanyData] = useState<Partial<CreateCompanyInput>>(initialCompanyData);

  // Debug logging and safety checks
  useEffect(() => {
    console.log('OnboardingScreen: Received onComplete prop:', typeof onComplete);
    console.log('OnboardingScreen: onComplete value:', onComplete);
    console.log('OnboardingScreen: Is onComplete callable?', typeof onComplete === 'function');
  }, [onComplete]);

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed. Dispatching completeOnboarding action...');
    dispatch(completeOnboarding());
    
    if (onComplete) {
      try {
        console.log('Calling onComplete function...');
        onComplete();
        console.log('onComplete function called successfully');
      } catch (error) {
        console.error('Error calling onComplete:', error);
      }
    } else {
      console.log('No onComplete prop provided, Redux state updated only');
    }
  };

  const handleSkipToMainApp = () => {
    console.log('Skipping onboarding. Dispatching setGuestMode action...');
    dispatch(setGuestMode(true));
    
    if (onComplete) {
      try {
        console.log('Calling onComplete function...');
        onComplete();
        console.log('onComplete function called successfully');
      } catch (error) {
        console.error('Error calling onComplete:', error);
      }
    } else {
      console.log('No onComplete prop provided, Redux state updated only');
    }
  };


  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      Animated.timing(scrollX, {
        toValue: nextIndex * width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      handleOnboardingComplete();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      Animated.timing(scrollX, {
        toValue: prevIndex * width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    Animated.timing(scrollX, {
      toValue: index * width,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleConfigurarPress = () => {
    const currentItem = onboardingData[currentIndex];
    
    // Determine which configuration step based on the current onboarding screen
    let step: 1 | 2 | 3 | 4 = 1;
    if (currentItem.companyStep1) step = 1;
    else if (currentItem.companyStep2) step = 2;
    else if (currentItem.companyStep3) step = 3;
    else if (currentItem.companyStep4) step = 4;
    
    setConfigStep(step);
    setShowConfigModal(true);
  };

  const handleConfigComplete = () => {
    setShowConfigModal(false);
    
    const currentItem = onboardingData[currentIndex];
    
    // If we just completed the final configuration step (step 4), complete the onboarding
    // This matches the Swift logic in AddCompanyView4 where the "Continuar" button 
    // calls saveChanges() and sets requiresOnboarding = false
    if (currentItem.companyStep4) {
      console.log('Final configuration step completed, finishing onboarding...');
      handleOnboardingComplete();
      return;
    }
    
    // For other steps, automatically advance to next onboarding step
    setTimeout(() => {
      goToNext();
    }, 300); // Small delay to allow modal to close smoothly
  };

  const handleConfigSkip = () => {
    setShowConfigModal(false);
  };

  const getImageSource = (imageName: string) => {
    switch (imageName) {
      case 'OnboardingImage1.png':
        return require('../../assets/OnboardingImage1.png');
      case 'AppLogo.png':
        return require('../../assets/AppLogo.png');
      case 'page2 1.png':
        return require('../../assets/page2 1.png');
      case 'pre-prod 1.png':
        return require('../../assets/pre-prod 1.png');
      default:
        // Fallback to OnboardingImage1 for missing page1
        return require('../../assets/OnboardingImage1.png');
    }
  };

  const renderItem = (item: OnboardingItem, index: number) => {
    const isActive = index === currentIndex;
    
    return (
      <View key={item.id} style={styles.slide}>
        <LinearGradient
          colors={item.backgroundColor}
          style={styles.slideContent}
        >
          <View style={styles.imageContainer}>
            <Image
              source={getImageSource(item.introAssetImage)}
              style={styles.onboardingImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.subTitle}</Text>
            
            {item.displaysAction && (
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  activeOpacity={0.8}
                  onPress={handleConfigurarPress}
                >
                  <Text style={styles.actionButtonText}>Configurar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingData.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <TouchableOpacity
            key={index}
            style={styles.dotContainer}
            onPress={() => goToSlide(index)}
          >
            <View
              style={[
                styles.dot,
                {
                  width: isActive ? 24 : 8,
                  opacity: isActive ? 1 : 0.3,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip Button - Only show on first screen */}
      {currentIndex === 0 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipToMainApp}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Continuar sin configurar</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.scrollContainer}>
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              transform: [
                { 
                  translateX: scrollX.interpolate({
                    inputRange: [0, width * (onboardingData.length - 1)],
                    outputRange: [0, -width * (onboardingData.length - 1)],
                    extrapolate: 'clamp',
                  })
                },
              ],
            },
          ]}
        >
          {onboardingData.map((item, index) => renderItem(item, index))}
        </Animated.View>
      </View>

      {renderPagination()}

      <View style={styles.buttonContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={goToPrevious}
          >
            <Text style={styles.backButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={goToNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Comenzar' : 'Continuar'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Company Configuration Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CompanyConfigurationForm
          step={configStep}
          onComplete={handleConfigComplete}
          onSkip={handleConfigSkip}
          companyData={companyData}
          setCompanyData={setCompanyData}
          showStepIndicator={true}
          showSkipButton={true}
          saveButtonText={configStep === 4 ? 'Continuar' : 'Guardar'}
          skipButtonText="Omitir"
          isCreating={true}            // Force creation mode for onboarding
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  slidesContainer: {
    flexDirection: 'row',
    width: width * onboardingData.length,
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    flex: 1,
    maxHeight: height * 0.5,
  },
  onboardingImage: {
    width: width * 0.8,
    height: width * 0.8,
    maxHeight: 320,
    maxWidth: 320,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  dotContainer: {
    paddingHorizontal: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButtonText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
});
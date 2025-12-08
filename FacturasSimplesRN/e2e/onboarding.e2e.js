describe('Onboarding Flow', () => {
  beforeAll(async () => {
    // Clear app data before starting
    await device.clearKeychain();
    await device.resetContentAndSettings();
  });

  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  it('should complete onboarding flow successfully', async () => {
    // Wait for onboarding screen to load
    await waitFor(element(by.text('Bienvenido a Facturas Simples')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate through onboarding screens
    await element(by.text('Continuar')).tap();
    
    await waitFor(element(by.text('Gestiona Facturas para Múltiples Empresas')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Continuar')).tap();
    
    await waitFor(element(by.text('Proceso Automatizado de Pruebas')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Continuar')).tap();

    // Test company configuration flow - Step 1
    await waitFor(element(by.text('Información de Registro Fiscal!!')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Configurar')).tap();
    
    // Fill Step 1 form
    await waitFor(element(by.text('Información Básica')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Nombres y Apellidos *')).tap();
    await element(by.text('Nombres y Apellidos *')).typeText('Juan Carlos Pérez');
    
    await element(by.text('Nombre Comercial *')).tap(); 
    await element(by.text('Nombre Comercial *')).typeText('Empresa Test S.A. de C.V.');
    
    await element(by.text('Guardar y Continuar')).tap();
    
    // Continue with next onboarding step
    await waitFor(element(by.text('Datos Generales!')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Configurar')).tap();
    
    // Fill Step 2 form  
    await waitFor(element(by.text('Datos de Contacto')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Correo Electrónico *')).tap();
    await element(by.text('Correo Electrónico *')).typeText('juan@empresa.com');
    
    await element(by.text('Dirección *')).tap();
    await element(by.text('Dirección *')).typeText('Calle Principal #123, Col. Centro');
    
    // Select department and municipality from catalogs
    await element(by.text('Departamento')).tap();
    await waitFor(element(by.text('San Salvador')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('San Salvador')).tap();
    
    await element(by.text('Municipio')).tap();  
    await waitFor(element(by.text('San Salvador')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('San Salvador')).tap();
    
    await element(by.text('Guardar y Continuar')).tap();
    
    // Continue with Step 3
    await waitFor(element(by.text('Info de emisor')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Configurar')).tap();
    
    // Fill Step 3 form
    await waitFor(element(by.text('Información del Emisor')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Actividad Económica')).tap();
    await waitFor(element(by.text('Servicios de consultoría')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Servicios de consultoría')).tap();
    
    await element(by.text('Guardar y Continuar')).tap();
    
    // Complete Step 4 - Certificate
    await waitFor(element(by.text('Falta Poco!')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Configurar')).tap();
    
    await waitFor(element(by.text('Configuración de Certificado')))
      .toBeVisible()
      .withTimeout(5000);
      
    // Skip certificate for now
    await element(by.text('Omitir por ahora')).tap();
    
    // Complete onboarding
    await waitFor(element(by.text('Comenzar')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.text('Comenzar')).tap();
    
    // Verify app navigated to main screen
    await waitFor(element(by.text('Inicio')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should allow skipping onboarding', async () => {
    await waitFor(element(by.text('Bienvenido a Facturas Simples')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.text('Omitir')).tap();
    
    // Should navigate to main app
    await waitFor(element(by.text('Inicio')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should save company data and persist on app restart', async () => {
    // Complete basic company setup
    await waitFor(element(by.text('Bienvenido a Facturas Simples')))
      .toBeVisible()
      .withTimeout(10000);

    // Go through onboarding to company setup
    await element(by.text('Continuar')).tap();
    await element(by.text('Continuar')).tap(); 
    await element(by.text('Continuar')).tap();
    await element(by.text('Configurar')).tap();
    
    // Fill company data
    await element(by.text('Nombres y Apellidos *')).typeText('Test User');
    await element(by.text('Nombre Comercial *')).typeText('Test Company');
    await element(by.text('Guardar y Continuar')).tap();
    
    // Restart app
    await device.reloadReactNative();
    
    // Verify company data persisted (should skip onboarding)
    await waitFor(element(by.text('Inicio')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
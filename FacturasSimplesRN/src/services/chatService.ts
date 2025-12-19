import { 
  ChatMessage, 
  ChatSession, 
  SessionResponse, 
  MessageResponse, 
  UploadResponse,
  ChatConfiguration 
} from '../types/chat';

class ChatAPIService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ChatConfiguration) {
    this.baseUrl = config.apiBaseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
  }

  async createSession(userId: string, title: string): Promise<SessionResponse> {
    try {
      console.log('📤 Creating session with userId:', userId, 'title:', title);
      console.log('🌐 URL:', `${this.baseUrl}/api/chat/sessions`);
      
      const response = await fetch(`${this.baseUrl}/api/chat/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userId,
          title,
          metadata: {
            platform: 'react-native',
            timestamp: new Date().toISOString(),
          },
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json();
      console.log('📥 Create session response:', response.status, data);
      
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error creating session',
      };
    } catch (error) {
      console.error('❌ Create session error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error getting session',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getMessages(sessionId: string): Promise<{ success: boolean; data?: ChatMessage[]; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/messages`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error getting messages',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async sendMessage(sessionId: string, content: string): Promise<MessageResponse> {
    try {
      console.log('📤 Sending message to session:', sessionId);
      
      const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          content,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json();
      console.log('📥 Send message response:', response.status, data);
      
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error sending message',
      };
    } catch (error) {
      console.error('❌ Send message error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async uploadDocument(data: FormData): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: data,
        signal: AbortSignal.timeout(this.timeout * 2), // Double timeout for uploads
      });

      const responseData = await response.json();
      return {
        success: response.ok,
        data: response.ok ? responseData : undefined,
        message: response.ok ? undefined : responseData.message || 'Error uploading document',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to:', `${this.baseUrl}/health`);
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(5000),
      });
      console.log('🏥 Health check status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('❌ Health check error:', error);
      return false;
    }
  }
}

// SignalR Service for React Native - matches Swift mock implementation
class ChatSignalRService {
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' = 'disconnected';
  private listeners: Map<string, Function[]> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private sessionId: string = '';
  private apiService: ChatAPIService;

  constructor(private config: ChatConfiguration) {
    this.apiService = new ChatAPIService(config);
  }

  async connect(): Promise<void> {
    this.connectionState = 'connecting';
    this.emit('connectionStateChanged', this.connectionState);

    try {
      // Simulate connection delay (like Swift)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test API connection
      const isHealthy = await this.apiService.testConnection();
      
      if (!isHealthy) {
        throw new Error('API not available');
      }

      this.connectionState = 'connected';
      this.emit('connectionStateChanged', this.connectionState);
      console.log('✅ SignalR connection established to:', this.config.signalrUrl);
      
      // Start heartbeat
      this.startHeartbeat();
      
    } catch (error) {
      this.connectionState = 'error';
      this.emit('connectionStateChanged', this.connectionState);
      this.emit('error', error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'disconnected';
    this.emit('connectionStateChanged', this.connectionState);
    console.log('❌ SignalR connection closed');
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  async joinSession(sessionId: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected');
    }
    
    this.sessionId = sessionId;
    console.log('📍 Joining session:', sessionId);
    
    // Create contextual welcome message (matching Swift createWelcomeMessage)
    const welcomeMessage = this.createWelcomeMessage(sessionId);
    
    // Simulate successful join with welcome message
    this.emit('sessionJoined', { 
      sessionId, 
      messages: [welcomeMessage] 
    });
  }

  async leaveSession(sessionId: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected');
    }
    console.log('📤 Leaving session:', sessionId);
  }

  async sendMessage(sessionId: string, content: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected');
    }

    console.log('💬 Sending message to session', sessionId + ':', content);
    
    // Simulate message sent confirmation (like Swift)
    const confirmation = {
      sessionId,
      messageId: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    console.log('✅ Message sent confirmation:', confirmation);

    // Simulate AI response after a delay (matching Swift behavior)
    setTimeout(() => {
      const aiResponse = this.generateContextualResponse(content, sessionId);
      
      console.log('[ChatResponse] 📥 Received response from server:');
      console.log('[ChatResponse] Content:', aiResponse.content);
      console.log('[ChatResponse] Timestamp:', aiResponse.timestamp);
      console.log('[ChatResponse] Message ID:', aiResponse.id);
      
      this.emit('messageReceived', aiResponse);
    }, 2000); // 2 second delay like Swift
  }

  // Create welcome message matching Swift's createWelcomeMessage
  private createWelcomeMessage(sessionId: string): ChatMessage {
    const welcomeContent = `Bienvenido al Asistente de Facturas Simples

Estoy aquí para ayudarte con preguntas sobre la aplicación, como usar la app o cualquier consulta sobre facturación electrónica.

Puedo ayudarte con:
• Cómo usar las funciones de la aplicación
• Proceso de facturación electrónica
• Configuración de tu empresa
• Gestión de clientes y productos
• Reportes y consultas

¿En qué puedo ayudarte hoy?`;

    return {
      id: Date.now().toString(),
      sessionId,
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate contextual responses matching Swift's generateSampleResponse
  private generateContextualResponse(message: string, sessionId: string): ChatMessage {
    const lowerMessage = message.toLowerCase();
    let responseContent: string;

    if (lowerMessage.includes('factura') || lowerMessage.includes('crear')) {
      responseContent = `Para crear una factura en Facturas Simples:

1. Ve a la pestaña "Facturas"
2. Presiona el botón "+" para agregar una nueva factura
3. Selecciona tu cliente o agrega uno nuevo
4. Agrega los productos o servicios
5. Revisa los datos y presiona "Guardar"

¿Necesitas ayuda con algún paso específico?`;
    } else if (lowerMessage.includes('cliente') || lowerMessage.includes('agregar')) {
      responseContent = `Para agregar un cliente en Facturas Simples:

1. Ve a la pestaña "Clientes"
2. Presiona el botón "+" para agregar un nuevo cliente
3. Completa la información requerida:
   • Nombre o razón social
   • NIT o DUI
   • Dirección
   • Teléfono y correo electrónico
4. Presiona "Guardar"

¿Te gustaría saber más sobre la gestión de clientes?`;
    } else if (lowerMessage.includes('empresa') || lowerMessage.includes('configurar')) {
      responseContent = `Para configurar tu empresa en Facturas Simples:

1. Ve a "Perfil" en el menú principal
2. Selecciona "Datos de la Empresa"
3. Completa la información fiscal:
   • Nombre comercial y razón social
   • NIT y NRC
   • Giro o actividad económica
   • Dirección del establecimiento
4. Configura tu certificado digital para firmar facturas
5. Guarda los cambios

¿Necesitas ayuda con la configuración del certificado digital?`;
    } else if (lowerMessage.includes('producto') || lowerMessage.includes('servicio')) {
      responseContent = `Para gestionar productos en Facturas Simples:

1. Ve a la pestaña "Productos"
2. Presiona "+" para agregar un nuevo producto
3. Completa la información:
   • Código del producto
   • Descripción
   • Precio unitario
   • Tipo de impuesto (IVA)
4. Presiona "Guardar"

¿Quieres saber cómo importar productos masivamente?`;
    } else if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
      responseContent = `Estoy aquí para ayudarte con:

• **Facturas**: Crear, editar, anular facturas electrónicas
• **Clientes**: Gestionar tu base de clientes
• **Productos**: Administrar tu catálogo
• **Empresa**: Configurar datos fiscales y certificados
• **Reportes**: Consultar ventas y estadísticas

¿Con qué te gustaría que te ayude hoy?`;
    } else {
      responseContent = `Entiendo tu consulta. Como asistente de Facturas Simples, puedo ayudarte con:

• Creación y gestión de facturas electrónicas
• Administración de clientes y productos
• Configuración de tu empresa
• Proceso de facturación con Hacienda

¿Podrías ser más específico sobre lo que necesitas? Estoy aquí para ayudarte.`;
    }

    return {
      id: Date.now().toString(),
      sessionId,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private startHeartbeat(): void {
    this.reconnectInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        // Heartbeat - maintain connection state
      }
    }, 30000);
  }

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  get currentConnectionState(): string {
    return this.connectionState;
  }
}

// Configuration - matching Swift ChatConfiguration.swift
const chatConfig: ChatConfiguration = {
  apiBaseUrl: 'https://k-chat-api-dev.azurewebsites.net',
  signalrUrl: 'https://k-chat-api-dev.azurewebsites.net/chathub',
  apiKey: 'fs-mobile-client-2025-secret-key',
  timeout: 10000,
  maxRetries: 3,
};

export { ChatAPIService, ChatSignalRService, chatConfig };
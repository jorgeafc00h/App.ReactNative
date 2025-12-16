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
  private timeout: number;

  constructor(config: ChatConfiguration) {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.timeout;
  }

  async createSession(userId: string, title: string): Promise<SessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error creating session',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async sendMessage(sessionId: string, content: string): Promise<MessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: response.ok ? undefined : data.message || 'Error sending message',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async uploadDocument(data: FormData): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/upload`, {
        method: 'POST',
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
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Mock SignalR Service for React Native
class ChatSignalRService {
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' = 'disconnected';
  private listeners: Map<string, Function[]> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private sessionId: string = '';

  constructor(private config: ChatConfiguration) {}

  async connect(): Promise<void> {
    this.connectionState = 'connecting';
    this.emit('connectionStateChanged', this.connectionState);

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test API connection
      const apiService = new ChatAPIService(this.config);
      const isHealthy = await apiService.testConnection();
      
      if (!isHealthy) {
        throw new Error('API not available');
      }

      this.connectionState = 'connected';
      this.emit('connectionStateChanged', this.connectionState);
      
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
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  async joinSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    
    // Simulate joining session
    const messages: ChatMessage[] = [
      {
        id: '1',
        sessionId,
        role: 'system',
        content: '¡Hola! Soy tu asistente para Facturas Simples. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date().toISOString(),
      }
    ];

    this.emit('sessionJoined', { sessionId, messages });
  }

  async sendMessage(sessionId: string, content: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      throw new Error('Not connected');
    }

    // Simulate assistant response after delay
    setTimeout(() => {
      const response: ChatMessage = {
        id: Date.now().toString(),
        sessionId,
        role: 'assistant',
        content: this.generateMockResponse(content),
        timestamp: new Date().toISOString(),
      };
      
      this.emit('messageReceived', response);
    }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
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
      // Simple heartbeat - just maintain connection state
      if (this.connectionState === 'connected') {
        // Could ping server here
      }
    }, 30000); // 30 second heartbeat
  }

  private generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('factura') || lowerMessage.includes('crear')) {
      return 'Para crear una nueva factura, puedes ir a la sección "Facturas" y presionar "Nueva Factura". ¿Necesitas ayuda con algún paso específico del proceso de facturación?';
    }
    
    if (lowerMessage.includes('cliente') || lowerMessage.includes('customer')) {
      return 'Puedes gestionar tus clientes desde la sección "Clientes". Ahí podrás agregar nuevos clientes, editarlos o buscar información específica. ¿Qué necesitas hacer con los clientes?';
    }
    
    if (lowerMessage.includes('producto') || lowerMessage.includes('product')) {
      return 'En la sección "Productos" puedes administrar tu catálogo completo. Puedes agregar nuevos productos, actualizar precios, o gestionar el inventario. ¿Te ayudo con algo específico sobre productos?';
    }
    
    if (lowerMessage.includes('configurar') || lowerMessage.includes('empresa')) {
      return 'Para configurar tu empresa, ve a "Perfil" donde encontrarás todas las opciones de configuración empresarial, incluyendo datos fiscales y certificados digitales.';
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
      return 'Estoy aquí para ayudarte con:\n• Creación de facturas\n• Gestión de clientes y productos\n• Configuración de empresa\n• Sincronización de datos\n• Reportes y estadísticas\n\n¿Con qué te gustaría que te ayude?';
    }
    
    return 'Entiendo tu consulta. Como asistente especializado en Facturas Simples, puedo ayudarte con la gestión de facturas, clientes, productos y configuración empresarial. ¿Podrías ser más específico sobre lo que necesitas?';
  }

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  get currentConnectionState(): string {
    return this.connectionState;
  }
}

// Configuration
const chatConfig: ChatConfiguration = {
  apiBaseUrl: 'https://api.facturassimples.com', // Mock URL
  signalrUrl: 'https://api.facturassimples.com/chathub', // Mock URL
  timeout: 10000,
  maxRetries: 3,
};

export { ChatAPIService, ChatSignalRService, chatConfig };
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: CitationInfo[];
  metadata?: Record<string, any>;
}

export interface CitationInfo {
  title: string;
  url?: string;
  source?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ChatConnectionState {
  isConnected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  error?: string;
}

export interface ChatUIState {
  messages: ChatMessage[];
  currentMessage: string;
  currentSessionId: string;
  isTyping: boolean;
  connectionState: ChatConnectionState;
  error?: string;
  suggestions: string[];
  showingSuggestions: boolean;
}

export interface SessionResponse {
  success: boolean;
  data?: ChatSession;
  message?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: ChatMessage;
  message?: string;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    filename: string;
    url: string;
    size: number;
  };
  message?: string;
}

export interface SessionJoinedEvent {
  sessionId: string;
  messages: ChatMessage[];
}

export interface ChatConfiguration {
  apiBaseUrl: string;
  signalrUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
}
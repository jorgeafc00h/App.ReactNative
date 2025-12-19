import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../../store';
import { RootStackParamList, ChatMessage, ChatConnectionState } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { ChatAPIService, ChatSignalRService, chatConfig } from '../../services/chatService';

type ChatNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChatScreenProps {
  route?: {
    params?: {
      selectedCompanyId?: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<ChatNavigationProp>();
  
  const { companies, currentCompany } = useAppSelector(state => state.companies);
  const { user } = useAppSelector(state => state.auth);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<ChatConnectionState>({
    isConnected: false,
    status: 'disconnected',
  });
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(currentCompany);
  const [isInitializing, setIsInitializing] = useState(true);

  const chatService = useRef(new ChatAPIService(chatConfig));
  const signalRService = useRef(new ChatSignalRService(chatConfig));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSelectedCompanyAndInitializeChat();

    // Set up SignalR event listeners
    const signalR = signalRService.current;
    
    const onConnectionStateChanged = (state: string) => {
      setConnectionState({
        isConnected: state === 'connected',
        status: state as any,
      });
    };

    const onSessionJoined = (event: { sessionId: string; messages: ChatMessage[] }) => {
      setCurrentSessionId(event.sessionId);
      setMessages(event.messages);
    };

    const onMessageReceived = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const onError = (errorMessage: string) => {
      setError(errorMessage);
      setShowError(true);
    };

    signalR.on('connectionStateChanged', onConnectionStateChanged);
    signalR.on('sessionJoined', onSessionJoined);
    signalR.on('messageReceived', onMessageReceived);
    signalR.on('error', onError);

    return () => {
      signalR.off('connectionStateChanged', onConnectionStateChanged);
      signalR.off('sessionJoined', onSessionJoined);
      signalR.off('messageReceived', onMessageReceived);
      signalR.off('error', onError);
      signalR.disconnect();
    };
  }, []);

  const loadSelectedCompanyAndInitializeChat = async () => {
    try {
      setIsInitializing(true);
      const resolvedUserId = await loadSelectedCompany();
      await initializeChat(resolvedUserId);
    } catch (error) {
      console.error('Failed to load company and initialize chat:', error);
      setError('Error al inicializar el chat');
      setShowError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadSelectedCompany = async (): Promise<string> => {
    const selectedCompanyId = route?.params?.selectedCompanyId;
    
    // If no specific company ID passed, use the current company from Redux
    const companyIdToUse = selectedCompanyId || currentCompany?.id;
    
    if (!companyIdToUse) {
      console.log('⚠️ No company selected, using default user ID');
      const defaultUserId = user ? `user-${user.id}` : `guest-${Date.now()}`;
      setUserId(defaultUserId);
      setSelectedCompany(currentCompany);
      return defaultUserId;
    }

    // Find the selected company from the companies array
    const company = companies.find(c => c.id === companyIdToUse) || currentCompany;
    
    if (company) {
      setSelectedCompany(company);
      // Use company NIT as user ID for chat session (matches Swift implementation)
      const companyUserId = company.nit ? `company-${company.nit}` : `company-${company.id}`;
      setUserId(companyUserId);
      console.log('✅ Loaded company:', company.nombreComercial, 'NIT:', company.nit);
      console.log('🆔 Using user ID for chat:', companyUserId);
      return companyUserId;
    } else {
      console.log('⚠️ Company not found with ID:', companyIdToUse);
      const defaultUserId = user ? `user-${user.id}` : `guest-${Date.now()}`;
      setUserId(defaultUserId);
      setSelectedCompany(currentCompany);
      return defaultUserId;
    }
  };

  const initializeChat = async (resolvedUserId: string) => {
    try {
      // Print configuration info (like Swift)
      console.log('📱 Chat Configuration');
      console.log('🌐 Base URL:', chatConfig.apiBaseUrl);
      console.log('🔗 SignalR Hub:', chatConfig.signalrUrl);
      console.log('👤 User ID:', resolvedUserId);
      
      console.log('🔍 Testing API connectivity...');
      
      // Test API connectivity first
      const isHealthy = await chatService.current.testConnection();
      
      if (!isHealthy) {
        setError('No se puede conectar al servidor de chat. Verifica tu conexión a internet.');
        setShowError(true);
        return;
      }

      console.log('✅ API is healthy, proceeding with chat initialization...');

      // Connect to SignalR
      await signalRService.current.connect();

      // Create or get session with company context (matches Swift implementation)
      const sessionTitle = selectedCompany 
        ? `Chat ${selectedCompany.nombreComercial} - ${selectedCompany.nit || selectedCompany.id}` 
        : 'Chat Facturas Simples';
      
      console.log('📤 Creating session with userId:', resolvedUserId, 'title:', sessionTitle);
      
      const sessionResponse = await chatService.current.createSession(resolvedUserId, sessionTitle);
      
      if (sessionResponse.success && sessionResponse.data) {
        console.log('✅ Session created:', sessionResponse.data.id);
        await signalRService.current.joinSession(sessionResponse.data.id);
      } else {
        throw new Error(sessionResponse.message || 'Failed to create session');
      }

    } catch (error) {
      console.error('❌ Chat initialization error:', error);
      setError(error instanceof Error ? error.message : 'Error al inicializar chat');
      setShowError(true);
    }
  };

  const sendMessage = async () => {
    const messageText = currentMessage.trim();
    if (!messageText || !connectionState.isConnected) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId: currentSessionId,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await signalRService.current.sendMessage(currentSessionId, messageText);
    } catch (error) {
      setError('Error al enviar mensaje: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setShowError(true);
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface.primary,
            borderColor: theme.colors.border.light,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? 'white' : theme.colors.text.primary }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary }
          ]}>
            {new Date(item.timestamp).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={[styles.typingBubble, { backgroundColor: theme.colors.surface.primary }]}>
          <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          <Text style={[styles.typingText, { color: theme.colors.text.secondary }]}>
            Escribiendo...
          </Text>
        </View>
      </View>
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionState.status) {
      case 'connected': return theme.colors.success;
      case 'connecting': return theme.colors.warning;
      case 'error': return theme.colors.error;
      default: return theme.colors.text.tertiary;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState.status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Error';
      default: return 'Desconectado';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface.primary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Asistente - Facturas Simples
          </Text>
          {selectedCompany && (
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Empresa: {selectedCompany.nombreComercial}
            </Text>
          )}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: getConnectionStatusColor() }
            ]} />
            <Text style={[styles.connectionText, { color: theme.colors.text.secondary }]}>
              {isInitializing ? 'Inicializando...' : getConnectionStatusText()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Subir Documento',
              'Función de subida de documentos próximamente disponible.',
              [{ text: 'OK' }]
            );
          }}
          style={styles.headerButton}
          disabled={!connectionState.isConnected}
        >
          <Ionicons 
            name="attach" 
            size={24} 
            color={connectionState.isConnected ? theme.colors.primary : theme.colors.text.tertiary} 
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isInitializing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Iniciando chat...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface.primary }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background.secondary }]}>
          <TextInput
            style={[styles.textInput, { color: theme.colors.text.primary }]}
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              { 
                backgroundColor: (currentMessage.trim() && connectionState.isConnected) 
                  ? theme.colors.primary 
                  : theme.colors.text.tertiary 
              }
            ]}
            disabled={!currentMessage.trim() || !connectionState.isConnected}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Alert */}
      {showError && (
        <View style={styles.overlay}>
          <View style={[styles.errorDialog, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
              Error
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDialog: {
    marginHorizontal: 40,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChatScreen;
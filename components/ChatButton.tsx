import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, PanResponder, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { authAPI, chatAPI } from '../app/services/api';
import { ThemedText } from './ThemedText';

interface ChatButtonProps {
  expandable?: boolean;
  navigateOnClick?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  title: string;
  category: string;
  level: string;
  messages: ChatMessage[];
}

export default function ChatButton({ expandable = true, navigateOnClick = false }: ChatButtonProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const windowDims = Dimensions.get('window');
  const centerBottom = Math.max(10, windowDims.height / 2 - 30);
  // Default: vertically centered, aligned to right edge
  const [buttonPosition, setButtonPosition] = useState({ right: 20, bottom: centerBottom });
  const dragStartRef = useRef({ right: 20, bottom: centerBottom });
  const keyboardOffsetRef = useRef(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Pan responder for draggable chat button
  const isDraggingRef = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only start dragging if user moves more than 5px
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Capture starting position for this drag
        isDraggingRef.current = false;
        dragStartRef.current = { right: buttonPosition.right, bottom: buttonPosition.bottom };
      },
      onPanResponderMove: (_, gesture) => {
        // Mark as dragging if user has moved significantly
        if (!isDraggingRef.current && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5)) {
          isDraggingRef.current = true;
        }
        
        if (isDraggingRef.current) {
          const screenW = Dimensions.get('window').width;
          const screenH = Dimensions.get('window').height;
          const newRightRaw = dragStartRef.current.right - gesture.dx;
          const newBottomRaw = dragStartRef.current.bottom - gesture.dy;
          const newRight = Math.max(0, Math.min(screenW - 60, newRightRaw));
          const newBottom = Math.max(0 + keyboardOffsetRef.current, Math.min(screenH - 60, newBottomRaw));
          setButtonPosition({ right: newRight, bottom: newBottom });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const wasDragging = isDraggingRef.current;
        isDraggingRef.current = false;
        
        if (wasDragging) {
          // Snap to screen edges after dragging
          const screenW = Dimensions.get('window').width;
          const screenH = Dimensions.get('window').height;
          setButtonPosition(prev => ({ 
            right: Math.max(0, Math.min(prev.right, screenW - 60)), 
            bottom: Math.max(0 + keyboardOffsetRef.current, Math.min(prev.bottom, screenH - 60))
          }));
        } else {
          // If not dragging, treat as a tap
          toggleChat();
        }
      },
    })
  ).current;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Initialize chat when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSuggestions();
    }
  }, [isAuthenticated]);

  // Keyboard listeners to lift button/panel
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e: any) => {
      const lift = Math.min(180, e?.endCoordinates?.height || 0);
      keyboardOffsetRef.current = lift;
      setKeyboardVisible(true);
      setButtonPosition(prev => ({ ...prev, bottom: prev.bottom + lift }));
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
      const lift = keyboardOffsetRef.current;
      keyboardOffsetRef.current = 0;
      setButtonPosition(prev => ({ ...prev, bottom: Math.max(20, prev.bottom - lift) }));
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Initialize conversation when chat is first expanded and user is authenticated
  useEffect(() => {
    if (chatExpanded && !conversation && !isInitializing && isAuthenticated) {
      initializeConversation();
    }
  }, [chatExpanded, conversation, isInitializing, isAuthenticated]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await authAPI.getCurrentUser();
      setIsAuthenticated(response && response.success);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadSuggestions = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatAPI.getSuggestions();
      if (response.suggestions) {
        setSuggestions(response.suggestions.slice(0, 3)); // Show first 3 suggestions
      }
    } catch (error: any) {
      console.error('Failed to load suggestions:', error);
      // If suggestions fail due to auth, re-check auth status
      if (error.message?.includes('token') || error.message?.includes('401')) {
        setIsAuthenticated(false);
      }
    }
  };

  const initializeConversation = async () => {
    if (isInitializing || !isAuthenticated) return;
    
    setIsInitializing(true);
    try {
      const response = await chatAPI.createConversation({
        category: 'general',
        level: 'intermediate',
        title: 'Language Learning Chat'
      });

      if (response.conversation) {
        setConversation(response.conversation);
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I can help you with language learning. What would you like to know?',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error: any) {
      console.error('Failed to initialize conversation:', error);
      
      // Check if error is due to authentication
      if (error.message?.includes('token') || error.message?.includes('401')) {
        setIsAuthenticated(false);
        Alert.alert('Authentication Required', 'Please log in to use the chat feature.');
      } else {
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !conversation || !isAuthenticated) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(conversation.id, text.trim(), {
        category: conversation.category,
        level: conversation.level
      });

      if (response.assistantMessage) {
        const assistantMessage: ChatMessage = {
          id: response.assistantMessage.id,
          role: 'assistant',
          content: response.assistantMessage.content,
          timestamp: response.assistantMessage.timestamp,
          metadata: response.assistantMessage.metadata
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Check if error is due to authentication
      if (error.message?.includes('token') || error.message?.includes('401')) {
        setIsAuthenticated(false);
        const authErrorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Your session has expired. Please log in again to continue chatting.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, authErrorMessage]);
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  const toggleChat = () => {
    if (navigateOnClick) {
      navigation.navigate('ChatScreen' as never);
    } else if (expandable) {
      // Check authentication before expanding chat
      if (!isAuthenticated && !isCheckingAuth) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use the chat feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('LoginScreen' as never) }
          ]
        );
        return;
      }
      setChatExpanded(!chatExpanded);
    }
  };

  return (
    <>
      {expandable && chatExpanded ? (
        <View style={[
          styles.chatPanel,
          {
            right: Math.max(10, Math.min(buttonPosition.right, windowDims.width - 320)), // Ensure panel stays on screen
            bottom: Math.max(10, Math.min(buttonPosition.bottom, windowDims.height - 420)), // Ensure panel stays on screen
          }
        ]}>
          <View style={styles.chatPanelHeader}>
            <ThemedText style={styles.chatPanelTitle}>Language Assistant</ThemedText>
            <TouchableOpacity onPress={toggleChat}>
              <FontAwesome name="times" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          >
            {isCheckingAuth ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#dc2929" />
                <ThemedText style={styles.loadingText}>Checking authentication...</ThemedText>
              </View>
            ) : !isAuthenticated ? (
              <View style={styles.authRequiredContainer}>
                <FontAwesome name="lock" size={32} color="#dc2929" style={styles.lockIcon} />
                <ThemedText style={styles.authRequiredText}>Please log in to use chat</ThemedText>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => navigation.navigate('LoginScreen' as never)}
                >
                  <ThemedText style={styles.loginButtonText}>Login</ThemedText>
                </TouchableOpacity>
              </View>
            ) : isInitializing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#dc2929" />
                <ThemedText style={styles.loadingText}>Starting chat...</ThemedText>
              </View>
            ) : (
              <>
                {messages.map((message) => (
                  <View key={message.id} style={message.role === 'user' ? styles.userMessage : styles.botMessage}>
                    <ThemedText style={message.role === 'user' ? styles.userMessageText : styles.messageText}>
                      {message.content}
                    </ThemedText>
                  </View>
                ))}
                
                {isLoading && (
                  <View style={styles.botMessage}>
                    <View style={styles.typingIndicator}>
                      <ActivityIndicator size="small" color="#666666" />
                      <ThemedText style={styles.typingText}>Thinking...</ThemedText>
                    </View>
                  </View>
                )}
                
                {messages.length === 1 && suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ThemedText style={styles.suggestionsTitle}>Try asking:</ThemedText>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.suggestionButton}
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Ask a question..."
              placeholderTextColor="#999999"
              value={currentMessage}
              onChangeText={setCurrentMessage}
              onSubmitEditing={() => sendMessage(currentMessage)}
              editable={!isLoading && !isInitializing}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!currentMessage.trim() || isLoading || !isAuthenticated) && styles.sendButtonDisabled]}
              onPress={() => sendMessage(currentMessage)}
              disabled={!currentMessage.trim() || isLoading || isInitializing || !isAuthenticated}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <FontAwesome name="paper-plane" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.chatButton,
            { right: buttonPosition.right, bottom: buttonPosition.bottom },
          ]}
          {...(expandable ? panResponder.panHandlers : {})}
        >
          <View style={styles.botIconBubble}>
            <FontAwesome5 name="robot" size={26} color="#FFFFFF" />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Sticky Chat Button
  chatButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2929',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  botIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chat Panel
  chatPanel: {
    position: 'absolute',
    width: '80%',
    maxWidth: 300,
    height: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#dc2929',
  },
  chatPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatMessages: {
    flex: 1,
    padding: 12,
  },
  botMessage: {
    marginBottom: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  userMessage: {
    marginBottom: 12,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  messageText: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    padding: 12,
    borderRadius: 15,
    borderTopLeftRadius: 4,
    fontSize: 14,
    color: '#333333',
  },
  userMessageText: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    padding: 12,
    borderRadius: 15,
    borderTopRightRadius: 4,
    fontSize: 14,
    color: '#333333',
  },
  highlightText: {
    color: '#dc2929',
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    padding: 12,
    borderRadius: 15,
    borderTopLeftRadius: 4,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionButton: {
    backgroundColor: 'rgba(220, 41, 41, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.2)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: '#dc2929',
    textAlign: 'center',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 12,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import ChatButton from '../components/ChatButton';
import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { communicationAPI } from './services/api';

interface Partner {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  languageLevel: string;
  lastActive: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  sessionType: string;
  title: string;
  status: string;
}

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderInfo?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function ChatScreen() {
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStatus, setChatStatus] = useState('finding'); // finding, active, ending, error
  const [partner, setPartner] = useState<Partner | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const messagePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find partner and start chat on mount
  useEffect(() => {
    findPartnerAndStartChat();
    
    return () => {
      // Cleanup polling
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, []);
  
  // Start polling for messages when chat becomes active
  useEffect(() => {
    if (chatStatus === 'active' && session?.id) {
      loadMessages();
      startMessagePolling();
    } else {
      stopMessagePolling();
    }
    
    return () => {
      stopMessagePolling();
    };
  }, [chatStatus, session]);
  
  const findPartnerAndStartChat = async () => {
    try {
      setChatStatus('finding');
      setError(null);
      
      // Find a partner (this also creates the chat session)
      const partnerResponse = await communicationAPI.findPartner('chat');
      
      if (!partnerResponse.success) {
        throw new Error(partnerResponse.message || 'Failed to find chat partner');
      }
      
      if (!partnerResponse.data.partner) {
        setError('No available partners found in your region. Please try again later.');
        setChatStatus('error');
        return;
      }
      
      setPartner(partnerResponse.data.partner);
      setSession(partnerResponse.data.session);
      setChatStatus('active');
      
    } catch (error: any) {
      console.error('Chat initiation error:', error);
      setError(error.message || 'Failed to start chat');
      setChatStatus('error');
    }
  };
  
  const loadMessages = async () => {
    if (!session?.id) return;
    
    try {
      const messagesResponse = await communicationAPI.getMessages(session.id);
      
      if (messagesResponse.success && messagesResponse.data.messages) {
        const formattedMessages = messagesResponse.data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender.id === partner?.id ? 'other' : 'user',
          timestamp: new Date(msg.timestamp),
          senderInfo: msg.sender
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };
  
  const startMessagePolling = () => {
    if (messagePollingRef.current) return;
    
    messagePollingRef.current = setInterval(() => {
      loadMessages();
    }, 2000); // Poll every 2 seconds
  };
  
  const stopMessagePolling = () => {
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
      messagePollingRef.current = null;
    }
  };

  const sendMessage = async () => {
    if (message.trim() === '' || !session?.id || chatStatus !== 'active') return;

    const messageText = message.trim();
    setMessage('');
    setLoading(true);

    try {
      const response = await communicationAPI.sendMessage(session.id, {
        message: messageText,
        messageType: 'text'
      });
      
      if (response.success) {
        // Add message to local state immediately for better UX
        const userMessage: Message = {
          id: response.data.message.id,
          text: messageText,
          sender: 'user',
          timestamp: new Date(response.data.message.timestamp),
          senderInfo: response.data.message.sender
        };
        
        setMessages(prevMessages => [...prevMessages, userMessage]);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessage(messageText); // Restore message on error
    } finally {
      setLoading(false);
    }
  };
  
  const handleCallPress = (callType: 'voice' | 'video') => {
    (navigation as any).navigate('CallScreen', { callType });
  };
  
  const retryFindPartner = () => {
    findPartnerAndStartChat();
  };
  
  // Show error state
  if (chatStatus === 'error') {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.gradientBackground} />
        <Header title="Chat in English" />
        
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={60} color="#dc2929" />
          <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          
          <TouchableOpacity style={styles.retryButton} onPress={retryFindPartner}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.cancelButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ChatButton expandable={true} navigateOnClick={false} />
      </KeyboardAvoidingView>
    );
  }
  
  // Show loading state
  if (chatStatus === 'finding') {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.gradientBackground} />
        <Header title="Chat in English" />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Finding a chat partner in your region...</ThemedText>
          {partner && (
            <View style={styles.partnerInfo}>
              <ThemedText style={styles.partnerText}>Found: {partner.name}</ThemedText>
              <ThemedText style={styles.partnerLevel}>Level: {partner.languageLevel}</ThemedText>
            </View>
          )}
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ChatButton expandable={true} navigateOnClick={false} />
      </KeyboardAvoidingView>
    );
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.otherMessageContainer]}>
        {!isUser && (
          <View style={styles.avatar}>
            <FontAwesome name="user" size={16} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.otherBubble]}>
          <ThemedText style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
            {item.text}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <FontAwesome name="user" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.gradientBackground} />
      
      <Header title="Chat in English" />
      
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <View style={styles.chatPartnerInfo}>
            <View style={styles.chatPartnerAvatar}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
            <View>
              <ThemedText style={styles.chatPartnerName}>{partner?.name || 'Partner'}</ThemedText>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <ThemedText style={styles.onlineText}>Online</ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCallPress('voice')}>
              <FontAwesome name="phone" size={18} color="#226cae" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCallPress('video')}>
              <FontAwesome name="video-camera" size={18} color="#226cae" />
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <FontAwesome name="plus" size={20} color="#666666" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!message.trim() || loading || chatStatus !== 'active'}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <FontAwesome name="paper-plane" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ChatButton expandable={true} navigateOnClick={false} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: -1,
  },
  chatContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  chatPartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatPartnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2929',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatPartnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  onlineText: {
    fontSize: 12,
    color: '#666666',
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  messagesList: {
    paddingVertical: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    backgroundColor: '#dc2929',
    marginLeft: 8,
    marginRight: 0,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 18,
    padding: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333333',
  },
  userMessageText: {
    color: '#333333',
  },
  otherMessageText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 10,
    color: '#999999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#226cae',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
    marginTop: 20,
    textAlign: 'center',
  },
  partnerInfo: {
    marginTop: 30,
    alignItems: 'center',
  },
  partnerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  partnerLevel: {
    fontSize: 14,
    color: '#666666',
  },
}); 
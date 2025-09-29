import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [sessionEndedBy, setSessionEndedBy] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const messagePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelingRef = useRef(false);

  const findPartnerAndStartChat = useCallback(async () => {
    try {
      setChatStatus('finding');
      setError(null);
      
      // Check if user already has an active session
      const sessionsResponse = await communicationAPI.getActiveSessions();
      
      if (sessionsResponse.success && sessionsResponse.data?.sessions?.length > 0) {
        // Found active session - resume it (no errors, just show the existing chat)
        const activeSession = sessionsResponse.data.sessions[0];
        
        // Handle different session statuses
        if (activeSession.status === 'waiting_for_partner') {
          setSession({
            id: activeSession._id,
            sessionId: activeSession.sessionId || activeSession._id,
            sessionType: activeSession.sessionType || 'chat',
            title: activeSession.title || 'Chat Session',
            status: activeSession.status
          });
          setError('Waiting for someone from your region to join...');
          setChatStatus('finding');
          
          // Start polling for partner to join
          setTimeout(() => {
            checkForPartnerJoined();
          }, 2000);
          return;
        }
        
        // Set basic session info
        setSession({
          id: activeSession._id,
          sessionId: activeSession.sessionId || activeSession._id,
          sessionType: activeSession.sessionType || 'chat',
          title: activeSession.title || 'Chat Session',
          status: activeSession.status || 'active'
        });
        
        // Try to get partner info (optional - won't fail if missing)
        try {
          const sessionDetails = await communicationAPI.getSessionDetails(activeSession._id);
          if (sessionDetails.success && sessionDetails.data?.session?.participants) {
            const participants = sessionDetails.data.session.participants;
            const partnerParticipant = participants.find((p: any) => p?.user?.role !== 'host' || p?.role === 'participant');
            
            if (partnerParticipant?.user) {
              setPartner({
                id: partnerParticipant.user._id,
                name: partnerParticipant.user.name || 'Chat Partner',
                email: partnerParticipant.user.email || '',
                profilePicture: partnerParticipant.user.profilePicture,
                languageLevel: partnerParticipant.user.studentInfo?.languageLevel || 'beginner',
                lastActive: partnerParticipant.user.lastActive || new Date().toISOString()
              });
            }
          }
        } catch (error) {
          // Set a default partner so chat works
          setPartner({
            id: 'partner',
            name: 'Chat Partner',
            email: '',
            languageLevel: 'beginner',
            lastActive: new Date().toISOString()
          });
        }
        
        setChatStatus('active');
        return;
      }
      
      // No active session - find a partner from same region
      const partnerResponse = await communicationAPI.findPartner('chat');
      
      if (partnerResponse.success) {
        if (partnerResponse.data?.partner) {
          // Found a partner immediately - they were waiting!
          setPartner(partnerResponse.data.partner);
          // Map the session object to match our interface
          const sessionData = partnerResponse.data.session;
          setSession({
            id: sessionData.id,
            sessionId: sessionData.sessionId,
            sessionType: sessionData.sessionType,
            title: sessionData.title,
            status: sessionData.status
          });
          setChatStatus('active');
        } else if (partnerResponse.data?.waitingInQueue) {
          // We're now waiting for someone else to join
          // Map the session object to match our interface
          const sessionData = partnerResponse.data.session;
          setSession({
            id: sessionData.id,
            sessionId: sessionData.sessionId,
            sessionType: sessionData.sessionType,
            title: sessionData.title,
            status: sessionData.status
          });
          setError(`Waiting for someone from ${partnerResponse.data.regionInfo?.name} to join...`);
          setChatStatus('finding');
        } else {
          setError('Unable to start chat session. Please try again.');
          setChatStatus('error');
        }
      } else {
        setError('Connection failed. Retrying...');
        setChatStatus('finding');
        setTimeout(() => {
          findPartnerAndStartChat();
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('❌ Chat error:', error);
      
      // Handle authentication errors
      if (error.message?.includes('Access token required')) {
        setError('Please login to start chatting');
        setChatStatus('error');
        return;
      }
      
      // Handle "already in active session" - this shouldn't happen anymore but just in case
      if (error.message?.includes('already in an active session')) {
        console.log('ℹ️ Already in session, retrying to get session details...');
        // Retry to get the active session
        setTimeout(() => {
          findPartnerAndStartChat();
        }, 1000);
        return;
      }
      
      setError('Connection failed. Retrying...');
      setChatStatus('finding');
      // Retry after 3 seconds
    setTimeout(() => {
        findPartnerAndStartChat();
      }, 3000);
    }
  }, []);
  
  const checkForPartnerJoined = useCallback(async () => {
    try {
      if (!session?.id || chatStatus !== 'finding') {
        return;
      }
      
      // Instead of using session details, check active sessions to see if status changed
      const sessionsResponse = await communicationAPI.getActiveSessions();
      
      if (sessionsResponse.success && sessionsResponse.data?.sessions?.length > 0) {
        const activeSession = sessionsResponse.data.sessions.find((s: any) => s._id === session.id || s._id === session.sessionId);
        
        if (activeSession) {
          // Check if session became active AND has 2 participants
          if (activeSession.status === 'active' && activeSession.participants?.length >= 2) {
            // Find the partner (the one who is not the host)
            // The host is the first participant, so find the second one
            const partnerParticipant = activeSession.participants.find((p: any) => p.role === 'participant');
            
            if (partnerParticipant?.user) {
              setPartner({
                id: partnerParticipant.user._id,
                name: partnerParticipant.user.name || 'Chat Partner',
                email: partnerParticipant.user.email || '',
                profilePicture: partnerParticipant.user.profilePicture,
                languageLevel: partnerParticipant.user.studentInfo?.languageLevel || 'beginner',
                lastActive: partnerParticipant.user.lastActive || new Date().toISOString()
              });
            } else {
              // Set a default partner
              setPartner({
                id: 'partner',
                name: 'Chat Partner',
                email: '',
                languageLevel: 'beginner',
                lastActive: new Date().toISOString()
              });
            }
            
            // Update session status
            setSession(prev => prev ? { ...prev, status: 'active' } : null);
            setChatStatus('active');
            setError(null);
            return;
          }
        }
      }
      
      // Still waiting, check again in 1 second for faster response
      setTimeout(() => {
        checkForPartnerJoined();
      }, 1000);
      
    } catch (error) {
      console.error('Error checking for partner:', error);
      // Continue checking despite errors
      setTimeout(() => {
        checkForPartnerJoined();
      }, 2000);
    }
  }, [session?.id, chatStatus]);

  const checkForSessionEnd = useCallback(async () => {
    try {
      if (!session?.id || chatStatus !== 'active') {
        return;
      }
      
      // Check if session still exists and is active
      const sessionsResponse = await communicationAPI.getActiveSessions();
      
      if (sessionsResponse.success) {
        const activeSession = sessionsResponse.data?.sessions?.find((s: any) => s._id === session.id || s._id === session.sessionId);
        
        // If session not found or status is completed/cancelled, it was ended
        if (!activeSession || (activeSession.status === 'completed' || activeSession.status === 'cancelled')) {
          // Find who ended the session by checking the last participant who left
          if (activeSession?.participants) {
            const lastParticipant = activeSession.participants.find((p: any) => p.leftAt);
            if (lastParticipant?.user) {
              setSessionEndedBy(lastParticipant.user.name || 'Chat Partner');
            } else {
              setSessionEndedBy(partner?.name || 'Chat Partner');
            }
          } else {
            setSessionEndedBy(partner?.name || 'Chat Partner');
          }
          
          setShowEndModal(true);
          setChatStatus('ending');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking for session end:', error);
    }
  }, [session?.id, chatStatus, partner?.name]);
  
  const loadMessages = useCallback(async () => {
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
  }, [session?.id, partner?.id]);
  
  const startMessagePolling = useCallback(() => {
    if (messagePollingRef.current) return;
    
    messagePollingRef.current = setInterval(() => {
      loadMessages();
    }, 2000); // Poll every 2 seconds
  }, [loadMessages]);
  
  const stopMessagePolling = useCallback(() => {
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
      messagePollingRef.current = null;
    }
  }, []);

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

  const handleEndSession = async () => {
    try {
      if (!session?.id) {
        console.log('No session to end');
        // Just clear state and go back
        setSession(null);
        setPartner(null);
        setMessages([]);
        setChatStatus('finding');
        navigation.goBack();
        return;
      }
      
      setLoading(true);
      
      const response = await communicationAPI.leaveSession(session.id);
      
      if (response.success) {
        // Clear current session state
        setSession(null);
        setPartner(null);
        setMessages([]);
        setChatStatus('finding');
        
        // Go back to previous screen
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to end session. Please try again.');
      }
    } catch (error) {
      console.error('End session error:', error);
      // Even if there's an error, clear the local state and go back
      setSession(null);
      setPartner(null);
      setMessages([]);
      setChatStatus('finding');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (cancelingRef.current) return;
    cancelingRef.current = true;
    try {
      // If chat session exists, attempt to leave first
      if (session?.id) {
        try { await communicationAPI.leaveSession(session.id); } catch {}
      }
      // Strict cancel: ensure any waiting/active sessions are cancelled and marked incomplete
      try { await communicationAPI.cancelAllSessions(); } catch {}
      try { await communicationAPI.purgeAllSessionsHard(); } catch {}
    } finally {
      cancelingRef.current = false;
      navigation.goBack();
    }
  };
  
  const retryFindPartner = () => {
    findPartnerAndStartChat();
  };


  // Find partner and start chat on mount
  useEffect(() => {
    findPartnerAndStartChat();
    
    return () => {
      // Cleanup polling
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, [findPartnerAndStartChat]);
  
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
  }, [chatStatus, session, loadMessages, startMessagePolling, stopMessagePolling]);

  // Polling effect for partner detection
  useEffect(() => {
    if (chatStatus === 'finding' && session?.id) {
      const interval = setInterval(() => {
        checkForPartnerJoined();
      }, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [chatStatus, session?.id, checkForPartnerJoined]);

  // Polling effect for session end detection
  useEffect(() => {
    if (chatStatus === 'active' && session?.id) {
      const interval = setInterval(() => {
        checkForSessionEnd();
      }, 2000); // Check every 2 seconds
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [chatStatus, session?.id, checkForSessionEnd]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
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
          <ThemedText style={styles.loadingText}>
            {error || 'Finding someone from your region to chat with...'}
          </ThemedText>
          <ThemedText style={styles.waitingText}>
            This might take a moment. We'll connect you as soon as someone is available!
          </ThemedText>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
        
       
      </KeyboardAvoidingView>
    );
  }

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
            <TouchableOpacity style={styles.endSessionButton} onPress={handleEndSession}>
              <FontAwesome name="times" size={18} color="#dc2929" />
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
      
      {/* Session Ended Modal */}
      <Modal
        visible={showEndModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <FontAwesome name="times-circle" size={60} color="#dc2929" />
            </View>
            
            <ThemedText style={styles.modalTitle}>Chat Session Ended</ThemedText>
            <ThemedText style={styles.modalMessage}>
              {sessionEndedBy} has ended the chat session.
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowEndModal(false);
                setSessionEndedBy(null);
                navigation.goBack();
              }}
            >
              <ThemedText style={styles.modalButtonText}>OK</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
  endSessionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
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
    backgroundColor: 'rgba(34, 108, 174, 0.08)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#226cae',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#226cae',
    fontSize: 16,
    fontWeight: '600',
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
  waitingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#226cae',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 
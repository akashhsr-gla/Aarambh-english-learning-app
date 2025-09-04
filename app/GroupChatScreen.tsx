import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { groupsAPI } from './services/api';

const { width, height } = Dimensions.get('window');

// Define types
interface GroupInfo {
  title: string;
  topic: string;
  maxParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  password: string | null;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string | null;
  isHost: boolean;
  isReady: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isSystemMessage?: boolean;
}

interface RouteParams {
  groupInfo: GroupInfo;
  participants: Participant[];
  groupId?: string;
}

// Initial empty messages - will be loaded from backend
const initialMessages: Message[] = [];

// Sample participant data if not provided
const defaultParticipants: Participant[] = [
  { id: '1', name: 'You', avatar: null, isHost: true, isReady: true },
  { id: '2', name: 'Sarah Johnson', avatar: null, isHost: false, isReady: true },
  { id: '3', name: 'Michael Brown', avatar: null, isHost: false, isReady: true },
];

export default function GroupChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupInfo, participants: routeParticipants, groupId } = (route.params as RouteParams) || {};
  
  const participants = routeParticipants || defaultParticipants;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Load messages from backend
  const loadMessages = async () => {
    if (!groupId) {
      setError('Group ID is required');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await groupsAPI.getMessages(groupId);
      const backendMessages = response.data.messages.map((msg: any) => ({
        id: msg._id,
        senderId: msg.sender._id || msg.sender,
        senderName: msg.sender.name || 'Unknown',
        text: msg.message,
        timestamp: new Date(msg.timestamp),
        isSystemMessage: msg.isSystemMessage || false
      }));
      setMessages(backendMessages);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message to backend
  const sendMessageToBackend = async (messageText: string) => {
    if (!groupId || !messageText.trim()) return;

    try {
      setSendingMessage(true);
      const response = await groupsAPI.sendMessage(groupId, messageText.trim());
      
      // Add the new message to local state
      const newMessage: Message = {
        id: response.data.messageId,
        senderId: response.data.sender.id,
        senderName: response.data.sender.name,
        text: messageText.trim(),
        timestamp: new Date(response.data.timestamp),
        isSystemMessage: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [groupId]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const handleSendMessage = async () => {
    if (!inputText.trim() || sendingMessage) return;
    
    await sendMessageToBackend(inputText.trim());
    scrollToBottom();
  };
  
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Discussion',
      'Are you sure you want to leave this discussion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => navigation.navigate('GroupDiscussionScreen' as never)
        }
      ]
    );
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader 
          title={groupInfo?.title || "Group Discussion"} 
          showBackButton 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={[styles.container, styles.centerContent]}>
          <FontAwesome name="spinner" size={50} color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading messages...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader 
          title={groupInfo?.title || "Group Discussion"} 
          showBackButton 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={[styles.container, styles.centerContent]}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>Error Loading Messages</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <View style={styles.headerContainer}>
        <GameHeader 
          title={groupInfo?.title || "Group Discussion"} 
          showBackButton 
          onBackPress={handleLeaveGroup}
        />
        <TouchableOpacity 
          style={styles.participantsButton}
          onPress={() => setShowParticipants(!showParticipants)}
        >
          <FontAwesome name="users" size={20} color="#dc2929" />
          <ThemedText style={styles.participantsCount}>{participants.length}</ThemedText>
        </TouchableOpacity>
      </View>
      
      {showParticipants && (
        <ThemedView style={styles.participantsPanel}>
          <View style={styles.participantsPanelHeader}>
            <ThemedText style={styles.participantsPanelTitle}>Participants</ThemedText>
            <TouchableOpacity onPress={() => setShowParticipants(false)}>
              <FontAwesome name="times" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarCircle}>
                    <FontAwesome name="user" size={16} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.participantName}>
                    {participant.id === '1' ? 'You' : participant.name}
                    {participant.isHost && <ThemedText style={styles.hostBadge}> (Host)</ThemedText>}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      )}
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageWrapper,
                message.isSystemMessage ? styles.systemMessageWrapper : 
                message.senderId === '1' ? styles.userMessageWrapper : styles.otherMessageWrapper
              ]}
            >
              {!message.isSystemMessage && message.senderId !== '1' && (
                <ThemedText style={styles.messageSender}>{message.senderName}</ThemedText>
              )}
              
              <View style={[
                styles.messageContainer,
                message.isSystemMessage ? styles.systemMessage : 
                message.senderId === '1' ? styles.userMessage : styles.otherMessage
              ]}>
                <ThemedText style={[
                  styles.messageText,
                  message.isSystemMessage ? styles.systemMessageText : 
                  message.senderId === '1' ? styles.userMessageText : styles.otherMessageText
                ]}>
                  {message.text}
                </ThemedText>
              </View>
              
              <ThemedText style={styles.messageTime}>
                {formatTime(message.timestamp)}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            placeholderTextColor="#999999"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || sendingMessage) && styles.disabledButton]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <FontAwesome name="spinner" size={20} color="#FFFFFF" />
            ) : (
              <FontAwesome name="paper-plane" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2929',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerContainer: {
    position: 'relative',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  participantsButton: {
    position: 'absolute',
    top: 20,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 5,
  },
  participantsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2929',
    marginLeft: 6,
  },
  participantsPanel: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: width * 0.7,
    maxHeight: height * 0.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    zIndex: 10,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  participantsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  participantsPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    color: '#333333',
  },
  hostBadge: {
    color: '#dc2929',
    fontWeight: '700',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  systemMessageWrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '90%',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageContainer: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
  },
  userMessage: {
    backgroundColor: '#dc2929',
    borderBottomRightRadius: 4,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  otherMessage: {
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#226cae',
    shadowColor: '#226cae',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  systemMessage: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 8,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2929',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333333',
  },
  systemMessageText: {
    color: '#333333',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dc2929',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
}); 
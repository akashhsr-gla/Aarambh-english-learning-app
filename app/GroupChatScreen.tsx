import { FontAwesome } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView, Modal, Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { authAPI, groupsAPI } from './services/api';

const { width } = Dimensions.get('window');

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isActive: boolean;
}

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  timestamp: Date;
  isEdited: boolean;
  replyTo?: string;
}

interface GroupInfo {
  title: string;
  topic: string;
  maxParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  password: string | null;
}

interface RouteParams {
  groupInfo: GroupInfo;
  participants: Participant[];
  groupId: string;
}

export default function GroupChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupInfo, participants: routeParticipants, groupId } = (route.params as RouteParams) || {};
  
  
  const [participants, setParticipants] = useState<Participant[]>(routeParticipants || []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endedByName, setEndedByName] = useState<string | null>(null);
  const groupDetailsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Feature access control
  const { canAccess: canAccessGroupChat, featureInfo: groupFeatureInfo } = useFeatureAccess('group_calls');
  const [showParticipants, setShowParticipants] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);

  // Load group messages
  const loadMessages = async () => {
    try {
      setError(null);
      const response = await groupsAPI.getMessages(groupId, 1, 100);
      
      if (response.success) {
        const formattedMessages: Message[] = (response.data.messages || []).map((msg: any) => ({
          id: msg.id,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            avatar: msg.sender.avatar
          },
          message: msg.message,
          messageType: msg.messageType,
          timestamp: new Date(msg.timestamp),
          isEdited: msg.isEdited,
          replyTo: msg.replyTo
        }));
        
        setMessages(formattedMessages);
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Load group participants
  const loadParticipants = async () => {
    try {
      const response = await groupsAPI.getGroupDetails(groupId);
      if (response.success) {
        const groupParticipants: Participant[] = (response.data.participants || []).map((p: any) => ({
          id: p.id || p.user?._id || p.user,
          name: p.name || p.user?.name || 'Unknown',
          avatar: p.profilePicture || p.user?.profilePicture || null,
          isHost: p.role === 'host',
          isActive: p.isActive
        }));
        setParticipants(groupParticipants);
        
        // Check if current user is the host
        try {
          const authResponse = await authAPI.getCurrentUser();
          if (authResponse.success) {
            const userId = authResponse.data?.user?._id || authResponse.data?._id || authResponse._id;
            setCurrentUserId(userId);
            
            if (userId) {
              const userIsHost = groupParticipants.some(p => p.id === userId && p.isHost);
              setIsHost(userIsHost);
            }
          }
        } catch (err) {
          // Silent error handling
        }
      }
    } catch (err: any) {
      // Silent error handling
    }
  };

  useEffect(() => {
    if (groupId) {
      loadMessages();
      loadParticipants();
      
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 3000);
      
      // Set up polling for group details to detect end-session and keep participants in sync
      const pollGroupDetails = async () => {
        try {
          const resp = await groupsAPI.getGroupDetails(groupId);
          if (resp?.success && resp.data) {
            // Update participants live
            const liveParticipants: Participant[] = (resp.data.participants || []).map((p: any) => ({
              id: p.id || p.user?._id || p.user,
              name: p.name || p.user?.name || 'Unknown',
              avatar: p.profilePicture || p.user?.profilePicture || null,
              isHost: p.role === 'host',
              isActive: p.isActive
            }));
            setParticipants(liveParticipants);

            // Detect session end - show modal to ALL participants when session ends
            const status = resp.data.status;
            const isActiveSession = resp.data.groupSession?.isActive;
            
            // Session has ended if status is not active OR session is not active
            const sessionEnded = (status && !['active', 'waiting'].includes(status)) || isActiveSession === false;
            
            if (sessionEnded) {
              const hostName = resp.data.host?.name || 'Host';
              setEndedByName(hostName);
              setShowEndModal(true);
              // Stop polling once we detect session end
              if (groupDetailsPollRef.current) {
                clearInterval(groupDetailsPollRef.current);
                groupDetailsPollRef.current = null;
              }
            }
          }
        } catch (error) {
          // Silent error handling
        }
      };

      groupDetailsPollRef.current = setInterval(pollGroupDetails, 2000);
      
      // Initial poll once
      pollGroupDetails();
      
    return () => {
        clearInterval(interval);
        if (groupDetailsPollRef.current) {
          clearInterval(groupDetailsPollRef.current);
          groupDetailsPollRef.current = null;
        }
      };
    }
  }, [groupId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await groupsAPI.sendMessage(groupId, newMessage.trim(), 'text');
      
      if (response.success) {
        setNewMessage('');
        // Message will be loaded by polling
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpgradeToCall = (type: 'voice' | 'video') => {
    Alert.alert(
      'Upgrade to Call',
      `Upgrade this group chat to a ${type} call?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade',
          onPress: () => {
            // @ts-ignore
            navigation.navigate('GroupVideoCallScreen', {
              groupInfo,
              participants,
              groupId,
              isVoiceOnly: type === 'voice'
            });
          }
        }
      ]
    );
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupId) {
                Alert.alert('Error', 'Group ID is missing');
                return;
              }
              const response = await groupsAPI.leaveGroup(groupId);
              // Optimistically remove current user from participants and close overlay
              if (currentUserId) {
                setParticipants(prev => prev.filter(p => p.id !== currentUserId));
              }
              setShowParticipants(false);
              // Reset to groups screen to guarantee navigation
              // @ts-ignore
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'GroupDiscussionScreen' }] })
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCloseGroup = async () => {
    Alert.alert(
      'Close Group Discussion',
      'Are you sure you want to close this group discussion? This will end the session for all participants.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Close Group', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupId) {
                Alert.alert('Error', 'Group ID is missing');
                return;
              }
              const response = await groupsAPI.endSession(groupId);
              // For host, directly navigate back - others will get modal via polling
              // @ts-ignore
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'GroupDiscussionScreen' }] })
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to close group. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const renderMessage = (message: Message, index: number) => {
    const isMyMessage = currentUserId && message.sender.id === currentUserId;
    const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
    
    return (
      <View key={message.id} style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        {!isMyMessage && showAvatar && (
          <View style={styles.avatar}>
            <FontAwesome name="user" size={16} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
          {!isMyMessage && showAvatar && (
            <ThemedText style={styles.senderName}>
              {message.sender.name}
            </ThemedText>
          )}
          <ThemedText style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {message.message}
          </ThemedText>
          <ThemedText style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {formatTime(message.timestamp)}
          </ThemedText>
        </View>
        
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Group Chat" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading messages...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Group Chat" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
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
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
        <GameHeader 
        title={groupInfo?.title || 'Group Chat'} 
          showBackButton 
        onBackPress={() => navigation.goBack()}
        />
      
      <FeatureAccessWrapper
        featureKey="group_calls"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
      {/* Group Info Header */}
      <ThemedView style={styles.groupInfoHeader}>
        <View style={styles.groupInfoContent}>
          <ThemedText style={styles.groupTitle}>{groupInfo?.title}</ThemedText>
          <ThemedText style={styles.groupTopic}>{groupInfo?.topic}</ThemedText>
          <View style={styles.groupMeta}>
            <View style={[styles.levelBadge, 
              groupInfo?.level === 'beginner' ? styles.beginnerBadge : 
              groupInfo?.level === 'intermediate' ? styles.intermediateBadge : 
              styles.advancedBadge
            ]}>
              <ThemedText style={styles.levelText}>
                {groupInfo?.level?.charAt(0).toUpperCase() + groupInfo?.level?.slice(1)}
              </ThemedText>
            </View>
            <ThemedText style={styles.participantsText}>
              {participants.length}/{groupInfo?.maxParticipants} participants
            </ThemedText>
          </View>
      </View>
      
        
        <View style={styles.actionButtons}>
          {/* Live group indicator - toggles participants (placed left of action button) */}
          <TouchableOpacity 
            style={styles.participantsButton}
            onPress={() => setShowParticipants(!showParticipants)}
          >
            <FontAwesome name="users" size={18} color="#FFFFFF" />
            <ThemedText style={styles.participantsCount}>{participants.length}</ThemedText>
          </TouchableOpacity>
          {isHost ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.closeButton]}
              onPress={handleCloseGroup}
            >
              <FontAwesome name="times-circle" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Close Group</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveGroup}
            >
              <FontAwesome name="sign-out" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Leave Group</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        
      </ThemedView>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 30}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <FontAwesome name="comments" size={50} color="#CCCCCC" />
              <ThemedText style={styles.emptyMessagesText}>No messages yet</ThemedText>
              <ThemedText style={styles.emptyMessagesSubtext}>
                Start the conversation by sending a message
              </ThemedText>
            </View>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <View style={styles.messageInputWrapper}>
            <TextInput
              ref={messageInputRef}
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              placeholderTextColor="#999999"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.disabledSendButton]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <FontAwesome name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Participants Overlay */}
      {showParticipants && (
        <View style={styles.participantsOverlay}>
          <View style={styles.participantsHeader}>
            <ThemedText style={styles.participantsTitle}>Participants ({participants.length})</ThemedText>
            <TouchableOpacity onPress={() => setShowParticipants(false)}>
              <FontAwesome name="times" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                    <FontAwesome name="user" size={16} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.participantName}>
                  {participant.name}
                    {participant.isHost && <ThemedText style={styles.hostBadge}> (Host)</ThemedText>}
                  </ThemedText>
                <View style={[styles.statusIndicator, participant.isActive && styles.activeStatus]} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Session Ended Modal */}
      <Modal visible={showEndModal} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }]}>
            <FontAwesome name="info-circle" size={40} color="#dc2929" />
            <ThemedText style={[styles.modalTitle, { color: '#1a5085' }]}>Group Discussion Ended</ThemedText>
            <ThemedText style={[styles.modalMessage, { color: '#333' }]}>
              {endedByName} has closed the group discussion.
            </ThemedText>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#226cae' }]}
              onPress={() => {
                setShowEndModal(false);
                // @ts-ignore
                navigation.dispatch(
                  CommonActions.reset({ index: 0, routes: [{ name: 'GroupDiscussionScreen' }] })
                );
              }}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>OK</ThemedText>
            </TouchableOpacity>
            </View>
        </View>
      </Modal>
      </FeatureAccessWrapper>
    </View>
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
    bottom: 0,
    zIndex: -1,
  },
  loadingContainer: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  participantsButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  participantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#226cae',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#226cae',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  participantsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupInfoContent: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  groupTopic: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  beginnerBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  intermediateBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  advancedBadge: {
    backgroundColor: 'rgba(220, 41, 41, 0.15)',
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  participantsText: {
    fontSize: 12,
    color: '#999999',
  },
  communicationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  communicationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButton: {
    backgroundColor: '#226cae',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  myMessageContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  myAvatar: {
    backgroundColor: '#dc2929',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myMessageBubble: {
    backgroundColor: '#dc2929',
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  mySenderName: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: '#CCCCCC',
  },
  participantsOverlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: width * 0.7,
    maxHeight: 400,
    borderRadius: 12,
    padding: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  hostBadge: {
    color: '#dc2929',
    fontWeight: '700',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  activeStatus: {
    backgroundColor: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  closeButton: {
    backgroundColor: '#dc2929',
  },
  leaveButton: {
    backgroundColor: '#666666',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal styles (matching CallScreen/ChatScreen style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#226cae',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#226cae',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import Header from '../components/Header';
import ChatButton from '../components/ChatButton';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
};

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! My name is Sarah. I\'m here to practice English with you. What\'s your name?',
      sender: 'other',
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  
  const flatListRef = useRef<FlatList>(null);

  // Auto-responses based on user messages
  const autoResponses = [
    { trigger: 'hi', response: 'Hi there! How are you doing today?' },
    { trigger: 'hello', response: 'Hello! Nice to meet you. What would you like to talk about?' },
    { trigger: 'name', response: 'My name is Sarah. I\'m an English language practice partner.' },
    { trigger: 'weather', response: 'The weather is a great topic for conversation practice! Is it sunny, rainy, or cloudy where you are?' },
    { trigger: 'hobby', response: 'Hobbies are interesting to discuss! I enjoy reading, hiking, and learning new languages. What about you?' },
    { trigger: 'food', response: 'Food is one of my favorite topics! What kind of cuisine do you enjoy the most?' },
    { trigger: 'movie', response: 'Movies are great for language learning! Have you watched any good films recently?' },
    { trigger: 'music', response: 'Music is universal! What kind of music do you listen to?' },
    { trigger: 'travel', response: 'Traveling is a wonderful experience! Have you visited any interesting places?' },
    { trigger: 'learn', response: 'Learning English takes practice. What aspects are you finding most challenging?' },
  ];

  const sendMessage = () => {
    if (message.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage('');

    // Simulate typing delay before response
    setTimeout(() => {
      // Check for matching auto-response
      let responseText = 'That\'s interesting! Could you tell me more about it?';
      
      for (const item of autoResponses) {
        if (message.toLowerCase().includes(item.trigger)) {
          responseText = item.response;
          break;
        }
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'other',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 1000);
  };

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
              <ThemedText style={styles.chatPartnerName}>Sarah</ThemedText>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <ThemedText style={styles.onlineText}>Online</ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome name="phone" size={18} color="#226cae" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
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
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <FontAwesome name="paper-plane" size={20} color="#FFFFFF" />
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
}); 
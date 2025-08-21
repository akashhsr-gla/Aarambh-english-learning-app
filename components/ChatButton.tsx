import { StyleSheet, View, TouchableOpacity, TextInput, Animated, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ChatButtonProps {
  expandable?: boolean;
  navigateOnClick?: boolean;
}

export default function ChatButton({ expandable = true, navigateOnClick = false }: ChatButtonProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const navigation = useNavigation();

  const toggleChat = () => {
    if (navigateOnClick) {
      navigation.navigate('ChatScreen' as never);
    } else if (expandable) {
      setChatExpanded(!chatExpanded);
    }
  };

  return (
    <>
      {expandable && chatExpanded ? (
        <View style={styles.chatPanel}>
          <View style={styles.chatPanelHeader}>
            <ThemedText style={styles.chatPanelTitle}>Language Assistant</ThemedText>
            <TouchableOpacity onPress={toggleChat}>
              <FontAwesome name="times" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.chatMessages}>
            <View style={styles.botMessage}>
              <ThemedText style={styles.messageText}>Hello! I can help you with language learning. What would you like to know?</ThemedText>
            </View>
            
            <View style={styles.userMessage}>
              <ThemedText style={styles.userMessageText}>How can I improve my pronunciation?</ThemedText>
            </View>
            
            <View style={styles.botMessage}>
              <ThemedText style={styles.messageText}>Try our <ThemedText style={styles.highlightText}>Pronunciation Challenge</ThemedText> game! It will help you practice difficult sounds and get feedback.</ThemedText>
            </View>
          </View>
          
          <View style={styles.chatInputContainer}>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Ask a question..."
              placeholderTextColor="#999999"
            />
            <TouchableOpacity style={styles.sendButton}>
              <FontAwesome name="paper-plane" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.chatButton} onPress={toggleChat}>
          <FontAwesome name="code" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Sticky Chat Button
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  // Chat Panel
  chatPanel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
}); 
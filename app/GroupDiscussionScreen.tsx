import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Work around TS JSX typing mismatch for expo-linear-gradient in some setups
const Gradient = (LinearGradient as unknown) as React.ComponentType<any>;

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { groupsAPI, sessionsAPI } from './services/api';

const { width } = Dimensions.get('window');

type GroupStatus = 'waiting' | 'active' | 'ready' | 'disbanded';

interface GroupDiscussion {
  id: string;
  title: string;
  topic: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  maxParticipants: number;
  status: GroupStatus;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  createdAt: Date;
}

export default function GroupDiscussionScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<GroupStatus | null>(null);
  const [groups, setGroups] = useState<GroupDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDiscussion | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinCodePassword, setJoinCodePassword] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  
  // Session management state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  const { canAccess: canViewGroups } = useFeatureAccess('group_calls');

  const fetchGroups = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedStatus) filters.status = selectedStatus;
      if (searchQuery) filters.search = searchQuery;

      const response = await groupsAPI.getAvailableGroups(filters);
      
      if (response?.success && response?.data?.groups) {
        const mappedGroups: GroupDiscussion[] = response.data.groups.map((group: any) => ({
          id: group.id,
          title: group.title || 'Untitled Group',
          topic: group.topic || 'No topic specified',
          participants: Array.isArray(group.participants) ? group.participants.map((p: any) => ({
            id: p.id,
            name: p.name || 'Anonymous',
            avatar: p.avatar
          })) : [],
          maxParticipants: group.maxParticipants || 10,
          status: group.status || 'waiting',
          level: group.level || 'beginner',
          isPrivate: Boolean(group.isPrivate),
          createdAt: group.createdAt ? new Date(group.createdAt) : new Date()
        }));
        
        setGroups(mappedGroups);
      } else {
        setGroups([]);
      }
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check for active group session on component mount
  const checkActiveSession = async () => {
    try {
      setSessionLoading(true);
      const response = await sessionsAPI.getActiveGroupSession();
      
      if (response.success && response.data) {
        console.log('🔍 Found active group session:', response.data);
        setActiveSession(response.data);
        
        // Show option to continue the session
        Alert.alert(
          'Continue Group Discussion?',
          `You have an active discussion session: "${response.data.groupSession?.groupName || 'Group Discussion'}". Would you like to continue?`,
          [
            {
              text: 'Start New',
              style: 'cancel',
              onPress: () => setActiveSession(null)
            },
            {
              text: 'Continue',
              onPress: () => continueGroupSession(response.data)
            }
          ]
        );
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
      setActiveSession(null);
    } finally {
      setSessionLoading(false);
    }
  };

  const continueGroupSession = (sessionData: any) => {
    if (sessionData.groupSession?.groupId) {
      // @ts-ignore
      navigation.navigate('GroupWaitingRoom', {
        groupId: sessionData.groupSession.groupId,
        groupInfo: {
          title: sessionData.groupSession.groupName,
          topic: sessionData.groupSession.topic,
          level: sessionData.groupSession.level,
          maxParticipants: sessionData.groupSession.maxParticipants,
          isPrivate: sessionData.groupSession.isPrivate,
          password: null
        },
        sessionType: sessionData.groupSession.discussionType || 'chat'
      });
    }
  };

  const saveGroupSession = async (groupInfo: any, groupId: string) => {
    try {
      console.log('💾 Saving group session:', { groupInfo, groupId });
      await sessionsAPI.createOrUpdateGroupSession({
        groupId,
        groupName: groupInfo.title,
        topic: groupInfo.topic,
        level: groupInfo.level,
        discussionType: 'chat',
        maxParticipants: groupInfo.maxParticipants,
        isPrivate: groupInfo.isPrivate,
        joinCode: groupInfo.joinCode
      });
    } catch (error) {
      console.error('Error saving group session:', error);
    }
  };

  useEffect(() => {
    checkActiveSession();
    fetchGroups();
  }, [selectedLevel, selectedStatus, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups(true);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchQuery || 
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.topic.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLevel = !selectedLevel || group.level === selectedLevel;
    const matchesStatus = !selectedStatus || group.status === selectedStatus;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleCreateGroup = () => {
    // @ts-ignore
    navigation.navigate('CreateGroupScreen');
  };
  
  const handleJoinGroup = async (group: GroupDiscussion) => {
    if (group.status === 'disbanded') {
      Alert.alert('Group Disbanded', 'This group has been disbanded.');
      return;
    }
    
    if (group.status === 'active') {
      Alert.alert('Group Active', 'This group discussion is already in progress.');
      return;
    }

    try {
      console.log('🔍 Attempting to join group:', group.id);
      console.log('🔍 Group object:', group);
      
      if (group.isPrivate) {
        // Show password modal for private groups
        setSelectedGroup(group);
        setPasswordInput('');
        setShowPasswordModal(true);
      } else {
        await joinGroupWithPassword(group, null);
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const joinGroupWithPassword = async (group: GroupDiscussion, password: string | null) => {
    try {
      console.log('🔍 Joining group with password:', group.id, password ? '***' : 'none');
      console.log('🔍 Group object:', group);
      console.log('🔍 Group ID type:', typeof group.id);
      console.log('🔍 Group ID length:', group.id.length);
      console.log('🔍 Group ID value:', JSON.stringify(group.id));
      console.log('🔍 Password value:', JSON.stringify(password));
      
      // Join the group first
      const joinResponse = await groupsAPI.joinGroup(group.id, password as any);
      
      console.log('🔍 Join response:', joinResponse);
      
      if (!joinResponse.success) {
        Alert.alert('Error', joinResponse.message || 'Failed to join group');
        return;
      }
      
      // Save group session before navigating
      await saveGroupSession({
        title: group.title,
        topic: group.topic,
        maxParticipants: group.maxParticipants,
        level: group.level,
        isPrivate: group.isPrivate,
        password: password
      }, group.id);

      // Navigate to group waiting room
      // @ts-ignore
      navigation.navigate('GroupWaitingRoom', {
        groupId: group.id,
        groupInfo: {
          title: group.title,
          topic: group.topic,
          maxParticipants: group.maxParticipants,
          level: group.level,
          isPrivate: group.isPrivate,
          password: password
        },
        participants: joinResponse.data.participants || [],
        sessionType: 'chat' // Default to chat session
      });
    } catch (error: any) {
      console.error('Error joining group with password:', error);
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedGroup) return;
    
    if (!passwordInput.trim()) {
      Alert.alert('Error', 'Please enter the group password');
      return;
    }

    setJoiningGroup(true);
    try {
      await joinGroupWithPassword(selectedGroup, passwordInput.trim());
      setShowPasswordModal(false);
      setPasswordInput('');
      setSelectedGroup(null);
    } catch (error: any) {
      console.error('❌ Password join error:', error);
      console.error('❌ Error details:', error.message, error.statusCode, error.errorData);
      
      if (error.message && (error.message.includes('Invalid password') || error.message.includes('Wrong password'))) {
        Alert.alert('Wrong Password', 'The password you entered is incorrect. Please try again.');
      } else if (error.message && error.message.includes('private group')) {
        Alert.alert('Wrong Password', 'Invalid password for private group. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to join group. Please try again.');
      }
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    setJoiningGroup(true);
    try {
      console.log('🔍 Attempting to join by code:', joinCodeInput.trim().toUpperCase());
      console.log('🔍 Password provided:', joinCodePassword.trim() ? 'yes' : 'no');
      console.log('🔍 groupsAPI.joinGroupByCode available:', typeof groupsAPI.joinGroupByCode);
      console.log('🔍 API Base URL check - making test call...');
      
      const response = await (groupsAPI as any).joinGroupByCode(
        joinCodeInput.trim().toUpperCase(), 
        joinCodePassword.trim() || null
      );
      
      console.log('🔍 Join by code response:', response);
      
      if (response.success) {
        setShowJoinByCodeModal(false);
        setJoinCodeInput('');
        setJoinCodePassword('');
        
        // Save group session before navigating
        await saveGroupSession({
          title: response.data.group?.title || 'Group',
          topic: response.data.group?.topic || 'Discussion',
          maxParticipants: response.data.group?.maxParticipants || 10,
          level: response.data.group?.level || 'beginner',
          isPrivate: response.data.group?.isPrivate || false,
          joinCode: joinCodeInput.trim().toUpperCase()
        }, response.data.groupId);

        // Navigate to the group waiting room
        // @ts-ignore
        navigation.navigate('GroupWaitingRoom', {
          groupId: response.data.groupId,
          groupInfo: {
            title: response.data.group?.title || 'Group',
            topic: response.data.group?.topic || 'Discussion',
            maxParticipants: response.data.group?.maxParticipants || 10,
            level: response.data.group?.level || 'beginner',
            isPrivate: response.data.group?.isPrivate || false,
            password: null
          }
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to join group');
      }
    } catch (error: any) {
      console.error('❌ Join by code error:', error);
      console.error('❌ Error details:', error.message, error.statusCode, error.errorData);
      
      if (error.message && (error.message.includes('Invalid password') || error.message.includes('Wrong password') || error.message.includes('private group'))) {
        Alert.alert('Wrong Password', 'The password you entered is incorrect. Please try again.');
      } else if (error.message && (error.message.includes('Group not found') || error.message.includes('not found with this code'))) {
        Alert.alert('Group Not Found', 'No group found with this code. Please check the code and try again.');
      } else if (error.message && error.message.includes('Join code is required')) {
        Alert.alert('Error', 'Please enter a group code');
      } else if (error.message && error.message.includes('Group is full')) {
        Alert.alert('Group Full', 'This group is already full. Try joining another group.');
      } else if (error.message && error.message.includes('already in this group')) {
        Alert.alert('Already Joined', 'You are already a member of this group.');
      } else {
        Alert.alert('Error', error.message || 'Failed to join group by code. Please try again.');
      }
    } finally {
      setJoiningGroup(false);
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const renderFilterChip = (label: string, value: string, type: 'level' | 'status') => {
    const isSelected = type === 'level' ? selectedLevel === value : selectedStatus === value;
    
    return (
      <TouchableOpacity 
        key={`${type}-${value}`}
        style={[styles.filterChip, isSelected && styles.activeFilterChip]} 
        onPress={() => {
          if (type === 'level') {
            setSelectedLevel(isSelected ? null : value);
          } else {
            setSelectedStatus(isSelected ? (null as GroupStatus | null) : value as GroupStatus);
          }
        }}
      >
        <View style={[styles.filterChipIndicator, isSelected && styles.activeFilterChipIndicator]} />
        <ThemedText style={[styles.filterChipText, isSelected && styles.activeFilterChipText]}>
          {label}
        </ThemedText>
        {isSelected && (
          <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderGroupCard = ({ item: group }: { item: GroupDiscussion }) => (
    <ThemedView style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupTitleContainer}>
          <ThemedText style={styles.groupTitle}>{group.title}</ThemedText>
          <View style={styles.groupMeta}>
            <View style={[
              styles.levelBadge, 
              group.level === 'beginner' ? styles.beginnerBadge : 
              group.level === 'intermediate' ? styles.intermediateBadge : 
              styles.advancedBadge
            ]}>
              <ThemedText style={styles.levelText}>
                {group.level.charAt(0).toUpperCase() + group.level.slice(1)}
              </ThemedText>
            </View>
            <ThemedText style={styles.timeText}>{formatTime(group.createdAt)}</ThemedText>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          {group.isPrivate && (
            <View style={styles.privateBadge}>
              <FontAwesome name="lock" size={10} color="#dc2929" />
              <ThemedText style={styles.privateText}>Private</ThemedText>
            </View>
          )}
          <View style={[
            styles.statusBadge, 
            group.status === 'waiting' ? styles.waitingBadge : 
            group.status === 'active' ? styles.activeBadge : 
            group.status === 'ready' ? styles.readyBadge :
            styles.disbandedBadge
          ]}>
            <ThemedText style={styles.statusText}>
              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
            </ThemedText>
          </View>
        </View>
      </View>
      
      <View style={styles.groupContent}>
        <ThemedText style={styles.topicLabel}>Topic:</ThemedText>
        <ThemedText style={styles.topicText}>{group.topic}</ThemedText>
      </View>
      
      <View style={styles.groupFooter}>
        <View style={styles.participantsContainer}>
          <ThemedText style={styles.participantsText}>
            {group.participants.length}/{group.maxParticipants} participants
          </ThemedText>
          <View style={styles.avatarStack}>
            {group.participants.slice(0, 3).map((participant, index) => (
              <View 
                key={participant.id} 
                style={[styles.avatarCircle, { zIndex: 3 - index, marginLeft: index > 0 ? -10 : 0 }]}
              >
                <FontAwesome name="user" size={12} color="#FFFFFF" />
              </View>
            ))}
            {group.participants.length > 3 && (
              <View style={[styles.avatarCircle, styles.avatarMore, { marginLeft: -10 }]}>
                <ThemedText style={styles.avatarMoreText}>+{group.participants.length - 3}</ThemedText>
              </View>
            )}
          </View>
        </View>
        
        {/* Join Button */}
        <TouchableOpacity 
          style={[styles.joinButton, group.status !== 'waiting' && styles.disabledJoinButton]}
          onPress={() => handleJoinGroup(group)}
          disabled={group.status !== 'waiting'}
        >
          <FontAwesome name="sign-in" size={16} color={group.status === 'waiting' ? "#FFFFFF" : "#CCCCCC"} />
          <ThemedText style={[styles.joinButtonText, group.status !== 'waiting' && styles.disabledJoinButtonText]}>
            Join
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading groups...</ThemedText>
        </ThemedView>
      );
    }
    
    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>Error Loading Groups</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchGroups()}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }
    
    return (
      <ThemedView style={styles.centerContainer}>
        <FontAwesome name="users" size={50} color="#CCCCCC" />
        <ThemedText style={styles.emptyText}>No groups found</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Try adjusting your filters or create a new group
        </ThemedText>
      </ThemedView>
    );
  };
  
  return (
    <View style={styles.container}>
      <Gradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <View style={styles.headerContainer}>
        <GameHeader 
          title="Group Discussions" 
          showBackButton 
          onBackPress={() => navigation.goBack()}
        />
      </View>
      
      <View style={styles.contentContainer}>
        {/* Search and Create Group */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome name="search" size={16} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
            />
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
            <FontAwesome name="plus" size={16} color="#FFFFFF" />
            <ThemedText style={styles.createButtonText}>Create</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.joinByCodeInlineButton}
            onPress={() => {
              setJoinCodeInput('');
              setJoinCodePassword('');
              setShowJoinByCodeModal(true);
            }}
          >
            <FontAwesome name="qrcode" size={16} color="#FFFFFF" />
            <ThemedText style={styles.joinByCodeButtonText}>Join by Code</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersRow}>
            {renderFilterChip('Beginner', 'beginner', 'level')}
            {renderFilterChip('Intermediate', 'intermediate', 'level')}
            {renderFilterChip('Advanced', 'advanced', 'level')}
            
            <View style={styles.filterDivider} />
            
            {renderFilterChip('Waiting', 'waiting', 'status')}
            {renderFilterChip('Active', 'active', 'status')}
          </View>
        </View>
        
        {/* Group List */}
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          style={styles.groupsList}
          contentContainerStyle={filteredGroups.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Private Group</ThemedText>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <FontAwesome name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalText}>
                This group requires a password to join.
              </ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Password *</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter group password..."
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  secureTextEntry
                  placeholderTextColor="#999999"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.modalJoinButton, joiningGroup && styles.modalDisabledButton]}
                onPress={handlePasswordSubmit}
                disabled={joiningGroup}
              >
                {joiningGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome name="sign-in" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.modalJoinButtonText}>Join Group</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join by Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showJoinByCodeModal}
        onRequestClose={() => setShowJoinByCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Join by Code</ThemedText>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowJoinByCodeModal(false)}
              >
                <FontAwesome name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Group Code *</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter group code..."
                  value={joinCodeInput}
                  onChangeText={setJoinCodeInput}
                  autoCapitalize="characters"
                  placeholderTextColor="#999999"
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Password (if private)</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter password (optional)..."
                  value={joinCodePassword}
                  onChangeText={setJoinCodePassword}
                  secureTextEntry
                  placeholderTextColor="#999999"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalJoinButton, joiningGroup && styles.modalDisabledButton]}
                onPress={handleJoinByCode}
                disabled={joiningGroup}
              >
                {joiningGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome name="sign-in" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.modalJoinButtonText}>Join Group</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  joinByCodeInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  joinByCodeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 32,
  },
  activeFilterChip: {
    backgroundColor: '#dc2929',
    borderColor: '#dc2929',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginRight: 6,
  },
  activeFilterChipIndicator: {
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterChipIcon: {
    marginLeft: 4,
  },
  filterDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E8E8E8',
    borderRadius: 1,
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  groupsList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
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
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  privateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2929',
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waitingBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  activeBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  readyBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  disbandedBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  groupContent: {
    marginBottom: 16,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2929',
    marginBottom: 4,
  },
  topicText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantsText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarMore: {
    backgroundColor: '#EEEEEE',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  disabledJoinButton: {
    backgroundColor: '#EEEEEE',
  },
  disabledJoinButtonText: {
    color: '#CCCCCC',
  },
  // removed floating joinByCodeButton in header; using inline button next to Create
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2929',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  modalJoinButton: {
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  modalDisabledButton: {
    backgroundColor: '#CCCCCC',
  },
  modalJoinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
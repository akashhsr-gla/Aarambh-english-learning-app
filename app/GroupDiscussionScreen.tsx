import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { groupsAPI } from './services/api';

const { width } = Dimensions.get('window');

// Define group discussion types
type GroupStatus = 'open' | 'ongoing' | 'full';

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
  createdAt: Date;
}

// Group discussions will be loaded from backend

export default function GroupDiscussionScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<GroupStatus | null>(null);
  const [groups, setGroups] = useState<GroupDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch groups from backend
  const fetchGroups = async () => {
    try {
      setError(null);
      const filters: any = {};
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedStatus) filters.status = selectedStatus;
      if (searchQuery) filters.search = searchQuery;

      const response = await groupsAPI.getAvailableGroups(filters);
      
      // Map backend response to frontend interface
      const mappedGroups: GroupDiscussion[] = response.data.groups.map((group: any) => ({
        id: group.id,
        title: group.title,
        topic: group.topic,
        participants: group.participants.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar
        })),
        maxParticipants: group.maxParticipants,
        status: group.status as GroupStatus,
        level: group.level,
        createdAt: new Date(group.createdAt)
      }));

      setGroups(mappedGroups);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load groups on component mount and when filters change
  useEffect(() => {
    fetchGroups();
  }, [selectedLevel, selectedStatus, searchQuery]);

  // Filter groups based on search query and filters (client-side for performance)
  const filteredGroups = groups.filter(group => {
    const matchesSearch = searchQuery === '' || 
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.topic.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLevel = selectedLevel === null || group.level === selectedLevel;
    const matchesStatus = selectedStatus === null || group.status === selectedStatus;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });
  
  const handleCreateGroup = () => {
    // @ts-ignore
    navigation.navigate('CreateGroupScreen');
  };
  
  const handleJoinGroup = async (group: GroupDiscussion, mode: 'chat' | 'voice' | 'video') => {
    if (group.status === 'full') {
      Alert.alert('Group Full', 'This group has reached its maximum number of participants.');
      return;
    }
    
    if (group.status === 'ongoing') {
      Alert.alert('Group Ongoing', 'This group discussion is already in progress.');
      return;
    }

    try {
      setLoading(true);
      
      // Join the group first
      const joinResponse = await groupsAPI.joinGroup(group.id);
      
      if (mode === 'chat') {
        // @ts-ignore
        navigation.navigate('GroupChatScreen', { 
          groupId: group.id,
          groupInfo: {
            title: group.title,
            topic: group.topic,
            maxParticipants: group.maxParticipants,
            level: group.level,
            isPrivate: false,
            password: null
          },
          participants: joinResponse.data.participants
        });
      } else {
        // For voice/video, navigate to waiting room first
        // @ts-ignore
        navigation.navigate('GroupWaitingRoom', {
          groupInfo: {
            title: group.title,
            topic: group.topic,
            maxParticipants: group.maxParticipants,
            level: group.level,
            isPrivate: false,
            password: null
          },
          groupId: group.id,
          sessionType: mode
        });
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hr ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Group Discussions" showBackButton onBackPress={() => navigation.goBack()} />
      
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
        </View>
        
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, selectedLevel === 'beginner' && styles.activeFilterChip]} 
            onPress={() => setSelectedLevel(selectedLevel === 'beginner' ? null : 'beginner')}
          >
            <View style={[styles.filterChipIndicator, selectedLevel === 'beginner' && styles.activeFilterChipIndicator]} />
            <ThemedText style={[styles.filterChipText, selectedLevel === 'beginner' && styles.activeFilterChipText]}>
              Beginner
            </ThemedText>
            {selectedLevel === 'beginner' && (
              <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, selectedLevel === 'intermediate' && styles.activeFilterChip]} 
            onPress={() => setSelectedLevel(selectedLevel === 'intermediate' ? null : 'intermediate')}
          >
            <View style={[styles.filterChipIndicator, selectedLevel === 'intermediate' && styles.activeFilterChipIndicator]} />
            <ThemedText style={[styles.filterChipText, selectedLevel === 'intermediate' && styles.activeFilterChipText]}>
              Intermediate
            </ThemedText>
            {selectedLevel === 'intermediate' && (
              <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, selectedLevel === 'advanced' && styles.activeFilterChip]} 
            onPress={() => setSelectedLevel(selectedLevel === 'advanced' ? null : 'advanced')}
          >
            <View style={[styles.filterChipIndicator, selectedLevel === 'advanced' && styles.activeFilterChipIndicator]} />
            <ThemedText style={[styles.filterChipText, selectedLevel === 'advanced' && styles.activeFilterChipText]}>
              Advanced
            </ThemedText>
            {selectedLevel === 'advanced' && (
              <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
            )}
          </TouchableOpacity>
          
          <View style={styles.filterDivider} />
          
          <TouchableOpacity 
            style={[styles.filterChip, selectedStatus === 'open' && styles.activeFilterChip]} 
            onPress={() => setSelectedStatus(selectedStatus === 'open' ? null : 'open')}
          >
            <View style={[styles.filterChipIndicator, selectedStatus === 'open' && styles.activeFilterChipIndicator]} />
            <ThemedText style={[styles.filterChipText, selectedStatus === 'open' && styles.activeFilterChipText]}>
              Open
            </ThemedText>
            {selectedStatus === 'open' && (
              <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, selectedStatus === 'ongoing' && styles.activeFilterChip]} 
            onPress={() => setSelectedStatus(selectedStatus === 'ongoing' ? null : 'ongoing')}
          >
            <View style={[styles.filterChipIndicator, selectedStatus === 'ongoing' && styles.activeFilterChipIndicator]} />
            <ThemedText style={[styles.filterChipText, selectedStatus === 'ongoing' && styles.activeFilterChipText]}>
              Ongoing
            </ThemedText>
            {selectedStatus === 'ongoing' && (
              <FontAwesome name="check" size={12} color="#FFFFFF" style={styles.filterChipIcon} />
            )}
          </TouchableOpacity>
        </ScrollView>
        
        {/* Group List */}
        <ScrollView 
          style={styles.groupsContainer}
          refreshControl={
            <ActivityIndicator animating={refreshing} />
          }
        >
          {loading ? (
            <ThemedView style={styles.loadingState}>
              <ActivityIndicator size="large" color="#dc2929" />
              <ThemedText style={styles.loadingText}>Loading groups...</ThemedText>
            </ThemedView>
          ) : error ? (
            <ThemedView style={styles.errorState}>
              <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
              <ThemedText style={styles.errorStateText}>Error Loading Groups</ThemedText>
              <ThemedText style={styles.errorStateSubtext}>{error}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setLoading(true);
                fetchGroups();
              }}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : filteredGroups.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <FontAwesome name="users" size={50} color="#CCCCCC" />
              <ThemedText style={styles.emptyStateText}>No groups found</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>Try adjusting your filters or create a new group</ThemedText>
            </ThemedView>
          ) : (
            filteredGroups.map((group) => (
              <ThemedView key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View>
                    <ThemedText style={styles.groupTitle}>{group.title}</ThemedText>
                    <View style={styles.groupMeta}>
                      <View style={[styles.levelBadge, 
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
                  <View style={[styles.statusBadge, 
                    group.status === 'open' ? styles.openBadge : 
                    group.status === 'ongoing' ? styles.ongoingBadge : 
                    styles.fullBadge
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </ThemedText>
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
                  
                  {/* Communication Options */}
                  <View style={styles.communicationOptions}>
                    <TouchableOpacity 
                      style={[styles.communicationButton, group.status !== 'open' && styles.disabledCommunicationButton]}
                      onPress={() => handleJoinGroup(group, 'chat')}
                      disabled={group.status !== 'open'}
                    >
                      <FontAwesome name="comments" size={16} color={group.status === 'open' ? "#FFFFFF" : "#CCCCCC"} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.communicationButton, styles.voiceButton, group.status !== 'open' && styles.disabledCommunicationButton]}
                      onPress={() => handleJoinGroup(group, 'voice')}
                      disabled={group.status !== 'open'}
                    >
                      <FontAwesome name="phone" size={16} color={group.status === 'open' ? "#FFFFFF" : "#CCCCCC"} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.communicationButton, styles.videoButton, group.status !== 'open' && styles.disabledCommunicationButton]}
                      onPress={() => handleJoinGroup(group, 'video')}
                      disabled={group.status !== 'open'}
                    >
                      <FontAwesome name="video-camera" size={16} color={group.status === 'open' ? "#FFFFFF" : "#CCCCCC"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>
      </View>
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
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
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
  groupsContainer: {
    flex: 1,
    paddingTop: 4,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginTop: 12,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  errorStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2929',
    marginTop: 12,
  },
  errorStateSubtext: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  emptyStateSubtext: {
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
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  ongoingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  fullBadge: {
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
  communicationOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communicationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    backgroundColor: '#226cae',
  },
  videoButton: {
    backgroundColor: '#dc2929',
  },
  disabledCommunicationButton: {
    backgroundColor: '#EEEEEE',
  },
});
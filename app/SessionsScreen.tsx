import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { sessionsAPI } from './services/api';

const { width } = Dimensions.get('window');

interface SessionData {
  _id: string;
  sessionId: string;
  sessionType: string;
  title?: string;
  description?: string;
  status: string;
  duration: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  host: {
    _id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
    duration: number;
  }>;
  gameSession?: {
    gameType: string;
    scores: Array<{
      user: string;
      score: number;
      percentage: number;
    }>;
  };
  chatSession?: {
    totalMessages: number;
  };
}

interface SessionsResponse {
  sessions: SessionData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: Array<{
    _id: string;
    count: number;
    totalDuration: number;
    avgDuration: number;
  }>;
}

const SESSION_TYPE_LABELS: { [key: string]: string } = {
  video_call: 'Video Call',
  voice_call: 'Voice Call',
  chat: 'Chat',
  group_video_call: 'Group Video',
  group_voice_call: 'Group Voice',
  group_chat: 'Group Chat',
  game: 'Game Session'
};

const SESSION_TYPE_ICONS: { [key: string]: string } = {
  video_call: 'video-camera',
  voice_call: 'phone',
  chat: 'comments',
  group_video_call: 'users',
  group_voice_call: 'users',
  group_chat: 'comments-o',
  game: 'gamepad'
};

export default function SessionsScreen() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [statistics, setStatistics] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    sessionType: '',
    status: ''
  });

  useEffect(() => {
    loadSessions(true);
  }, [filters]);

  const loadSessions = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setSessions([]);
      }
      setError(null);

      const page = reset ? 1 : pagination.page + 1;
      const queryParams: any = {
        page,
        limit: pagination.limit
      };

      if (filters.sessionType) queryParams.sessionType = filters.sessionType;
      if (filters.status) queryParams.status = filters.status;

      const response: { data: SessionsResponse } = await sessionsAPI.getMySessions(queryParams);
      
      if (reset) {
        setSessions(response.data.sessions);
      } else {
        setSessions(prev => [...prev, ...response.data.sessions]);
      }
      
      setPagination(response.data.pagination);
      setStatistics(response.data.statistics || []);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && pagination.page < pagination.pages) {
      setLoadingMore(true);
      loadSessions(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'cancelled':
        return '#f44336';
      case 'failed':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const renderSessionCard = ({ item }: { item: SessionData }) => {
    const sessionIcon = (SESSION_TYPE_ICONS[item.sessionType] || 'circle') as any;
    const sessionLabel = SESSION_TYPE_LABELS[item.sessionType] || item.sessionType;
    const statusColor = getStatusColor(item.status);

    return (
      <ThemedView style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTypeContainer}>
            <View style={[styles.sessionIcon, { backgroundColor: statusColor }]}>
              <FontAwesome name={sessionIcon} size={16} color="#FFFFFF" />
            </View>
            <View style={styles.sessionInfo}>
              <ThemedText style={styles.sessionType}>{sessionLabel}</ThemedText>
              <ThemedText style={styles.sessionDate}>{formatDate(item.createdAt)}</ThemedText>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        {item.title && (
          <ThemedText style={styles.sessionTitle}>{item.title}</ThemedText>
        )}

        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <FontAwesome name="clock-o" size={14} color="#666666" />
            <ThemedText style={styles.detailText}>
              Duration: {formatDuration(item.duration)}
            </ThemedText>
          </View>

          <View style={styles.detailItem}>
            <FontAwesome name="users" size={14} color="#666666" />
            <ThemedText style={styles.detailText}>
              {item.participants.length} participant{item.participants.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {item.gameSession && (
            <View style={styles.detailItem}>
              <FontAwesome name="trophy" size={14} color="#FFD700" />
              <ThemedText style={styles.detailText}>
                Game: {item.gameSession.gameType}
              </ThemedText>
            </View>
          )}

          {item.chatSession && (
            <View style={styles.detailItem}>
              <FontAwesome name="comment" size={14} color="#2196F3" />
              <ThemedText style={styles.detailText}>
                {item.chatSession.totalMessages} messages
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.hostInfo}>
            <FontAwesome name="user-circle" size={16} color="#666666" />
            <ThemedText style={styles.hostText}>
              Host: {item.host.name}
            </ThemedText>
          </View>

          {item.gameSession?.scores && item.gameSession.scores.length > 0 && (
            <View style={styles.scoreInfo}>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <ThemedText style={styles.scoreText}>
                Best: {Math.max(...item.gameSession.scores.map(s => s.percentage))}%
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    );
  };

  const renderStatisticsCard = () => {
    if (statistics.length === 0) return null;

    const totalSessions = statistics.reduce((sum, stat) => sum + stat.count, 0);
    const totalTime = statistics.reduce((sum, stat) => sum + stat.totalDuration, 0);

    return (
      <ThemedView style={styles.statisticsCard}>
        <View style={styles.statisticsHeader}>
          <FontAwesome name="bar-chart" size={20} color="#dc2929" />
          <ThemedText style={styles.statisticsTitle}>Your Statistics</ThemedText>
        </View>

        <View style={styles.statisticsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalSessions}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{formatDuration(totalTime)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Time</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {totalSessions > 0 ? formatDuration(Math.round(totalTime / totalSessions)) : '0s'}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Avg Duration</ThemedText>
          </View>
        </View>

        {statistics.length > 1 && (
          <View style={styles.sessionTypesGrid}>
            {statistics.map((stat, index) => (
              <View key={index} style={styles.sessionTypeStatItem}>
                <FontAwesome 
                  name={(SESSION_TYPE_ICONS[stat._id] || 'circle') as any} 
                  size={14} 
                  color="#226cae" 
                />
                <ThemedText style={styles.sessionTypeStatLabel}>
                  {SESSION_TYPE_LABELS[stat._id] || stat._id}
                </ThemedText>
                <ThemedText style={styles.sessionTypeStatValue}>{stat.count}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ThemedText style={styles.filtersTitle}>Filter Sessions:</ThemedText>
      <View style={styles.filterButtons}>
        <TouchableOpacity 
          style={[styles.filterButton, !filters.sessionType && styles.activeFilterButton]}
          onPress={() => setFilters({ ...filters, sessionType: '' })}
        >
          <ThemedText style={[styles.filterButtonText, !filters.sessionType && styles.activeFilterButtonText]}>
            All Types
          </ThemedText>
        </TouchableOpacity>

        {Object.entries(SESSION_TYPE_LABELS).map(([type, label]) => (
          <TouchableOpacity 
            key={type}
            style={[styles.filterButton, filters.sessionType === type && styles.activeFilterButton]}
            onPress={() => setFilters({ ...filters, sessionType: type })}
          >
            <FontAwesome 
              name={SESSION_TYPE_ICONS[type] as any} 
              size={12} 
              color={filters.sessionType === type ? "#FFFFFF" : "#666666"} 
            />
            <ThemedText style={[styles.filterButtonText, filters.sessionType === type && styles.activeFilterButtonText]}>
              {label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Sessions" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading sessions...</ThemedText>
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
      
      <GameHeader 
        title="Sessions" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#dc2929']}
            tintColor="#dc2929"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View>
            {renderStatisticsCard()}
            {renderFilters()}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <ThemedView style={styles.emptyContainer}>
              {error ? (
                <>
                  <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
                  <ThemedText style={styles.emptyTitle}>Error Loading Sessions</ThemedText>
                  <ThemedText style={styles.emptySubtext}>{error}</ThemedText>
                  <TouchableOpacity style={styles.retryButton} onPress={() => loadSessions(true)}>
                    <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <FontAwesome name="history" size={48} color="#CCCCCC" />
                  <ThemedText style={styles.emptyTitle}>No Sessions Found</ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    Start using the app to see your session history here
                  </ThemedText>
                </>
              )}
            </ThemedView>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#dc2929" />
              <ThemedText style={styles.loadMoreText}>Loading more...</ThemedText>
            </View>
          ) : sessions.length > 0 && pagination.page >= pagination.pages ? (
            <View style={styles.endContainer}>
              <ThemedText style={styles.endText}>No more sessions to load</ThemedText>
            </View>
          ) : null
        }
      />
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statisticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  statisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2929',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  sessionTypesGrid: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    gap: 8,
  },
  sessionTypeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sessionTypeStatLabel: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    marginLeft: 8,
  },
  sessionTypeStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#226cae',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  activeFilterButton: {
    backgroundColor: '#dc2929',
    borderColor: '#dc2929',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666666',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  hostText: {
    fontSize: 12,
    color: '#666666',
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666666',
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
});

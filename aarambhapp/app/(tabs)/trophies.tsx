import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authAPI, leaderboardAPI, sessionsAPI } from '../services/api';

interface RegionData {
  name: string;
  totalPlayers: number;
  onlineNow: number;
  userRank: string;
}

interface ActivityStats {
  chatSessions: number;
  chatRating: number;
  gamesPlayed: number;
  pointsEarned: number;
  lessonsCompleted: number;
  newWordsLearned: number;
}

interface PlayerData {
  rank: number;
  name: string;
  level: string;
  points: number;
  trophies: number;
}

export default function TrophiesScreen() {
  const [loading, setLoading] = useState(true);
  const [regionData, setRegionData] = useState<RegionData>({
    name: 'Loading...',
    totalPlayers: 0,
    onlineNow: 0,
    userRank: 'Loading...'
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    chatSessions: 0,
    chatRating: 0,
    gamesPlayed: 0,
    pointsEarned: 0,
    lessonsCompleted: 0,
    newWordsLearned: 0
  });
  const [topPlayers, setTopPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTrophiesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user data
      const userResponse = await authAPI.getCurrentUser();
      if (!userResponse.success || !userResponse.data.user) {
        throw new Error('Failed to get user data');
      }

      const user = userResponse.data.user;
      if (!user.region) {
        throw new Error('User not assigned to a region');
      }

      // Get user's rank data
      let userRankData = null;
      let leaderboardData = null;
      
      if (user.role === 'student') {
        try {
          const rankResponse = await leaderboardAPI.getMyRank();
          if (rankResponse.success) {
            userRankData = rankResponse.data;
          }
        } catch (error) {
          console.log('Rank fetch error:', error);
        }

        // Get region leaderboard for top players
        try {
          const leaderboardResponse = await leaderboardAPI.getRegionLeaderboard(user.region._id, 1, 3);
          if (leaderboardResponse.success) {
            leaderboardData = leaderboardResponse.data.leaderboard;
          }
        } catch (error) {
          console.log('Leaderboard fetch error:', error);
        }
      }

      // Get user sessions for activity stats
      let sessionsData = null;
      try {
        const sessionsResponse = await sessionsAPI.getMySessions();
        if (sessionsResponse.success) {
          sessionsData = sessionsResponse.data.sessions;
        }
      } catch (error) {
        console.log('Sessions fetch error:', error);
      }

      // Update region data
      setRegionData({
        name: user.region.name,
        totalPlayers: userRankData?.totalPlayersInRegion || 0,
        onlineNow: Math.floor((userRankData?.totalPlayersInRegion || 0) * 0.1), // Estimated
        userRank: userRankData ? `#${userRankData.rank}` : (user.role === 'student' ? 'Unranked' : 'N/A')
      });

      // Calculate activity stats from user data and sessions
      const stats = userRankData?.statistics || {
        lecturesWatched: user.studentInfo?.totalLecturesWatched || 0,
        gameSessions: 0,
        communicationSessions: 0,
        totalScore: 0
      };

      const chatSessions = sessionsData ? sessionsData.filter((s: any) => 
        s.sessionType === 'chat' || s.sessionType.includes('call')
      ).length : stats.communicationSessions;

      setActivityStats({
        chatSessions,
        chatRating: 4.5, // Placeholder - would need rating system
        gamesPlayed: stats.gameSessions,
        pointsEarned: stats.totalScore,
        lessonsCompleted: stats.lecturesWatched,
        newWordsLearned: stats.lecturesWatched * 5 // Estimate
      });

      // Update top players
      if (leaderboardData && leaderboardData.length > 0) {
        const players = leaderboardData.slice(0, 3).map((entry: any, index: number) => ({
          rank: entry.rank,
          name: entry.student.name,
          level: `Level ${Math.floor(entry.statistics.totalScore / 100) + 1}`,
          points: entry.statistics.totalScore,
          trophies: Math.floor(entry.statistics.totalScore / 200) + index + 1
        }));
        setTopPlayers(players);
      }

    } catch (error) {
      console.error('Error fetching trophies data:', error);
      setError('Failed to load trophies data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrophiesData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Header title="Trophies" />
        <ActivityIndicator size="large" color="#dc2929" />
        <ThemedText style={styles.loadingText}>Loading trophies...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Header title="Trophies" />
        <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTrophiesData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Header title="Trophies" />

      {/* Title Section */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.titleText}>Achievements</ThemedText>
        <View style={styles.titleUnderline} />
      </ThemedView>

      {/* Region Stats Card */}
      <ThemedView style={styles.regionCard}>
        <View style={styles.regionHeader}>
          <View style={[styles.regionIconContainer, { backgroundColor: '#dc2929' }]}>
            <FontAwesome name="globe" size={24} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.regionTitle}>Your Region: {regionData.name}</ThemedText>
        </View>
        
        <View style={styles.regionStats}>
          <View style={styles.regionStat}>
            <ThemedText style={styles.statNumber}>{regionData.totalPlayers.toLocaleString()}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Players</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(220, 41, 41, 0.2)' }]} />
          <View style={styles.regionStat}>
            <ThemedText style={[styles.statNumber, { color: '#dc2929' }]}>{regionData.onlineNow}</ThemedText>
            <ThemedText style={styles.statLabel}>Online Now</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(34, 108, 174, 0.2)' }]} />
          <View style={styles.regionStat}>
            <ThemedText style={[styles.statNumber, { color: '#226cae' }]}>{regionData.userRank}</ThemedText>
            <ThemedText style={styles.statLabel}>Your Rank</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Activity Stats Section */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Your Activity</ThemedText>
        <TouchableOpacity style={styles.viewAllButton}>
          <ThemedText style={[styles.viewAllText, { color: '#dc2929' }]}>View Stats</ThemedText>
          <FontAwesome name="angle-right" size={16} color="#dc2929" />
        </TouchableOpacity>
      </View>

      {/* Activity Cards */}
      <View style={styles.activityCardsContainer}>
        {/* Chat Activity */}
        <ThemedView style={styles.activityCard}>
          <View style={[styles.activityIconContainer, { backgroundColor: '#226cae' }]}>
            <FontAwesome name="comments" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.activityContent}>
            <ThemedText style={styles.activityTitle}>Chat Sessions</ThemedText>
            <View style={styles.activityProgressBar}>
              <View style={[styles.activityProgressFill, { width: '65%', backgroundColor: '#226cae' }]} />
            </View>
            <View style={styles.activityStats}>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.chatSessions}</ThemedText> conversations
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.chatRating}</ThemedText> avg. rating
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Game Activity */}
        <ThemedView style={styles.activityCard}>
          <View style={[styles.activityIconContainer, { backgroundColor: '#dc2929' }]}>
            <FontAwesome name="gamepad" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.activityContent}>
            <ThemedText style={styles.activityTitle}>Games Played</ThemedText>
            <View style={styles.activityProgressBar}>
              <View style={[styles.activityProgressFill, { width: '80%', backgroundColor: '#dc2929' }]} />
            </View>
            <View style={styles.activityStats}>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.gamesPlayed}</ThemedText> games completed
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.pointsEarned}</ThemedText> points earned
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Learning Activity */}
        <ThemedView style={styles.activityCard}>
          <View style={[styles.activityIconContainer, { backgroundColor: '#226cae' }]}>
            <FontAwesome name="book" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.activityContent}>
            <ThemedText style={styles.activityTitle}>Learning Progress</ThemedText>
            <View style={styles.activityProgressBar}>
              <View style={[styles.activityProgressFill, { width: '45%', backgroundColor: '#226cae' }]} />
            </View>
            <View style={styles.activityStats}>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.lessonsCompleted}</ThemedText> lessons completed
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>{activityStats.newWordsLearned}</ThemedText> new words learned
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>

      {/* Top Players Section */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Top Players</ThemedText>
        <TouchableOpacity style={styles.viewAllButton}>
          <ThemedText style={[styles.viewAllText, { color: '#226cae' }]}>View All</ThemedText>
          <FontAwesome name="angle-right" size={16} color="#226cae" />
        </TouchableOpacity>
      </View>

      {/* Player Cards */}
      <View style={styles.playerCardsContainer}>
        {topPlayers.length > 0 ? (
          topPlayers.map((player, index) => {
            const borderColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const avatarStyles = [styles.goldAvatar, styles.silverAvatar, styles.bronzeAvatar];
            const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const badgeColors = ['#dc2929', '#226cae', '#dc2929'];
            
            return (
              <ThemedView key={index} style={[styles.playerCard, { borderLeftWidth: 4, borderLeftColor: borderColors[index] }]}>
                <View style={[styles.rankBadge, { backgroundColor: badgeColors[index] }]}>
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>{player.rank}</ThemedText>
                </View>
                <View style={styles.playerInfo}>
                  <View style={[styles.playerAvatar, avatarStyles[index]]}>
                    <FontAwesome name="user" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.playerDetails}>
                    <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                    <ThemedText style={styles.playerCode}>{player.level}</ThemedText>
                  </View>
                </View>
                <View style={styles.playerStats}>
                  <View style={styles.points}>
                    <FontAwesome name="star" size={16} color="#dc2929" />
                    <ThemedText style={styles.statsText}>{player.points}</ThemedText>
                  </View>
                  <View style={styles.trophies}>
                    <FontAwesome name="trophy" size={16} color={trophyColors[index]} />
                    <ThemedText style={styles.statsText}>{player.trophies}</ThemedText>
                  </View>
                </View>
              </ThemedView>
            );
          })
        ) : (
          <ThemedView style={styles.noDataCard}>
            <FontAwesome name="users" size={40} color="#666666" />
            <ThemedText style={styles.noDataText}>No leaderboard data available</ThemedText>
          </ThemedView>
        )}
      </View>
      
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 0,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#dc2929',
    borderRadius: 1.5,
  },
  regionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.05)',
    padding: 16,
  },
  regionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  regionStats: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionStat: {
    flex: 1,
    alignItems: 'center',
  },
  regionDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#226cae',
    marginRight: 4,
  },
  playerCardsContainer: {
    marginBottom: 24,
  },
  playerCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    left: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#dc2929',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  goldAvatar: {
    backgroundColor: '#FFD700',
  },
  silverAvatar: {
    backgroundColor: '#C0C0C0',
  },
  bronzeAvatar: {
    backgroundColor: '#CD7F32',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontWeight: '600',
    color: '#333333',
  },
  playerCode: {
    fontSize: 14,
    color: '#666666',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophies: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    marginLeft: 8,
    color: '#666666',
  },
  activityCardsContainer: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  activityProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStatText: {
    fontSize: 13,
    color: '#666666',
  },
  activityStatHighlight: {
    fontWeight: '700',
    color: '#333333',
  },
  trophyContainer: {
    marginBottom: 20,
  },
  trophyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trophyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  goldTrophy: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  silverTrophy: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  bronzeTrophy: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  lockedTrophy: {
    backgroundColor: 'rgba(136, 136, 136, 0.2)',
  },
  trophyDetails: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  trophyDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  trophyProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#226cae',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2929',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
}); 
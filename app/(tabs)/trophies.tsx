import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ChatButton from '@/components/ChatButton';
import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authAPI, leaderboardAPI, sessionsAPI } from '../services/api';

interface RegionData {
  name: string;
  totalPlayers: number;
  rankText: string;
  points: number;
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
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [regionData, setRegionData] = useState<RegionData>({
    name: 'Loading...',
    totalPlayers: 0,
    rankText: 'Loading...',
    points: 0
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
      const totalStudents = userRankData?.totalStudents || userRankData?.totalPlayersInRegion || 0;
      const rankNum = userRankData?.user?.rank ?? userRankData?.rank;
      const points = userRankData?.user?.totalScore ?? userRankData?.user?.statistics?.totalScore ?? 0;
      setRegionData({
        name: user.region.name,
        totalPlayers: totalStudents,
        rankText: typeof rankNum === 'number' ? `${rankNum}` : (user.role === 'student' ? 'Unranked' : 'N/A'),
        points: Math.floor(Number(points) || 0)
      });

      // Calculate activity stats from user data and sessions
      const stats = userRankData?.user?.statistics || userRankData?.statistics || {
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
          points: Math.floor(Number(entry.statistics?.totalScore || entry.totalScore || 0)),
          trophies: Math.floor((Number(entry.statistics?.totalScore || entry.totalScore || 0)) / 200) + index + 1
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
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
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
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
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
            <FontAwesome name="trophy" size={16} color="#FFD700" />
            <ThemedText style={styles.statNumber}>{regionData.rankText}</ThemedText>
            <ThemedText style={styles.statLabel}>Rank</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(34, 108, 174, 0.2)' }]} />
          <View style={styles.regionStat}>
            <FontAwesome name="star" size={16} color="#dc2929" />
            <ThemedText style={[styles.statNumber, { color: '#dc2929' }]}>{regionData.points}</ThemedText>
            <ThemedText style={styles.statLabel}>Points</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(34, 108, 174, 0.2)' }]} />
          <View style={styles.regionStat}>
            <FontAwesome name="users" size={16} color="#226cae" />
            <ThemedText style={[styles.statNumber, { color: '#226cae' }]}>{regionData.totalPlayers.toLocaleString()}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Players</ThemedText>
          </View>
        </View>
      </ThemedView>

     

      {/* Top Players Section */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Top Players in {regionData.name}</ThemedText>
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
                </View>
                </View>
                <View style={styles.playerStats}>
                  <View style={styles.points}>
                    <FontAwesome name="star" size={16} color="#dc2929" />
                    <ThemedText style={styles.statsText}>{player.points} Points</ThemedText>
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
      {/* Ranking Criteria */}
      <ThemedView style={styles.criteriaCard}>
        <View style={styles.criteriaHeader}>
          <View style={[styles.criteriaBadge, { backgroundColor: '#dc2929' }]}>
            <FontAwesome name="info" size={12} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.criteriaTitle}>Ranking Criteria</ThemedText>
        </View>

        <View style={styles.criteriaChips}>
          <View style={[styles.criteriaChip, styles.criteriaChipRed]}>
            <FontAwesome name="star" size={12} color="#dc2929" />
            <ThemedText style={styles.criteriaChipText}>Points = total sessions participated</ThemedText>
          </View>
          <View style={[styles.criteriaChip, styles.criteriaChipBlue]}>
            <FontAwesome name="trophy" size={12} color="#226cae" />
            <ThemedText style={styles.criteriaChipText}>Higher points rank higher in region</ThemedText>
          </View>
          <View style={[styles.criteriaChip, styles.criteriaChipMixed]}>
            <FontAwesome name="clock-o" size={12} color="#8A8A8A" />
            <ThemedText style={styles.criteriaChipText}>Tie-breaker: earlier registration wins</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.criteriaAction}
          onPress={() => navigation.navigate('SessionsScreen' as never)}
        >
          <FontAwesome name="calendar" size={14} color="#FFFFFF" />
          <ThemedText style={styles.criteriaActionText}>View your sessions</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      {/* Bottom spacer for lifted tab bar */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
    <ChatButton />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 0,
    paddingTop: 0,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
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
    backgroundColor: 'rgba(34, 108, 174, 0.06)',
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
  playerScore: {
    fontSize: 12,
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
  bottomSpacer: {
    height: 38,
    backgroundColor: '#FFFFFF',
  },
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
    overflow: 'hidden',
  },
  // removed mixed gradient; using solid accents instead
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  criteriaBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaBadgeFill: {
    ...StyleSheet.absoluteFillObject as any,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  criteriaLine: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  criteriaChips: {
    marginTop: 6,
    gap: 8,
  },
  criteriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
  },
  criteriaChipRed: {
    backgroundColor: 'rgba(220, 41, 41, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.25)'
  },
  criteriaChipBlue: {
    backgroundColor: 'rgba(34, 108, 174, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.25)'
  },
  criteriaChipMixed: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  criteriaChipText: {
    color: '#444444',
    fontSize: 13,
  },
  criteriaAction: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#226cae',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 
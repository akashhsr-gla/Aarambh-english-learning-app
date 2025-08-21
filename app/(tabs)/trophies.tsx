import { FontAwesome } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TrophiesScreen() {
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
          <ThemedText style={styles.regionTitle}>Your Region: Delhi</ThemedText>
        </View>
        
        <View style={styles.regionStats}>
          <View style={styles.regionStat}>
            <ThemedText style={styles.statNumber}>1,245</ThemedText>
            <ThemedText style={styles.statLabel}>Total Players</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(220, 41, 41, 0.2)' }]} />
          <View style={styles.regionStat}>
            <ThemedText style={[styles.statNumber, { color: '#dc2929' }]}>87</ThemedText>
            <ThemedText style={styles.statLabel}>Online Now</ThemedText>
          </View>
          <View style={[styles.regionDivider, { backgroundColor: 'rgba(34, 108, 174, 0.2)' }]} />
          <View style={styles.regionStat}>
            <ThemedText style={[styles.statNumber, { color: '#226cae' }]}>#4</ThemedText>
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
                <ThemedText style={styles.activityStatHighlight}>32</ThemedText> conversations
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>4.5</ThemedText> avg. rating
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
                <ThemedText style={styles.activityStatHighlight}>48</ThemedText> games completed
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>860</ThemedText> points earned
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
                <ThemedText style={styles.activityStatHighlight}>18</ThemedText> lessons completed
              </ThemedText>
              <ThemedText style={styles.activityStatText}>
                <ThemedText style={styles.activityStatHighlight}>120</ThemedText> new words learned
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
        {/* Player 1 */}
        <ThemedView style={[styles.playerCard, { borderLeftWidth: 4, borderLeftColor: '#FFD700' }]}>
          <View style={[styles.rankBadge, { backgroundColor: '#dc2929' }]}>
            <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>1</ThemedText>
          </View>
          <View style={styles.playerInfo}>
            <View style={[styles.playerAvatar, styles.goldAvatar]}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.playerDetails}>
              <ThemedText style={styles.playerName}>Rahul S.</ThemedText>
              <ThemedText style={styles.playerCode}>Level 8 • Expert</ThemedText>
            </View>
          </View>
          <View style={styles.playerStats}>
            <View style={styles.points}>
              <FontAwesome name="star" size={16} color="#dc2929" />
              <ThemedText style={styles.statsText}>2,450</ThemedText>
            </View>
            <View style={styles.trophies}>
              <FontAwesome name="trophy" size={16} color="#FFD700" />
              <ThemedText style={styles.statsText}>12</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Player 2 */}
        <ThemedView style={[styles.playerCard, { borderLeftWidth: 4, borderLeftColor: '#C0C0C0' }]}>
          <View style={[styles.rankBadge, { backgroundColor: '#226cae' }]}>
            <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>2</ThemedText>
          </View>
          <View style={styles.playerInfo}>
            <View style={[styles.playerAvatar, styles.silverAvatar]}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.playerDetails}>
              <ThemedText style={styles.playerName}>Priya M.</ThemedText>
              <ThemedText style={styles.playerCode}>Level 7 • Expert</ThemedText>
            </View>
          </View>
          <View style={styles.playerStats}>
            <View style={styles.points}>
              <FontAwesome name="star" size={16} color="#dc2929" />
              <ThemedText style={styles.statsText}>2,105</ThemedText>
            </View>
            <View style={styles.trophies}>
              <FontAwesome name="trophy" size={16} color="#C0C0C0" />
              <ThemedText style={styles.statsText}>10</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Player 3 */}
        <ThemedView style={[styles.playerCard, { borderLeftWidth: 4, borderLeftColor: '#CD7F32' }]}>
          <View style={[styles.rankBadge, { backgroundColor: '#dc2929' }]}>
            <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>3</ThemedText>
          </View>
          <View style={styles.playerInfo}>
            <View style={[styles.playerAvatar, styles.bronzeAvatar]}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.playerDetails}>
              <ThemedText style={styles.playerName}>Amit K.</ThemedText>
              <ThemedText style={styles.playerCode}>Level 6 • Advanced</ThemedText>
            </View>
          </View>
          <View style={styles.playerStats}>
            <View style={styles.points}>
              <FontAwesome name="star" size={16} color="#dc2929" />
              <ThemedText style={styles.statsText}>1,890</ThemedText>
            </View>
            <View style={styles.trophies}>
              <FontAwesome name="trophy" size={16} color="#CD7F32" />
              <ThemedText style={styles.statsText}>8</ThemedText>
            </View>
          </View>
        </ThemedView>
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
}); 
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ChatButton from '@/components/ChatButton';
import { Collapsible } from '@/components/Collapsible';
import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HelpScreen() {

  const openEmail = () => Linking.openURL('mailto:aarambhoffficial@gmail.com');
  const openPhone = () => Linking.openURL('tel:+916204111878');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <Header title="Help" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Contact Header */}
        <ThemedView style={styles.contactHeader}>
          <View style={styles.contactRow}>
            <View style={[styles.badge, { backgroundColor: '#dc2929' }]}>
              <FontAwesome name="envelope" size={16} color="#FFFFFF" />
            </View>
            <TouchableOpacity onPress={openEmail}>
              <ThemedText style={styles.contactLink}>aarambhoffficial@gmail.com</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <View style={[styles.badge, { backgroundColor: '#226cae' }]}>
              <FontAwesome name="phone" size={16} color="#FFFFFF" />
            </View>
            <TouchableOpacity onPress={openPhone}>
              <ThemedText style={styles.contactLink}>+91 6204 111 878</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        {/* Hero Section */}
        <ThemedView style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <FontAwesome name="question-circle" size={60} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.heroTitle}>Help & Support</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            We're here to help you learn English better
          </ThemedText>
        </ThemedView>


        {/* FAQ Section */}
        <ThemedView style={styles.faqSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="list" size={20} color="#dc2929" />
            <ThemedText style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
          </View>
          
          <View style={styles.faqContainer}>
            <Collapsible title="How do I start learning English?">
              <ThemedText style={styles.faqAnswer}>
                Tap on "Learn English" from the home screen, choose your skill level, and begin with your first lesson. Our AI tutor will guide you through interactive conversations and exercises.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How do I practice conversations?">
              <ThemedText style={styles.faqAnswer}>
                Use the "Call in English" feature to practice real-time conversations with our AI. Select topics that interest you and start speaking naturally.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How do I earn points and track progress?">
              <ThemedText style={styles.faqAnswer}>
                Complete daily lessons, participate in conversations, and maintain your learning streak. Points are awarded for consistency and improvement. Check your profile to see detailed progress.
              </ThemedText>
            </Collapsible>

            <Collapsible title="Can I change my region settings?">
              <ThemedText style={styles.faqAnswer}>
                Yes! Use the "Set your Region" option on the home screen to customize content based on your location and preferred English dialect.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How does the chat feature work?">
              <ThemedText style={styles.faqAnswer}>
                The "Chat in English" feature allows you to practice written English through text conversations with our AI tutor. It's perfect for improving grammar and vocabulary.
              </ThemedText>
            </Collapsible>

            <Collapsible title="What if I forget my player code?">
              <ThemedText style={styles.faqAnswer}>
                Your player code is displayed on the home screen. If you need to recover it, contact support or check your profile settings for account recovery options.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How do I maintain my learning streak?">
              <ThemedText style={styles.faqAnswer}>
                Complete at least one lesson or conversation daily. You'll receive notifications to remind you of your daily goals and help maintain your streak.
              </ThemedText>
            </Collapsible>

            <Collapsible title="What premium plans are available and how do payments work?">
              <ThemedText style={styles.faqAnswer}>
                You can upgrade from the Subscription screen. Payments are processed securely via Razorpay. After successful payment verification, premium features like unlimited calls, advanced games, group tools, and teacher dashboard access are unlocked.
              </ThemedText>
            </Collapsible>

            <Collapsible title="I was charged but the subscription didn’t activate">
              <ThemedText style={styles.faqAnswer}>
                Make sure you returned to the app after payment and have an active internet connection. If it still shows locked, force-close and reopen the app. If unresolved, contact us with your Razorpay Payment ID and Order ID.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How do I use Pronunciation, Grammar, Identification, and Storytelling games?">
              <ThemedText style={styles.faqAnswer}>
                Open Explore to find all games. Pronunciation analyzes your speech and gives feedback, Grammar tests rules, Identification builds vocabulary, and Storytelling improves fluency and creativity.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How do Groups, Chats, and Video Calls work?">
              <ThemedText style={styles.faqAnswer}>
                Create or join groups from the Groups section. You can chat, schedule sessions, and start video calls. For best call quality, use headphones and a stable network.
              </ThemedText>
            </Collapsible>

            <Collapsible title="What permissions do I need to allow?">
              <ThemedText style={styles.faqAnswer}>
                Microphone and camera permissions are needed for calls and pronunciation. Notifications help you keep your streak. You can manage permissions in your device settings.
              </ThemedText>
            </Collapsible>

            <Collapsible title="How is my data protected?">
              <ThemedText style={styles.faqAnswer}>
                We follow strict security practices and process payments via Razorpay. We store only the minimum necessary data. For details, see our Privacy Policy.
              </ThemedText>
              <TouchableOpacity onPress={() => { router.push('/PrivacyPolicyScreen'); }}>
                <ThemedText style={styles.link}>Read Privacy Policy</ThemedText>
              </TouchableOpacity>
            </Collapsible>

            <Collapsible title="How do I contact support or request a refund?">
              <ThemedText style={styles.faqAnswer}>
                Email us at aarambhoffficial@gmail.com or call +91 6204 111 878 with your registered email and (if payment-related) Razorpay Payment ID. We’ll review and assist promptly.
              </ThemedText>
            </Collapsible>
          </View>
        </ThemedView>

        {/* Feature Guide */}
        <ThemedView style={styles.featureGuide}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="lightbulb-o" size={20} color="#226cae" />
            <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="comments" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Chat in English</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Practice writing and improve your grammar through text conversations
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="phone" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Call in English</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Improve your speaking skills with voice conversations
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="play" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Learn English</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Structured lessons to build your English foundation
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="map-marker" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Set your Region</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Customize content based on your location and preferences
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="microphone" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Pronunciation Game</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Practice speaking and receive feedback to refine pronunciation
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="graduation-cap" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Grammar Quiz</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Test and strengthen grammar with interactive quizzes
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="bullseye" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Daily Challenges</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Stay consistent with bite-sized daily learning tasks
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="eye" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Identification Game</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Learn vocabulary with fun identify-and-match activities
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="book" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Storytelling Game</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Build creativity and fluency through guided storytelling
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="users" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Groups & Community</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Create groups, chat, discuss, and join video calls with peers
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="calendar" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Sessions</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Track and revisit your learning sessions easily
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="trophy" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Trophies & Progress</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Earn trophies and track milestones as you improve
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="id-badge" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Profile</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Manage your account, preferences, and learning goals
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="credit-card" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Subscription & Payments</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Unlock premium features and manage your plan securely
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#dc2929' }]}>
                <FontAwesome name="shield" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Privacy & Safety</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Review our privacy policy and understand your data rights
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#226cae' }]}>
                <FontAwesome name="black-tie" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>Teacher Dashboard</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Tools for teachers to monitor and support learners
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Contact & Support */}
        <ThemedView style={styles.featureGuide}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="support" size={20} color="#dc2929" />
            <ThemedText style={styles.sectionTitle}>Support & Feedback</ThemedText>
          </View>
          <View style={styles.faqContainer}>
            <ThemedText style={styles.faqAnswer}>
              For any help, grievance, or to share a review, contact us at
              {'\n'}Phone: +91 6204 111 878
              {'\n'}Email: aarambhoffficial@gmail.com
            </ThemedText>
          </View>
        </ThemedView>

        {/* App Info */}
        <ThemedView style={styles.appInfo}>
          <ThemedText style={styles.appName}>Aarambh App</ThemedText>
          <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
          <ThemedText style={styles.copyrightText}>
            © 2025 Aarambh. All rights reserved.
          </ThemedText>
        </ThemedView>
        {/* Bottom spacer for lifted tab bar */}
        <View style={{ height: 58, backgroundColor: '#FFFFFF' }} />
      </ScrollView>
      <ChatButton />
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
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#226cae',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  contactHeader: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: 'rgba(220,41,41,0.2)'
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactLink: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 12,
    padding: 16,
  },
  contactButtonText: {
    marginLeft: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 16,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    borderRadius: 12,
    padding: 16,
  },
  chatButtonText: {
    marginLeft: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 16,
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  faqContainer: {
    gap: 8,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    marginTop: 8,
  },
  featureGuide: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  link: {
    marginTop: 8,
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '600'
  },
  appInfo: {
    alignItems: 'center',
    padding: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});
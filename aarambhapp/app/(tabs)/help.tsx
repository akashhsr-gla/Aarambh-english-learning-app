import { FontAwesome } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HelpScreen() {
  return (
    <View style={styles.container}>
      <Header title="Help" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

        {/* Quick Actions */}
        <ThemedView style={styles.quickActions}>
          <TouchableOpacity style={styles.contactButton}>
            <FontAwesome name="headphones" size={24} color="#FFFFFF" />
            <ThemedText style={styles.contactButtonText}>Contact Support</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatButton}>
            <FontAwesome name="comments" size={24} color="#FFFFFF" />
            <ThemedText style={styles.chatButtonText}>Live Chat</ThemedText>
          </TouchableOpacity>
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
          </View>
        </ThemedView>

        {/* App Info */}
        <ThemedView style={styles.appInfo}>
          <ThemedText style={styles.appName}>Aarambh App</ThemedText>
          <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
          <ThemedText style={styles.copyrightText}>
            © 2024 Aarambh. All rights reserved.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
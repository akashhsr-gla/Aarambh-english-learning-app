import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function PrivacyPolicyScreen() {
  const contactEmail = 'aarambhoffficial@gmail.com';
  const contactPhone = '+916204111878';

  const openEmail = () => Linking.openURL(`mailto:${contactEmail}`);
  const openPhone = () => Linking.openURL(`tel:${contactPhone}`);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <ThemedText style={styles.title}>Privacy Policy</ThemedText>
          <ThemedText style={styles.subtitle}>Effective Date: 29 September 2025</ThemedText>
          <ThemedText style={styles.disclaimer}>
            By using Aarambh and proceeding with payments, you acknowledge that you have read and
            accepted this Privacy Policy. If you do not agree, please discontinue use of the
            application.
          </ThemedText>
        </View>

        <Section title="Who We Are">
          <ThemedText style={styles.p}>
            Aarambh (“we”, “our”, “us”) is a learning and communication platform offering lessons,
            games, live sessions, group discussions, and premium subscriptions. We operate the
            Aarambh mobile application and related services.
          </ThemedText>
        </Section>

        <Section title="Information We Collect">
          <Bullet>Account data: name, email, password (hashed), role (student/teacher).</Bullet>
          <Bullet>Profile data: region, preferences, avatar.</Bullet>
          <Bullet>Usage data: app interactions, feature access, sessions history.</Bullet>
          <Bullet>Content data: messages, group info, game scores where applicable.</Bullet>
          <Bullet>Device data: device model, OS, identifiers permitted by your device.</Bullet>
          <Bullet>
            Payment data: when you purchase a plan, payments are processed by Razorpay. We receive
            limited payment metadata such as order id, payment id, and status; we do not store your
            full card/banking details.
          </Bullet>
          <Bullet>
            Logs and diagnostics: error logs and performance metrics to improve reliability.
          </Bullet>
        </Section>

        <Section title="How We Use Information">
          <Bullet>Provide and maintain services, including authentication and personalization.</Bullet>
          <Bullet>Process subscriptions, verify payments, and manage entitlements.</Bullet>
          <Bullet>Enable features like chats, groups, calls, and learning games.</Bullet>
          <Bullet>Improve performance, troubleshoot issues, and prevent abuse.</Bullet>
          <Bullet>Communicate updates, support responses, and important notices.</Bullet>
          <Bullet>Comply with legal obligations and enforce our terms.</Bullet>
        </Section>

        <Section title="Legal Bases (where applicable)">
          <Bullet>Contract: to deliver the services you request.</Bullet>
          <Bullet>Legitimate interests: to secure, improve, and measure our services.</Bullet>
          <Bullet>Consent: when you opt in to specific features or communications.</Bullet>
          <Bullet>Legal obligation: to comply with law enforcement or regulatory requests.</Bullet>
        </Section>

        <Section title="Payments with Razorpay">
          <ThemedText style={styles.p}>
            We use Razorpay to process payments. When you initiate a purchase, an order is created
            and processed via Razorpay’s SDK/Checkout. We receive confirmations (order id, payment
            id, signature) to verify your payment and activate your subscription. Your sensitive
            payment details are handled by Razorpay and not stored on our servers. For details,
            review Razorpay’s policies on their website.
          </ThemedText>
        </Section>

        <Section title="Data Sharing">
          <Bullet>Payment processors: Razorpay for payment processing and verification.</Bullet>
          <Bullet>Service providers: analytics, infrastructure, and customer support partners.</Bullet>
          <Bullet>Legal/Compliance: when required by law or to protect rights and safety.</Bullet>
          <Bullet>Business transfers: as part of a merger, acquisition, or asset sale.</Bullet>
        </Section>

        <Section title="Data Retention">
          <ThemedText style={styles.p}>
            We retain personal data as long as needed to provide services, comply with legal
            requirements, resolve disputes, and enforce agreements. Payment records are retained per
            statutory requirements.
          </ThemedText>
        </Section>

        <Section title="Your Rights">
          <Bullet>Access, or update certain account information within the app.</Bullet>
          <Bullet>Request copies, correction, or deletion by contacting support.</Bullet>
          <Bullet>Withdraw consent for optional features where consent is the legal basis.</Bullet>
          <Bullet>Object to or restrict certain processing as permitted by law.</Bullet>
        </Section>

        <Section title="Security">
          <ThemedText style={styles.p}>
            We implement technical and organizational measures to protect data, including transport
            encryption and access controls. However, no method is 100% secure; use strong passwords
            and protect your device.
          </ThemedText>
        </Section>

        <Section title="Children’s Privacy">
          <ThemedText style={styles.p}>
            Our services are intended for general audiences. Where required by law, we obtain
            appropriate consent or limit features for younger users.
          </ThemedText>
        </Section>

        <Section title="International Transfers">
          <ThemedText style={styles.p}>
            Your information may be processed in locations outside your state or country. We apply
            protections consistent with this policy and applicable laws.
          </ThemedText>
        </Section>

        <Section title="Updates to This Policy">
          <ThemedText style={styles.p}>
            We may update this policy to reflect changes in our practices or for legal reasons. We
            will indicate the effective date and, where appropriate, notify you in-app.
          </ThemedText>
        </Section>

        <Section title="Contact Us">
          <ThemedText style={styles.p}>For questions or requests, contact:</ThemedText>
          <View style={styles.contactRow}>
            <FontAwesome name="envelope" color="#226cae" size={18} />
            <TouchableOpacity onPress={openEmail}>
              <ThemedText style={styles.link}>{contactEmail}</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <FontAwesome name="phone" color="#dc2929" size={18} />
            <TouchableOpacity onPress={openPhone}>
              <ThemedText style={styles.link}>+91 6204 111 878</ThemedText>
            </TouchableOpacity>
          </View>
        </Section>

        <View style={styles.acceptCard}>
          <FontAwesome name="shield" color="#dc2929" size={20} />
          <ThemedText style={styles.acceptText}>
            By continuing to use the app and completing a purchase, you accept this Privacy Policy.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <ThemedText style={styles.p}>{children}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,108,174,0.15)',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  section: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A37',
    marginBottom: 8,
  },
  sectionBody: {},
  p: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#226cae',
    marginRight: 10,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  link: {
    color: '#0a7ea4',
    fontSize: 15,
    marginLeft: 8,
  },
  acceptCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: 'rgba(220,41,41,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acceptText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
});



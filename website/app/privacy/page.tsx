"use client";

import Link from "next/link";
import React from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-6">
      <h2 className="mb-2 text-xl font-bold text-gray-800">{title}</h2>
      <div className="text-[15px] leading-6 text-gray-700">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-start">
      <span className="mt-2 mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#226cae]" />
      <p className="m-0 text-[15px] leading-6 text-gray-700">{children}</p>
    </div>
  );
}

export default function PrivacyPage() {
  const contactEmail = "aarambhoffficial@gmail.com";
  const contactPhone = "+916204111878";

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 bg-white">
      <div className="mb-4 rounded-2xl border border-[#226cae]/15 bg-[#F8FAFF] p-4">
        <h1 className="text-[28px] font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-1.5 text-sm text-gray-600">Effective Date: 29 September 2025</p>
        <p className="mt-2 text-sm text-gray-700">
          By using Aarambh and proceeding with payments, you acknowledge that you have read and
          accepted this Privacy Policy. If you do not agree, please discontinue use of the
          application.
        </p>
      </div>

      <Section title="Who We Are">
        <p>
          Aarambh (“we”, “our”, “us”) is a learning and communication platform offering lessons,
          games, live sessions, group discussions, and premium subscriptions. We operate the
          Aarambh mobile application and related services.
        </p>
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
        <Bullet>Logs and diagnostics: error logs and performance metrics to improve reliability.</Bullet>
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
        <p>
          We use Razorpay to process payments. When you initiate a purchase, an order is created and
          processed via Razorpay’s SDK/Checkout. We receive confirmations (order id, payment id,
          signature) to verify your payment and activate your subscription. Your sensitive payment
          details are handled by Razorpay and not stored on our servers. For details, review
          Razorpay’s policies on their website.
        </p>
      </Section>

      <Section title="Data Sharing">
        <Bullet>Payment processors: Razorpay for payment processing and verification.</Bullet>
        <Bullet>Service providers: analytics, infrastructure, and customer support partners.</Bullet>
        <Bullet>Legal/Compliance: when required by law or to protect rights and safety.</Bullet>
        <Bullet>Business transfers: as part of a merger, acquisition, or asset sale.</Bullet>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain personal data as long as needed to provide services, comply with legal
          requirements, resolve disputes, and enforce agreements. Payment records are retained per
          statutory requirements.
        </p>
      </Section>

      <Section title="Your Rights">
        <Bullet>Access, or update certain account information within the app.</Bullet>
        <Bullet>Request copies, correction, or deletion by contacting support.</Bullet>
        <Bullet>Withdraw consent for optional features where consent is the legal basis.</Bullet>
        <Bullet>Object to or restrict certain processing as permitted by law.</Bullet>
      </Section>

      <Section title="Security">
        <p>
          We implement technical and organizational measures to protect data, including transport
          encryption and access controls. However, no method is 100% secure; use strong passwords and
          protect your device.
        </p>
      </Section>

      <Section title="Children’s Privacy">
        <p>
          Our services are intended for general audiences. Where required by law, we obtain
          appropriate consent or limit features for younger users.
        </p>
      </Section>

      <Section title="International Transfers">
        <p>
          Your information may be processed in locations outside your state or country. We apply
          protections consistent with this policy and applicable laws.
        </p>
      </Section>

      <Section title="Updates to This Policy">
        <p>
          We may update this policy to reflect changes in our practices or for legal reasons. We
          will indicate the effective date and, where appropriate, notify you in-app.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>For questions or requests, contact:</p>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <span aria-hidden className="text-[#226cae]">✉️</span>
            <Link href={`mailto:${contactEmail}`} className="text-[#0a7ea4]">
              {contactEmail}
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <span aria-hidden className="text-[#dc2929]">📞</span>
            <Link href={`tel:${contactPhone}`} className="text-[#0a7ea4]">
              +91 6204 111 878
            </Link>
          </div>
        </div>
      </Section>

      <div className="mt-5 flex items-center space-x-2 rounded-xl border border-[#dc2929]/20 bg-[#FFF5F5] p-4">
        <span aria-hidden className="text-[#dc2929]">🛡️</span>
        <p className="m-0 text-sm text-gray-700">
          By continuing to use the app and completing a purchase, you accept this Privacy Policy.
        </p>
      </div>
    </main>
  );
}



'use client'

import { motion } from 'framer-motion'
import { Download, Smartphone, Star, Users, Award, CheckCircle } from 'lucide-react'
import Image from 'next/image'

const DownloadSection = () => {
  const appStores = [
    {
      name: 'Google Play Store',
      icon: '📱',
      link: '#',
      rating: '4.8',
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Apple App Store',
      icon: '🍎',
      link: '#',
      rating: '4.9',
      color: 'from-blue-500 to-blue-600'
    }
  ]

  const features = [
    {
      icon: Smartphone,
      title: "Cross-Platform",
      description: "Available on iOS and Android devices"
    },
    {
      icon: Star,
      title: "Free to Start",
      description: "No hidden costs, start learning today"
    },
    {
      icon: Users,
      title: "Community",
      description: "Join thousands of learners worldwide"
    },
    {
      icon: Award,
      title: "Certified",
      description: "Trusted by educational institutions"
    }
  ]

  const highlights = [
    "AI-powered conversation practice",
    "Real-time pronunciation feedback",
    "Interactive learning games",
    "Progress tracking & achievements",
    "Group discussion sessions",
    "Expert-curated lesson plans"
  ]

  return (
    <section id="download" className="section-padding bg-gradient-to-br from-red-50 to-blue-50">
      <div className="container-max">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Download <span className="text-gradient">Aarambh</span> Today
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Start your English learning journey with our revolutionary app. 
            Available on all major platforms with a seamless learning experience designed for everyone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Content - App Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* App Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="text-4xl font-bold text-gradient-red mb-3">4.8★</div>
                <div className="text-gray-600 font-medium">App Rating</div>
                <div className="text-sm text-gray-500 mt-2">Based on 2,500+ reviews</div>
              </div>
              <div className="text-center bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="text-4xl font-bold text-gradient-blue mb-3">15K+</div>
                <div className="text-gray-600 font-medium">Active Users</div>
                <div className="text-sm text-gray-500 mt-2">Worldwide learners</div>
              </div>
            </div>

            {/* App Highlights */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">What You'll Get</h3>
              <div className="grid grid-cols-2 gap-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium text-sm">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="space-y-4">
              {appStores.map((store, index) => (
                <motion.a
                  key={store.name}
                  href={store.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-between bg-gradient-to-r ${store.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{store.icon}</div>
                    <div>
                      <div className="font-semibold text-lg">{store.name}</div>
                      <div className="text-sm opacity-90">
                        {store.rating} ★ Rating
                      </div>
                    </div>
                  </div>
                  <Download size={24} className="opacity-90" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Right Content - App Screenshots */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Screenshot - Home Screen */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="aspect-16-9-large"
            >
              <Image
                src="/home.png"
                alt="Aarambh App Home Screen"
                width={288}
                height={384}
                className="w-full h-full object-cover rounded-3xl"
              />
            </motion.div>

            {/* Floating Screenshots */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -top-8 -right-8"
            >
              <div className="aspect-16-9-small">
                <Image
                  src="/signin.png"
                  alt="Sign In Screen"
                  width={96}
                  height={128}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-8 -left-8"
            >
              <div className="aspect-16-9-small">
                <Image
                  src="/games.png"
                  alt="Games Screen"
                  width={96}
                  height={128}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 -right-16"
            >
              <div className="aspect-16-9-tiny">
                <Image
                  src="/callthem.png"
                  alt="Call Screen"
                  width={80}
                  height={112}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 -left-16"
            >
              <div className="aspect-16-9-tiny">
                <Image
                  src="/talktopeopleandlearnenglish.png"
                  alt="Chat Screen"
                  width={80}
                  height={112}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-red-500 to-blue-500 rounded-3xl p-12 text-white">
            <h3 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your English Skills?
            </h3>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Join thousands of learners who have already improved their English with Aarambh. 
              Download now and take the first step towards your goals.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-red-500 px-10 py-5 rounded-full font-semibold text-xl hover:shadow-2xl transition-all duration-200"
            >
              Download Now - It's Free!
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default DownloadSection 
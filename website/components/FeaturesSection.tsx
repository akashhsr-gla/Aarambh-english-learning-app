'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Phone, Users, BookOpen, Trophy, Target, Globe, Zap, Heart, Shield, Star, Award, Mic, Video, Gamepad2 } from 'lucide-react'
import Image from 'next/image'

const FeaturesSection = () => {
  const mainFeatures = [
    {
      icon: MessageCircle,
      title: "Chat in English",
      description: "Practice real conversations with AI-powered chat system. Improve your written English skills through interactive dialogues with intelligent responses.",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      screenshot: "/talktopeopleandlearnenglish.png",
      details: [
        "AI-powered conversation partner",
        "Real-time grammar correction",
        "Vocabulary building exercises",
        "Contextual learning scenarios"
      ]
    },
    {
      icon: Phone,
      title: "Call in English",
      description: "Enhance your speaking skills with voice practice. Get real-time feedback on pronunciation and fluency through voice calls.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      screenshot: "/callthem.png",
      details: [
        "Voice-based learning sessions",
        "Pronunciation feedback",
        "Speaking confidence building",
        "Real conversation practice"
      ]
    },
    {
      icon: Users,
      title: "Group Discussions",
      description: "Join group discussions with other learners. Practice speaking in a supportive community environment with peers.",
      color: "from-red-500 to-blue-600",
      bgColor: "bg-gradient-to-br from-red-50 to-blue-50",
      screenshot: "/joinandcreategroupdiscussions.png",
      details: [
        "Multi-participant discussions",
        "Topic-based conversations",
        "Peer learning opportunities",
        "Community building"
      ]
    },
    {
      icon: Gamepad2,
      title: "Interactive Games",
      description: "Learn through engaging games designed for different skill levels. Make learning fun with gamified experiences.",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      screenshot: "/games.png",
      details: [
        "Word puzzles and challenges",
        "Grammar quizzes",
        "Pronunciation games",
        "Progress tracking"
      ]
    },
    {
      icon: Trophy,
      title: "Achievements & Leaderboards",
      description: "Stay motivated with daily challenges and achievements. Track your progress and compete with other learners.",
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-50",
      screenshot: "/leaderboardgames.png",
      details: [
        "Daily challenges",
        "Achievement badges",
        "Leaderboard rankings",
        "Progress milestones"
      ]
    },
    {
      icon: BookOpen,
      title: "Structured Lessons",
      description: "Follow comprehensive lesson plans designed by experts. Learn systematically with progressive difficulty levels.",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      screenshot: "/structuredlessoon.png",
      details: [
        "Expert-curated content",
        "Progressive difficulty",
        "Comprehensive curriculum",
        "Regular assessments"
      ]
    }
  ]

  const benefits = [
    {
      icon: Globe,
      title: "Global Opportunities",
      description: "Open doors to international career opportunities with improved English skills. Connect with people worldwide."
    },
    {
      icon: Zap,
      title: "Fast Learning",
      description: "Accelerate your learning with proven methods and interactive content. See results in weeks, not months."
    },
    {
      icon: Heart,
      title: "Affordable Education",
      description: "Quality education accessible to everyone, regardless of financial background. No expensive courses needed."
    },
    {
      icon: Shield,
      title: "Safe Learning Environment",
      description: "Learn in a supportive environment without fear of judgment or criticism. Build confidence gradually."
    }
  ]

  return (
    <section id="features" className="section-padding bg-gradient-to-br from-gray-50 to-white">
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
            Powerful Features for{' '}
            <span className="text-gradient">Effective Learning</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Aarambh combines cutting-edge technology with proven learning methodologies 
            to provide you with the most effective English learning experience. 
            Every feature is designed to make learning engaging, accessible, and results-driven.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={`${feature.bgColor} rounded-3xl p-8 card-hover border border-gray-100`}>
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <feature.icon size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                    
                    {/* Feature Details */}
                    <div className="space-y-3 mb-6">
                      {feature.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Screenshot if available */}
                    {feature.screenshot && (
                      <div className="mt-6">
                        <div className="aspect-16-9-medium">
                          <Image
                            src={feature.screenshot}
                            alt={`${feature.title} Screenshot`}
                            width={192}
                            height={256}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-5xl font-bold mb-8">
            Why Choose <span className="text-gradient">Aarambh</span>?
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Our platform is designed to make English learning accessible, effective, and enjoyable for everyone.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-white rounded-3xl p-8 shadow-lg card-hover border border-gray-100"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <benefit.icon size={40} className="text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">{benefit.title}</h4>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* App Screenshots Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-5xl font-bold mb-8">
            Experience the <span className="text-gradient">Real App</span>
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            See how Aarambh transforms English learning with its intuitive interface and powerful features.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* Home Screen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="aspect-16-9-medium mb-6">
              <Image
                src="/home.png"
                alt="Home Screen"
                width={192}
                height={256}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Home Dashboard</h4>
            <p className="text-gray-600">Welcome screen with quick access to all features</p>
          </motion.div>

          {/* Sign In Screen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="aspect-16-9-medium mb-6">
              <Image
                src="/signin.png"
                alt="Sign In Screen"
                width={192}
                height={256}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Easy Sign In</h4>
            <p className="text-gray-600">Simple authentication for students and teachers</p>
          </motion.div>

          {/* Games Screen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="aspect-16-9-medium mb-6">
              <Image
                src="/games.png"
                alt="Games Screen"
                width={192}
                height={256}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Learning Games</h4>
            <p className="text-gray-600">Interactive games to make learning fun</p>
          </motion.div>
        </div>

        {/* Call to Action */}
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
              Download the app today and take the first step towards your goals.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-red-500 px-10 py-5 rounded-full font-semibold text-xl hover:shadow-2xl transition-all duration-200"
            >
              Start Learning Today
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturesSection 
'use client'

import { motion } from 'framer-motion'
import { Download, Play, Star, Users, Award, MessageCircle, Phone } from 'lucide-react'
import Image from 'next/image'

const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center gradient-bg-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-red-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container-max relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30"
            >
              <Star className="w-5 h-5 text-yellow-500 fill-current" />

            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
            >
              Master English &{' '}
              <span className="text-gradient">Soft Skills</span>
              <br />
              <span className="text-4xl md:text-6xl text-gray-700">
                with Aarambh
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl leading-relaxed"
            >
              Empowering individuals with essential English language skills and soft skills. 
              Affordable, accessible, and effective learning for everyone, regardless of background.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center justify-center space-x-3"
              >
                <Download size={24} />
                <span>Download Now</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline flex items-center justify-center space-x-3"
              >
                <Play size={24} />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12"
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-gradient-red mb-2">10K+</div>
                <div className="text-gray-600 font-medium">Active Learners</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-gradient-blue mb-2">4.8★</div>
                <div className="text-gray-600 font-medium">App Rating</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-gradient-red mb-2">50+</div>
                <div className="text-gray-600 font-medium">Lessons</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - App Screenshots */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
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

            {/* Floating App Screenshots */}
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
      </div>
    </section>
  )
}

export default HeroSection 
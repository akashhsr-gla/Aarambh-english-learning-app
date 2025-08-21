'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Award, Heart, Target, Users, Globe, Star, BookOpen, Lightbulb } from 'lucide-react'
import Image from 'next/image'

const AboutFounderSection = () => {
  const achievements = [
    {
      icon: GraduationCap,
      title: "Chemical Engineering",
      description: "Qualified JEE Mains, Panjab University",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Making education accessible to everyone",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Heart,
      title: "Empathetic Teacher",
      description: "Understands the struggles of learners",
      color: "from-red-500 to-blue-500"
    }
  ]

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "Building a supportive learning community where everyone feels welcome and valued."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Creating opportunities for learners worldwide to access quality education."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering the highest quality learning experience possible."
    }
  ]

  const teachingApproach = [
    "Explains complex concepts in simple terms",
    "Uses real-life examples and scenarios",
    "Creates a supportive learning environment",
    "Focuses on practical application",
    "Encourages continuous improvement",
    "Builds confidence through small wins"
  ]

  return (
    <section id="about" className="section-padding bg-white">
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
            Meet the <span className="text-gradient">Founder</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            The visionary behind Aarambh - transforming lives through accessible education. 
            A story of determination, empathy, and the power of technology to bridge educational gaps.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Founder Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-blue-500/20 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                <Image
                  src="/dounders image.jpg"
                  alt="Omprakash Prajapati - Founder of Aarambh"
                  width={500}
                  height={600}
                  className="rounded-2xl w-full h-auto object-cover"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-bold text-gradient mb-2">Omprakash Prajapati</h3>
                  <p className="text-gray-600 font-medium">Founder & CEO, Aarambh</p>
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-500">Visionary Educator & Tech Innovator</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Founder Story */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-8">
                From the Rural Landscape to <span className="text-gradient">Big Changes</span>
              </h3>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                <p>
                  Omprakash Prajapati grew up just like many of us—simple beginnings, Hindi medium school, 
                  and a bunch of struggles with English. Talking in English wasn't easy for him, and sometimes 
                  people judged him for it. But instead of giving up, he decided to turn things around.
                </p>
                <p>
                  He worked really hard and cracked the <strong className="text-red-500">JEE Mains</strong>, landing a seat in chemical 
                  engineering at <strong className="text-blue-500">Panjab University</strong>. Even then, the whole English-speaking thing 
                  was tough. But those tough days made him realize how many others must be feeling the same.
                </p>
                <p>
                  That's why he started <strong className="text-gradient">Aarambh</strong>—an app where anyone can learn English and 
                  soft skills, no matter where they come from.
                </p>
              </div>
            </div>

            {/* What Makes Him Special */}
            <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-3xl p-8 border border-gray-100">
              <h4 className="text-2xl font-bold mb-6 text-gradient flex items-center space-x-3">
                <Lightbulb className="w-8 h-8" />
                <span>What Makes Omprakash Special?</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {teachingApproach.map((approach, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 font-medium">{approach}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* His Mission */}
            <div className="bg-gradient-to-r from-red-500 to-blue-500 rounded-3xl p-8 text-white">
              <h4 className="text-2xl font-bold mb-4 flex items-center space-x-3">
                <Target className="w-8 h-8" />
                <span>His Mission</span>
              </h4>
              <p className="text-lg leading-relaxed opacity-90">
                Omprakash isn't just teaching English—he's helping people feel confident and ready to grab 
                new opportunities. If you're looking to improve your skills and want someone who truly gets 
                your journey, you're in the right place with Aarambh.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-white rounded-3xl p-8 shadow-lg card-hover border border-gray-100"
            >
              <div className={`w-20 h-20 bg-gradient-to-r ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <achievement.icon size={40} className="text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800">{achievement.title}</h4>
              <p className="text-gray-600">{achievement.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-5xl font-bold mb-8">
            Our <span className="text-gradient">Values</span>
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            The principles that guide everything we do at Aarambh
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-gradient-to-br from-red-50 to-blue-50 rounded-3xl p-8 border border-gray-100"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <value.icon size={40} className="text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">{value.title}</h4>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-red-500 to-blue-500 rounded-3xl p-12 text-white">
            <h3 className="text-3xl md:text-5xl font-bold mb-6">
              Join Omprakash's Mission
            </h3>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Be part of a community that believes in the power of accessible education. 
              Start your journey with someone who truly understands your challenges.
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

export default AboutFounderSection 
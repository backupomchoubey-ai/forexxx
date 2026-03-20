import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { MessageCircle, Mail, HelpCircle, FileText, ArrowRight } from 'lucide-react'

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Instant support from our team',
    action: 'Start Chat',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Response within 24 hours',
    action: 'Send Email',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Browse our knowledge base',
    action: 'Visit Center',
  },
  {
    icon: FileText,
    title: 'FAQs',
    description: 'Find quick answers',
    action: 'View FAQs',
  },
]

export default function Support() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="support" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-burgundy-dark to-gray-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-burgundy/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-crimson/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-white/10 text-white rounded-full text-sm font-semibold mb-4"
          >
            Support
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Need Help? We're Here
            <span className="block text-crimson-light">24/7</span>
          </motion.h2>
        </motion.div>

        {/* Support Options Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              {/* Icon with pulse animation */}
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-burgundy to-crimson flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 10 }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(212, 26, 51, 0)',
                    '0 0 0 15px rgba(212, 26, 51, 0.2)',
                    '0 0 0 0 rgba(212, 26, 51, 0)',
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  },
                }}
              >
                <option.icon className="w-7 h-7 text-white" />
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">
                {option.title}
              </h3>
              <p className="text-white/70 text-sm mb-4">
                {option.description}
              </p>

              <motion.div
                className="flex items-center gap-2 text-crimson-light font-semibold text-sm"
                whileHover={{ x: 5 }}
              >
                {option.action}
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

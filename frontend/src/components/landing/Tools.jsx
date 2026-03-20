import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { BarChart3, Calendar, LineChart, Shield, History, Bot, ArrowRight } from 'lucide-react'

const tools = [
  {
    icon: BarChart3,
    title: 'Advanced Charting',
    description: 'Professional-grade charts with 50+ technical indicators and drawing tools.',
  },
  {
    icon: Calendar,
    title: 'Economic Calendar',
    description: 'Stay ahead of market-moving events with real-time economic data.',
  },
  {
    icon: LineChart,
    title: 'Market Analysis',
    description: 'Daily market insights and technical analysis from expert traders.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Advanced risk tools including stop-loss, take-profit, and margin alerts.',
  },
  {
    icon: History,
    title: 'Trade History',
    description: 'Detailed analytics and reporting to track your trading performance.',
  },
  {
    icon: Bot,
    title: 'Automated Trading',
    description: 'Build and deploy trading algorithms with our API and automation tools.',
  },
]

export default function Tools() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="tools" className="py-24 relative overflow-hidden bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 left-0 w-72 h-72 bg-burgundy/5 dark:bg-burgundy/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 right-0 w-96 h-96 bg-crimson/5 dark:bg-crimson/10 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
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
            className="inline-block px-4 py-2 bg-burgundy/10 text-burgundy dark:text-crimson-light rounded-full text-sm font-semibold mb-4"
          >
            Tools & Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
          >
            Everything You Need to
            <span className="gradient-text block">Trade Smarter</span>
          </motion.h2>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Icon with pulse animation */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-burgundy to-crimson flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1 }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(108, 14, 42, 0)',
                    '0 0 0 10px rgba(108, 14, 42, 0.1)',
                    '0 0 0 0 rgba(108, 14, 42, 0)',
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
                <tool.icon className="w-6 h-6 text-white" />
              </motion.div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-burgundy dark:group-hover:text-crimson-light transition-colors">
                {tool.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {tool.description}
              </p>

              {/* Hover arrow */}
              <motion.div
                className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <ArrowRight className="w-5 h-5 text-burgundy dark:text-crimson-light" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

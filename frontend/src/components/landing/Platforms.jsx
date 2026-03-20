import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Monitor, Smartphone, Laptop, Check, ArrowRight } from 'lucide-react'

const platforms = [
  {
    icon: Monitor,
    title: 'Web Trader',
    description: 'No download required',
    features: ['One-click trading', 'Advanced indicators', 'Multi-chart layout', 'Risk management tools'],
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    description: 'Trade on the go',
    features: ['Push notifications', 'Biometric login', 'Quick deposits', 'Portfolio tracking'],
  },
  {
    icon: Laptop,
    title: 'Desktop Terminal',
    description: 'Advanced trading features',
    features: ['Algorithmic trading', 'Custom scripts', 'Depth of market', 'Advanced order types'],
  },
]

export default function Platforms() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="platforms" className="py-24 relative overflow-hidden bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-72 h-72 bg-burgundy/5 dark:bg-burgundy/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-96 h-96 bg-crimson/5 dark:bg-crimson/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
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
            Platforms
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
          >
            Powerful Platforms.
            <span className="gradient-text block">Seamless Experience.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Trade anytime, anywhere using our advanced platforms built for speed and reliability.
          </motion.p>
        </motion.div>

        {/* Platforms Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-burgundy/5 to-crimson/5 dark:from-burgundy/10 dark:to-crimson/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              {/* Icon with bounce animation */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-burgundy to-crimson flex items-center justify-center mb-6 relative z-10"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -10, 10, 0],
                }}
                transition={{ duration: 0.5 }}
              >
                <platform.icon className="w-8 h-8 text-white" />
              </motion.div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-burgundy dark:group-hover:text-crimson-light transition-colors">
                  {platform.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{platform.description}</p>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {platform.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                    >
                      <div className="w-5 h-5 bg-gradient-to-br from-burgundy to-crimson rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  className="flex items-center gap-2 text-burgundy dark:text-crimson-light font-semibold group/btn"
                  whileHover={{ x: 5 }}
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

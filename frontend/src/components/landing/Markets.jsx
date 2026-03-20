import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { DollarSign, BarChart2, Gem, Bitcoin, Building2, ArrowRight } from 'lucide-react'

const markets = [
  {
    icon: DollarSign,
    title: 'Forex',
    description: 'Major, minor & exotic pairs',
    pairs: '80+ Pairs',
    color: 'from-burgundy to-crimson',
  },
  {
    icon: BarChart2,
    title: 'Indices',
    description: 'Trade global stock indices',
    pairs: '15+ Indices',
    color: 'from-crimson to-burgundy',
  },
  {
    icon: Gem,
    title: 'Commodities',
    description: 'Gold, silver, oil & more',
    pairs: '20+ Assets',
    color: 'from-burgundy to-crimson',
  },
  {
    icon: Bitcoin,
    title: 'Crypto',
    description: 'Digital asset CFDs',
    pairs: '50+ Cryptos',
    color: 'from-crimson to-burgundy',
  },
  {
    icon: Building2,
    title: 'Shares',
    description: 'Top global companies',
    pairs: '300+ Stocks',
    color: 'from-burgundy to-crimson',
  },
]

export default function Markets() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="markets" className="py-24 relative overflow-hidden dark:bg-gray-950 transition-colors duration-500">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-burgundy/5 dark:from-burgundy/10 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
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
            Markets
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
          >
            Trade Multiple Markets
            <span className="gradient-text block">in One Place</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Diversify your portfolio with access to a wide range of global financial instruments.
          </motion.p>
        </motion.div>

        {/* Markets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {markets.map((market, index) => (
            <motion.div
              key={market.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${market.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`}
              />

              {/* Icon with continuous rotation on hover */}
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${market.color} flex items-center justify-center mb-6`}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <market.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-burgundy dark:group-hover:text-crimson-light transition-colors">
                {market.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{market.description}</p>
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {market.pairs}
              </div>

              {/* Arrow indicator */}
              <motion.div
                className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <ArrowRight className="w-6 h-6 text-burgundy dark:text-crimson-light" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

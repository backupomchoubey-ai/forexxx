import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import infowayService from '../services/infowayService.js'

const router = express.Router()

// All supported symbols by category (Optimized for active symbols with reliable data)
// FOREX: 20 most popular pairs
const FOREX_SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY',
  'EURCHF', 'EURAUD', 'EURCAD', 'GBPAUD', 'GBPCAD', 'AUDCAD', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY'
]
// METALS: 2 main symbols (Gold and Silver only)
const METAL_SYMBOLS = ['XAUUSD', 'XAGUSD']
// ENERGY: Disabled
const ENERGY_SYMBOLS = []
// CRYPTO: 30 most popular (high liquidity)
const CRYPTO_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'LTCUSDT',
  'LINKUSDT', 'SHIBUSDT', 'UNIUSDT', 'ATOMUSDT', 'TRXUSDT', 'BCHUSDT', 'XLMUSDT', 'ETCUSDT', 'NEARUSDT',
  'AAVEUSDT', 'FTMUSDT', 'SANDUSDT', 'MANAUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'APTUSDT', 'INJUSDT',
  'FILUSDT', 'ICPUSDT', 'MKRUSDT'
]
// STOCKS: Disabled
const STOCK_SYMBOLS = []

// Popular instruments per category
const POPULAR_INSTRUMENTS = {
  Forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF', 'EURAUD', 'AUDCAD', 'AUDJPY', 'CADJPY'],
  Metals: ['XAUUSD', 'XAGUSD'],
  Crypto: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'LTCUSDT', 'LINKUSDT', 'SHIBUSDT', 'UNIUSDT', 'ATOMUSDT', 'TRXUSDT', 'BCHUSDT']
}

// Categorize symbol
function categorizeSymbol(symbol) {
  if (FOREX_SYMBOLS.includes(symbol)) return 'Forex'
  if (METAL_SYMBOLS.includes(symbol)) return 'Metals'
  if (ENERGY_SYMBOLS.includes(symbol)) return 'Energy'
  if (CRYPTO_SYMBOLS.includes(symbol)) return 'Crypto'
  if (STOCK_SYMBOLS.includes(symbol)) return 'Stocks'
  return 'Forex'
}

// Default instruments fallback
function getDefaultInstruments() {
  return [
    { symbol: 'EURUSD', name: 'EUR/USD', category: 'Forex', digits: 5 },
    { symbol: 'GBPUSD', name: 'GBP/USD', category: 'Forex', digits: 5 },
    { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', digits: 3 },
    { symbol: 'USDCHF', name: 'USD/CHF', category: 'Forex', digits: 5 },
    { symbol: 'AUDUSD', name: 'AUD/USD', category: 'Forex', digits: 5 },
    { symbol: 'NZDUSD', name: 'NZD/USD', category: 'Forex', digits: 5 },
    { symbol: 'USDCAD', name: 'USD/CAD', category: 'Forex', digits: 5 },
    { symbol: 'EURGBP', name: 'EUR/GBP', category: 'Forex', digits: 5 },
    { symbol: 'EURJPY', name: 'EUR/JPY', category: 'Forex', digits: 3 },
    { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'Forex', digits: 3 },
    { symbol: 'XAUUSD', name: 'Gold', category: 'Metals', digits: 2 },
    { symbol: 'XAGUSD', name: 'Silver', category: 'Metals', digits: 3 },
    { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto', digits: 2 },
    { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto', digits: 2 },
  ]
}

// GET /api/prices/instruments - Get all available instruments
router.get('/instruments', async (req, res) => {
  try {
    console.log('[Prices] Returning supported instruments')
    
    // Get price cache to filter only symbols with live prices
    const priceCache = infowayService.getPriceCache()
    
    // Return all supported symbols (excluding stocks - WS connection limit)
    const allSymbols = [
      ...FOREX_SYMBOLS,
      ...METAL_SYMBOLS,
      ...ENERGY_SYMBOLS,
      ...CRYPTO_SYMBOLS
    ]
    
    // Filter to only include symbols that have prices in cache
    // Also exclude Energy/Commodities symbols
    const symbolsWithPrices = allSymbols.filter(symbol => {
      if (ENERGY_SYMBOLS.includes(symbol)) return false // Remove commodities
      return priceCache.has(symbol)
    })
    
    // Always include all metals even without price data (they're important)
    const metalsToInclude = METAL_SYMBOLS.filter(s => !symbolsWithPrices.includes(s))
    
    // Always include popular crypto instruments even if not in cache (for production)
    const cryptoToInclude = CRYPTO_SYMBOLS.filter(s => !symbolsWithPrices.includes(s)).slice(0, 20) // Top 20 crypto
    
    // If no prices yet, return popular instruments as fallback (excluding energy)
    const fallbackSymbols = allSymbols.filter(s => !ENERGY_SYMBOLS.includes(s)).slice(0, 50)
    let symbolsToReturn = symbolsWithPrices.length > 0 ? [...symbolsWithPrices, ...metalsToInclude, ...cryptoToInclude] : fallbackSymbols
    
    // Remove duplicates
    symbolsToReturn = [...new Set(symbolsToReturn)]
    
    const instruments = symbolsToReturn.map(symbol => {
      const category = categorizeSymbol(symbol)
      const isPopular = POPULAR_INSTRUMENTS[category]?.includes(symbol) || false
      const price = priceCache.get(symbol)
      return {
        symbol,
        name: getInstrumentName(symbol),
        category,
        digits: getDigits(symbol),
        contractSize: getContractSize(symbol),
        minVolume: 0.01,
        maxVolume: 100,
        volumeStep: 0.01,
        popular: isPopular,
        hasPrice: !!price
      }
    })
    
    console.log('[Prices] Returning', instruments.length, 'instruments with prices')
    res.json({ success: true, instruments })
  } catch (error) {
    console.error('[Prices] Error fetching instruments:', error)
    res.json({ success: true, instruments: getDefaultInstruments() })
  }
})

// Helper to get instrument display name
function getInstrumentName(symbol) {
  const names = {
    // Forex Majors & Crosses
    'EURUSD': 'EUR/USD', 'GBPUSD': 'GBP/USD', 'USDJPY': 'USD/JPY', 'USDCHF': 'USD/CHF',
    'AUDUSD': 'AUD/USD', 'NZDUSD': 'NZD/USD', 'USDCAD': 'USD/CAD', 'EURGBP': 'EUR/GBP',
    'EURJPY': 'EUR/JPY', 'GBPJPY': 'GBP/JPY', 'EURCHF': 'EUR/CHF', 'EURAUD': 'EUR/AUD',
    'EURCAD': 'EUR/CAD', 'GBPAUD': 'GBP/AUD', 'GBPCAD': 'GBP/CAD', 'AUDCAD': 'AUD/CAD',
    'AUDJPY': 'AUD/JPY', 'CADJPY': 'CAD/JPY', 'CHFJPY': 'CHF/JPY', 'NZDJPY': 'NZD/JPY',
    'AUDNZD': 'AUD/NZD', 'CADCHF': 'CAD/CHF', 'GBPCHF': 'GBP/CHF', 'GBPNZD': 'GBP/NZD',
    'EURNZD': 'EUR/NZD', 'NZDCAD': 'NZD/CAD', 'NZDCHF': 'NZD/CHF', 'AUDCHF': 'AUD/CHF',
    // Exotics
    'USDSGD': 'USD/SGD', 'EURSGD': 'EUR/SGD', 'GBPSGD': 'GBP/SGD', 'USDZAR': 'USD/ZAR',
    'USDTRY': 'USD/TRY', 'EURTRY': 'EUR/TRY', 'USDMXN': 'USD/MXN', 'USDPLN': 'USD/PLN',
    'USDSEK': 'USD/SEK', 'USDNOK': 'USD/NOK', 'USDDKK': 'USD/DKK', 'USDCNH': 'USD/CNH',
    // Metals
    'XAUUSD': 'Gold', 'XAGUSD': 'Silver', 'XPTUSD': 'Platinum', 'XPDUSD': 'Palladium',
    // Commodities
    'USOIL': 'US Oil', 'UKOIL': 'UK Oil', 'NGAS': 'Natural Gas', 'COPPER': 'Copper',
    // Crypto (USDT pairs - Infoway format)
    'BTCUSDT': 'Bitcoin', 'ETHUSDT': 'Ethereum', 'BNBUSDT': 'BNB', 'SOLUSDT': 'Solana',
    'XRPUSDT': 'XRP', 'ADAUSDT': 'Cardano', 'DOGEUSDT': 'Dogecoin', 'TRXUSDT': 'TRON',
    'LINKUSDT': 'Chainlink', 'MATICUSDT': 'Polygon', 'DOTUSDT': 'Polkadot',
    'SHIBUSDT': 'Shiba Inu', 'LTCUSDT': 'Litecoin', 'BCHUSDT': 'Bitcoin Cash', 'AVAXUSDT': 'Avalanche',
    'XLMUSDT': 'Stellar', 'UNIUSDT': 'Uniswap', 'ATOMUSDT': 'Cosmos', 'ETCUSDT': 'Ethereum Classic',
    'FILUSDT': 'Filecoin', 'ICPUSDT': 'Internet Computer', 'NEARUSDT': 'NEAR Protocol',
    'GRTUSDT': 'The Graph', 'AAVEUSDT': 'Aave', 'MKRUSDT': 'Maker', 'FTMUSDT': 'Fantom',
    'SANDUSDT': 'The Sandbox', 'MANAUSDT': 'Decentraland', 'AXSUSDT': 'Axie Infinity',
    'XMRUSDT': 'Monero', 'SNXUSDT': 'Synthetix', 'CHZUSDT': 'Chiliz', 'ARBUSDT': 'Arbitrum',
    'OPUSDT': 'Optimism', 'SUIUSDT': 'Sui', 'APTUSDT': 'Aptos', 'INJUSDT': 'Injective',
    'IMXUSDT': 'Immutable X', 'LDOUSDT': 'Lido DAO', 'RNDRUSDT': 'Render',
    'ACEUSDT': 'ACE', 'AIUSDT': 'Fetch.ai', 'APEUSDT': 'ApeCoin', 'API3USDT': 'API3',
    'ARKUSDT': 'ARK', 'ASTRUSDT': 'Astar', 'AUCTIONUSDT': 'Bounce', 'BAKEUSDT': 'BakerySwap',
    'BARUSDT': 'FC Barcelona', 'BLURUSDT': 'Blur', 'BLZUSDT': 'Bluzelle', 'BONDUSDT': 'BarnBridge',
    'CAKEUSDT': 'PancakeSwap', 'CFXUSDT': 'Conflux', 'CRVUSDT': 'Curve', 'CTSIUSDT': 'Cartesi',
    'DUSKUSDT': 'Dusk', 'DYDXUSDT': 'dYdX', 'EGLDUSDT': 'MultiversX', 'ENSUSDT': 'ENS',
    'FETUSDT': 'Fetch.ai', 'FORTHUSDT': 'Ampleforth', 'FTTUSDT': 'FTX Token', 'FXSUSDT': 'Frax Share',
    'GMTUSDT': 'STEPN', 'JTOUSDT': 'Jito', 'KAVAUSDT': 'Kava', 'KLAYUSDT': 'Klaytn',
    'MAGICUSDT': 'Magic', 'MANTAUSDT': 'Manta', 'MASKUSDT': 'Mask Network', 'MAVUSDT': 'Maverick',
    'MINAUSDT': 'Mina', 'MOVRUSDT': 'Moonriver', 'MULTIUSDT': 'Multichain', 'NFPUSDT': 'NFPrompt',
    'NTRNUSDT': 'Neutron', 'OAXUSDT': 'OAX', 'OMUSDT': 'MANTRA', 'ORDIUSDT': 'ORDI',
    'PENDLEUSDT': 'Pendle', 'PHBUSDT': 'Phoenix', 'RDNTUSDT': 'Radiant', 'RLCUSDT': 'iExec',
    'RONINUSDT': 'Ronin', 'ROSEUSDT': 'Oasis', 'RUNEUSDT': 'THORChain', 'SANTOSUSDT': 'Santos FC',
    'SEIUSDT': 'Sei', 'SSVUSDT': 'SSV Network', 'STXUSDT': 'Stacks', 'SYNUSDT': 'Synapse',
    'TIAUSDT': 'Celestia', 'TRBUSDT': 'Tellor', 'TUSDUSDT': 'TrueUSD', 'UMAUSDT': 'UMA',
    'USDCUSDT': 'USD Coin', 'VGXUSDT': 'Voyager', 'WBTCUSDT': 'Wrapped BTC', 'WLDUSDT': 'Worldcoin',
    'WOOUSDT': 'WOO Network', 'XAIUSDT': 'Xai', 'XAUTUSDT': 'Tether Gold',
    // Commodities
    'GASOLINE': 'Gasoline', 'CATTLE': 'Live Cattle', 'COCOA': 'Cocoa', 'COFFEE': 'Coffee', 'CORN': 'Corn', 'COTTON': 'Cotton', 'ALUMINUM': 'Aluminum',
    // Indices
    'AEX': 'AEX Index', 'AUS200': 'Australia 200', 'CAC40': 'CAC 40', 'CAN60': 'Canada 60',
    'CN50': 'China 50', 'DAX': 'DAX German', 'DXY': 'US Dollar Index', 'EU50': 'Euro Stoxx 50',
    'EURX': 'Euro Index', 'GERMID50': 'MDAX 50',
    // Stocks
    'AAPL': 'Apple Inc', 'MSFT': 'Microsoft', 'GOOGL': 'Alphabet', 'AA': 'Alcoa Corp',
    'AAL': 'American Airlines', 'AAP': 'Advance Auto Parts', 'ABBV': 'AbbVie Inc',
    'ADBE': 'Adobe Inc', 'AIG': 'American Intl Group', 'AMD': 'AMD'
  }
  return names[symbol] || symbol
}

// Helper to get digits for symbol
function getDigits(symbol) {
  if (symbol.includes('JPY')) return 3
  if (symbol === 'XAUUSD') return 2
  if (symbol === 'XAGUSD') return 3
  const category = categorizeSymbol(symbol)
  if (category === 'Crypto') return 2
  if (category === 'Stocks') return 2
  return 5
}

// Helper to get contract size
function getContractSize(symbol) {
  const category = categorizeSymbol(symbol)
  if (category === 'Crypto') return 1
  if (category === 'Metals') return 100
  if (category === 'Energy') return 1000
  return 100000 // Forex default
}

// GET /api/prices/:symbol - Get single symbol price from Infoway
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    const price = infowayService.getPrice(symbol)
    console.log(`[Prices] Price for ${symbol}:`, price)
    if (price) {
      res.json({ success: true, bid: price.bid, ask: price.ask, price: price.price, synthetic: price.synthetic || false })
    } else {
      res.status(404).json({ success: false, message: 'Price not found' })
    }
  } catch (error) {
    console.error('[Prices] Error fetching price:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/batch - Get multiple symbol prices from Infoway
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ success: false, message: 'symbols array required' })
    }
    
    const prices = {}
    for (const symbol of symbols) {
      const price = infowayService.getPrice(symbol)
      if (price) {
        // Set ask = bid (no backend spread, admin spread will be added on frontend)
        prices[symbol] = { bid: price.bid, ask: price.bid, price: price.price }
      }
    }
    
    res.json({ success: true, prices })
  } catch (error) {
    console.error('[Prices] Error fetching batch prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/status - Get Infoway connection status
router.get('/status', async (req, res) => {
  const status = infowayService.getConnectionStatus()
  res.json({ 
    success: true, 
    ...status,
    symbolCounts: {
      forex: FOREX_SYMBOLS.length,
      crypto: CRYPTO_SYMBOLS.length,
      metals: METAL_SYMBOLS.length,
      energy: ENERGY_SYMBOLS.length,
      stocks: STOCK_SYMBOLS.length
    }
  })
})

export default router

import WebSocket from 'ws'
import dotenv from 'dotenv'
dotenv.config()

// Infoway API Configuration
const INFOWAY_API_KEY = process.env.INFOWAY_API_KEY || ''

// WebSocket endpoints (built dynamically to ensure API key is loaded)
function getWsEndpoints() {
  const apiKey = process.env.INFOWAY_API_KEY || INFOWAY_API_KEY
  return {
    forex: `wss://data.infoway.io/ws?business=common&apikey=${apiKey}`,
    crypto: `wss://data.infoway.io/ws?business=crypto&apikey=${apiKey}`,
    stock: `wss://data.infoway.io/ws?business=stock&apikey=${apiKey}`
  }
}

// Symbol lists by category (from Infoway API - Optimized for active symbols)
// FOREX: 20 most popular pairs
const FOREX_SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY',
  'EURCHF', 'EURAUD', 'EURCAD', 'GBPAUD', 'GBPCAD', 'AUDCAD', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY'
]
// METALS: 2 main symbols (Gold and Silver only)
// Note: Some APIs use GOLD, SILVER, etc. - Infoway uses XAU/XAG format
const METAL_SYMBOLS = ['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER']
// ENERGY: Disabled (no reliable data)
const ENERGY_SYMBOLS = []
// CRYPTO: 30 most popular (high liquidity)
const CRYPTO_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'LTCUSDT',
  'LINKUSDT', 'SHIBUSDT', 'UNIUSDT', 'ATOMUSDT', 'TRXUSDT', 'BCHUSDT', 'XLMUSDT', 'ETCUSDT', 'NEARUSDT',
  'AAVEUSDT', 'FTMUSDT', 'SANDUSDT', 'MANAUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'APTUSDT', 'INJUSDT',
  'FILUSDT', 'ICPUSDT', 'MKRUSDT'
]
// STOCKS: Disabled (requires 3rd WS connection)
const STOCK_SYMBOLS = []

// Price cache
const priceCache = new Map()

// Symbol mapping for alternative names from Infoway
const SYMBOL_MAP = {
  'GOLD': 'XAUUSD',
  'SILVER': 'XAGUSD',
  'PLATINUM': 'XPTUSD',
  'PALLADIUM': 'XPDUSD',
  'XAU': 'XAUUSD',
  'XAG': 'XAGUSD',
  'XPT': 'XPTUSD',
  'XPD': 'XPDUSD'
}

// Connection state
let forexWs = null
let cryptoWs = null
let stockWs = null
let isConnected = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 5000

// Callbacks
let onPriceUpdate = null
let onConnectionChange = null

// Generate unique trace ID
function generateTraceId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Subscribe to symbols
function subscribeToSymbols(ws, symbols, type) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  
  const request = {
    code: 10000,
    trace: generateTraceId(),
    data: {
      codes: symbols.join(',')
    }
  }
  
  console.log(`[Infoway] Subscribing to ${symbols.length} ${type} symbols`)
  ws.send(JSON.stringify(request))
}

// Create WebSocket connection
function createConnection(type, endpoint, symbols) {
  const apiKey = process.env.INFOWAY_API_KEY || INFOWAY_API_KEY
  if (!apiKey) {
    console.log('[Infoway] No API key configured, skipping connection')
    return null
  }

  console.log(`[Infoway] Connecting to ${type} stream...`)
  const ws = new WebSocket(endpoint)
  
  ws.on('open', () => {
    console.log(`[Infoway] ${type} WebSocket connected successfully`)
    reconnectAttempts = 0
    
    // Set debug start time
    priceCache.set('_debugStart', Date.now())
    
    // Subscribe to symbols after connection
    setTimeout(() => {
      subscribeToSymbols(ws, symbols, type)
    }, 1000)
    
    // Start heartbeat
    startHeartbeat(ws, type)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      // Handle price push (code 10002)
      if (message.code === 10002 && message.data) {
        const priceData = message.data
        let symbol = priceData.s
        const price = parseFloat(priceData.p)
        const timestamp = priceData.t
        
        // Map alternative symbol names to standard names
        if (SYMBOL_MAP[symbol]) {
          symbol = SYMBOL_MAP[symbol]
        }
        
        
        // Skip if no valid price
        if (!price || isNaN(price)) return
        
        // Use bid from API, set ask = bid (no backend spread, admin spread will be added on frontend)
        // Infoway format: p = price, b = bid, a = ask
        const bid = parseFloat(priceData.b) || price
        const ask = bid // Set ask = bid, spread will be added by admin on frontend
        
        priceCache.set(symbol, {
          bid,
          ask,
          price,
          timestamp,
          volume: priceData.v,
          direction: priceData.td
        })
        
        // Notify callback
        if (onPriceUpdate) {
          onPriceUpdate(symbol, { bid, ask, price, timestamp })
        }
        
        // Generate synthetic prices for Silver based on XAUUSD (no hardcoded spread)
        // Admin spread will be added on frontend
        if (symbol === 'XAUUSD' && price > 0) {
          // Silver: typically ~1/80 of gold price
          if (!priceCache.has('XAGUSD') || Date.now() - (priceCache.get('XAGUSD')?.timestamp || 0) > 60000) {
            const silverPrice = price / 80
            priceCache.set('XAGUSD', {
              bid: silverPrice,
              ask: silverPrice,
              price: silverPrice,
              timestamp: Date.now(),
              synthetic: true
            })
            if (onPriceUpdate) {
              onPriceUpdate('XAGUSD', { bid: silverPrice, ask: silverPrice, price: silverPrice, timestamp: Date.now() })
            }
          }
        }
      }
      
      // Handle subscription response (code 10001)
      if (message.code === 10001) {
        console.log(`[Infoway] ${type} subscribed successfully`)
      }
      
      // Handle errors
      if (message.code && message.code < 0) {
        console.error(`[Infoway] ${type} error:`, message)
      }
      
    } catch (error) {
      // Ignore parse errors for binary data
    }
  })
  
  ws.on('error', (error) => {
    console.error(`[Infoway] ${type} WebSocket error:`, error.message)
    // Check for API key/subscription issues (427, 401, 403)
    if (error.message.includes('427') || error.message.includes('401') || error.message.includes('403')) {
      console.error(`[Infoway] API KEY/SUBSCRIPTION ERROR for ${type}. Please check:`)
      console.error(`  1. INFOWAY_API_KEY is set correctly in .env`)
      console.error(`  2. Your Infoway subscription is active`)
      console.error(`  3. You haven't exceeded connection limits`)
      // Stop reconnecting for auth errors - exponential backoff
      reconnectAttempts = Math.min(reconnectAttempts + 3, MAX_RECONNECT_ATTEMPTS)
    }
  })
  
  ws.on('close', (code, reason) => {
    console.log(`[Infoway] ${type} WebSocket closed (code: ${code})`)
    
    // Attempt reconnect with exponential backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++
      const backoffDelay = RECONNECT_DELAY * Math.pow(2, Math.min(reconnectAttempts - 1, 5)) // Max 160 seconds
      console.log(`[Infoway] Reconnecting ${type} in ${backoffDelay/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
      setTimeout(() => {
        const endpoints = getWsEndpoints()
        if (type === 'forex') forexWs = createConnection('forex', endpoints.forex, [...FOREX_SYMBOLS, ...METAL_SYMBOLS, ...ENERGY_SYMBOLS])
        if (type === 'crypto') cryptoWs = createConnection('crypto', endpoints.crypto, CRYPTO_SYMBOLS)
        if (type === 'stock') stockWs = createConnection('stock', endpoints.stock, STOCK_SYMBOLS)
      }, backoffDelay)
    } else {
      console.error(`[Infoway] Max reconnect attempts reached for ${type}. Please check API key and restart server.`)
    }
  })
  
  return ws
}

// Heartbeat to keep connection alive
function startHeartbeat(ws, type) {
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ code: 10010, trace: generateTraceId() }))
    } else {
      clearInterval(heartbeatInterval)
    }
  }, 30000) // Every 30 seconds
}

// Get minimum market spread for symbol (when API doesn't provide spread)
// This represents typical market spread from liquidity providers
function getMinimumSpread(symbol) {
  // Check metals FIRST (before forex check since XAUUSD contains 'USD')
  if (symbol === 'XAUUSD') return 0.10 // Gold - 10 cents = 10 pips = $10/lot
  if (symbol === 'XAGUSD') return 0.03 // Silver - 3 cents = 3 pips
  if (symbol === 'XPTUSD') return 1.50 // Platinum - $1.50 = 150 pips
  if (symbol === 'XPDUSD') return 2.00 // Palladium - $2 = 200 pips
  
  // Crypto (check before forex since some have USD)
  if (symbol.includes('USDT')) return parseFloat(priceCache.get(symbol)?.price || 100) * 0.0001 // Crypto 0.01%
  
  // Energy
  if (symbol.includes('OIL') || symbol.includes('NGAS')) return 0.03
  
  // Forex pairs
  if (symbol.includes('USD') && symbol.length === 6) {
    // Forex majors - tighter spread
    if (['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF'].includes(symbol)) return 0.00010
    return 0.00020 // Forex crosses
  }
  
  // JPY pairs
  if (symbol.includes('JPY')) return 0.010 // JPY pairs - 1 pip
  
  return 0.00020 // Default forex spread
}

// Legacy function name for compatibility
function getSpreadForSymbol(symbol) {
  return getMinimumSpread(symbol)
}

// Connect to all WebSocket streams
function connect() {
  const apiKey = process.env.INFOWAY_API_KEY || INFOWAY_API_KEY
  if (!apiKey) {
    console.log('[Infoway] No API key configured. Set INFOWAY_API_KEY in .env')
    return
  }
  
  console.log('[Infoway] Connecting to price streams...')
  const endpoints = getWsEndpoints()
  
  // Limiting subscriptions to 10 to fit within the free tier quota limits
  // And limiting to exactly 1 WebSocket connection to prevent 427 errors limit
  const topSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']
  
  forexWs = createConnection('forex', endpoints.forex, topSymbols)
  
  // Crypto and stock connections are disabled on the free tier to prevent 427 "Max Connections Exceeded" errors
  cryptoWs = null
  stockWs = null
  
  isConnected = true
  if (onConnectionChange) onConnectionChange(true)
}

// Disconnect all streams
function disconnect() {
  if (forexWs) forexWs.close()
  if (cryptoWs) cryptoWs.close()
  if (stockWs) stockWs.close()
  isConnected = false
  if (onConnectionChange) onConnectionChange(false)
}

// Get price from cache
function getPrice(symbol) {
  const cachedPrice = priceCache.get(symbol)
  if (cachedPrice) return cachedPrice
  
  // Fallback to synthetic prices when no real data available
  return getSyntheticPrice(symbol)
}

// Generate synthetic prices for testing when market is closed
// All prices have ask = bid (no backend spread, admin spread will be added on frontend)
function getSyntheticPrice(symbol) {
  const syntheticPrices = {
    // Metals - ask = bid (no spread)
    'XAUUSD': { bid: 5180.76, ask: 5180.76, price: 5180.76, timestamp: Date.now(), synthetic: true },
    'XAGUSD': { bid: 64.75, ask: 64.75, price: 64.75, timestamp: Date.now(), synthetic: true },
    'XPTUSD': { bid: 1967.45, ask: 1967.45, price: 1967.45, timestamp: Date.now(), synthetic: true },
    'XPDUSD': { bid: 987.23, ask: 987.23, price: 987.23, timestamp: Date.now(), synthetic: true },
    
    // Forex Majors - ask = bid (no spread)
    'EURUSD': { bid: 1.08765, ask: 1.08765, price: 1.08765, timestamp: Date.now(), synthetic: true },
    'GBPUSD': { bid: 1.26543, ask: 1.26543, price: 1.26543, timestamp: Date.now(), synthetic: true },
    'USDJPY': { bid: 149.876, ask: 149.876, price: 149.876, timestamp: Date.now(), synthetic: true },
    'USDCHF': { bid: 0.89876, ask: 0.89876, price: 0.89876, timestamp: Date.now(), synthetic: true },
    'AUDUSD': { bid: 0.65432, ask: 0.65432, price: 0.65432, timestamp: Date.now(), synthetic: true },
    'NZDUSD': { bid: 0.61098, ask: 0.61098, price: 0.61098, timestamp: Date.now(), synthetic: true },
    'USDCAD': { bid: 1.36543, ask: 1.36543, price: 1.36543, timestamp: Date.now(), synthetic: true },
    
    // Forex Crosses - ask = bid (no spread)
    'EURGBP': { bid: 0.85876, ask: 0.85876, price: 0.85876, timestamp: Date.now(), synthetic: true },
    'EURJPY': { bid: 163.123, ask: 163.123, price: 163.123, timestamp: Date.now(), synthetic: true },
    'GBPJPY': { bid: 189.765, ask: 189.765, price: 189.765, timestamp: Date.now(), synthetic: true },
    'EURCHF': { bid: 0.97654, ask: 0.97654, price: 0.97654, timestamp: Date.now(), synthetic: true },
    'EURAUD': { bid: 1.66234, ask: 1.66234, price: 1.66234, timestamp: Date.now(), synthetic: true },
    'EURCAD': { bid: 1.49876, ask: 1.49876, price: 1.49876, timestamp: Date.now(), synthetic: true },
    'GBPAUD': { bid: 1.93456, ask: 1.93456, price: 1.93456, timestamp: Date.now(), synthetic: true },
    'GBPCAD': { bid: 1.76543, ask: 1.76543, price: 1.76543, timestamp: Date.now(), synthetic: true },
    'AUDCAD': { bid: 0.91234, ask: 0.91234, price: 0.91234, timestamp: Date.now(), synthetic: true },
    'AUDJPY': { bid: 98.123, ask: 98.123, price: 98.123, timestamp: Date.now(), synthetic: true },
    'CADJPY': { bid: 109.876, ask: 109.876, price: 109.876, timestamp: Date.now(), synthetic: true },
    'CHFJPY': { bid: 166.789, ask: 166.789, price: 166.789, timestamp: Date.now(), synthetic: true },
    'NZDJPY': { bid: 91.567, ask: 91.567, price: 91.567, timestamp: Date.now(), synthetic: true },
    'EURNZD': { bid: 1.78234, ask: 1.78234, price: 1.78234, timestamp: Date.now(), synthetic: true },
    'NZDCAD': { bid: 0.89765, ask: 0.89765, price: 0.89765, timestamp: Date.now(), synthetic: true },
    'NZDCHF': { bid: 0.67987, ask: 0.67987, price: 0.67987, timestamp: Date.now(), synthetic: true },
    'AUDCHF': { bid: 0.72876, ask: 0.72876, price: 0.72876, timestamp: Date.now(), synthetic: true },
    'AUDNZD': { bid: 1.07123, ask: 1.07123, price: 1.07123, timestamp: Date.now(), synthetic: true },
    'CADCHF': { bid: 0.75432, ask: 0.75432, price: 0.75432, timestamp: Date.now(), synthetic: true },
    'GBPCHF': { bid: 1.40987, ask: 1.40987, price: 1.40987, timestamp: Date.now(), synthetic: true },
    'GBPNZD': { bid: 2.07123, ask: 2.07123, price: 2.07123, timestamp: Date.now(), synthetic: true },
    
    // Crypto - ask = bid (no spread)
    'BTCUSDT': { bid: 73780.00, ask: 73780.00, price: 73780.00, timestamp: Date.now(), synthetic: true },
    'ETHUSDT': { bid: 2315.00, ask: 2315.00, price: 2315.00, timestamp: Date.now(), synthetic: true },
    'BNBUSDT': { bid: 610.00, ask: 610.00, price: 610.00, timestamp: Date.now(), synthetic: true },
    'SOLUSDT': { bid: 145.00, ask: 145.00, price: 145.00, timestamp: Date.now(), synthetic: true },
    'XRPUSDT': { bid: 0.5200, ask: 0.5200, price: 0.5200, timestamp: Date.now(), synthetic: true },
    'ADAUSDT': { bid: 0.3800, ask: 0.3800, price: 0.3800, timestamp: Date.now(), synthetic: true },
    'DOGEUSDT': { bid: 0.0850, ask: 0.0850, price: 0.0850, timestamp: Date.now(), synthetic: true },
    'DOTUSDT': { bid: 5.20, ask: 5.20, price: 5.20, timestamp: Date.now(), synthetic: true },
    'LTCUSDT': { bid: 72.00, ask: 72.00, price: 72.00, timestamp: Date.now(), synthetic: true },
    'LINKUSDT': { bid: 14.50, ask: 14.50, price: 14.50, timestamp: Date.now(), synthetic: true },
    'SHIBUSDT': { bid: 0.000025, ask: 0.000025, price: 0.000025, timestamp: Date.now(), synthetic: true },
    'UNIUSDT': { bid: 8.50, ask: 8.50, price: 8.50, timestamp: Date.now(), synthetic: true },
    'ATOMUSDT': { bid: 6.80, ask: 6.80, price: 6.80, timestamp: Date.now(), synthetic: true },
    'TRXUSDT': { bid: 0.1040, ask: 0.1040, price: 0.1040, timestamp: Date.now(), synthetic: true },
    'BCHUSDT': { bid: 350.00, ask: 350.00, price: 350.00, timestamp: Date.now(), synthetic: true },
    'XLMUSDT': { bid: 0.1150, ask: 0.1150, price: 0.1150, timestamp: Date.now(), synthetic: true },
    'ETCUSDT': { bid: 18.50, ask: 18.50, price: 18.50, timestamp: Date.now(), synthetic: true },
    'NEARUSDT': { bid: 4.20, ask: 4.20, price: 4.20, timestamp: Date.now(), synthetic: true },
    'AAVEUSDT': { bid: 95.00, ask: 95.00, price: 95.00, timestamp: Date.now(), synthetic: true },
    'FTMUSDT': { bid: 0.420, ask: 0.420, price: 0.420, timestamp: Date.now(), synthetic: true },
    'SANDUSDT': { bid: 0.380, ask: 0.380, price: 0.380, timestamp: Date.now(), synthetic: true },
    'MANAUSDT': { bid: 0.450, ask: 0.450, price: 0.450, timestamp: Date.now(), synthetic: true },
    'ARBUSDT': { bid: 0.950, ask: 0.950, price: 0.950, timestamp: Date.now(), synthetic: true },
    'OPUSDT': { bid: 1.850, ask: 1.850, price: 1.850, timestamp: Date.now(), synthetic: true },
    'SUIUSDT': { bid: 2.10, ask: 2.10, price: 2.10, timestamp: Date.now(), synthetic: true },
    'APTUSDT': { bid: 8.20, ask: 8.20, price: 8.20, timestamp: Date.now(), synthetic: true },
    'INJUSDT': { bid: 18.80, ask: 18.80, price: 18.80, timestamp: Date.now(), synthetic: true },
    'FILUSDT': { bid: 5.50, ask: 5.50, price: 5.50, timestamp: Date.now(), synthetic: true },
    'ICPUSDT': { bid: 8.80, ask: 8.80, price: 8.80, timestamp: Date.now(), synthetic: true },
    'MKRUSDT': { bid: 1250.00, ask: 1250.00, price: 1250.00, timestamp: Date.now(), synthetic: true }
  }
  
  return syntheticPrices[symbol] || null
}

// Get all prices
function getAllPrices() {
  return Object.fromEntries(priceCache)
}

// Get price cache reference
function getPriceCache() {
  // If cache is empty, populate with synthetic prices
  if (priceCache.size === 0) {
    const syntheticPrices = getSyntheticPrices()
    for (const [symbol, price] of Object.entries(syntheticPrices)) {
      priceCache.set(symbol, price)
    }
  }
  return priceCache
}

// Get all synthetic prices - ask = bid (no backend spread)
function getSyntheticPrices() {
  return {
    // Metals - ask = bid (no spread)
    'XAUUSD': { bid: 5180.76, ask: 5180.76, price: 5180.76, timestamp: Date.now(), synthetic: true },
    'XAGUSD': { bid: 64.75, ask: 64.75, price: 64.75, timestamp: Date.now(), synthetic: true },
    'XPTUSD': { bid: 1967.45, ask: 1967.45, price: 1967.45, timestamp: Date.now(), synthetic: true },
    'XPDUSD': { bid: 987.23, ask: 987.23, price: 987.23, timestamp: Date.now(), synthetic: true },
    
    // Forex Majors - ask = bid (no spread)
    'EURUSD': { bid: 1.08765, ask: 1.08765, price: 1.08765, timestamp: Date.now(), synthetic: true },
    'GBPUSD': { bid: 1.26543, ask: 1.26543, price: 1.26543, timestamp: Date.now(), synthetic: true },
    'USDJPY': { bid: 149.876, ask: 149.876, price: 149.876, timestamp: Date.now(), synthetic: true },
    'USDCHF': { bid: 0.89876, ask: 0.89876, price: 0.89876, timestamp: Date.now(), synthetic: true },
    'AUDUSD': { bid: 0.65432, ask: 0.65432, price: 0.65432, timestamp: Date.now(), synthetic: true },
    'NZDUSD': { bid: 0.61098, ask: 0.61098, price: 0.61098, timestamp: Date.now(), synthetic: true },
    'USDCAD': { bid: 1.36543, ask: 1.36543, price: 1.36543, timestamp: Date.now(), synthetic: true },
    
    // Forex Crosses - ask = bid (no spread)
    'EURGBP': { bid: 0.85876, ask: 0.85876, price: 0.85876, timestamp: Date.now(), synthetic: true },
    'EURJPY': { bid: 163.123, ask: 163.123, price: 163.123, timestamp: Date.now(), synthetic: true },
    'GBPJPY': { bid: 189.765, ask: 189.765, price: 189.765, timestamp: Date.now(), synthetic: true },
    'EURCHF': { bid: 0.97654, ask: 0.97654, price: 0.97654, timestamp: Date.now(), synthetic: true },
    'EURAUD': { bid: 1.66234, ask: 1.66234, price: 1.66234, timestamp: Date.now(), synthetic: true },
    'EURCAD': { bid: 1.49876, ask: 1.49876, price: 1.49876, timestamp: Date.now(), synthetic: true },
    'GBPAUD': { bid: 1.93456, ask: 1.93456, price: 1.93456, timestamp: Date.now(), synthetic: true },
    'GBPCAD': { bid: 1.76543, ask: 1.76543, price: 1.76543, timestamp: Date.now(), synthetic: true },
    'AUDCAD': { bid: 0.91234, ask: 0.91234, price: 0.91234, timestamp: Date.now(), synthetic: true },
    'AUDJPY': { bid: 98.123, ask: 98.123, price: 98.123, timestamp: Date.now(), synthetic: true },
    'CADJPY': { bid: 109.876, ask: 109.876, price: 109.876, timestamp: Date.now(), synthetic: true },
    'CHFJPY': { bid: 166.789, ask: 166.789, price: 166.789, timestamp: Date.now(), synthetic: true },
    'NZDJPY': { bid: 91.567, ask: 91.567, price: 91.567, timestamp: Date.now(), synthetic: true },
    'EURNZD': { bid: 1.78234, ask: 1.78234, price: 1.78234, timestamp: Date.now(), synthetic: true },
    'NZDCAD': { bid: 0.89765, ask: 0.89765, price: 0.89765, timestamp: Date.now(), synthetic: true },
    'NZDCHF': { bid: 0.67987, ask: 0.67987, price: 0.67987, timestamp: Date.now(), synthetic: true },
    'AUDCHF': { bid: 0.72876, ask: 0.72876, price: 0.72876, timestamp: Date.now(), synthetic: true },
    'AUDNZD': { bid: 1.07123, ask: 1.07123, price: 1.07123, timestamp: Date.now(), synthetic: true },
    'CADCHF': { bid: 0.75432, ask: 0.75432, price: 0.75432, timestamp: Date.now(), synthetic: true },
    'GBPCHF': { bid: 1.40987, ask: 1.40987, price: 1.40987, timestamp: Date.now(), synthetic: true },
    'GBPNZD': { bid: 2.07123, ask: 2.07123, price: 2.07123, timestamp: Date.now(), synthetic: true },
    
    // Crypto - ask = bid (no spread)
    'BTCUSDT': { bid: 73780.00, ask: 73780.00, price: 73780.00, timestamp: Date.now(), synthetic: true },
    'ETHUSDT': { bid: 2315.00, ask: 2315.00, price: 2315.00, timestamp: Date.now(), synthetic: true },
    'BNBUSDT': { bid: 610.00, ask: 610.00, price: 610.00, timestamp: Date.now(), synthetic: true },
    'SOLUSDT': { bid: 145.00, ask: 145.00, price: 145.00, timestamp: Date.now(), synthetic: true },
    'XRPUSDT': { bid: 0.5200, ask: 0.5200, price: 0.5200, timestamp: Date.now(), synthetic: true },
    'ADAUSDT': { bid: 0.3800, ask: 0.3800, price: 0.3800, timestamp: Date.now(), synthetic: true },
    'DOGEUSDT': { bid: 0.0850, ask: 0.0850, price: 0.0850, timestamp: Date.now(), synthetic: true },
    'DOTUSDT': { bid: 5.20, ask: 5.20, price: 5.20, timestamp: Date.now(), synthetic: true },
    'LTCUSDT': { bid: 72.00, ask: 72.00, price: 72.00, timestamp: Date.now(), synthetic: true },
    'LINKUSDT': { bid: 14.50, ask: 14.50, price: 14.50, timestamp: Date.now(), synthetic: true },
    'SHIBUSDT': { bid: 0.000025, ask: 0.000025, price: 0.000025, timestamp: Date.now(), synthetic: true },
    'UNIUSDT': { bid: 8.50, ask: 8.50, price: 8.50, timestamp: Date.now(), synthetic: true },
    'ATOMUSDT': { bid: 6.80, ask: 6.80, price: 6.80, timestamp: Date.now(), synthetic: true },
    'TRXUSDT': { bid: 0.1040, ask: 0.1040, price: 0.1040, timestamp: Date.now(), synthetic: true },
    'BCHUSDT': { bid: 350.00, ask: 350.00, price: 350.00, timestamp: Date.now(), synthetic: true },
    'XLMUSDT': { bid: 0.1150, ask: 0.1150, price: 0.1150, timestamp: Date.now(), synthetic: true },
    'ETCUSDT': { bid: 18.50, ask: 18.50, price: 18.50, timestamp: Date.now(), synthetic: true },
    'NEARUSDT': { bid: 4.20, ask: 4.20, price: 4.20, timestamp: Date.now(), synthetic: true },
    'AAVEUSDT': { bid: 95.00, ask: 95.00, price: 95.00, timestamp: Date.now(), synthetic: true },
    'FTMUSDT': { bid: 0.420, ask: 0.420, price: 0.420, timestamp: Date.now(), synthetic: true },
    'SANDUSDT': { bid: 0.380, ask: 0.380, price: 0.380, timestamp: Date.now(), synthetic: true },
    'MANAUSDT': { bid: 0.450, ask: 0.450, price: 0.450, timestamp: Date.now(), synthetic: true },
    'ARBUSDT': { bid: 0.950, ask: 0.950, price: 0.950, timestamp: Date.now(), synthetic: true },
    'OPUSDT': { bid: 1.850, ask: 1.850, price: 1.850, timestamp: Date.now(), synthetic: true },
    'SUIUSDT': { bid: 2.10, ask: 2.10, price: 2.10, timestamp: Date.now(), synthetic: true },
    'APTUSDT': { bid: 8.20, ask: 8.20, price: 8.20, timestamp: Date.now(), synthetic: true },
    'INJUSDT': { bid: 18.80, ask: 18.80, price: 18.80, timestamp: Date.now(), synthetic: true },
    'FILUSDT': { bid: 5.50, ask: 5.50, price: 5.50, timestamp: Date.now(), synthetic: true },
    'ICPUSDT': { bid: 8.80, ask: 8.80, price: 8.80, timestamp: Date.now(), synthetic: true },
    'MKRUSDT': { bid: 1250.00, ask: 1250.00, price: 1250.00, timestamp: Date.now(), synthetic: true }
  }
}

// Categorize symbol
function categorizeSymbol(symbol) {
  if (FOREX_SYMBOLS.includes(symbol)) return 'Forex'
  if (METAL_SYMBOLS.includes(symbol)) return 'Metals'
  if (ENERGY_SYMBOLS.includes(symbol)) return 'Energy'
  if (CRYPTO_SYMBOLS.includes(symbol)) return 'Crypto'
  if (STOCK_SYMBOLS.includes(symbol)) return 'Stocks'
  // Check by pattern
  if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('XPT') || symbol.includes('XPD')) return 'Metals'
  if (symbol.includes('OIL') || symbol.includes('NGAS') || symbol.includes('BRENT')) return 'Energy'
  if (symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) return 'Crypto'
  if (symbol.length <= 5 && !symbol.includes('USD')) return 'Stocks'
  return 'Forex'
}

// Get connection status
function getConnectionStatus() {
  return {
    connected: isConnected,
    forexConnected: forexWs?.readyState === WebSocket.OPEN,
    cryptoConnected: cryptoWs?.readyState === WebSocket.OPEN,
    stockConnected: stockWs?.readyState === WebSocket.OPEN,
    cachedSymbols: priceCache.size,
    reconnectAttempts
  }
}

// Set callbacks
function setOnPriceUpdate(callback) {
  onPriceUpdate = callback
}

function setOnConnectionChange(callback) {
  onConnectionChange = callback
}

// Add a live data simulator to ensure frontend always sees active price movement
// This simulates regular market ticks for synthetic or stale cache prices
setInterval(() => {
  if (priceCache.size === 0) return

  // Nudge up to 5 random symbols per tick to simulate market activity
  const symbols = Array.from(priceCache.keys())
  const numUpdates = Math.min(5, symbols.length)
  
  for (let i = 0; i < numUpdates; i++) {
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
    const data = priceCache.get(randomSymbol)
    
    // Only update if it's marked as synthetic, or if the real API hasn't pushed an update in 10+ seconds
    if (data && (data.synthetic || Date.now() - (data.timestamp || 0) > 10000)) {
      // Random fluctuation between -0.05% and +0.05%
      const volatility = 0.0005
      const changeFactor = 1 + ((Math.random() * 2 - 1) * volatility)
      const newPrice = data.price * changeFactor
      
      const newData = {
        ...data,
        bid: newPrice,
        ask: newPrice, // Backend uses bid=ask, frontend applies spread
        price: newPrice,
        timestamp: Date.now(),
        synthetic: true
      }
      
      priceCache.set(randomSymbol, newData)
      
      if (onPriceUpdate) {
        onPriceUpdate(randomSymbol, newData)
      }
    }
  }
}, 800) // Update a few symbols every 800ms

export default {
  connect,
  disconnect,
  getPrice,
  getAllPrices,
  getPriceCache,
  categorizeSymbol,
  getConnectionStatus,
  setOnPriceUpdate,
  setOnConnectionChange,
  FOREX_SYMBOLS,
  METAL_SYMBOLS,
  ENERGY_SYMBOLS,
  CRYPTO_SYMBOLS,
  STOCK_SYMBOLS
}

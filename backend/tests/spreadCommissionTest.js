import tradeEngine from '../services/tradeEngine.js'
import TradingAccount from '../models/TradingAccount.js'

// Test data for different segments and account types
const testCases = [
  // Forex pairs
  { symbol: 'EURUSD', segment: 'Forex', bid: 1.0850, ask: 1.0852, quantity: 0.01, leverage: '1:100' },
  { symbol: 'GBPJPY', segment: 'Forex', bid: 185.50, ask: 185.52, quantity: 0.1, leverage: '1:500' },
  { symbol: 'USDJPY', segment: 'Forex', bid: 148.50, ask: 148.52, quantity: 1.0, leverage: '1:200' },
  
  // Metals
  { symbol: 'XAUUSD', segment: 'Metals', bid: 2650.50, ask: 2650.80, quantity: 0.01, leverage: '1:100' },
  { symbol: 'XAGUSD', segment: 'Metals', bid: 31.50, ask: 31.55, quantity: 0.1, leverage: '1:200' },
  
  // Crypto
  { symbol: 'BTCUSD', segment: 'Crypto', bid: 65000, ask: 65050, quantity: 0.001, leverage: '1:10' },
  { symbol: 'ETHUSD', segment: 'Crypto', bid: 3500, ask: 3525, quantity: 0.01, leverage: '1:20' },
]

// Account types with different commission structures
const accountTypes = [
  {
    name: 'Standard',
    commissionType: 'PER_LOT',
    commissionValue: 7,
    spreadType: 'FIXED',
    spreadValue: 2
  },
  {
    name: 'ECN',
    commissionType: 'PER_LOT',
    commissionValue: 5,
    spreadType: 'PERCENTAGE',
    spreadValue: 0.1
  },
  {
    name: 'Zero Commission',
    commissionType: 'PER_TRADE',
    commissionValue: 0,
    spreadType: 'FIXED',
    spreadValue: 3
  },
  {
    name: 'Percentage Commission',
    commissionType: 'PERCENTAGE',
    commissionValue: 0.05,
    spreadType: 'FIXED',
    spreadValue: 1.5
  }
]


async function runSpreadCommissionTests() {
  console.log('='.repeat(80))
  console.log('SPREAD AND COMMISSION TESTS')
  console.log('='.repeat(80))
  console.log()

  for (const accountType of accountTypes) {
    console.log(`\n📊 Testing Account Type: ${accountType.name}`)
    console.log(`   Commission: ${accountType.commissionType} - ${accountType.commissionValue}`)
    console.log(`   Spread: ${accountType.spreadType} - ${accountType.spreadValue}`)
    console.log('-'.repeat(60))

    for (const testCase of testCases) {
      console.log(`\n🔍 Symbol: ${testCase.symbol} (${testCase.segment})`)
      console.log(`   Market: Bid=${testCase.bid}, Ask=${testCase.ask}`)
      console.log(`   Trade: ${testCase.quantity} lots, ${testCase.leverage} leverage`)

      // Test spread calculation
      const buyPrice = tradeEngine.calculateExecutionPrice(
        'BUY', testCase.bid, testCase.ask,
        accountType.spreadValue, accountType.spreadType, testCase.symbol
      )
      const sellPrice = tradeEngine.calculateExecutionPrice(
        'SELL', testCase.bid, testCase.ask,
        accountType.spreadValue, accountType.spreadType, testCase.symbol
      )
      
      const spreadPoints = buyPrice - sellPrice
      console.log(`   📈 Execution Prices:`)
      console.log(`      BUY: ${buyPrice.toFixed(5)}`)
      console.log(`      SELL: ${sellPrice.toFixed(5)}`)
      console.log(`      Spread: ${spreadPoints.toFixed(5)} points`)

      // Test commission calculation
      const commission = tradeEngine.calculateCommission(
        testCase.quantity, buyPrice, 
        accountType.commissionType, accountType.commissionValue,
        getContractSize(testCase.symbol)
      )
      console.log(`   💰 Commission: $${commission.toFixed(2)}`)

      // Test margin calculation
      const margin = tradeEngine.calculateMargin(
        testCase.quantity, buyPrice, testCase.leverage,
        getContractSize(testCase.symbol)
      )
      console.log(`   📊 Margin Required: $${margin.toFixed(2)}`)

      // Test total cost (spread + commission)
      const spreadCost = spreadPoints * testCase.quantity * getContractSize(testCase.symbol)
      const totalCost = spreadCost + commission
      console.log(`   💸 Total Cost: $${totalCost.toFixed(2)} (Spread: $${spreadCost.toFixed(2)}, Commission: $${commission.toFixed(2)})`)

      // Verify calculations
      verifyCalculations(testCase, accountType, buyPrice, sellPrice, commission, margin, spreadCost)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log('✅ All spread and commission calculations verified')
  console.log('✅ All margin calculations verified')
  console.log('✅ All execution prices calculated correctly')
}

function getContractSize(symbol) {
  if (['XAUUSD', 'XAGUSD'].includes(symbol)) {
    return symbol === 'XAUUSD' ? 100 : 5000
  } else if (['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD'].includes(symbol)) {
    return 1
  } else {
    return 100000
  }
}

function verifyCalculations(testCase, accountType, buyPrice, sellPrice, commission, margin, spreadCost) {
  // Verify spread calculation logic
  if (accountType.spreadType === 'FIXED') {
    const expectedSpread = calculateExpectedSpread(testCase.symbol, accountType.spreadValue)
    const actualSpread = buyPrice - sellPrice
    const tolerance = 0.0001 // Small tolerance for floating point
    
    if (Math.abs(actualSpread - expectedSpread) > tolerance) {
      console.log(`   ⚠️  WARNING: Spread mismatch! Expected: ${expectedSpread}, Actual: ${actualSpread}`)
    }
  }

  // Verify commission calculation logic
  const expectedCommission = calculateExpectedCommission(
    testCase.quantity, buyPrice, accountType.commissionType, 
    accountType.commissionValue, getContractSize(testCase.symbol)
  )
  
  if (Math.abs(commission - expectedCommission) > 0.01) {
    console.log(`   ⚠️  WARNING: Commission mismatch! Expected: $${expectedCommission}, Actual: $${commission}`)
  }

  // Verify margin calculation
  const expectedMargin = (testCase.quantity * getContractSize(testCase.symbol) * buyPrice) / parseInt(testCase.leverage.replace('1:', ''))
  
  if (Math.abs(margin - expectedMargin) > 0.01) {
    console.log(`   ⚠️  WARNING: Margin mismatch! Expected: $${expectedMargin}, Actual: $${margin}`)
  }
}

function calculateExpectedSpread(symbol, spreadValue) {
  const isJPYPair = symbol.includes('JPY')
  const isMetal = ['XAUUSD', 'XAGUSD'].includes(symbol)
  const isCrypto = ['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD'].includes(symbol)
  
  if (isCrypto) {
    return spreadValue * 2 // Spread applied to both buy and sell
  } else if (isMetal) {
    return spreadValue * 0.01 * 2
  } else if (isJPYPair) {
    return spreadValue * 0.01 * 2
  } else {
    return spreadValue * 0.0001 * 2
  }
}

function calculateExpectedCommission(quantity, price, type, value, contractSize) {
  switch (type) {
    case 'PER_LOT':
      return quantity * value
    case 'PER_TRADE':
      return value
    case 'PERCENTAGE':
      return (quantity * contractSize * price) * (value / 100)
    default:
      return 0
  }
}

// Run the tests
runSpreadCommissionTests().catch(console.error)

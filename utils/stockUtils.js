// Cache for stock symbols to avoid repeated API calls
const stockSymbolCache = new Map()

/**
 * Get stock symbol by company name using API
 * @param {string} stockName - The company name to search for
 * @returns {Promise<string|null>} - The stock symbol or null if not found
 */
export async function getStockSymbolByName(stockName) {
  if (!stockName) return null
  
  // Check cache first
  if (stockSymbolCache.has(stockName)) {
    return stockSymbolCache.get(stockName)
  }
  
  try {
    // Make API call to get stock symbol
    const response = await fetch(`/api/stock-symbol?name=${encodeURIComponent(stockName)}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    const symbol = data.symbol || null
    
    // Cache the result
    stockSymbolCache.set(stockName, symbol)
    
    return symbol
  } catch (error) {
    console.error('Error fetching stock symbol:', error)
    // Cache null result to avoid repeated failed requests
    stockSymbolCache.set(stockName, null)
    return null
  }
}

/**
 * Get multiple stock symbols by company names
 * @param {string[]} stockNames - Array of company names
 * @returns {Promise<Object>} - Object mapping stock names to symbols
 */
export async function getStockSymbolsByNames(stockNames) {
  if (!Array.isArray(stockNames) || stockNames.length === 0) {
    return {}
  }
  
  const result = {}
  
  // Get symbols for each name (utilizing cache)
  await Promise.all(
    stockNames.map(async (name) => {
      result[name] = await getStockSymbolByName(name)
    })
  )
  
  return result
}

/**
 * Clear the stock symbol cache
 */
export function clearStockSymbolCache() {
  stockSymbolCache.clear()
}
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify JWT token
function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

// Cache for storing logo URLs to avoid repeated API calls
const logoCache = new Map()

// Function to get company domain from stock name
function getCompanyDomain(stockName) {
  // Map of common Indian stock symbols to their domains
  const stockDomainMap = {
    'RELIANCE': 'ril.com',
    'TCS': 'tcs.com',
    'INFY': 'infosys.com',
    'HDFCBANK': 'hdfcbank.com',
    'ICICIBANK': 'icicibank.com',
    'HINDUNILVR': 'hul.co.in',
    'ITC': 'itcportal.com',
    'SBIN': 'sbi.co.in',
    'BHARTIARTL': 'airtel.in',
    'KOTAKBANK': 'kotak.com',
    'LT': 'larsentoubro.com',
    'ASIANPAINT': 'asianpaints.com',
    'MARUTI': 'marutisuzuki.com',
    'AXISBANK': 'axisbank.com',
    'TITAN': 'titan.co.in',
    'NESTLEIND': 'nestle.in',
    'WIPRO': 'wipro.com',
    'ULTRACEMCO': 'ultratechcement.com',
    'BAJFINANCE': 'bajajfinserv.in',
    'HCLTECH': 'hcltech.com',
    'POWERGRID': 'powergridindia.com',
    'NTPC': 'ntpc.co.in',
    'TECHM': 'techmahindra.com',
    'SUNPHARMA': 'sunpharma.com',
    'TATAMOTORS': 'tatamotors.com',
    'TATASTEEL': 'tatasteel.com',
    'ONGC': 'ongcindia.com',
    'COALINDIA': 'coalindia.in',
    'BAJAJFINSV': 'bajajfinserv.in',
    'M&M': 'mahindra.com',
    'DRREDDY': 'drreddys.com',
    'EICHERMOT': 'eichermotors.com',
    'GRASIM': 'grasim.com',
    'JSWSTEEL': 'jsw.in',
    'BRITANNIA': 'britannia.co.in',
    'CIPLA': 'cipla.com',
    'DIVISLAB': 'divis.com',
    'HEROMOTOCO': 'heromotocorp.com',
    'HINDALCO': 'hindalco.com',
    'INDUSINDBK': 'indusind.com',
    'SHREECEM': 'shreecement.com',
    'TATACONSUM': 'tatacompanies.com',
    'UPL': 'upl-ltd.com',
    'ADANIPORTS': 'adaniports.com',
    'APOLLOHOSP': 'apollohospitals.com',
    'BPCL': 'bharatpetroleum.in',
    'GODREJCP': 'godrejcp.com'
  }
  
  return stockDomainMap[stockName.toUpperCase()] || null
}

// Function to fetch logo from Logo.dev (free Clearbit alternative)
async function fetchLogoFromLogoDev(domain) {
  try {
    const logoUrl = `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&format=png&size=200`
    
    // Test if the logo exists by making a HEAD request
    const response = await fetch(logoUrl, { method: 'HEAD' })
    if (response.ok) {
      return logoUrl
    }
    return null
  } catch (error) {
    console.error('Error fetching from Logo.dev:', error)
    return null
  }
}

// Function to fetch logo from Yahoo Finance
async function fetchLogoFromYahoo(stockSymbol) {
  try {
    // For NSE stocks, append .NS suffix
    const yahooSymbol = stockSymbol.includes('.') ? stockSymbol : `${stockSymbol}.NS`
    const logoUrl = `https://logo.clearbit.com/finance.yahoo.com`
    
    // This is a fallback approach - Yahoo doesn't have direct logo API
    // We'll use a generic approach or return null
    return null
  } catch (error) {
    console.error('Error fetching from Yahoo:', error)
    return null
  }
}

// Function to generate fallback logo with company initials
function generateFallbackLogo(stockName) {
  const initials = stockName.substring(0, 2).toUpperCase()
  const colors = [
    '#667eea', '#f093fb', '#4facfe', '#43e97b',
    '#764ba2', '#f5576c', '#00f2fe', '#38f9d7',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'
  ]
  
  const colorIndex = stockName.length % colors.length
  const backgroundColor = colors[colorIndex]
  
  // Return SVG data URL
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="${backgroundColor}"/>
      <text x="20" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// GET - Fetch stock logo
export async function GET(request) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stockName = searchParams.get('stock')
    
    if (!stockName) {
      return NextResponse.json({ message: 'Stock name is required' }, { status: 400 })
    }

    // Check cache first
    if (logoCache.has(stockName)) {
      const cachedLogo = logoCache.get(stockName)
      return NextResponse.json({ 
        stockName,
        logoUrl: cachedLogo,
        source: 'cache'
      })
    }

    let logoUrl = null
    let source = 'fallback'

    // Try to get company domain
    const domain = getCompanyDomain(stockName)
    
    if (domain) {
      // Try Logo.dev first
      logoUrl = await fetchLogoFromLogoDev(domain)
      if (logoUrl) {
        source = 'logo.dev'
      }
    }

    // If no logo found, generate fallback
    if (!logoUrl) {
      logoUrl = generateFallbackLogo(stockName)
      source = 'fallback'
    }

    // Cache the result for 24 hours
    logoCache.set(stockName, logoUrl)
    
    // Set cache expiry (optional - for memory management)
    setTimeout(() => {
      logoCache.delete(stockName)
    }, 24 * 60 * 60 * 1000) // 24 hours

    return NextResponse.json({ 
      stockName,
      logoUrl,
      source
    })

  } catch (error) {
    console.error('Stock logo API error:', error)
    
    // Return fallback logo even on error
    const stockName = new URL(request.url).searchParams.get('stock') || 'STOCK'
    const fallbackLogo = generateFallbackLogo(stockName)
    
    return NextResponse.json({ 
      stockName,
      logoUrl: fallbackLogo,
      source: 'fallback',
      error: 'Failed to fetch logo'
    })
  }
}
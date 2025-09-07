'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge, Spinner } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'
import StockDisplay from '../../../components/StockDisplay'
import { getStockSymbolByName } from '../../../utils/stockUtils'

export default function BuySellPage() {
  const [user, setUser] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [holdingsLoading, setHoldingsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [stockLogos, setStockLogos] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })
  // Investment balance states
  const [investmentData, setInvestmentData] = useState({
    totalInvestment: 0,
    investedInTrades: 0,
    remainingBalance: 0
  })
  const [investmentLoading, setInvestmentLoading] = useState(true)
  const [portfolioTotals, setPortfolioTotals] = useState({
    totalInvestment: 0
  })
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [currentValue, setCurrentValue] = useState(0)
  const [currentValueLoading, setCurrentValueLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // Add Trade Modal states
  const [showAddTradeModal, setShowAddTradeModal] = useState(false)
  const [addTradeFormData, setAddTradeFormData] = useState({
    stockName: '',
    purchaseRate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    unitsPurchased: ''
  })
  
  // Stock autocomplete states
  const [showStockSuggestions, setShowStockSuggestions] = useState(false)
  const [stockSuggestions, setStockSuggestions] = useState([])
  const [stockSymbols, setStockSymbols] = useState({})
  const [loadingStocks, setLoadingStocks] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  
  // Stock search function
  const searchStocks = async (query) => {
    if (!query || query.trim().length < 2) {
      setStockSuggestions([])
      return
    }

    setLoadingStocks(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStockSuggestions(data.suggestions || [])
      } else {
        setStockSuggestions([])
      }
    } catch (error) {
      console.error('Error searching stocks:', error)
      setStockSuggestions([])
    } finally {
      setLoadingStocks(false)
    }
  }

  // Handle stock name input change with debouncing
  const handleStockNameChange = (e) => {
    const value = e.target.value
    setAddTradeFormData({...addTradeFormData, stockName: value})
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      searchStocks(value)
    }, 300)
    
    setSearchTimeout(newTimeout)
    setShowStockSuggestions(true)
  }

  // Handle stock selection from dropdown
  const handleStockSelect = (stock) => {
    setAddTradeFormData({...addTradeFormData, stockName: stock.symbol})
    setStockSuggestions([])
    setShowStockSuggestions(false)
  }
  
  // Sell form state
  const [sellForm, setSellForm] = useState({
    sellingPrice: '',
    sellingDate: new Date().toISOString().split('T')[0],
    unitsSold: ''
  })
  
  // Modal states
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState(null)

  useEffect(() => {
    fetchUserData()
    fetchHoldings()
    fetchInvestmentData()
    fetchPortfolioTotals()
    fetchCurrentValue()
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchInvestmentData = async () => {
    try {
      setInvestmentLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/investment-balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvestmentData({
          totalInvestment: data.totalInvestment || 0,
          investedInTrades: data.investedInTrades || 0,
          remainingBalance: data.remainingBalance || 0
        })
      } else {
        throw new Error('Failed to fetch investment data')
      }
    } catch (error) {
      console.error('Error fetching investment data:', error)
      showAlert('Failed to fetch investment data', 'danger')
    } finally {
      setInvestmentLoading(false)
    }
  }

  const fetchPortfolioTotals = async () => {
    try {
      setPortfolioLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/portfolio-totals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setPortfolioTotals({
          totalInvestment: result.data.totalInvestment || 0
        })
      } else {
        throw new Error('Failed to fetch portfolio totals')
      }
    } catch (error) {
      console.error('Error fetching portfolio totals:', error)
      showAlert('Failed to fetch portfolio totals', 'danger')
    } finally {
      setPortfolioLoading(false)
    }
  }

  const fetchCurrentValue = async () => {
    try {
      setCurrentValueLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/current-value', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setCurrentValue(result.currentValue || 0)
      } else {
        throw new Error('Failed to fetch current value')
      }
    } catch (error) {
      console.error('Error fetching current value:', error)
      showAlert('Failed to fetch current value', 'danger')
    } finally {
      setCurrentValueLoading(false)
    }
  }

  const initializeCurrentValue = async () => {
    try {
      setCurrentValueLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/current-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'initialize'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setCurrentValue(result.currentValue || 0)
        showAlert('Current value initialized successfully', 'success')
        console.log('Initialization details:', result.details)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize current value')
      }
    } catch (error) {
      console.error('Error initializing current value:', error)
      showAlert('Failed to initialize current value: ' + error.message, 'danger')
    } finally {
      setCurrentValueLoading(false)
    }
  }

  const fetchStockLogo = async (stockName) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stock-logo?stock=${encodeURIComponent(stockName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.logoUrl
      }
    } catch (error) {
      console.error('Error fetching stock logo:', error)
    }
    return null
  }

  // Function to fetch stock symbols for holdings
  const fetchStockSymbols = async (holdingsList) => {
    const uniqueStockNames = [...new Set(holdingsList.map(holding => holding.stockName))]
    const symbols = {}
    
    for (const stockName of uniqueStockNames) {
      try {
        const symbol = await getStockSymbolByName(stockName)
        symbols[stockName] = symbol
      } catch (error) {
        console.error(`Error fetching symbol for ${stockName}:`, error)
        symbols[stockName] = null
      }
    }
    
    setStockSymbols(symbols)
  }

  const fetchHoldings = async () => {
    try {
      setHoldingsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/holdings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setHoldings(data.holdings)
        
        // Fetch stock symbols for the loaded holdings
        await fetchStockSymbols(data.holdings)
        
        // Fetch logos for all unique stocks
        const uniqueStocks = [...new Set(data.holdings.map(h => h.stockName))]
        const logoPromises = uniqueStocks.map(async (stockName) => {
          const logoUrl = await fetchStockLogo(stockName)
          return { stockName, logoUrl }
        })
        
        const logoResults = await Promise.all(logoPromises)
        const logoMap = {}
        logoResults.forEach(({ stockName, logoUrl }) => {
          logoMap[stockName] = logoUrl
        })
        setStockLogos(logoMap)
      } else {
        throw new Error('Failed to fetch holdings')
      }
    } catch (error) {
      console.error('Error fetching holdings:', error)
      showAlert('Failed to fetch holdings', 'danger')
    } finally {
      setHoldingsLoading(false)
      setLoading(false)
    }
  }



  const handleSellSubmit = async (e) => {
    e.preventDefault()
    if (!selectedHolding) return
    
    try {
      setSubmitLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/buy-sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'sell',
          holdingId: selectedHolding._id,
          ...sellForm,
          sellingPrice: parseFloat(sellForm.sellingPrice),
          unitsSold: parseInt(sellForm.unitsSold)
        })
      })
      
      if (response.ok) {
        showAlert('Stock sold successfully!', 'success')
        setSellForm({ 
          sellingPrice: '', 
          sellingDate: new Date().toISOString().split('T')[0], 
          unitsSold: '' 
        })
        setShowSellModal(false)
        setSelectedHolding(null)
        fetchHoldings()
        fetchInvestmentData() // Refresh investment data to show updated totals
        fetchPortfolioTotals() // Refresh portfolio totals to reflect profit/loss
        fetchCurrentValue() // Refresh current value after sell transaction
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to sell stock')
      }
    } catch (error) {
      console.error('Error selling stock:', error)
      showAlert(error.message, 'danger')
    } finally {
      setSubmitLoading(false)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000)
  }

  // Calculate if trade amount exceeds total investment
  const isTradeAmountValid = () => {
    const purchaseRate = parseFloat(addTradeFormData.purchaseRate) || 0
    const unitsPurchased = parseInt(addTradeFormData.unitsPurchased) || 0
    const tradeAmount = purchaseRate * unitsPurchased
    
    if (tradeAmount === 0) return true // Allow empty form
    return tradeAmount <= portfolioTotals.totalInvestment
  }

  const handleAddTradeSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitLoading(true)
      
      // Calculate trade amount
      const tradeAmount = parseFloat(addTradeFormData.purchaseRate) * parseInt(addTradeFormData.unitsPurchased)
      
      // Validate against total investment
      if (tradeAmount > portfolioTotals.totalInvestment) {
        showAlert(`Trade amount ₹${tradeAmount.toLocaleString()} exceeds total investment ₹${portfolioTotals.totalInvestment.toLocaleString()}`, 'danger')
        return
      }
      
      // Calculate remaining balance: Total Investment - Amount invested in trades
      const remainingBalance = portfolioTotals.totalInvestment - investmentData.investedInTrades
      
      // Validate against remaining balance
      if (tradeAmount > remainingBalance) {
        showAlert(`Trade amount ₹${tradeAmount.toLocaleString()} exceeds remaining balance ₹${remainingBalance.toLocaleString()}`, 'danger')
        return
      }
      
      const token = localStorage.getItem('token')
      
      // Decode token to get userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const userId = tokenPayload.userId
      
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          stockName: addTradeFormData.stockName,
          purchaseRate: parseFloat(addTradeFormData.purchaseRate),
          unitsPurchased: parseInt(addTradeFormData.unitsPurchased),
          purchaseDate: addTradeFormData.purchaseDate
        })
      })
      
      if (response.ok) {
        showAlert('Trade added successfully!', 'success')
        setShowAddTradeModal(false)
        setAddTradeFormData({
          stockName: '',
          purchaseRate: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          unitsPurchased: '',
          sellingPrice: '',
          sellingDate: '',
          unitsSold: ''
        })
        fetchHoldings()
        fetchInvestmentData() // Refresh investment balance after successful trade
        fetchPortfolioTotals() // Refresh portfolio totals after successful trade
        fetchCurrentValue() // Refresh current value after successful trade
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add trade')
      }
    } catch (error) {
      console.error('Error adding trade:', error)
      showAlert(error.message, 'danger')
    } finally {
      setSubmitLoading(false)
    }
  }

  const openSellModal = (holding) => {
    setSelectedHolding(holding)
    setSellForm({
      sellingPrice: '',
      sellingDate: new Date().toISOString().split('T')[0],
      unitsSold: ''
    })
    setShowSellModal(true)
  }

  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    position: 'relative',
    overflow: 'hidden'
  }

  const containerStyle = {
    position: 'relative',
    zIndex: 2
  }

  const headerStyle = {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  animation: 'spin 1s linear infinite'
                }}
              >
                <i className="bi bi-arrow-left-right text-white" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
            <h4 className="text-white mb-2">Loading Buy/Sell</h4>
            <p className="text-white-50">Please wait while we fetch your holdings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...pageStyle, position: 'fixed', width: '100%', height: '100vh' }}>
      {/* Animated Background Elements */}
      <div 
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Navbar user={user} isAdmin={true} />
      </div>
      <div className="d-flex" style={{ height: '100vh', paddingTop: '76px' }}>
        <div style={{ flexShrink: 0, position: 'fixed', left: 0, top: '76px', bottom: 0, zIndex: 999 }}>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        <div 
          className="flex-grow-1" 
          style={{ 
            minWidth: 0, 
            overflow: 'auto',
            height: 'calc(100vh - 76px)',
            marginLeft: isSidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Container fluid className="py-4" style={containerStyle}>
            <Row>
              <Col>
                <div style={headerStyle}>
                  <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-3 p-3 me-3"
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="bi bi-arrow-left-right text-white fs-3"></i>
                        </div>
                        <div>
                          <h1 
                            style={{
                              fontSize: '2rem',
                              fontWeight: '700',
                              color: 'white',
                              margin: '0'
                            }}
                          >
                            Buy / Sell Stocks
                          </h1>
                          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0', fontSize: '1rem' }}>
                            Purchase new stocks or sell existing holdings
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setAddTradeFormData({
                            stockName: '',
                            purchaseRate: '',
                            unitsPurchased: '',
                            purchaseDate: new Date().toISOString().split('T')[0]
                          })
                          setShowAddTradeModal(true)
                        }}
                        style={{
                          background: '#667eea',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '12px 24px',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add New Trade
                      </Button>
                    </div>
                </div>
              </Col>
            </Row>

            {alert.show && (
              <Row>
                <Col>
                  <Alert variant={alert.type} onClose={() => setAlert({ show: false, message: '', type: 'success' })} dismissible>
                    {alert.message}
                  </Alert>
                </Col>
              </Row>
            )}

            {/* Investment Balance Cards */}
            <Row className="mb-4">
              <Col md={4}>
                <Card style={{
                  ...cardStyle,
                  background: currentValue >= 0 ? '#27ae60' : '#e74c3c',
                  color: 'white',
                  border: 'none'
                }}>
                  <Card.Body style={{ padding: '24px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            className="rounded-3 p-2 me-3"
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className={`bi ${currentValue >= 0 ? 'bi-wallet2' : 'bi-exclamation-triangle'} text-white`}></i>
                          </div>
                          <div>
                            <h6 style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9' }}>Current Value</h6>
                            {currentValueLoading ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <div>
                                <h4 style={{ margin: '0', fontWeight: '700' }}>₹{currentValue.toLocaleString()}</h4>
                                {currentValue === 0 && (
                                  <Button 
                                    size="sm" 
                                    variant="light" 
                                    onClick={initializeCurrentValue}
                                    disabled={currentValueLoading}
                                    style={{ 
                                      marginTop: '8px',
                                      fontSize: '12px',
                                      padding: '4px 12px',
                                      borderRadius: '8px',
                                      background: 'rgba(255,255,255,0.3)',
                                      border: '1px solid rgba(255,255,255,0.4)',
                                      color: 'white'
                                    }}
                                  >
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    Initialize
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card style={{
                  ...cardStyle,
                  background: '#3498db',
                  color: 'white',
                  border: 'none'
                }}>
                  <Card.Body style={{ padding: '24px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            className="rounded-3 p-2 me-3"
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-graph-up text-white"></i>
                          </div>
                          <div>
                            <h6 style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9' }}>Invested in Trades</h6>
                            {investmentLoading ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <h4 style={{ margin: '0', fontWeight: '700' }}>₹{investmentData.investedInTrades.toLocaleString()}</h4>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card style={{
                  ...cardStyle,
                  background: '#27ae60',
                  color: 'white',
                  border: 'none'
                }}>
                  <Card.Body style={{ padding: '24px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            className="rounded-3 p-2 me-3"
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-wallet2 text-white"></i>
                          </div>
                          <div>
                            <h6 style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9' }}>Remaining Balance</h6>
                            {investmentLoading || currentValueLoading ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <h4 style={{ margin: '0', fontWeight: '700' }}>₹{(currentValue - investmentData.investedInTrades).toLocaleString()}</h4>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col lg={12}>
                <Card style={cardStyle}>
                  <Card.Body style={{ padding: '32px' }}>
                    <div className="d-flex align-items-center mb-4">
                      <div 
                        className="rounded-3 p-2 me-3"
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-wallet2 text-white"></i>
                      </div>
                      <h5 
                        style={{
                          margin: '0',
                          fontSize: '1.4rem',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}
                      >
                        Current Holdings
                      </h5>
                    </div>
                    
                    {holdingsLoading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" style={{ color: '#667eea' }} />
                        <h6 className="mt-3 text-muted">Loading Holdings...</h6>
                        <p className="text-muted">Please wait while we fetch your data</p>
                      </div>
                    ) : holdings.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                        <h6 className="mt-3 text-muted">No Holdings Found</h6>
                        <p className="text-muted">Start by purchasing some stocks</p>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Table hover style={{ margin: '0', background: 'white', fontSize: '14px', tableLayout: 'auto', width: '100%' }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%)' }}>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>User</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>Stock</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>Remaining Units</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>Avg. Price</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>Investment</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderRight: '1px solid #dee2e6',
                                whiteSpace: 'nowrap'
                              }}>Purchase Date</th>
                              <th style={{ 
                                border: 'none', 
                                padding: '16px 20px', 
                                fontWeight: '700', 
                                fontSize: '13px', 
                                color: '#2c3e50',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap'
                              }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{borderTop: '2px solid #dee2e6'}}>
                            {holdings.map((holding, index) => (
                              <tr key={holding._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', borderRight: '1px solid #f8f9fa' }}>
                                  <div className="d-flex align-items-center justify-content-center">
                                    <div 
                                      className="rounded-circle me-3"
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        background: `linear-gradient(135deg, #28a745 0%, #20c997 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      {holding.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '13px' }}>{holding.user?.name || 'Unknown User'}</div>
                                      <small className="text-muted">{holding.user?.userCode || 'N/A'}</small>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #f8f9fa' }}>
                                  <div className="d-flex align-items-center justify-content-center">
                                    <StockDisplay 
                                      stockName={holding.stockName}
                                      stockSymbol={stockSymbols[holding.stockName]}
                                      size="me"
                                      showName={true}
                                    />
                                  </div>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #f8f9fa' }}>
                                  <Badge 
                                    bg="primary" 
                                    style={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '12px'
                                    }}
                                  >
                                    {holding.remainingUnits} units
                                  </Badge>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #f8f9fa' }}>
                                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>₹{holding.avgPrice?.toFixed(2) || holding.purchaseRate.toFixed(2)}</span>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #f8f9fa' }}>
                                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>₹{holding.totalInvestment?.toFixed(2) || (holding.remainingUnits * holding.purchaseRate).toFixed(2)}</span>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #f8f9fa' }}>
                                  <span style={{ color: '#6c757d', fontSize: '13px' }}>{format(new Date(holding.purchaseDate), 'MMM dd, yyyy')}</span>
                                </td>
                                <td style={{ padding: '16px 20px', border: 'none', verticalAlign: 'middle', textAlign: 'center' }}>
                                  <Button
                                    size="sm"
                                    onClick={() => openSellModal(holding)}
                                    style={{
                                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '6px 16px',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    <i className="bi bi-arrow-up-right me-1"></i>
                                    Sell
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Sell Modal */}
      <Modal show={showSellModal} onHide={() => setShowSellModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%)', border: 'none' }}>
          <Modal.Title style={{ color: '#2c3e50', fontWeight: '700' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="bi bi-arrow-up-right"></i>
              <span>Sell Stock:</span>
              {selectedHolding && (
                <StockDisplay 
                  stockName={selectedHolding.stockName}
                  stockSymbol={stockSymbols[selectedHolding.stockName]}
                  size="md"
                  showName={true}
                />
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '32px' }}>
          {selectedHolding && (
            <>
              <div className="mb-4 p-3" style={{ background: '#f8f9ff', borderRadius: '12px' }}>
                <Row>
                  <Col md={6}>
                    <small className="text-muted">Available Units</small>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2c3e50' }}>
                      {selectedHolding.remainingUnits} units
                    </div>
                  </Col>
                  <Col md={6}>
                    <small className="text-muted">Average Purchase Price</small>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2c3e50' }}>
                      ₹{selectedHolding.avgPrice?.toFixed(2) || selectedHolding.purchaseRate.toFixed(2)}
                    </div>
                  </Col>
                </Row>
              </div>
              
              <Form onSubmit={handleSellSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Selling Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={sellForm.sellingPrice}
                        onChange={(e) => setSellForm({...sellForm, sellingPrice: e.target.value})}
                        required
                        style={{
                          borderRadius: '12px',
                          border: '2px solid rgba(102, 126, 234, 0.2)',
                          padding: '12px 16px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Selling Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={sellForm.sellingDate}
                        onChange={(e) => setSellForm({...sellForm, sellingDate: e.target.value})}
                        required
                        style={{
                          borderRadius: '12px',
                          border: '2px solid rgba(102, 126, 234, 0.2)',
                          padding: '12px 16px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Units to Sell</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="number"
                      max={selectedHolding.remainingUnits}
                      value={sellForm.unitsSold}
                      onChange={(e) => setSellForm({...sellForm, unitsSold: e.target.value})}
                      required
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        flex: 1
                      }}
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setSellForm({...sellForm, unitsSold: selectedHolding.remainingUnits.toString()})}
                      style={{
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontWeight: '600',
                        fontSize: '16px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Select All Units
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Maximum: {selectedHolding.remainingUnits} units
                  </Form.Text>
                </Form.Group>
                
                <div className="d-flex gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowSellModal(false)}
                    style={{
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      flex: 1
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitLoading}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      flex: 1
                    }}
                  >
                    {submitLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up-right me-2"></i>
                        Sell Stock
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Trade Modal */}
      <Modal 
        show={showAddTradeModal} 
        onHide={() => setShowAddTradeModal(false)} 
        size="lg"
        centered
        style={{
          backdropFilter: 'blur(8px)'
        }}
      >
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title style={{ fontWeight: '600', fontSize: '1.5rem' }}>
            <i className="bi bi-plus-circle me-2"></i>
            Add New Trade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem', backgroundColor: '#f8f9fa' }}>
          <Form onSubmit={handleAddTradeSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="bi bi-graph-up me-2"></i>
                    Stock Name *
                  </Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      value={addTradeFormData.stockName}
                      onChange={handleStockNameChange}
                      required
                      placeholder="Type to search stocks..."
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea'
                        setShowStockSuggestions(true)
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'
                        // Delay hiding suggestions to allow for selection
                        setTimeout(() => setShowStockSuggestions(false), 200)
                      }}
                    />
                    {showStockSuggestions && stockSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}>
                        {stockSuggestions.map((stock, index) => (
                          <div
                            key={stock.id}
                            onClick={() => handleStockSelect(stock)}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: index < stockSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9ff'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div className="d-flex align-items-center">
                              <StockDisplay 
                                stockName={stock.name}
                                stockSymbol={stock.symbol}
                                size="sm"
                                showName={false}
                              />
                              <div className="ms-3">
                                <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                  {stock.symbol}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                  {stock.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {loadingStocks && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        padding: '12px 16px',
                        zIndex: 1000,
                        textAlign: 'center',
                        color: '#6c757d'
                      }}>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Searching stocks...
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="bi bi-currency-rupee me-2"></i>
                    Purchase Rate (₹) *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={addTradeFormData.purchaseRate}
                    onChange={(e) => setAddTradeFormData({...addTradeFormData, purchaseRate: e.target.value})}
                    required
                    placeholder="0.00"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="bi bi-box me-2"></i>
                    Units Purchased *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    min="1"
                    value={addTradeFormData.unitsPurchased}
                    onChange={(e) => setAddTradeFormData({...addTradeFormData, unitsPurchased: e.target.value})}
                    required
                    placeholder="Enter quantity"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="bi bi-calendar-event me-2"></i>
                    Purchase Date *
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={addTradeFormData.purchaseDate}
                    onChange={(e) => setAddTradeFormData({...addTradeFormData, purchaseDate: e.target.value})}
                    required
                    style={{
                      borderRadius: '12px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-3 mt-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowAddTradeModal(false)}
                style={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  border: '2px solid #6c757d',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitLoading || !isTradeAmountValid()}
                style={{
                  background: submitLoading || !isTradeAmountValid() 
                    ? 'linear-gradient(135deg, #6c757d 0%, #6c757d 100%)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  boxShadow: submitLoading || !isTradeAmountValid() 
                    ? '0 4px 15px rgba(108, 117, 125, 0.3)' 
                    : '0 4px 15px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: submitLoading || !isTradeAmountValid() ? 'not-allowed' : 'pointer'
                }}
              >
                {submitLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Adding Trade...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Trade
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
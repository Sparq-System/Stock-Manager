'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'
import StockDisplay from '../../../components/StockDisplay'

const TradeDetailsContent = ({ viewingTrade }) => {
  const [stockSymbol, setStockSymbol] = useState(null)
  
  useEffect(() => {
    const fetchSymbol = async () => {
      if (viewingTrade?.stockName) {
        try {
          const response = await fetch(`/api/stock-symbol?name=${encodeURIComponent(viewingTrade.stockName)}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          const symbol = data.symbol || null
          setStockSymbol(symbol)
        } catch (error) {
          console.error('Error fetching stock symbol:', error)
          setStockSymbol(null)
        }
      } else {
        setStockSymbol(null)
      }
    }
    
    fetchSymbol()
  }, [viewingTrade?.stockName])
  
  if (!viewingTrade) return null;
  
  return (
    <div className="row g-4">
      {/* Stock Information */}
      <div className="col-12">
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(102, 126, 234, 0.25)',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '18px 25px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h5 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-building me-2" style={{ fontSize: '18px' }}></i>
              Stock Information
            </h5>
          </div>
          <div style={{
            background: 'white',
            padding: '25px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              {/* Stock Display with Image, Symbol, and Company Name */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <StockDisplay 
                  stockName={viewingTrade.stockName}
                  stockSymbol={stockSymbol || 'N/A'}
                  size="large"
                  showName={true}
                />
              </div>
              
              {/* Status Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                {/* Trade Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Status:</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    backgroundColor: (() => {
                      switch(viewingTrade.status) {
                        case 'active': return '#e3f2fd';
                        case 'partial': return '#fff3e0';
                        case 'sold': return '#e8f5e8';
                        default: return '#f5f5f5';
                      }
                    })(),
                    color: (() => {
                      switch(viewingTrade.status) {
                        case 'active': return '#1976d2';
                        case 'partial': return '#f57c00';
                        case 'sold': return '#388e3c';
                        default: return '#666';
                      }
                    })()
                  }}>
                    {viewingTrade.status === 'partial' ? 'Partially Sold' : viewingTrade.status}
                  </span>
                </div>
                
                {/* Profit/Loss Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Last Trade:</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: (() => {
                      if (viewingTrade.unitsSold > 0 && viewingTrade.sellingPrice) {
                        const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsSold * viewingTrade.purchaseRate);
                        return totalReturn >= 0 ? '#e8f5e8' : '#ffebee';
                      }
                      return '#f5f5f5';
                    })(),
                    color: (() => {
                      if (viewingTrade.unitsSold > 0 && viewingTrade.sellingPrice) {
                        const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsSold * viewingTrade.purchaseRate);
                        return totalReturn >= 0 ? '#388e3c' : '#d32f2f';
                      }
                      return '#666';
                    })()
                  }}>
                    {(() => {
                      if (viewingTrade.unitsSold > 0 && viewingTrade.sellingPrice) {
                        const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsSold * viewingTrade.purchaseRate);
                        return totalReturn >= 0 ? 'Profit' : 'Loss';
                      }
                      return 'No Sale';
                    })()
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase and Selling Details */}
      <div className="col-md-6">
        <div 
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(79, 172, 254, 0.25)',
            border: 'none',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '18px 25px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h5 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-cart-plus me-2" style={{ fontSize: '18px' }}></i>
              Purchase Details
            </h5>
          </div>
          <div style={{
            background: 'white',
            padding: '25px',
            height: 'calc(100% - 60px)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Purchase Date</span>
                <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                  {new Date(viewingTrade.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Units Purchased</span>
                <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                  {Math.round(viewingTrade.unitsPurchased)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Purchase Rate</span>
                <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                  ₹{viewingTrade.purchaseRate.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '0' }}>
              <div style={{ 
                padding: '16px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                  Total Investment
                </div>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                  ₹{(viewingTrade.unitsPurchased * viewingTrade.purchaseRate).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div 
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(255, 107, 107, 0.25)',
            border: 'none',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '18px 25px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h5 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-cart-dash me-2" style={{ fontSize: '18px' }}></i>
              Selling Details
            </h5>
          </div>
          <div style={{
            background: 'white',
            padding: '25px',
            height: 'calc(100% - 60px)'
          }}>
            {viewingTrade.sellingDate ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Selling Date</span>
                    <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                      {new Date(viewingTrade.sellingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Units Sold</span>
                    <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                      {Math.round(viewingTrade.unitsSold) || 0}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>Selling Price</span>
                    <span style={{ color: '#2c3e50', fontSize: '15px', fontWeight: '600' }}>
                      ₹{(viewingTrade.sellingPrice || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: '0' }}>
                  <div style={{ 
                    padding: '16px',
                    background: (() => {
                      const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsPurchased * viewingTrade.purchaseRate);
                      return totalReturn >= 0 
                        ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
                        : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                    })(),
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: (() => {
                      const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsPurchased * viewingTrade.purchaseRate);
                      return totalReturn >= 0 
                        ? '0 4px 15px rgba(46, 204, 113, 0.3)'
                        : '0 4px 15px rgba(231, 76, 60, 0.3)';
                    })()
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                      Return
                    </div>
                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                      {(() => {
                        const totalReturn = (viewingTrade.unitsSold * viewingTrade.sellingPrice) - (viewingTrade.unitsPurchased * viewingTrade.purchaseRate);
                        return totalReturn >= 0 
                          ? `+₹${totalReturn.toFixed(2)}`
                          : `-₹${Math.abs(totalReturn).toFixed(2)}`;
                      })()} 
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#7f8c8d', 
                fontSize: '16px',
                fontStyle: 'italic',
                padding: '40px 20px'
              }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                Not sold yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TradesManagement() {
  const [trades, setTrades] = useState([])
  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingTrade, setViewingTrade] = useState(null)
  const [stockSymbols, setStockSymbols] = useState({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)


  // Function to fetch stock symbols for trades
  const fetchStockSymbols = async (tradesList) => {
    const uniqueStockNames = [...new Set(tradesList.map(trade => trade.stockName))]
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

  useEffect(() => {
    fetchUserData()
    fetchTrades()
  }, [])

  const fetchUserData = async () => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }



  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/trades?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades)
        // Fetch stock symbols for the loaded trades
        await fetchStockSymbols(data.trades)
      } else {
        setError('Failed to fetch trades')
      }
    } catch (error) {
      setError('Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }

  // Pagination helper functions
  const getFilteredTrades = () => {
    return trades
      .filter(trade => 
        trade.stockName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getPaginatedTrades = () => {
    const filteredTrades = getFilteredTrades()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTrades.slice(startIndex, endIndex)
  }

  // Update total pages when trades or search term changes
  useEffect(() => {
    const filteredTrades = getFilteredTrades()
    const newTotalPages = Math.ceil(filteredTrades.length / itemsPerPage)
    setTotalPages(newTotalPages)
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1)
    }
  }, [trades, searchTerm, itemsPerPage, currentPage])







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

  const tableCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  }

  const addButtonStyle = {
    background: '#667eea',
    border: 'none',
    borderRadius: '16px',
    padding: '12px 24px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
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
                <i className="bi bi-graph-up text-white" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
            <h4 className="text-white mb-2">Loading Trades</h4>
            <p className="text-white-50">Please wait while we fetch trading data...</p>
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
        <Navbar user={user} />
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
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-graph-up text-white fs-3"></i>
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
                          Trades Management
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0', fontSize: '1rem' }}>
                          Monitor and manage all trading activities
                        </p>
                      </div>
                    </div>

                   </div>
                 </div>
              </Col>
            </Row>

            {error && (
              <Row>
                <Col>
                  <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                  </Alert>
                </Col>
              </Row>
            )}

            <Row>
              <Col>
                <Card style={tableCardStyle}>
                  <Card.Body style={{ padding: '32px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-3 p-2 me-3"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="bi bi-table text-white"></i>
                        </div>
                        <h5 
                          style={{
                            margin: '0',
                            fontSize: '1.4rem',
                            fontWeight: '600',
                            color: '#2c3e50'
                          }}
                        >
                          All Trades
                        </h5>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ position: 'relative' }}>
                          <i 
                            className="bi bi-search"
                            style={{
                              position: 'absolute',
                              left: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#6c757d',
                              zIndex: 1
                            }}
                          ></i>
                          <Form.Control
                            type="text"
                            placeholder="Search by stock name..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value)
                              setCurrentPage(1) // Reset to first page on search
                            }}
                            style={{
                              width: '320px',
                              borderRadius: '12px',
                              border: '2px solid rgba(102, 126, 234, 0.2)',
                              paddingLeft: '45px',
                              paddingRight: '16px',
                              paddingTop: '12px',
                              paddingBottom: '12px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              background: 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#667eea'
                              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                              e.target.style.background = 'white'
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'
                              e.target.style.boxShadow = 'none'
                              e.target.style.background = 'rgba(255,255,255,0.8)'
                            }}
                          />
                        </div>
                        
                        {/* Items per page selector */}
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Show:</span>
                          <Form.Select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value))
                              setCurrentPage(1) // Reset to first page when changing items per page
                            }}
                            style={{
                              width: '80px',
                              borderRadius: '8px',
                              border: '2px solid rgba(102, 126, 234, 0.2)',
                              fontSize: '14px',
                              fontWeight: '500',
                              background: 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)',
                              padding: '8px 12px'
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </Form.Select>
                        </div>
                      </div>
                    </div>
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
                            }}>Stock Name</th>
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
                              borderRight: '1px solid #dee2e6',
                              whiteSpace: 'nowrap'
                            }}>Total Investment</th>
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
                            }}>Profit</th>
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
                            }}>Status</th>
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
                        <tbody style={{
                          borderTop: '2px solid #e9ecef'
                        }}>
                          {getFilteredTrades().length === 0 ? (
                            <tr>
                              <td 
                                colSpan="6" 
                                style={{
                                  textAlign: 'center',
                                  padding: '40px 20px',
                                  color: '#6c757d',
                                  fontSize: '14px',
                                  border: 'none'
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  gap: '12px'
                                }}>
                                  <i className="bi bi-inbox" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
                                  <div>
                                    <h6 style={{ color: '#495057', marginBottom: '4px', fontWeight: '500' }}>
                                      {searchTerm ? 'No matching trades found' : 'No trades available'}
                                    </h6>
                                    <p style={{ color: '#6c757d', margin: '0', fontSize: '13px' }}>
                                      {searchTerm ? `No trades found for "${searchTerm}"` : 'Start by adding your first trade'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            getPaginatedTrades().map((trade, index) => {
                              // Calculate return (profit/loss)
                              const calculateReturn = () => {
                                if (!trade.sellingPrice || !trade.unitsSold) {
                                  return { amount: 0, isProfit: null };
                                }
                                const purchaseCost = trade.unitsSold * trade.purchaseRate;
                                const sellingAmount = trade.unitsSold * trade.sellingPrice;
                                const returnAmount = sellingAmount - purchaseCost;
                                return {
                                  amount: returnAmount,
                                  isProfit: returnAmount > 0
                                };
                              };
                              
                              const returnData = calculateReturn();
                              
                              return (
                              <tr 
                                key={trade._id}
                                style={{
                                  background: index % 2 === 0 
                                    ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
                                    : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                                  borderBottom: '1px solid #e9ecef',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = index % 2 === 0 
                                    ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
                                    : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px', 
                                  fontWeight: '600', 
                                  color: '#2c3e50', 
                                  fontSize: '14px',
                                  borderRight: '1px solid #f1f3f4',
                                  textAlign: 'center'
                                }}>
                                  <StockDisplay 
                                    stockName={trade.stockName}
                                    stockSymbol={stockSymbols[trade.stockName]}
                                    size="sm"
                                    showName={true}
                                  />
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px', 
                                  fontWeight: '500', 
                                  color: '#6c757d', 
                                  fontSize: '13px',
                                  borderRight: '1px solid #f1f3f4',
                                  textAlign: 'center'
                                }}>
                                  {format(new Date(trade.purchaseDate), 'MMM dd, yyyy')}
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px', 
                                  fontWeight: '600', 
                                  color: '#2c3e50', 
                                  fontSize: '14px',
                                  borderRight: '1px solid #f1f3f4',
                                  textAlign: 'center'
                                }}>
                                  ₹{(trade.unitsPurchased * trade.purchaseRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px',
                                  borderRight: '1px solid #f1f3f4',
                                  textAlign: 'center'
                                }}>
                                  {trade.sellingDate && trade.unitsSold ? (
                                    <div>
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: returnData.isProfit ? '#28a745' : '#dc3545',
                                        marginBottom: '2px'
                                      }}>
                                        {returnData.isProfit ? '+' : ''}₹{Math.abs(returnData.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                      </div>
                                      <div style={{
                                        fontSize: '12px',
                                        color: returnData.isProfit ? '#28a745' : '#dc3545',
                                        fontWeight: '500'
                                      }}>
                                        ({returnData.isProfit ? '+' : ''}{((returnData.amount / (trade.unitsSold * trade.purchaseRate)) * 100).toFixed(2)}%)
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{
                                      fontSize: '13px',
                                      color: '#6c757d',
                                      fontStyle: 'italic'
                                    }}>
                                      Active Trade
                                    </div>
                                  )}
                                </td>
                                <td style={{ 
                                   border: 'none', 
                                   padding: '18px 20px',
                                   textAlign: 'center',
                                   borderRight: '1px solid #f1f3f4'
                                 }}>
                                   {trade.sellingDate && trade.unitsSold ? (
                                     <span style={{
                                       padding: '6px 12px',
                                       background: returnData.isProfit ? '#d4edda' : '#f8d7da',
                                       borderRadius: '20px',
                                       display: 'inline-block',
                                       color: returnData.isProfit ? '#155724' : '#721c24',
                                       fontWeight: '600',
                                       fontSize: '12px',
                                       textTransform: 'uppercase',
                                       letterSpacing: '0.5px',
                                       border: `1px solid ${returnData.isProfit ? '#c3e6cb' : '#f5c6cb'}`
                                     }}>
                                       {returnData.isProfit ? 'Profit' : 'Loss'}
                                     </span>
                                   ) : (
                                     <span style={{
                                       padding: '6px 12px',
                                       background: '#fff3cd',
                                       borderRadius: '20px',
                                       display: 'inline-block',
                                       color: '#856404',
                                       fontSize: '12px',
                                       fontWeight: '600',
                                       textTransform: 'uppercase',
                                       letterSpacing: '0.5px',
                                       border: '1px solid #ffeaa7'
                                     }}>
                                       Active
                                     </span>
                                   )}
                                 </td>
                                 <td style={{ 
                                   border: 'none', 
                                   padding: '18px 20px'
                                 }}>
                                  <div className="d-flex gap-2 justify-content-center">
                                     <Button 
                                        style={{
                                          background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                          border: 'none',
                                          borderRadius: '8px',
                                          padding: '10px 12px',
                                          fontSize: '14px',
                                          transition: 'all 0.3s ease',
                                          color: 'white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        size="sm"
                                        onClick={() => {
                                          setViewingTrade(trade)
                                          setShowViewModal(true)
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)'
                                          e.target.style.transform = 'translateY(-1px)'
                                          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
                                          e.target.style.transform = 'translateY(0)'
                                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        <i className="bi bi-eye"></i>
                                      </Button>


                                   </div>
                                </td>
                              </tr>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {getFilteredTrades().length > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ fontSize: '14px', color: '#6c757d' }}>
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredTrades().length)} of {getFilteredTrades().length} trades
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2">
                          {/* Previous Button */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            style={{
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '1px solid #667eea',
                              color: currentPage === 1 ? '#6c757d' : '#667eea',
                              background: currentPage === 1 ? '#f8f9fa' : 'white'
                            }}
                          >
                            <i className="bi bi-chevron-left me-1"></i>
                            Previous
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="d-flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "primary" : "outline-primary"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  style={{
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    minWidth: '36px',
                                    border: '1px solid #667eea',
                                    background: currentPage === pageNum ? '#667eea' : 'white',
                                    color: currentPage === pageNum ? 'white' : '#667eea'
                                  }}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          
                          {/* Next Button */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            style={{
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '1px solid #667eea',
                              color: currentPage === totalPages ? '#6c757d' : '#667eea',
                              background: currentPage === totalPages ? '#f8f9fa' : 'white'
                            }}
                          >
                            Next
                            <i className="bi bi-chevron-right ms-1"></i>
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* View Trade Details Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '15px 15px 0 0'
          }}
        >
          <Modal.Title style={{ fontSize: '24px', fontWeight: '700' }}>
            <i className="bi bi-graph-up-arrow me-3"></i>
            Trade Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body 
          style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '30px',
            borderRadius: '0 0 15px 15px'
          }}
        >
          <TradeDetailsContent viewingTrade={viewingTrade} stockSymbols={stockSymbols} />
        </Modal.Body>
        <Modal.Footer
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '0 0 15px 15px',
            padding: '20px 30px'
          }}
        >
          <Button 
            variant="secondary" 
            onClick={() => setShowViewModal(false)}
            style={{
              background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>




    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'

export default function TradesManagement() {
  const [trades, setTrades] = useState([])
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingTrade, setViewingTrade] = useState(null)
  const [formData, setFormData] = useState({
    stockName: '',
    purchaseRate: '',
    purchaseDate: '',
    unitsPurchased: '',
    sellingPrice: '',
    sellingDate: '',
    unitsSold: ''
  })

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
      } else {
        setError('Failed to fetch trades')
      }
    } catch (error) {
      setError('Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const url = '/api/trades'
      const method = editingTrade ? 'PUT' : 'POST'
      
      const token = localStorage.getItem('token')
      const requestBody = {
        ...formData,
        purchaseRate: parseFloat(formData.purchaseRate),
        unitsPurchased: parseFloat(formData.unitsPurchased),
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        unitsSold: formData.unitsSold ? parseFloat(formData.unitsSold) : null
      }
      
      // Validation: Units must be whole numbers
      if (!Number.isInteger(requestBody.unitsPurchased) || requestBody.unitsPurchased <= 0) {
        setError('Units purchased must be a positive whole number')
        return
      }
      
      if (requestBody.unitsSold && (!Number.isInteger(requestBody.unitsSold) || requestBody.unitsSold <= 0)) {
        setError('Units sold must be a positive whole number')
        return
      }
      
      // Validation: Units sold should not exceed units purchased
      if (requestBody.unitsSold && requestBody.unitsSold > requestBody.unitsPurchased) {
        setError('Units sold cannot be greater than units purchased')
        return
      }
      
      // Add tradeId to request body for PUT requests
      if (editingTrade) {
        requestBody.tradeId = editingTrade._id
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        setShowModal(false)
        setEditingTrade(null)
        setFormData({
          stockName: '',
          purchaseRate: '',
          purchaseDate: '',
          unitsPurchased: '',
          sellingPrice: '',
          sellingDate: '',
          unitsSold: ''
        })
        fetchTrades()
      } else {
        const data = await response.json()
        setError(data.message || `Failed to ${editingTrade ? 'update' : 'create'} trade`)
      }
    } catch (error) {
      setError(`Failed to ${editingTrade ? 'update' : 'create'} trade`)
    }
  }

  const handleEdit = (trade) => {
    setEditingTrade(trade)
    setFormData({
      stockName: trade.stockName,
      purchaseRate: trade.purchaseRate.toString(),
      purchaseDate: new Date(trade.purchaseDate).toISOString().split('T')[0],
      unitsPurchased: trade.unitsPurchased.toString(),
      sellingPrice: trade.sellingPrice ? trade.sellingPrice.toString() : '',
      sellingDate: trade.sellingDate ? new Date(trade.sellingDate).toISOString().split('T')[0] : '',
      unitsSold: trade.unitsSold ? trade.unitsSold.toString() : ''
    })
    setShowModal(true)
  }

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/trades?tradeId=${tradeToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchTrades()
        setShowDeleteModal(false)
        setTradeToDelete(null)
      } else {
        setError('Failed to delete trade')
      }
    } catch (error) {
      setError('Failed to delete trade')
    }
  }

  const confirmDelete = (trade) => {
    setTradeToDelete(trade)
    setShowDeleteModal(true)
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

  // Modern page styles
  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    overflow: 'hidden'
  }

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    margin: '20px',
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.2)'
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '32px',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }

  const tableCardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
    overflow: 'hidden'
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
          <Container fluid style={containerStyle}>
            <Row>
              <Col>
                <div style={headerStyle}>
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
                          color: '#2c3e50',
                          margin: '0',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Trades Management
                      </h1>
                      <p style={{ color: '#6c757d', margin: '0', fontSize: '1rem' }}>
                        Monitor and manage all trading activities
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingTrade(null)
                      setFormData({
                        stockName: '',
                        purchaseRate: '',
                        purchaseDate: '',
                        unitsPurchased: '',
                        sellingPrice: '',
                        sellingDate: '',
                        unitsSold: ''
                      })
                      setShowModal(true)
                    }}
                    style={{
                      background: '#4facfe',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'white',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.3)'
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Trade
                  </Button>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                      </div>
                    </div>
                    <div className="table-responsive" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <Table hover style={{ margin: '0', background: 'white', fontSize: '14px', tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '18%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderRight: '1px solid #dee2e6'
                            }}>Stock Name</th>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '15%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderRight: '1px solid #dee2e6'
                            }}>Purchase Date</th>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '16%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderRight: '1px solid #dee2e6'
                            }}>Total Investment</th>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '18%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderRight: '1px solid #dee2e6'
                            }}>Profit</th>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '12%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderRight: '1px solid #dee2e6'
                            }}>Status</th>
                            <th style={{ 
                              border: 'none', 
                              padding: '16px 20px', 
                              fontWeight: '600', 
                              fontSize: '13px', 
                              color: '#495057', 
                              width: '21%',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.filter(trade => 
                            trade.stockName.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 ? (
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
                            trades.filter(trade => 
                              trade.stockName.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((trade, index) => {
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
                                  borderRight: '1px solid #f1f3f4'
                                }}>
                                  {trade.stockName}
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px', 
                                  fontWeight: '500', 
                                  color: '#6c757d', 
                                  fontSize: '13px',
                                  borderRight: '1px solid #f1f3f4'
                                }}>
                                  {format(new Date(trade.purchaseDate), 'MMM dd, yyyy')}
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px', 
                                  fontWeight: '600', 
                                  color: '#2c3e50', 
                                  fontSize: '14px',
                                  borderRight: '1px solid #f1f3f4'
                                }}>
                                  ₹{(trade.unitsPurchased * trade.purchaseRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </td>
                                <td style={{ 
                                  border: 'none', 
                                  padding: '18px 20px',
                                  borderRight: '1px solid #f1f3f4'
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
                                     <Button 
                                        style={{
                                          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                          border: 'none',
                                          borderRadius: '8px',
                                          padding: '10px 12px',
                                          fontSize: '14px',
                                          transition: 'all 0.3s ease',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        size="sm"
                                        onClick={() => handleEdit(trade)}
                                        disabled={trade.unitsSold && trade.unitsSold === trade.unitsPurchased}
                                        onMouseEnter={(e) => {
                                          if (!e.target.disabled) {
                                            e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)'
                                            e.target.style.transform = 'translateY(-1px)'
                                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
                                          e.target.style.transform = 'translateY(0)'
                                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                      </Button>
                                     <Button 
                                       style={{
                                         background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                         border: 'none',
                                         borderRadius: '8px',
                                         padding: '10px 12px',
                                         fontSize: '14px',
                                         transition: 'all 0.3s ease',
                                         boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                       }}
                                       size="sm"
                                       onClick={() => confirmDelete(trade)}
                                       onMouseEnter={(e) => {
                                         e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #a71e2a 100%)'
                                         e.target.style.transform = 'translateY(-1px)'
                                         e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                                       }}
                                       onMouseLeave={(e) => {
                                         e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                         e.target.style.transform = 'translateY(0)'
                                         e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                                       }}
                                     >
                                       <i className="bi bi-trash3"></i>
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
          {viewingTrade && (
            <div className="row g-4">
              {/* Stock Information */}
              <div className="col-12">
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <h5 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '20px', 
                    fontWeight: '700',
                    borderBottom: '2px solid #667eea',
                    paddingBottom: '10px'
                  }}>
                    <i className="bi bi-building me-2"></i>
                    Stock Information
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Stock Name:</strong>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#667eea',
                          marginTop: '5px'
                        }}>
                          {viewingTrade.stockName}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Status:</strong>
                        <div style={{ marginTop: '5px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: viewingTrade.unitsSold && viewingTrade.unitsSold === viewingTrade.unitsPurchased 
                              ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' 
                              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white'
                          }}>
                            {viewingTrade.unitsSold && viewingTrade.unitsSold === viewingTrade.unitsPurchased ? 'Sold' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="col-md-6">
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    height: '100%'
                  }}
                >
                  <h5 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '20px', 
                    fontWeight: '700',
                    borderBottom: '2px solid #4facfe',
                    paddingBottom: '10px'
                  }}>
                    <i className="bi bi-cart-plus me-2"></i>
                    Purchase Details
                  </h5>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#34495e', fontSize: '14px' }}>Purchase Date:</strong>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#4facfe',
                      marginTop: '5px'
                    }}>
                      {new Date(viewingTrade.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#34495e', fontSize: '14px' }}>Units Purchased:</strong>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#4facfe',
                      marginTop: '5px'
                    }}>
                      {viewingTrade.unitsPurchased}
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#34495e', fontSize: '14px' }}>Purchase Rate:</strong>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#4facfe',
                      marginTop: '5px'
                    }}>
                      ₹{viewingTrade.purchaseRate}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0' }}>
                    <strong style={{ color: '#34495e', fontSize: '14px' }}>Total Investment:</strong>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#4facfe',
                      marginTop: '5px',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      borderRadius: '8px'
                    }}>
                      ₹{(viewingTrade.unitsPurchased * viewingTrade.purchaseRate).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selling Details */}
              <div className="col-md-6">
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    height: '100%'
                  }}
                >
                  <h5 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '20px', 
                    fontWeight: '700',
                    borderBottom: '2px solid #ff6b6b',
                    paddingBottom: '10px'
                  }}>
                    <i className="bi bi-cart-dash me-2"></i>
                    Selling Details
                  </h5>
                  {viewingTrade.sellingDate ? (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Selling Date:</strong>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#ff6b6b',
                          marginTop: '5px'
                        }}>
                          {new Date(viewingTrade.sellingDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Units Sold:</strong>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#ff6b6b',
                          marginTop: '5px'
                        }}>
                          {viewingTrade.unitsSold || 0}
                        </div>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Selling Price:</strong>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#ff6b6b',
                          marginTop: '5px'
                        }}>
                          ₹{viewingTrade.sellingPrice || 0}
                        </div>
                      </div>
                      <div style={{ marginBottom: '0' }}>
                        <strong style={{ color: '#34495e', fontSize: '14px' }}>Return:</strong>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '700', 
                          color: (() => {
                            if (!viewingTrade.sellingPrice || !viewingTrade.unitsSold) return '#6c757d';
                            const purchaseCost = viewingTrade.unitsSold * viewingTrade.purchaseRate;
                            const sellingAmount = viewingTrade.unitsSold * viewingTrade.sellingPrice;
                            const returnAmount = sellingAmount - purchaseCost;
                            return returnAmount >= 0 ? '#27ae60' : '#e74c3c';
                          })(),
                          marginTop: '5px',
                          padding: '10px',
                          background: (() => {
                            if (!viewingTrade.sellingPrice || !viewingTrade.unitsSold) return 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                            const purchaseCost = viewingTrade.unitsSold * viewingTrade.purchaseRate;
                            const sellingAmount = viewingTrade.unitsSold * viewingTrade.sellingPrice;
                            const returnAmount = sellingAmount - purchaseCost;
                            return returnAmount >= 0 
                              ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' 
                              : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
                          })(),
                          borderRadius: '8px'
                        }}>
                          {(() => {
                            if (!viewingTrade.sellingPrice || !viewingTrade.unitsSold) return '₹0.00';
                            const purchaseCost = viewingTrade.unitsSold * viewingTrade.purchaseRate;
                            const sellingAmount = viewingTrade.unitsSold * viewingTrade.sellingPrice;
                            const returnAmount = sellingAmount - purchaseCost;
                            return (returnAmount >= 0 ? '+' : '') + '₹' + returnAmount.toFixed(2);
                          })()} 
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
          )}
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

      {/* Add Trade Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.stockName}
                    onChange={(e) => setFormData({...formData, stockName: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Rate (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData({...formData, purchaseRate: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Units Purchased *</Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    min="1"
                    value={formData.unitsPurchased}
                    onChange={(e) => setFormData({...formData, unitsPurchased: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.sellingDate}
                    onChange={(e) => setFormData({...formData, sellingDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Units Sold</Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    min="0"
                    value={formData.unitsSold}
                    onChange={(e) => setFormData({...formData, unitsSold: e.target.value})}
                    isInvalid={formData.unitsSold && formData.unitsPurchased && parseInt(formData.unitsSold) > parseInt(formData.unitsPurchased)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Units sold cannot be greater than units purchased ({formData.unitsPurchased})
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={formData.unitsSold && formData.unitsPurchased && parseInt(formData.unitsSold) > parseInt(formData.unitsPurchased)}
              >
                {editingTrade ? 'Update Trade' : 'Add Trade'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '60px',
                height: '60px',
                background: 'rgba(220, 53, 69, 0.1)',
                color: '#dc3545'
              }}
            >
              <i className="bi bi-exclamation-triangle fs-3"></i>
            </div>
            <h5 className="mb-3">Delete Trade</h5>
            <p className="text-muted mb-0">
              Are you sure you want to delete this trade for{' '}
              <strong>{tradeToDelete?.stockName}</strong>?
            </p>
            <p className="text-muted small">
              This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteTrade}
          >
            Delete Trade
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
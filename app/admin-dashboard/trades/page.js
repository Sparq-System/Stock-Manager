'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'

export default function TradesManagement() {
  const [trades, setTrades] = useState([])
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState(null)
  const [formData, setFormData] = useState({
    userId: '',
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
    fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
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
          userId: '',
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
      userId: trade.userId?._id || '',
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
    <div style={pageStyle}>
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
      
      <Navbar user={user} />
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 76px)' }}>
        <div style={{ flexShrink: 0 }}>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0, overflow: 'auto' }}>
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
                        userId: '',
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
                      <Table hover style={{ margin: '0', background: 'white', fontSize: '12px', tableLayout: 'fixed', width: '100%' }}>
                        <thead 
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                          }}
                        >
                          <tr>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '8%' }}>Date</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '12%' }}>User</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '10%' }}>Stock Name</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '7%' }}>Units</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '9%' }}>Purchase Rate</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '10%' }}>Total Amount</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '8%' }}>Selling Date</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '9%' }}>Selling Price</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '7%' }}>Units Sold</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '8%' }}>Return</th>
                            <th style={{ border: 'none', padding: '12px 8px', fontWeight: '600', fontSize: '11px', width: '12%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.filter(trade => 
                            trade.stockName.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 ? (
                            <tr>
                              <td 
                                colSpan="11" 
                                style={{
                                  textAlign: 'center',
                                  padding: '40px 20px',
                                  color: '#6c757d',
                                  fontSize: '16px',
                                  border: 'none'
                                }}
                              >
                                <i className="bi bi-inbox fs-1 d-block mb-3" style={{ color: '#dee2e6' }}></i>
                                {searchTerm ? `No trades found for "${searchTerm}"` : 'No trades found'}
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
                                  borderBottom: index === trades.filter(t => t.stockName.toLowerCase().includes(searchTerm.toLowerCase())).length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)'
                                  e.currentTarget.style.transform = 'scale(1.01)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.transform = 'scale(1)'
                                }}
                              >
                                <td style={{ border: 'none', padding: '12px 8px', fontWeight: '500', color: '#2c3e50', fontSize: '11px' }}>
                                  {format(new Date(trade.purchaseDate), 'dd MMM yy')}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px' }}>
                                  {trade.userId ? (
                                    <div>
                                      <div style={{ fontWeight: '500', color: '#2c3e50', fontSize: '11px', lineHeight: '1.2' }}>
                                        {trade.userId.firstName} {trade.userId.lastName}
                                      </div>
                                      <small style={{ color: '#6c757d', fontSize: '10px', lineHeight: '1.2' }}>
                                        {trade.userId.email.length > 15 ? trade.userId.email.substring(0, 15) + '...' : trade.userId.email}
                                      </small>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#dc3545', fontWeight: '500', fontSize: '11px' }}>User not found</span>
                                  )}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', fontWeight: '500', color: '#2c3e50', fontSize: '11px' }}>
                                  {trade.stockName.length > 8 ? trade.stockName.substring(0, 8) + '...' : trade.stockName}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', fontWeight: '500', color: '#2c3e50', fontSize: '11px' }}>
                                  {trade.unitsPurchased}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', fontWeight: '500', color: '#2c3e50', fontSize: '11px' }}>
                                  ₹{trade.purchaseRate.toFixed(1)}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', fontSize: '11px' }}>
                                  ₹{(trade.unitsPurchased * trade.purchaseRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', color: '#6c757d', fontSize: '11px' }}>
                                  {trade.sellingDate ? format(new Date(trade.sellingDate), 'dd MMM yy') : '-'}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', color: '#6c757d', fontSize: '11px' }}>
                                  {trade.sellingPrice ? `₹${trade.sellingPrice.toFixed(1)}` : '-'}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px', color: '#6c757d', fontSize: '11px' }}>
                                  {trade.unitsSold ? trade.unitsSold : '-'}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px' }}>
                                  {returnData.isProfit === null ? (
                                    <span style={{ color: '#6c757d', fontSize: '10px' }}>-</span>
                                  ) : (
                                    <span 
                                      style={{
                                        color: returnData.isProfit ? '#28a745' : '#dc3545',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        fontSize: '10px'
                                      }}
                                    >
                                      ₹{Math.abs(returnData.amount).toFixed(0)}
                                      <i className={`bi ${returnData.isProfit ? 'bi-arrow-up' : 'bi-arrow-down'} ms-1`}></i>
                                    </span>
                                  )}
                                </td>
                                <td style={{ border: 'none', padding: '12px 8px' }}>
                                  <div className="d-flex gap-1">
                                    <Button 
                                       style={{
                                         background: '#4facfe',
                                         border: 'none',
                                         borderRadius: '6px',
                                         padding: '4px 8px',
                                         fontSize: '10px',
                                         fontWeight: '600',
                                         transition: 'all 0.3s ease'
                                       }}
                                       size="sm"
                                       onClick={() => handleEdit(trade)}
                                       disabled={trade.unitsSold && trade.unitsSold === trade.unitsPurchased}
                                       onMouseEnter={(e) => {
                                         if (!e.target.disabled) {
                                           e.target.style.transform = 'translateY(-1px)'
                                           e.target.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.4)'
                                         }
                                       }}
                                       onMouseLeave={(e) => {
                                         e.target.style.transform = 'translateY(0)'
                                         e.target.style.boxShadow = 'none'
                                       }}
                                     >
                                       <i className="bi bi-pencil"></i>
                                     </Button>
                                    <Button 
                                      style={{
                                        background: '#ff6b6b',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                      }}
                                      size="sm"
                                      onClick={() => confirmDelete(trade)}
                                      onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-1px)'
                                        e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)'
                                        e.target.style.boxShadow = 'none'
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
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
                  <Form.Label>User *</Form.Label>
                  <Form.Select
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    required
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
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
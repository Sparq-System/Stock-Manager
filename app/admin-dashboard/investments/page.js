'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Spinner } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'

const InvestmentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'add' or 'withdraw'
  const [amount, setAmount] = useState('')
  const [units, setUnits] = useState('')
  const [withdrawType, setWithdrawType] = useState('amount') // 'amount' or 'units'
  const [calculatedWithdrawAmount, setCalculatedWithdrawAmount] = useState(0)
  const [currentNAV, setCurrentNAV] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch current user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  // Fetch current NAV
  const fetchCurrentNAV = async () => {
    try {
      const response = await fetch('/api/nav')
      if (response.ok) {
        const navData = await response.json()
        if (navData.navs && navData.navs.length > 0) {
          setCurrentNAV(navData.navs[0])
        }
      }
    } catch (error) {
      console.error('Error fetching NAV:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchCurrentNAV()
    
    // Handle responsive design
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate withdraw amount when units change
  useEffect(() => {
    if (withdrawType === 'units' && units && currentNAV) {
      const calculatedAmount = parseFloat(units) * currentNAV.value
      setCalculatedWithdrawAmount(calculatedAmount)
    } else {
      setCalculatedWithdrawAmount(0)
    }
  }, [units, currentNAV, withdrawType])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    setError('')
    setSearchResult(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        console.log('Search API response:', data) // Debug log
        if (data && (Array.isArray(data) ? data.length > 0 : data._id)) {
          const userData = Array.isArray(data) ? data[0] : data
          console.log('Setting search result:', userData) // Debug log
          setSearchResult(userData)
        } else {
          setError('No user found with the provided search term')
        }
      } else {
        setError(data.error || data.message || 'Failed to search user')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  const handleModalOpen = (type) => {
    setModalType(type)
    setShowModal(true)
    setAmount('')
    setUnits('')
    setWithdrawType('amount')
    setCalculatedWithdrawAmount(0)
    setError('')
  }

  const handleModalClose = () => {
    setShowModal(false)
    setShowConfirmModal(false)
    setAmount('')
    setUnits('')
    setWithdrawType('amount')
    setCalculatedWithdrawAmount(0)
    setError('')
  }

  const handleConfirmAction = () => {
    setShowModal(false)
    setShowConfirmModal(true)
  }

  const handleSubmit = async () => {
    if (!amount && !units) {
      setError('Please enter an amount or units')
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const endpoint = modalType === 'add' ? '/api/investments/add-money' : '/api/investments/withdraw'
      const requestBody = {
        userId: searchResult._id,
        ...(modalType === 'add' ? { amount: parseFloat(amount) } : {
          withdrawType: withdrawType,
          ...(withdrawType === 'amount' ? { amount: parseFloat(amount) } : { units: parseFloat(units) })
        })
      }

      const token = localStorage.getItem('token')
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${modalType === 'add' ? 'Money added' : 'Money withdrawn'} successfully!`)
        
        // Update user data with the response
        const updatedUser = data.user
        console.log('Updated user data:', updatedUser) // Debug log
        
        // Refresh current NAV first to ensure accurate calculations
        await fetchCurrentNAV()
        
        // Update search result with fresh data
        setSearchResult(updatedUser)
        
        // Force UI re-render by triggering state update
        setTimeout(() => {
          // This ensures all calculated values refresh properly
          setSearchResult(prevResult => ({ 
            ...updatedUser, 
            _forceUpdate: Date.now() 
          }))
        }, 100)
        
        handleModalClose()
      } else {
        setError(data.error || `Failed to ${modalType === 'add' ? 'add money' : 'withdraw money'}`)
      }
    } catch (error) {
      console.error('Transaction error:', error)
      setError('An error occurred during the transaction')
    } finally {
      setActionLoading(false)
    }
  }

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatUnits = (units) => {
    return parseFloat(units).toFixed(4)
  }

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  }

  const containerStyle = {
    transition: 'margin-left 0.3s ease',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    overflowY: 'auto'
  }

  return (
    <div style={{ ...pageStyle, position: 'fixed', width: '100%', height: '100vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Navbar user={currentUser} />
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
            width: '100%', 
            minWidth: 0, 
            overflow: 'auto',
            height: 'calc(100vh - 76px)',
            marginLeft: isSidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div style={{
            padding: !isMobile ? '2rem' : '1rem',
            width: '100%',
            maxWidth: '100%'
          }}>
            <Row>
              <Col>
                <Card 
                  style={{
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <Card.Body style={{ padding: '32px' }}>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                          }}
                        >
                          📊
                        </div>
                        <div>
                          <h2 className="text-white mb-1" style={{ fontWeight: '700' }}>Investment Management</h2>
                          <p className="text-white-50 mb-0">Search and manage user investments</p>
                        </div>
                      </div>
                    </div>
                    
                    <Row className="align-items-end">
                      <Col xl={10} lg={9} md={8} sm={12} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label className="text-white mb-2" style={{ fontWeight: '600' }}>Search by User ID or Email</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter User ID or Email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                              borderRadius: '15px',
                              border: 'none',
                              padding: '12px 20px',
                              fontSize: '16px',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)'
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xl={2} lg={3} md={4} sm={12}>
                        <Button
                          onClick={handleSearch}
                          disabled={loading}
                          style={{
                            borderRadius: '15px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            border: 'none',
                            width: '100%'
                          }}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Searching...
                            </>
                          ) : (
                            '🔍 Search'
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {error && (
              <Alert variant="danger" className="mt-3" style={{ borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            {searchResult && (
              <Card 
                className="mt-4"
                style={{
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
                  overflow: 'hidden'
                }}
              >
                {/* Header Section with User Info */}
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '24px 32px',
                    color: 'white'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-4"
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {searchResult.firstName?.charAt(0)}{searchResult.lastName?.charAt(0)}
                    </div>
                    <div className="flex-grow-1">
                      <h3 className="mb-2" style={{ fontWeight: '700', fontSize: '1.8rem' }}>
                        {searchResult.firstName} {searchResult.lastName}
                      </h3>
                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <div className="d-flex align-items-center">
                          <span className="me-2">🆔</span>
                          <span style={{ fontWeight: '500' }}>{searchResult.userCode}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="me-2">👤</span>
                          <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{searchResult.role || 'client'}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="me-2">📅</span>
                          <span style={{ fontWeight: '500' }}>
                            {searchResult.dateOfJoining ? format(new Date(searchResult.dateOfJoining), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card.Body style={{ padding: '32px' }}>
                  {/* Contact Information */}
                  <div className="mb-4">
                    <h5 className="mb-3" style={{ color: '#2c3e50', fontWeight: '600', fontSize: '1.1rem' }}>
                      📧 Contact Information
                    </h5>
                    <div 
                      className="p-3 rounded-3 d-flex align-items-center"
                      style={{ 
                        backgroundColor: 'rgba(13, 110, 253, 0.08)',
                        border: '1px solid rgba(13, 110, 253, 0.1)'
                      }}
                    >
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'rgba(13, 110, 253, 0.1)',
                          color: '#0d6efd'
                        }}
                      >
                        ✉️
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-muted small mb-1">Email Address</div>
                        <div 
                          className="h6 mb-0" 
                          style={{ 
                            color: '#0d6efd', 
                            fontWeight: '600',
                            wordBreak: 'break-all',
                            lineHeight: '1.3'
                          }}
                        >
                          {searchResult.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investment Overview */}
                  <div className="mb-4">
                    <h5 className="mb-3" style={{ color: '#2c3e50', fontWeight: '600', fontSize: '1.1rem' }}>
                      💼 Investment Overview
                    </h5>
                    <Row>
                      <Col lg={3} md={6} className="mb-3">
                        <div 
                          className="p-4 rounded-3 text-center position-relative overflow-hidden"
                          style={{ 
                            backgroundColor: 'rgba(40, 167, 69, 0.08)',
                            border: '2px solid rgba(40, 167, 69, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          <div className="mb-2" style={{ fontSize: '2rem' }}>💰</div>
                          <div className="text-muted small mb-2">Invested Amount</div>
                          <div className="h4 mb-0" style={{ color: '#28a745', fontWeight: '700' }}>
                            {formatCurrency(searchResult.investedAmount || 0)}
                          </div>
                        </div>
                      </Col>
                      <Col lg={3} md={6} className="mb-3">
                        <div 
                          className="p-4 rounded-3 text-center position-relative overflow-hidden"
                          style={{ 
                            backgroundColor: 'rgba(102, 126, 234, 0.08)',
                            border: '2px solid rgba(102, 126, 234, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          <div className="mb-2" style={{ fontSize: '2rem' }}>📈</div>
                          <div className="text-muted small mb-2">Current Value</div>
                          <div className="h4 mb-0" style={{ color: '#667eea', fontWeight: '700' }}>
                            {formatCurrency(currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0)}
                          </div>
                        </div>
                      </Col>
                      <Col lg={3} md={6} className="mb-3">
                        <div 
                          className="p-4 rounded-3 text-center position-relative overflow-hidden"
                          style={{ 
                            backgroundColor: 'rgba(255, 193, 7, 0.08)',
                            border: '2px solid rgba(255, 193, 7, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 8px 25px rgba(255, 193, 7, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          <div className="mb-2" style={{ fontSize: '2rem' }}>🔢</div>
                          <div className="text-muted small mb-2">Units Owned</div>
                          <div className="h4 mb-0" style={{ color: '#ffc107', fontWeight: '700' }}>
                            {formatUnits(searchResult.units || 0)}
                          </div>
                        </div>
                      </Col>
                      <Col lg={3} md={6} className="mb-3">
                        <div 
                          className="p-4 rounded-3 text-center position-relative overflow-hidden"
                          style={{ 
                            backgroundColor: (currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0) ? 
                              'rgba(40, 167, 69, 0.08)' : 'rgba(220, 53, 69, 0.08)',
                            border: `2px solid ${(currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0) ? 
                              'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'}`,
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            const isProfit = (currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0)
                            e.target.style.boxShadow = `0 8px 25px ${isProfit ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)'}`
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          <div className="mb-2" style={{ fontSize: '2rem' }}>
                            {(currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0) ? '📊' : '📉'}
                          </div>
                          <div className="text-muted small mb-2">Profit & Loss (%)</div>
                          <div className="h4 mb-0" style={{ 
                            color: (currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0) ? '#28a745' : '#dc3545',
                            fontWeight: '700' 
                          }}>
                            {formatCurrency((currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) - (searchResult.investedAmount || 0))}
                            <span className="small" style={{ 
                              color: (currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) >= (searchResult.investedAmount || 0) ? '#28a745' : '#dc3545',
                              fontWeight: '600',
                              marginLeft: '8px'
                            }}>
                              ({searchResult.investedAmount > 0 ? 
                                `${(((currentNAV && searchResult.units ? (searchResult.units * currentNAV.value) : 0) - (searchResult.investedAmount || 0)) / (searchResult.investedAmount || 1) * 100).toFixed(2)}%` 
                                : '0.00%'
                              })
                            </span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Action Buttons */}
                  <div className="text-center">
                    <div className="d-inline-flex gap-3 flex-wrap">
                      <Button
                        variant="success"
                        size="lg"
                        onClick={() => handleModalOpen('add')}
                        style={{
                          borderRadius: '20px',
                          fontWeight: '600',
                          padding: '14px 32px',
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '160px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)'
                        }}
                      >
                        💰 Add Money
                      </Button>
                      <Button
                        variant="warning"
                        size="lg"
                        onClick={() => handleModalOpen('withdraw')}
                        style={{
                          borderRadius: '20px',
                          fontWeight: '600',
                          padding: '14px 32px',
                          background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                          border: 'none',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '160px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.3)'
                        }}
                      >
                        💸 Withdraw
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {message && (
              <Alert 
                variant={message.includes('successfully') ? 'success' : 'danger'} 
                className="mt-3"
                style={{ borderRadius: '12px' }}
              >
                {message}
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Add Money/Withdraw Modal */}
      <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <Modal.Title style={{ color: '#2c3e50', fontWeight: '600' }}>
            {modalType === 'add' ? '💰 Add Money' : '💸 Withdraw Money'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {error && (
            <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
              {error}
            </Alert>
          )}
          
          <Form>
            {modalType === 'withdraw' && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#495057' }}>Withdraw By</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="withdraw-amount"
                    name="withdrawType"
                    label="Amount"
                    checked={withdrawType === 'amount'}
                    onChange={() => {
                      setWithdrawType('amount')
                      setUnits('')
                      setCalculatedWithdrawAmount(0)
                    }}
                  />
                  <Form.Check
                    type="radio"
                    id="withdraw-units"
                    name="withdrawType"
                    label="Units"
                    checked={withdrawType === 'units'}
                    onChange={() => {
                      setWithdrawType('units')
                      setAmount('')
                    }}
                  />
                </div>
              </Form.Group>
            )}
            
            {(modalType === 'add' || (modalType === 'withdraw' && withdrawType === 'amount')) && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#495057' }}>Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    padding: '12px 16px'
                  }}
                />
              </Form.Group>
            )}
            
            {modalType === 'withdraw' && withdrawType === 'units' && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#495057' }}>Units</Form.Label>
                <Form.Control
                  type="number"
                  step="0.0001"
                  placeholder="Enter number of units"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    padding: '12px 16px'
                  }}
                />
                {calculatedWithdrawAmount > 0 && (
                  <div className="mt-2 text-info small">
                    <strong>Withdraw Amount: {formatCurrency(calculatedWithdrawAmount)}</strong>
                  </div>
                )}
              </Form.Group>
            )}
            
            <div className="text-muted small mb-3">
              <strong>User:</strong> {searchResult?.firstName} {searchResult?.lastName} ({searchResult?.userCode})
            </div>
            
            {currentNAV && (
              <div className="text-muted small mb-3">
                <strong>Current NAV:</strong> ₹{currentNAV.value.toFixed(2)} (as of {format(new Date(currentNAV.date), 'dd MMM yyyy')})
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', padding: '0 24px 24px' }}>
          <Button 
            variant="outline-secondary" 
            onClick={handleModalClose}
            style={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmAction}
            disabled={loading || (!amount && !units) || (modalType === 'withdraw' && withdrawType === 'units' && calculatedWithdrawAmount === 0)}
            style={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              modalType === 'add' ? 'Invest' : 
              (modalType === 'withdraw' && withdrawType === 'units' && calculatedWithdrawAmount > 0) ?
                `Withdraw ${formatCurrency(calculatedWithdrawAmount)}` :
                (modalType === 'withdraw' && withdrawType === 'amount' && amount) ?
                  `Withdraw ${formatCurrency(parseFloat(amount))}` :
                  'Withdraw'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <Modal.Title style={{ color: '#2c3e50', fontWeight: '600' }}>
            {modalType === 'add' ? '💰 Confirm' : '💸 Confirm'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {error && (
            <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
              {error}
            </Alert>
          )}
          
          <div className="text-center">
            <div className="mb-3">
              <strong>User:</strong> {searchResult?.firstName} {searchResult?.lastName} ({searchResult?.userCode})
            </div>
            
            {modalType === 'add' ? (
              <div className="mb-3">
                <div className="text-muted">Adding Amount:</div>
                <div className="h4 text-success">{formatCurrency(parseFloat(amount))}</div>
              </div>
            ) : (
              <div className="mb-3">
                <div className="text-muted">Withdrawing:</div>
                {withdrawType === 'units' ? (
                  <>
                    <div className="h5 text-warning">{formatUnits(parseFloat(units))} units</div>
                    <div className="h4 text-warning">{formatCurrency(calculatedWithdrawAmount)}</div>
                  </>
                ) : (
                  <div className="h4 text-warning">{formatCurrency(parseFloat(amount))}</div>
                )}
              </div>
            )}
            
            <div className="text-muted small">
              Are you sure you want to proceed with this transaction?
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', paddingTop: '0' }}>
          <Button 
            variant="secondary" 
            onClick={handleModalClose}
            style={{
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: '600'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant={modalType === 'add' ? 'success' : 'warning'}
            onClick={handleSubmit}
            disabled={actionLoading}
            style={{
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: '600'
            }}
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              `Confirm ${modalType === 'add' ? 'Add Money' : 'Withdrawal'}`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default InvestmentManagement
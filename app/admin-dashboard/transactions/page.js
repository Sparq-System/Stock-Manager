'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Form, Button, Badge, Spinner, Alert, InputGroup, Pagination, Modal } from 'react-bootstrap'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'

export default function TransactionsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    fetchUserData()
    fetchTransactions()
  }, [])

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
        if (userData.role !== 'admin') {
          window.location.href = '/login'
          return
        }
        setUser(userData)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder
      })

      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      if (data.success) {
        setTransactions(data.data.transactions)
        setTotalPages(data.data.pagination.totalPages)
        setCurrentPage(data.data.pagination.currentPage)
        setTotalCount(data.data.pagination.totalCount)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTransactions(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchTransactions(page)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
    setTimeout(() => fetchTransactions(1), 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getTypeVariant = (type) => {
    return type === 'invest' ? 'success' : 'warning'
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      default: return 'secondary'
    }
  }

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTransaction(null)
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
    border: '1px solid rgba(102, 126, 234, 0.2)'
  }

  const tableCardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  }

  if (loading && !user) {
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
                <i className="bi bi-arrow-clockwise text-white" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
            <h4 className="text-white mb-2">Loading Transactions</h4>
            <p className="text-white-50">Please wait while we fetch transaction data...</p>
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
                      <i className="bi bi-receipt text-white fs-3"></i>
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
                        Transactions Management
                      </h1>
                      <p style={{ color: '#6c757d', margin: '0', fontSize: '1rem' }}>
                        Track all investment and withdrawal transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Search and Filter Section */}
              <Card 
                className="mb-4"
                style={{
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="rounded-circle p-2 me-3"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="bi bi-funnel text-white"></i>
                    </div>
                    <h5 className="mb-0" style={{ color: '#2c3e50', fontWeight: '600' }}>
                      Search & Filter Transactions
                    </h5>
                  </div>
                  <Form onSubmit={handleSearch}>
                    <Row className="g-3 mb-3">
                      <Col lg={6} md={7} sm={12}>
                        <Form.Label style={{ color: '#495057', fontWeight: '500', fontSize: '14px' }}>Search</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Search by transaction ID, user name, amount..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            borderRadius: '12px',
                            border: '2px solid #e9ecef',
                            padding: '12px 16px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </Col>
                      <Col lg={2} md={3} sm={6}>
                        <Form.Label style={{ color: '#495057', fontWeight: '500', fontSize: '14px' }}>Type</Form.Label>
                        <Form.Select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          style={{
                            borderRadius: '12px',
                            border: '2px solid #e9ecef',
                            padding: '12px 16px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <option value="">All Types</option>
                          <option value="invest">Investment</option>
                          <option value="withdraw">Withdrawal</option>
                        </Form.Select>
                      </Col>
                      <Col lg={2} md={3} sm={6}>
                        <Form.Label style={{ color: '#495057', fontWeight: '500', fontSize: '14px' }}>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{
                            borderRadius: '12px',
                            border: '2px solid #e9ecef',
                            padding: '12px 16px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </Col>
                      <Col lg={2} md={3} sm={6}>
                        <Form.Label style={{ color: '#495057', fontWeight: '500', fontSize: '14px' }}>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{
                            borderRadius: '12px',
                            border: '2px solid #e9ecef',
                            padding: '12px 16px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </Col>
                    </Row>
                    <Row className="g-3 justify-content-center">
                      <Col lg={2} md={3} sm={6}>
                        <Button
                          onClick={() => {
                            setSearchTerm('')
                            setTypeFilter('')
                            setStartDate('')
                            setEndDate('')
                            setCurrentPage(1)
                            setTimeout(() => fetchTransactions(1), 0)
                          }}
                          className="w-100"
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                          }}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Clear
                        </Button>
                      </Col>
                      <Col lg={2} md={3} sm={6}>
                        <Button 
                          type="submit"
                          className="w-100"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          <i className="bi bi-search me-2"></i>
                          Search
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>

              {/* Summary Cards */}
              <Row className="mb-4">
                <Col md={3} sm={6} className="mb-3">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="text-center">
                      <div className="text-primary mb-2">
                        <i className="bi bi-receipt display-6"></i>
                      </div>
                      <h4 className="mb-1">{transactions.length}</h4>
                      <small className="text-muted">Total Transactions</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="text-center">
                      <div className="text-success mb-2">
                        <i className="bi bi-arrow-down-circle display-6"></i>
                      </div>
                      <h4 className="mb-1">{transactions.filter(t => t.type === 'invest').length}</h4>
                      <small className="text-muted">Investments</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="text-center">
                      <div className="text-warning mb-2">
                        <i className="bi bi-arrow-up-circle display-6"></i>
                      </div>
                      <h4 className="mb-1">{transactions.filter(t => t.type === 'withdraw').length}</h4>
                      <small className="text-muted">Withdrawals</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="text-center">
                      <div className="text-info mb-2">
                        <i className="bi bi-currency-rupee display-6"></i>
                      </div>
                      <h4 className="mb-1">
                        {formatCurrency(
                          transactions.reduce((sum, t) => sum + (t.type === 'invest' ? t.amount : -t.amount), 0)
                        )}
                      </h4>
                      <small className="text-muted">Net Amount</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Transactions Table */}
              <Card 
                style={{
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden'
                }}
              >
                <Card.Header 
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px 30px'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle p-2 me-3"
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-table text-white"></i>
                      </div>
                      <h5 className="mb-0 text-white" style={{ fontWeight: '600' }}>
                        Transaction Records
                      </h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Badge 
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {transactions.length} transactions found
                      </Badge>
                      <Button 
                        onClick={fetchTransactions}
                        disabled={loading}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          padding: '8px 16px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Refresh
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive" style={{maxHeight: '600px', overflowX: 'auto'}}>
                    <Table className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0', minWidth: '100%', width: 'auto' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                          <th 
                            style={{ 
                              cursor: 'pointer', 
                              width: '20%',
                              padding: '16px 20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#495057',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              border: 'none',
                              borderRight: '1px solid #dee2e6'
                            }}
                            onClick={() => handleSort('userName')}
                            className="text-nowrap"
                          >
                            User Details
                            {sortBy === 'userName' && (
                              <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th 
                            style={{ 
                              cursor: 'pointer', 
                              width: '15%',
                              padding: '16px 20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#495057',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              border: 'none',
                              borderRight: '1px solid #dee2e6'
                            }}
                            onClick={() => handleSort('amount')}
                            className="text-nowrap"
                          >
                            Amount
                            {sortBy === 'amount' && (
                              <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th 
                            style={{ 
                              cursor: 'pointer', 
                              width: '15%',
                              padding: '16px 20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#495057',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              border: 'none',
                              borderRight: '1px solid #dee2e6'
                            }}
                            onClick={() => handleSort('type')}
                            className="text-nowrap"
                          >
                            Type
                            {sortBy === 'type' && (
                              <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th style={{ 
                            width: '12%',
                            padding: '16px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            border: 'none',
                            borderRight: '1px solid #dee2e6'
                          }} className="text-nowrap">
                            Units
                          </th>
                          <th style={{ 
                            width: '13%',
                            padding: '16px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            border: 'none',
                            borderRight: '1px solid #dee2e6'
                          }} className="text-nowrap">
                            NAV Value
                          </th>
                          <th style={{ 
                            width: '12%',
                            padding: '16px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            border: 'none',
                            borderRight: '1px solid #dee2e6'
                          }} className="text-nowrap">
                            Status
                          </th>
                          <th style={{ 
                            width: '13%',
                            padding: '16px 20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#495057',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            border: 'none'
                          }} className="text-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5">
                              <div className="d-flex flex-column align-items-center">
                                <Spinner animation="border" size="sm" className="mb-2" />
                                <span className="text-muted">Loading transactions...</span>
                              </div>
                            </td>
                          </tr>
                        ) : transactions.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5">
                              <div className="d-flex flex-column align-items-center text-muted">
                                <i className="bi bi-inbox display-4 mb-3 opacity-50"></i>
                                <h6>No transactions found</h6>
                                <p className="mb-0">Try adjusting your search criteria</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          transactions.map((transaction, index) => (
                            <tr 
                              key={transaction._id} 
                              style={{
                                borderBottom: '1px solid #f1f3f4',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                backgroundColor: index % 2 === 0 ? '#fafbfc' : 'white'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafbfc' : 'white';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                                    {transaction.userName}
                                  </div>
                                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                                    {transaction.userCode}
                                  </small>
                                </div>
                              </td>
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                <div className={`fw-bold fs-6 ${transaction.type === 'invest' ? 'text-success' : 'text-warning'}`}>
                                  {transaction.type === 'invest' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                </div>
                              </td>
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                <Badge 
                                  style={{
                                    background: transaction.type === 'invest' ? 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)' : 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {transaction.type === 'invest' ? 'Investment' : 'Withdrawal'}
                                </Badge>
                              </td>
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                {transaction.units > 0 ? (
                                  <span style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                                    {transaction.units.toFixed(4)}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                {transaction.navValue > 0 ? (
                                  <span style={{ fontWeight: '600', color: '#495057', fontSize: '14px' }}>
                                    {formatCurrency(transaction.navValue)}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td 
                                className="align-middle"
                                style={{
                                  padding: '16px 20px',
                                  borderRight: '1px solid #f1f3f4'
                                }}
                              >
                                <Badge 
                                  style={{
                                    background: transaction.status === 'completed' ? 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)' :
                                               transaction.status === 'pending' ? 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)' :
                                               transaction.status === 'failed' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' :
                                               'linear-gradient(135deg, #a4b0be 0%, #57606f 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {transaction.status}
                                </Badge>
                              </td>
                              <td 
                                className="align-middle text-center"
                                style={{
                                  padding: '16px 20px'
                                }}
                              >
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewTransaction(transaction)}
                                  style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    padding: '6px 16px',
                                    fontSize: '12px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
                <Card.Footer 
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    padding: '20px 30px',
                    borderTop: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: '32px',
                          height: '32px'
                        }}
                      >
                        <i className="bi bi-info-circle text-white" style={{ fontSize: '12px' }}></i>
                      </div>
                      <span style={{ color: '#495057', fontWeight: '500', fontSize: '14px' }}>
                        Showing {transactions.length} of {totalCount} transactions
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            width: '24px',
                            height: '24px'
                          }}
                        >
                          <i className="bi bi-clock-history text-white" style={{ fontSize: '10px' }}></i>
                        </div>
                        <small style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>
                          Last updated: {new Date().toLocaleTimeString()}
                        </small>
                      </div>
                      <Badge 
                        style={{
                          background: 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white'
                        }}
                      >
                        <i className="bi bi-database me-1"></i>
                        Live Data
                      </Badge>
                    </div>
                  </div>
                </Card.Footer>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        )
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return <Pagination.Ellipsis key={page} />
                      }
                      return null
                    })}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </Col>
          </Row>
        </Container>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-receipt me-2"></i>
            Transaction Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '30px' }}>
          {selectedTransaction && (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-hash me-2"></i>Transaction ID
                    </h6>
                    <p className="font-monospace fw-bold">{selectedTransaction.transactionId}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-person me-2"></i>User Details
                    </h6>
                    <p className="fw-bold mb-1">{selectedTransaction.userName}</p>
                    <small className="text-muted">{selectedTransaction.userCode}</small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-currency-dollar me-2"></i>Amount
                    </h6>
                    <p className={`fw-bold fs-5 ${selectedTransaction.type === 'invest' ? 'text-success' : 'text-warning'}`}>
                      {selectedTransaction.type === 'invest' ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-arrow-left-right me-2"></i>Transaction Type
                    </h6>
                    <Badge 
                      style={{
                        background: selectedTransaction.type === 'invest' ? 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)' : 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        fontSize: '14px'
                      }}
                    >
                      {selectedTransaction.type === 'invest' ? 'Investment' : 'Withdrawal'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-pie-chart me-2"></i>Units
                    </h6>
                    <p className="fw-bold">
                      {selectedTransaction.units > 0 ? selectedTransaction.units.toFixed(4) : '-'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-graph-up me-2"></i>NAV Value
                    </h6>
                    <p className="fw-bold">
                      {selectedTransaction.navValue > 0 ? formatCurrency(selectedTransaction.navValue) : '-'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-shield-check me-2"></i>Status
                    </h6>
                    <Badge 
                      style={{
                        background: selectedTransaction.status === 'completed' ? 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)' :
                                   selectedTransaction.status === 'pending' ? 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)' :
                                   selectedTransaction.status === 'failed' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' :
                                   'linear-gradient(135deg, #a4b0be 0%, #57606f 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        textTransform: 'capitalize'
                      }}
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-person-check me-2"></i>Processed By
                    </h6>
                    <p className="fw-bold">{selectedTransaction.processedByName || 'System'}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">
                      <i className="bi bi-calendar-event me-2"></i>Date & Time
                    </h6>
                    <p className="fw-bold mb-1">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</p>
                    <small className="text-muted">{new Date(selectedTransaction.createdAt).toLocaleTimeString()}</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '20px 30px' }}>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
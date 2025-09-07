'use client'
import { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'

export default function UsersManagement() {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'client'
  })
  const [emailValidation, setEmailValidation] = useState({
    isValidating: false,
    isAvailable: null,
    message: '',
    hasBlurred: false
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    userId: null,
    userName: '',
    hasUnitsError: false,
    units: 0
  })
  const [showPassword, setShowPassword] = useState(false)
  const [viewUser, setViewUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchUsers()
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
      } else {
        setError('Failed to fetch users')
      }
    } catch (error) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Debounced email validation function
  const validateEmail = useCallback(async (email) => {
    if (!email || !email.trim()) {
      setEmailValidation(prev => ({
        ...prev,
        isValidating: false,
        isAvailable: null,
        message: ''
      }))
      return
    }

    setEmailValidation(prev => ({ ...prev, isValidating: true }))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: email.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setEmailValidation(prev => ({
          ...prev,
          isValidating: false,
          isAvailable: data.isAvailable,
          message: data.message
        }))
      } else {
        setEmailValidation(prev => ({
          ...prev,
          isValidating: false,
          isAvailable: false,
          message: 'Unable to validate email'
        }))
      }
    } catch (error) {
      console.error('Email validation error:', error)
      setEmailValidation(prev => ({
        ...prev,
        isValidating: false,
        isAvailable: false,
        message: 'Validation service unavailable'
      }))
    }
  }, [])

  // Debounced validation with 500ms delay
  useEffect(() => {
    if (!emailValidation.hasBlurred || !formData.email || editingUser) return

    const timeoutId = setTimeout(() => {
      validateEmail(formData.email)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.email, emailValidation.hasBlurred, validateEmail, editingUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Check email validation before submission for new users
    if (!editingUser) {
      if (emailValidation.isValidating) {
        setError('Please wait for email validation to complete')
        return
      }
      
      if (emailValidation.hasBlurred && emailValidation.isAvailable === false) {
        setError('Please use a different email address')
        return
      }
      
      // Check if passwords match for new users
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    try {
      const url = editingUser ? '/api/users' : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const requestBody = editingUser 
        ? { ...formData, userId: editingUser._id }
        : formData
      
      const token = localStorage.getItem('token')
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
        setEditingUser(null)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          role: 'client'
        })
        setEmailValidation({
          isValidating: false,
          isAvailable: null,
          message: '',
          hasBlurred: false
        })
        setShowPassword(false)
        setShowConfirmPassword(false)
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.message || 'Operation failed')
      }
    } catch (error) {
      setError('Operation failed')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role
    })
    setShowModal(true)
  }

  const handleDeleteClick = (user) => {
    setDeleteConfirmation({
      show: true,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users?userId=${deleteConfirmation.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDeleteConfirmation({ show: false, userId: null, userName: '', hasUnitsError: false, units: 0 })
        fetchUsers()
      } else {
        const data = await response.json()
        if (data.hasUnits) {
          setDeleteConfirmation(prev => ({
            ...prev,
            hasUnitsError: true,
            units: data.units
          }))
        } else {
          setError(data.message || 'Failed to delete user')
        }
      }
    } catch (error) {
      setError('Failed to delete user')
    }
  }

  const exportToExcel = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const wsData = [
      ['Unique ID', 'Name', 'Email', 'Phone', 'Role', 'Joined On'],
      ...users.map(user => [
        user.userCode || 'N/A',
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.phone || 'N/A',
        user.role.toUpperCase(),
        user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'N/A'
      ])
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Users')
    
    // Generate and download XLSX file
    XLSX.writeFile(wb, `Users_export_${format(new Date(), 'dd-MM-yyyy')}.xlsx`)
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ show: false, userId: null, userName: '', hasUnitsError: false, units: 0 })
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'client': return 'primary'
      default: return 'secondary'
    }
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
      <div style={pageStyle} className="d-flex align-items-center justify-content-center">
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
    )
  }

  return (
    <div style={{ ...pageStyle, position: 'fixed', width: '100%', height: '100vh' }}>
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
                    <div>
                      <h1 className="mb-2 fw-bold text-white" style={{ fontSize: '2.5rem' }}>User Management</h1>
                      <p className="text-white-50 mb-0 fs-5">Manage system users and their permissions 👥</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '16px',
                          animation: 'pulse 3s infinite'
                        }}
                      >
                        <i className="bi bi-people text-white" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <Button 
                        style={addButtonStyle}
                        onClick={() => {
                          setEditingUser(null)
                          setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            password: '',
                            phone: '',
                            role: 'client'
                          })
                          setShowModal(true)
                        }}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New User
                      </Button>
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
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-3 p-2 me-3"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="bi bi-people text-white fs-4"></i>
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>All Users ({users.length})</h4>
                          <p className="text-muted mb-0">Manage system users and permissions</p>
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control
                          type="text"
                          placeholder="🔍 Search by name, email, phone, or user ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            width: '300px',
                            borderRadius: '16px',
                            border: '2px solid rgba(102, 126, 234, 0.2)',
                            padding: '12px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Button
                        onClick={exportToExcel}
                        style={{
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                        }}
                        title="Export to Excel"
                      >
                        <i className="bi bi-download me-2"></i>
                        Export
                      </Button>
                    </div>
                    </div>
                    <div className="table-responsive" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <Table hover style={{ marginBottom: 0, tableLayout: 'auto', width: '100%' }}>
                        <thead style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%)' }}>
                          <tr>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Unique ID</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Name</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Email</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Phone</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Role</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Joined On</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredUsers = users.filter(user => {
                              const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
                              const email = user.email.toLowerCase()
                              const phone = (user.phone || '').toLowerCase()
                              const userCode = (user.userCode || '').toLowerCase()
                              const search = searchTerm.toLowerCase()
                              
                              return fullName.includes(search) || 
                                     email.includes(search) || 
                                     phone.includes(search) ||
                                     userCode.includes(search)
                            })
                            
                            if (filteredUsers.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="8" className="text-center py-4">
                                    {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                                  </td>
                                </tr>
                              )
                            }
                            
                            return filteredUsers.map((user, index) => (
                              <tr key={user._id}>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', color: '#2c3e50', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {user.userCode || 'N/A'}
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '500', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {user.firstName} {user.lastName}
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', color: '#6c757d', textAlign: 'center', whiteSpace: 'nowrap' }}>{user.email}</td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', color: '#6c757d', textAlign: 'center', whiteSpace: 'nowrap' }}>{user.phone || 'N/A'}</td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <Badge 
                                    className="d-flex align-items-center gap-1"
                                    style={{
                                      background: user.role === 'admin' 
                                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                                        : user.role === 'manager'
                                        ? 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      border: 'none',
                                      borderRadius: '12px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      margin: '0 auto'
                                    }}
                                  >
                                    <i className={`bi ${
                                      user.role === 'admin' ? 'bi-shield-fill' :
                                      user.role === 'manager' ? 'bi-person-gear' :
                                      'bi-person-fill'
                                    }`}></i>
                                    {user.role.toUpperCase()}
                                  </Badge>
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', color: '#6c757d', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <div className="d-flex gap-2 justify-content-center">
                                    <Button
                                      style={{
                                        background: '#28a745',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      size="sm"
                                      title="View Details"
                                      onClick={() => {
                                        setViewUser(user)
                                        setShowViewModal(true)
                                      }}
                                    >
                                      <i className="bi bi-eye"></i>
                                    </Button>
                                    <Button
                                      style={{
                                        background: '#4facfe',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      size="sm"
                                      title="Edit User"
                                      onClick={() => handleEdit(user)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                    <Button
                                      style={{
                                        background: '#ff6b6b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      size="sm"
                                      title="Delete User"
                                      onClick={() => handleDeleteClick(user)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            

            
            {/* User Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: 'none'
          }}
        >
          <Modal.Header 
            closeButton
            style={{
              background: 'transparent',
              border: 'none',
              padding: '24px 32px 0',
              color: 'white'
            }}
          >
            <Modal.Title 
              style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div 
                className="rounded-3 p-2 me-3"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className={editingUser ? 'bi bi-pencil-square text-white fs-4' : 'bi bi-person-plus text-white fs-4'}></i>
              </div>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body 
            style={{
              background: 'white',
              margin: '0 24px 24px',
              borderRadius: '16px',
              padding: '32px'
            }}
          >
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      First Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="Enter first name"
                      required
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      Last Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Enter last name"
                      required
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label 
                  style={{
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}
                >
                  Email Address
                </Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value})
                    if (emailValidation.hasBlurred) {
                      setEmailValidation(prev => ({
                        ...prev,
                        isAvailable: null,
                        message: ''
                      }))
                    }
                  }}
                  onBlur={() => {
                    if (!editingUser) {
                      setEmailValidation(prev => ({ ...prev, hasBlurred: true }))
                    }
                  }}
                  placeholder="Enter email address"
                  required
                  isInvalid={!editingUser && emailValidation.hasBlurred && emailValidation.isAvailable === false}
                  isValid={!editingUser && emailValidation.hasBlurred && emailValidation.isAvailable === true}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    padding: '12px 16px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                />
                {!editingUser && emailValidation.isValidating && (
                  <Form.Text className="text-muted">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Checking email availability...
                  </Form.Text>
                )}
                {!editingUser && emailValidation.hasBlurred && emailValidation.message && (
                  <Form.Control.Feedback type={emailValidation.isAvailable ? 'valid' : 'invalid'}>
                    {emailValidation.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      Password {editingUser && <span style={{ color: '#6c757d', fontSize: '12px' }}>(leave blank to keep current)</span>}
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                       <Form.Control
                         type={showPassword ? "text" : "password"}
                         value={formData.password}
                         onChange={(e) => setFormData({...formData, password: e.target.value})}
                         placeholder="Enter password"
                         required={!editingUser}
                         style={{
                           borderRadius: '12px',
                           border: '2px solid rgba(102, 126, 234, 0.2)',
                           padding: '12px 40px 12px 16px',
                           fontSize: '14px',
                           transition: 'all 0.3s ease'
                         }}
                       />
                       <i 
                         className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                         onClick={() => setShowPassword(!showPassword)}
                         style={{
                           position: 'absolute',
                           right: '12px',
                           top: '50%',
                           transform: 'translateY(-50%)',
                           cursor: 'pointer',
                           color: '#6c757d',
                           fontSize: '16px',
                           transition: 'color 0.2s ease'
                         }}
                         onMouseEnter={(e) => e.target.style.color = '#495057'}
                         onMouseLeave={(e) => e.target.style.color = '#6c757d'}
                       />
                     </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      Confirm Password {editingUser && <span style={{ color: '#6c757d', fontSize: '12px' }}>(leave blank to keep current)</span>}
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                       <Form.Control
                         type={showConfirmPassword ? "text" : "password"}
                         value={formData.confirmPassword}
                         onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                         placeholder="Confirm password"
                         required={!editingUser}
                         isInvalid={formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword}
                         style={{
                           borderRadius: '12px',
                           border: '2px solid rgba(102, 126, 234, 0.2)',
                           padding: '12px 40px 12px 16px',
                           fontSize: '14px',
                           transition: 'all 0.3s ease'
                         }}
                       />
                       <i 
                         className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         style={{
                           position: 'absolute',
                           right: '12px',
                           top: '50%',
                           transform: 'translateY(-50%)',
                           cursor: 'pointer',
                           color: '#6c757d',
                           fontSize: '16px',
                           transition: 'color 0.2s ease'
                         }}
                         onMouseEnter={(e) => e.target.style.color = '#495057'}
                         onMouseLeave={(e) => e.target.style.color = '#6c757d'}
                       />
                     </div>
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <Form.Control.Feedback type="invalid">
                        Passwords do not match
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      Phone Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label 
                      style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '8px'
                      }}
                    >
                      User Role
                    </Form.Label>
                    <Form.Select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                      style={{
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        padding: '12px 16px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <option value="client">👤 Client</option>
                      <option value="admin">👑 Admin</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                       firstName: '',
                       lastName: '',
                       email: '',
                       password: '',
                       confirmPassword: '',
                       phone: '',
                       role: 'client'
                     })
                     setEmailValidation({ isValidating: false, isAvailable: null, message: '', hasBlurred: false })
                     setShowPassword(false)
                     setShowConfirmPassword(false)
                  }}
                  style={{
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    border: '2px solid #e9ecef',
                    background: 'white',
                    color: '#6c757d',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!editingUser && (emailValidation.isValidating || (emailValidation.hasBlurred && emailValidation.isAvailable === false) || (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword))}
                  style={{
                    background: (!editingUser && (emailValidation.isValidating || (emailValidation.hasBlurred && emailValidation.isAvailable === false) || (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword))) ? '#6c757d' : '#667eea',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {!editingUser && emailValidation.isValidating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Validating...
                    </>
                  ) : (
                    <>
                      <i className={editingUser ? 'bi bi-check-circle me-2' : 'bi bi-plus-circle me-2'}></i>
                      {editingUser ? 'Update User' : 'Create User'}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className="bi bi-person-circle me-2"></i>
            User Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {viewUser && (
            <div>
              <div className="text-center mb-4">
                <div 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <i className="bi bi-person" style={{ fontSize: '2rem', color: 'white' }}></i>
                </div>
                <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                  {viewUser.firstName} {viewUser.lastName}
                </h4>
                <Badge 
                  style={{
                    background: viewUser.role === 'admin' 
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                      : viewUser.role === 'manager'
                      ? 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  <i className={`bi ${
                    viewUser.role === 'admin' ? 'bi-shield-fill' :
                    viewUser.role === 'manager' ? 'bi-person-gear' :
                    'bi-person-fill'
                  } me-1`}></i>
                  {viewUser.role.toUpperCase()}
                </Badge>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong style={{ color: '#2c3e50' }}>Unique ID:</strong>
                  <p style={{ color: '#6c757d', marginBottom: '0' }}>{viewUser.userCode || 'N/A'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong style={{ color: '#2c3e50' }}>Email:</strong>
                  <p style={{ color: '#6c757d', marginBottom: '0' }}>{viewUser.email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong style={{ color: '#2c3e50' }}>Phone:</strong>
                  <p style={{ color: '#6c757d', marginBottom: '0' }}>{viewUser.phone || 'N/A'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong style={{ color: '#2c3e50' }}>Joined On:</strong>
                  <p style={{ color: '#6c757d', marginBottom: '0' }}>
                    {viewUser.createdAt ? format(new Date(viewUser.createdAt), 'dd MMM yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong style={{ color: '#2c3e50' }}>Last Updated:</strong>
                  <p style={{ color: '#6c757d', marginBottom: '0' }}>
                    {viewUser.updatedAt ? format(new Date(viewUser.updatedAt), 'dd MMM yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '1rem 2rem 2rem' }}>
          <Button 
            onClick={() => setShowViewModal(false)}
            style={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={deleteConfirmation.show} 
        onHide={handleDeleteCancel}
        centered
        backdrop="static"
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div className="text-center">
            <div 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: deleteConfirmation.hasUnitsError 
                  ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'
                  : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: deleteConfirmation.hasUnitsError
                  ? '0 8px 25px rgba(255, 193, 7, 0.3)'
                  : '0 8px 25px rgba(255, 107, 107, 0.3)'
              }}
            >
              <i className={deleteConfirmation.hasUnitsError ? 'bi bi-exclamation-triangle' : 'bi bi-trash'} style={{ fontSize: '2rem', color: 'white' }}></i>
            </div>
            <h5 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
              {deleteConfirmation.hasUnitsError ? 'Cannot Delete User' : 'Delete User Account'}
            </h5>
            {deleteConfirmation.hasUnitsError ? (
              <div>
                <p style={{ color: '#dc3545', marginBottom: '1rem', lineHeight: '1.6', fontWeight: '600' }}>
                  <strong>{deleteConfirmation.userName}</strong> cannot be deleted because they still have <strong>{deleteConfirmation.units.toFixed(2)} units</strong> allocated.
                </p>
                <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  The user must withdraw all their money (units = 0.00) before their account can be deleted.
                  <br />
                  <small className="text-muted">Please ensure all investments are liquidated first.</small>
                </p>
              </div>
            ) : (
              <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Are you sure you want to delete <strong>{deleteConfirmation.userName}</strong>?
                <br />
                <small className="text-muted">This action cannot be undone.</small>
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '1rem 2rem 2rem' }}>
          {deleteConfirmation.hasUnitsError ? (
            <Button 
              onClick={handleDeleteCancel}
              style={{
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '600',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
                transition: 'all 0.3s ease',
                color: 'white'
              }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Understood
            </Button>
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={handleDeleteCancel}
                style={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                  boxShadow: '0 4px 15px rgba(108, 117, 125, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteConfirm}
                style={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="bi bi-trash me-2"></i>
                Delete User
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
          </Container>
        </div>
      </div>
    </div>
  )
}
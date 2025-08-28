'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table } from 'react-bootstrap'
import { format } from 'date-fns'

export default function NAVManager() {
  const [navs, setNavs] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    value: ''
  })

  useEffect(() => {
    fetchNAVs()
    fetchUserData()
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

  const fetchNAVs = async () => {
    try {
      const response = await fetch('/api/nav')

      if (response.ok) {
        const data = await response.json()
        setNavs(data.navs)
      } else {
        setError('Failed to fetch NAV data')
      }
    } catch (error) {
      setError('Failed to fetch NAV data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/nav', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          value: ''
        })
        fetchNAVs()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update NAV')
      }
    } catch (error) {
      setError('Operation failed')
    }
  }

  const handleDelete = async (navId) => {
    if (!confirm('Are you sure you want to delete this NAV record?')) return

    try {
      const response = await fetch(`/api/nav?navId=${navId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Delete success:', result)
        fetchNAVs()
        setError('')
      } else {
        const errorData = await response.json()
        console.error('Delete failed:', errorData)
        setError(`Failed to delete NAV record: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError(`Failed to delete NAV record: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div 
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          background: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative gradient */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)'
          }}
        ></div>
        
        <div className="d-flex align-items-center">
          <div 
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '16px',
              padding: '14px',
              marginRight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            <i className="bi bi-bar-chart" style={{ fontSize: '22px', color: 'white' }}></i>
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>NAV History</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Track portfolio performance over time</p>
          </div>
        </div>
        <Button 
          style={{
            background: '#10b981',
            border: 'none',
            borderRadius: '16px',
            padding: '12px 24px',
            fontWeight: '600',
            fontSize: '14px',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => {
            setFormData({
              date: format(new Date(), 'yyyy-MM-dd'),
              value: ''
            })
            setShowModal(true)
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)'
            e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)'
            e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Update NAV
        </Button>
      </div>

      <Card 
        style={{
          background: 'white',
          border: 'none',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Card.Body style={{ padding: '0' }}>
          <div className="table-responsive">
            <Table 
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                marginBottom: '0'
              }}
            >
              <thead>
                <tr 
                  style={{
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    borderBottom: '3px solid #cbd5e1'
                  }}
                >
                  <th 
                    style={{
                      border: 'none',
                      color: '#1e293b',
                      fontWeight: '800',
                      padding: '24px 28px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="bi bi-calendar3 me-2"></i>
                    Date
                  </th>
                  <th 
                    style={{
                      border: 'none',
                      color: '#1e293b',
                      fontWeight: '800',
                      padding: '24px 28px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    NAV Value
                  </th>
                  <th 
                    style={{
                      border: 'none',
                      color: '#1e293b',
                      fontWeight: '800',
                      padding: '24px 28px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="bi bi-person-check me-2"></i>
                    Updated By
                  </th>
                  <th 
                    style={{
                      border: 'none',
                      color: '#1e293b',
                      fontWeight: '800',
                      padding: '24px 28px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="bi bi-clock me-2"></i>
                    Updated On
                  </th>
                  <th 
                    style={{
                      border: 'none',
                      color: '#1e293b',
                      fontWeight: '800',
                      padding: '24px 28px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="bi bi-gear me-2"></i>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {navs.length === 0 ? (
                  <tr>
                    <td 
                      colSpan="5" 
                      className="text-center" 
                      style={{ 
                        padding: '60px 28px',
                        color: '#64748b', 
                        fontSize: '18px', 
                        fontWeight: '500',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        border: 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
                        <div>No NAV records found</div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>Start by adding your first NAV record</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  navs.map((nav) => (
                     <tr 
                       key={nav._id}
                       style={{
                         borderBottom: '1px solid #e2e8f0',
                         transition: 'all 0.3s ease',
                         background: 'white'
                       }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.background = '#f8fafc'
                         e.currentTarget.style.transform = 'translateY(-1px)'
                         e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.background = 'white'
                         e.currentTarget.style.transform = 'translateY(0)'
                         e.currentTarget.style.boxShadow = 'none'
                       }}
                     >
                       <td 
                         style={{
                           padding: '20px 28px',
                           border: 'none',
                           color: '#475569',
                           fontSize: '15px',
                           fontWeight: '600',
                           verticalAlign: 'middle'
                         }}
                       >
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                         }}>
                           <div style={{
                             width: '8px',
                             height: '8px',
                             borderRadius: '50%',
                             background: '#10b981'
                           }}></div>
                           {format(new Date(nav.date), 'dd MMM yyyy')}
                         </div>
                       </td>
                       <td 
                         style={{
                           padding: '20px 28px',
                           border: 'none',
                           color: '#059669',
                           fontSize: '16px',
                           fontWeight: '700',
                           verticalAlign: 'middle'
                         }}
                       >
                         <span style={{
                           background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                           padding: '6px 12px',
                           borderRadius: '8px',
                           border: '1px solid #10b981'
                         }}>
                           ₹{nav.value.toFixed(2)}
                         </span>
                       </td>
                       <td 
                         style={{
                           padding: '20px 28px',
                           border: 'none',
                           color: '#475569',
                           fontSize: '15px',
                           fontWeight: '600',
                           verticalAlign: 'middle'
                         }}
                       >
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                         }}>
                           <div style={{
                             width: '32px',
                             height: '32px',
                             borderRadius: '50%',
                             background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             color: 'white',
                             fontSize: '12px',
                             fontWeight: '700'
                           }}>
                             {nav.updatedBy ? 
                             (nav.updatedBy.firstName ? 
                               nav.updatedBy.firstName.charAt(0).toUpperCase() : 
                               'A') : 
                             'U'}
                         </div>
                         {nav.updatedBy ? 
                           (nav.updatedBy.firstName && nav.updatedBy.lastName ? 
                             `${nav.updatedBy.firstName} ${nav.updatedBy.lastName}` : 
                             'Admin') : 
                           'Unknown'}
                         </div>
                       </td>
                       <td 
                         style={{
                           padding: '20px 28px',
                           border: 'none',
                           color: '#475569',
                           fontSize: '14px',
                           fontWeight: '500',
                           verticalAlign: 'middle'
                         }}
                       >
                         <div style={{
                           display: 'flex',
                           flexDirection: 'column',
                           gap: '2px'
                         }}>
                           <div>{format(new Date(nav.updatedAt), 'dd MMM yyyy')}</div>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#94a3b8' 
                           }}>
                             {format(new Date(nav.updatedAt), 'hh:mm a')}
                           </div>
                         </div>
                       </td>
                       <td style={{ 
                         padding: '20px 28px', 
                         border: 'none',
                         verticalAlign: 'middle'
                       }}>
                         <Button 
                           variant="outline-danger" 
                           size="sm"
                           onClick={() => handleDelete(nav._id)}
                           style={{
                             background: '#ef4444',
                             borderRadius: '12px',
                             padding: '8px 16px',
                             fontSize: '12px',
                             fontWeight: '600',
                             transition: 'all 0.2s ease',
                             border: 'none',
                             color: 'white'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.background = '#dc2626'
                             e.target.style.transform = 'translateY(-1px)'
                           }}
                           onMouseLeave={(e) => {
                             e.target.style.background = '#ef4444'
                             e.target.style.transform = 'translateY(0)'
                           }}
                         >
                           <i className="bi bi-trash3 me-1"></i>
                           Delete
                         </Button>
                       </td>
                     </tr>
                   ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Update NAV Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px 16px 0 0'
          }}
        >
          <Modal.Title style={{ fontWeight: '700', fontSize: '18px' }}>
            <i className="bi bi-plus-circle me-2"></i>
            Update NAV
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
           <Modal.Body style={{ padding: '32px', background: '#fafafa' }}>
             <Form.Group className="mb-4">
               <Form.Label style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '8px' }}>Date</Form.Label>
               <Form.Control
                 type="date"
                 value={formData.date}
                 onChange={(e) => setFormData({...formData, date: e.target.value})}
                 required
                 style={{
                   border: '2px solid #e2e8f0',
                   borderRadius: '12px',
                   padding: '12px 16px',
                   fontSize: '14px',
                   transition: 'all 0.2s ease',
                   background: 'white'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#10b981'
                   e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e2e8f0'
                   e.target.style.boxShadow = 'none'
                 }}
               />
             </Form.Group>
             <Form.Group className="mb-4">
               <Form.Label style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '8px' }}>NAV Value</Form.Label>
               <Form.Control
                 type="number"
                 step="0.01"
                 placeholder="Enter NAV value"
                 value={formData.value}
                 onChange={(e) => setFormData({...formData, value: e.target.value})}
                 required
                 style={{
                   border: '2px solid #e2e8f0',
                   borderRadius: '12px',
                   padding: '12px 16px',
                   fontSize: '14px',
                   transition: 'all 0.2s ease',
                   background: 'white'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#10b981'
                   e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e2e8f0'
                   e.target.style.boxShadow = 'none'
                 }}
               />
             </Form.Group>
           </Modal.Body>
          <Modal.Footer style={{ padding: '24px 32px', background: 'white', border: 'none', borderRadius: '0 0 16px 16px' }}>
             <Button 
               variant="secondary" 
               onClick={() => setShowModal(false)}
               style={{
                 background: '#f1f5f9',
                 border: 'none',
                 borderRadius: '12px',
                 padding: '12px 24px',
                 fontWeight: '600',
                 color: '#64748b',
                 transition: 'all 0.2s ease'
               }}
               onMouseEnter={(e) => {
                 e.target.style.background = '#e2e8f0'
               }}
               onMouseLeave={(e) => {
                 e.target.style.background = '#f1f5f9'
               }}
             >
               Cancel
             </Button>
             <Button 
               variant="primary" 
               type="submit"
               style={{
                 background: '#10b981',
                 border: 'none',
                 borderRadius: '12px',
                 padding: '12px 24px',
                 fontWeight: '600',
                 color: 'white',
                 transition: 'all 0.2s ease',
                 boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
               }}
               onMouseEnter={(e) => {
                 e.target.style.transform = 'translateY(-1px)'
                 e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
               }}
               onMouseLeave={(e) => {
                 e.target.style.transform = 'translateY(0)'
                 e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
               }}
             >
               <i className="bi bi-check-circle me-2"></i>
               Update NAV
             </Button>
           </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}
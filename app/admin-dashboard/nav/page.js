'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'
import NAVManager from '../../../components/NAVManager'

export default function NAVPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

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

  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          style={{
            width: '60px',
            height: '60px',
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

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    position: 'relative'
  }

  const containerStyle = {
    flexGrow: 1,
    position: 'relative',
    zIndex: 2,
    padding: '2rem'
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    border: 'none',
    borderRadius: '24px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  }



  return (
    <div style={pageStyle}>
      <Navbar user={user} />
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        <div style={{ flexShrink: 0 }}>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0, overflow: 'auto' }}>
          <Container fluid className="py-4" style={containerStyle}>
            <Row>
              <Col>
                <div style={headerStyle}>
                  {/* Decorative background elements */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '200px',
                      height: '200px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      filter: 'blur(40px)'
                    }}
                  ></div>
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-30px',
                      left: '-30px',
                      width: '150px',
                      height: '150px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '50%',
                      filter: 'blur(30px)'
                    }}
                  ></div>
                  
                  <div className="d-flex align-items-center mb-0" style={{ position: 'relative', zIndex: 2 }}>
                    <div 
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '16px',
                        marginRight: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <i className="bi bi-graph-up" style={{ fontSize: '28px', color: 'white' }}></i>
                    </div>
                    <div>
                      <h1 
                        style={{
                          margin: 0,
                          fontSize: '32px',
                          fontWeight: '800',
                          color: 'white',
                          textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          letterSpacing: '-0.5px'
                        }}
                      >
                        NAV Management
                      </h1>
                      <p 
                        style={{
                          margin: '8px 0 0 0',
                          fontSize: '16px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontWeight: '400'
                        }}
                      >
                        Monitor and update Net Asset Values
                      </p>
                    </div>
                  </div>
                </div>
                <NAVManager />
              </Col>
            </Row>
          </Container>
        </div>
      </div>


    </div>
  )
}
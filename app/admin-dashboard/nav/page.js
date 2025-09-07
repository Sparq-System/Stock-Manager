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
                        NAV Management
                      </h1>
                      <p style={{ color: '#6c757d', margin: '0', fontSize: '1rem' }}>
                        Monitor and update Net Asset Values
                      </p>
                    </div>
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
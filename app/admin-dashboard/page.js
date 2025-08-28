'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    totalVolume: 0
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchStats()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        console.error('No authentication token found')
        router.push('/login')
        return
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        console.error('Failed to fetch user data:', response.status)
        if (response.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        console.error('No authentication token found for stats')
        return
      }

      const [usersRes, tradesRes] = await Promise.all([
        fetch('/api/users?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/trades?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      console.log('Users response status:', usersRes.status)
      console.log('Trades response status:', tradesRes.status)

      if (usersRes.ok && tradesRes.ok) {
        const usersData = await usersRes.json()
        const tradesData = await tradesRes.json()
        
        console.log('Users data:', usersData)
        console.log('Trades data:', tradesData)
        
        const volume = tradesData.trades?.reduce((sum, trade) =>
          sum + (trade.purchaseRate * trade.unitsPurchased), 0) || 0

        setStats({
          totalUsers: usersData.users?.length || 0,
          totalTrades: tradesData.trades?.length || 0,
          totalVolume: volume
        })
      } else {
        console.error('Failed to fetch stats - Users:', usersRes.status, 'Trades:', tradesRes.status)
        if (usersRes.status === 401 || tradesRes.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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

  const getStatsCardStyle = (gradient) => ({
    background: `linear-gradient(135deg, ${gradient})`,
    border: 'none',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    position: 'relative'
  })

  const quickActionsStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  }

  const getButtonStyle = (gradient, isHovered) => ({
    background: gradient,
    border: 'none',
    borderRadius: '16px',
    padding: '12px 24px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
    boxShadow: isHovered 
      ? '0 8px 25px rgba(0,0,0,0.2)'
      : '0 4px 15px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  })

  return (
    <div style={pageStyle}>
      {/* Animated background elements */}
      <div 
        className="position-absolute"
        style={{
          top: '15%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          top: '60%',
          right: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          bottom: '20%',
          left: '20%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(25px)',
          animation: 'float 12s ease-in-out infinite'
        }}
      ></div>
      
      <Navbar user={user} />
      <div className="d-flex">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex-grow-1">
          <Container fluid className="py-4" style={containerStyle}>
            <Row>
              <Col>
                <div style={headerStyle}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h1 className="mb-2 fw-bold text-white" style={{ fontSize: '2.5rem' }}>Admin Dashboard</h1>
                      <p className="text-white-50 mb-0 fs-5">Manage your portfolio system with powerful admin tools 🚀</p>
                    </div>
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        animation: 'pulse 3s infinite'
                      }}
                    >
                      <i className="bi bi-shield-check text-white" style={{ fontSize: '2rem' }}></i>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-5">
              <Col md={4}>
                <Card 
                  style={getStatsCardStyle('rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-4 p-3 me-3"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-people text-white fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 fw-medium">Total Users</h6>
                        <h2 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>{stats.totalUsers}</h2>
                        <small className="text-success fw-semibold">+12% this month</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card 
                  style={getStatsCardStyle('rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-4 p-3 me-3"
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                        <h6 className="text-muted mb-1 fw-medium">Total Trades</h6>
                        <h2 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>{stats.totalTrades}</h2>
                        <small className="text-info fw-semibold">+8% this week</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card 
                  style={getStatsCardStyle('rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-4 p-3 me-3"
                        style={{
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-currency-rupee text-white fs-3"></i>
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 fw-medium">Total Volume</h6>
                        <h2 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>₹{stats.totalVolume.toLocaleString()}</h2>
                        <small className="text-warning fw-semibold">+15% this month</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card style={quickActionsStyle}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-4">
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
                        <i className="bi bi-lightning-charge text-white fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>Quick Actions</h4>
                        <p className="text-muted mb-0">Manage your system efficiently</p>
                      </div>
                    </div>
                    <div className="d-flex gap-3 flex-wrap">
                      <button
                        style={getButtonStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', false)}
                        onClick={() => router.push('/admin-dashboard/users')}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)'
                          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)'
                          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="bi bi-people me-2"></i>
                        Manage Users
                      </button>
                      <button
                        style={getButtonStyle('#4facfe', false)}
                        onClick={() => router.push('/admin-dashboard/trades')}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)'
                          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)'
                          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="bi bi-graph-up me-2"></i>
                        Manage Trades
                      </button>
                      <button
                        style={getButtonStyle('#43e97b', false)}
                        onClick={() => router.push('/admin-dashboard/nav')}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)'
                          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)'
                          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className="bi bi-currency-rupee me-2"></i>
                        Update NAV
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(-5px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
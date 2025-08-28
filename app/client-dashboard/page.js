'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Navbar from '../../components/Navbar'
import SummaryCards from '../../components/SummaryCards'
import ReturnChart from '../../components/ReturnChart'
import TradesTable from '../../components/TradesTable'

export default function ClientDashboard() {
  const [trades, setTrades] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({
    investedValue: 0,
    currentValue: 0,
    nav: 0
  })

  useEffect(() => {
    fetchUserData()
    fetchTrades()
    fetchLatestNAV()
  }, [])

  const fetchUserData = async () => {
    try {
      // Try to get token from localStorage first, then from cookies
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) {
        console.error('No authentication token found')
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
      } else if (response.status === 401) {
        console.error('Authentication failed, redirecting to login')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchTrades = async () => {
    try {
      // Try to get token from localStorage first, then from cookies
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades)
        calculateSummary(data.trades)
      } else if (response.status === 401) {
        console.error('Authentication failed, redirecting to login')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestNAV = async () => {
    try {
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) {
        console.error('No authentication token found for NAV')
        return
      }

      const response = await fetch('/api/nav', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.navs && data.navs.length > 0) {
          // Update the NAV in summary data with the latest value
          setSummaryData(prev => ({
            ...prev,
            nav: data.navs[0].value
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching NAV:', error)
    }
  }

  const calculateSummary = (tradesData) => {
    const invested = tradesData.reduce((sum, trade) =>
      sum + (trade.purchaseRate * trade.unitsPurchased), 0)
    
    const current = tradesData.reduce((sum, trade) => {
      if (trade.status === 'sold') {
        return sum + (trade.sellingPrice * trade.unitsSold)
      }
      return sum + (trade.purchaseRate * trade.unitsPurchased * 1.1) // Mock current value
    }, 0)

    setSummaryData(prev => ({
      ...prev,
      investedValue: invested,
      currentValue: current
    }))
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="text-center">
          <div className="d-flex align-items-center justify-content-center mb-3">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            >
              <i className="bi bi-arrow-clockwise text-white" style={{ fontSize: '2rem' }}></i>
            </div>
          </div>
          <h4 className="text-muted mb-2">Loading Dashboard</h4>
          <p className="text-muted">Please wait while we fetch your portfolio data...</p>
        </div>
      </div>
    )
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    position: 'relative',
    overflow: 'hidden'
  }

  const containerStyle = {
    position: 'relative',
    zIndex: 2
  }

  const headerStyle = {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '24px',
    marginBottom: '32px'
  }

  const portfolioStatsStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={pageStyle}>
      {/* Animated background elements */}
      <div 
        className="position-absolute"
        style={{
          top: '10%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 6s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          top: '60%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      ></div>
      
      <Navbar user={user} />
      
      <Container fluid className="py-4" style={containerStyle}>
        <Row>
          <Col>
            <div style={headerStyle}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h1 className="mb-2 fw-bold" style={{ color: '#2c3e50' }}>Dashboard</h1>
                  <p className="text-muted mb-0 fs-5">Welcome back, <span className="fw-semibold" style={{ color: '#667eea' }}>{user?.firstName} {user?.lastName}</span>! 👋</p>
                </div>
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <i className="bi bi-speedometer2 text-white fs-3"></i>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="mb-5">
          <SummaryCards data={summaryData} />
        </div>

        <Row className="g-4 mb-5">
          <Col lg={8}>
            <ReturnChart trades={trades} />
          </Col>
          <Col lg={4}>
            <div 
              className="card border-0 shadow-lg h-100"
              style={portfolioStatsStyle}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div 
                    className="rounded-3 p-2 me-3"
                    style={{
                      background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="bi bi-graph-up text-white fs-5"></i>
                  </div>
                  <h5 className="mb-0 fw-bold text-dark">Portfolio Performance</h5>
                </div>
                
                <div className="space-y-3">
                  <div 
                    className="d-flex justify-content-between align-items-center p-3 rounded-3"
                    style={{
                      background: 'rgba(102, 126, 234, 0.05)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="text-muted fw-medium">Total Returns</span>
                    <span className={`fw-bold fs-5 ${summaryData.currentValue > summaryData.investedValue ? 'text-success' : 'text-danger'}`}>
                      ₹{(summaryData.currentValue - summaryData.investedValue).toLocaleString()}
                    </span>
                  </div>
                  
                  <div 
                    className="d-flex justify-content-between align-items-center p-3 rounded-3"
                    style={{
                      background: 'rgba(17, 153, 142, 0.05)',
                      border: '1px solid rgba(17, 153, 142, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="text-muted fw-medium">Return %</span>
                    <span className={`fw-bold fs-5 ${summaryData.currentValue > summaryData.investedValue ? 'text-success' : 'text-danger'}`}>
                      {(((summaryData.currentValue - summaryData.investedValue) / summaryData.investedValue) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <TradesTable trades={trades} />
          </Col>
        </Row>
      </Container>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .space-y-3 > * + * {
          margin-top: 12px;
        }
      `}</style>
    </div>
  )
}
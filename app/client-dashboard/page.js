'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Navbar from '../../components/Navbar'
import SummaryCards from '../../components/SummaryCards'
import ReturnChart from '../../components/ReturnChart'
import InvestmentVsCurrentChart from '../../components/InvestmentVsCurrentChart'

export default function ClientDashboard() {
  const [holdings, setHoldings] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({
    investedValue: 0,
    currentValue: 0,
    nav: 0,
    totalUnits: 0
  })

  useEffect(() => {
    const loadData = async () => {
      const userData = await fetchUserData()
      const navData = await fetchLatestNAV()
      await fetchHoldings(userData, navData)
    }
    loadData()
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
        return null
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        return userData
      } else if (response.status === 401) {
        console.error('Authentication failed, redirecting to login')
        window.location.href = '/login'
        return null
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  const fetchHoldings = async (currentUser = user, currentNav = null) => {
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

      const response = await fetch('/api/holdings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Holdings are already filtered by the API for client users
        setHoldings(data.holdings)
        // Use the currentUser parameter and currentNav to ensure we have the correct data
        calculateSummary(data.holdings, currentUser, currentNav || summaryData.nav)
      } else if (response.status === 401) {
        console.error('Authentication failed, redirecting to login')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error fetching holdings:', error)
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
        return null
      }

      const response = await fetch('/api/nav', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.navs && data.navs.length > 0) {
          const navValue = data.navs[0].value
          // Update the NAV in summary data with the latest value
          setSummaryData(prev => ({
            ...prev,
            nav: navValue
          }))
          return navValue
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching NAV:', error)
      return null
    }
  }

  const calculateSummary = (holdingsData, currentUser = user, currentNav = summaryData.nav) => {
    if (!currentUser || !currentNav) {
      return;
    }

    // Get invested amount directly from user data
    const invested = currentUser?.investedAmount || 0
    
    // Calculate current value by multiplying total units with current NAV
    const totalUnits = currentUser?.units || 0
    const current = totalUnits * (currentNav || 1)

    setSummaryData(prev => ({
      ...prev,
      investedValue: invested,
      currentValue: current,
      totalUnits: totalUnits
    }))
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)' }}>
        <div className="text-center">
          <div className="d-flex align-items-center justify-content-center mb-5">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: '30px',
                animation: 'float 3s ease-in-out infinite',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: '3rem', animation: 'pulse 2s infinite' }}></i>
            </div>
          </div>
          <h2 className="text-white mb-3 fw-bold" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '2rem', letterSpacing: '-0.02em' }}>Loading Portfolio</h2>
          <p className="text-white mb-4" style={{ fontSize: '1.125rem', opacity: 0.8 }}>Fetching your latest investment data...</p>
          <div className="d-flex align-items-center justify-content-center">
            <div className="d-flex align-items-center px-4 py-2 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <div className="rounded-circle me-2" style={{ width: '8px', height: '8px', background: '#10b981', animation: 'pulse 1.5s infinite' }}></div>
              <span className="text-white" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Connecting to live data</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  }

  const containerStyle = {
    position: 'relative',
    zIndex: 2
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
    backdropFilter: 'blur(25px)',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '40px',
    marginBottom: '48px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.15), 0 12px 35px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)'
  }

  const portfolioStatsStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '28px',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.12), 0 12px 35px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
    backdropFilter: 'blur(25px)'
  }

  return (
    <div style={pageStyle}>
      {/* Animated background elements */}
      <div 
        className="position-absolute"
        style={{
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          top: '50%',
          right: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite reverse'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          bottom: '20%',
          left: '20%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'float 12s ease-in-out infinite'
        }}
      ></div>
      
      <Navbar user={user} />
      
      <Container fluid className="py-4" style={{ ...containerStyle, maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <Row>
          <Col>
            <div style={{ ...headerStyle, marginBottom: '48px' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-3">
                    <h1 className="mb-0 fw-bold me-3" style={{ color: '#0f172a', fontSize: '3rem', letterSpacing: '-0.03em', fontFamily: 'Inter, system-ui, sans-serif' }}>Portfolio</h1>
                    <span className="badge px-3 py-2" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontSize: '0.875rem', borderRadius: '12px', fontWeight: '600' }}>ACTIVE</span>
                  </div>
                  <p className="mb-2" style={{ fontSize: '1.25rem', color: '#475569', fontWeight: '500' }}>Welcome back, <span className="fw-bold" style={{ color: '#0f172a' }}>{user?.firstName} {user?.lastName}</span>! 👋</p>
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center me-4">
                      <div className="rounded-circle me-2" style={{ width: '8px', height: '8px', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                      <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Live Data</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-clock me-2" style={{ color: '#64748b', fontSize: '0.875rem' }}></i>
                      <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <div 
                    className="d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '100px',
                      height: '100px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      borderRadius: '24px',
                      animation: 'float 6s ease-in-out infinite',
                      boxShadow: '0 15px 40px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  >
                    <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  <div>
                    <div className="text-end mb-1">
                      <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Portfolio Score</span>
                    </div>
                    <div className="text-end">
                      <span style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>A+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="mb-5" style={{ marginBottom: '48px' }}>
          <SummaryCards data={summaryData} />
        </div>

        <Row className="g-4 mb-5">
          <Col lg={8}>
            <ReturnChart holdings={holdings} />
          </Col>
          <Col lg={4}>
            <div 
              className="card border-0 shadow-lg h-100"
              style={portfolioStatsStyle}
            >
              <div className="card-body p-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-4 p-3 me-3"
                      style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        width: '64px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 35px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                        animation: 'float 8s ease-in-out infinite'
                      }}
                    >
                      <i className="bi bi-graph-up text-white" style={{ fontSize: '1.75rem' }}></i>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold" style={{ color: '#0f172a', fontSize: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>Performance</h5>
                      <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Real-time Analytics</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge px-3 py-2" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', fontSize: '0.75rem', borderRadius: '10px', fontWeight: '600' }}>LIVE</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div 
                    className="d-flex justify-content-between align-items-center p-4 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-currency-rupee me-2" style={{ color: '#10b981', fontSize: '1rem' }}></i>
                        <span style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Total Returns</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${summaryData.currentValue > summaryData.investedValue ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'} me-2`} style={{ color: summaryData.currentValue > summaryData.investedValue ? '#10b981' : '#ef4444', fontSize: '1rem' }}></i>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Since inception</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className={`fw-bold d-block ${summaryData.currentValue > summaryData.investedValue ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        ₹{Math.abs(summaryData.currentValue - summaryData.investedValue).toLocaleString()}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>{summaryData.currentValue > summaryData.investedValue ? 'Profit' : 'Loss'}</span>
                    </div>
                  </div>
                  
                  <div 
                    className="d-flex justify-content-between align-items-center p-4 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-percent me-2" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                        <span style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Return Rate</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${summaryData.currentValue > summaryData.investedValue ? 'bi-trending-up' : 'bi-trending-down'} me-2`} style={{ color: summaryData.currentValue > summaryData.investedValue ? '#10b981' : '#ef4444', fontSize: '1rem' }}></i>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Annual growth</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className={`fw-bold d-block ${summaryData.currentValue > summaryData.investedValue ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {summaryData.investedValue > 0 ? (((summaryData.currentValue - summaryData.investedValue) / summaryData.investedValue) * 100).toFixed(2) : '0.00'}%
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Performance</span>
                    </div>
                  </div>
                  
                  <div 
                    className="d-flex justify-content-between align-items-center p-4 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 25px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 12px 35px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-speedometer2 me-2" style={{ color: '#a855f7', fontSize: '1rem' }}></i>
                        <span style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Risk Score</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="rounded-pill me-2" style={{ width: '8px', height: '8px', background: '#10b981' }}></div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Low risk profile</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold d-block" style={{ fontSize: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif', color: '#10b981' }}>
                        7.2/10
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Stability</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col lg={8}>
            <InvestmentVsCurrentChart />
          </Col>
          <Col lg={4}>
            <div 
              className="card border-0 shadow-lg h-100"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '28px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.12), 0 12px 35px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                backdropFilter: 'blur(25px)'
              }}
            >
              <div className="card-body p-5">
                <div className="d-flex align-items-center mb-4">
                  <div 
                    className="rounded-4 p-3 me-3"
                    style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 35px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                      animation: 'float 10s ease-in-out infinite'
                    }}
                  >
                    <i className="bi bi-lightning-charge text-white" style={{ fontSize: '1.75rem' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold" style={{ color: '#0f172a', fontSize: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>Quick Actions</h5>
                    <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Manage your portfolio</span>
                  </div>
                </div>
                
                <div className="d-grid gap-3">
                  <button 
                    className="btn d-flex align-items-center justify-content-between p-4 border-0 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-plus-circle-fill me-3" style={{ color: '#10b981', fontSize: '1.25rem' }}></i>
                      <div className="text-start">
                        <div style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Add Investment</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Invest more funds</div>
                      </div>
                    </div>
                    <i className="bi bi-arrow-right" style={{ color: '#10b981', fontSize: '1rem' }}></i>
                  </button>
                  
                  <button 
                    className="btn d-flex align-items-center justify-content-between p-4 border-0 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.1)'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-text-fill me-3" style={{ color: '#3b82f6', fontSize: '1.25rem' }}></i>
                      <div className="text-start">
                        <div style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>View Reports</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Detailed analytics</div>
                      </div>
                    </div>
                    <i className="bi bi-arrow-right" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                  </button>
                  
                  <button 
                    className="btn d-flex align-items-center justify-content-between p-4 border-0 rounded-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 25px rgba(168, 85, 247, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0px)'
                      e.target.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.1)'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-gear-fill me-3" style={{ color: '#a855f7', fontSize: '1.25rem' }}></i>
                      <div className="text-start">
                        <div style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Settings</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Manage preferences</div>
                      </div>
                    </div>
                    <i className="bi bi-arrow-right" style={{ color: '#a855f7', fontSize: '1rem' }}></i>
                  </button>
                </div>
                
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Market Status</span>
                    <span className="badge px-2 py-1" style={{ background: '#10b981', color: 'white', fontSize: '0.75rem', borderRadius: '8px' }}>OPEN</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Next Update</div>
                      <div style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>15:30 IST</div>
                    </div>
                    <div className="text-end">
                      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Last Sync</div>
                      <div style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>2 min ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Notification Banner */}
        <Row className="mb-4">
          <Col>
            <div 
              className="d-flex align-items-center justify-content-between p-4 rounded-4"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle p-2 me-3"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="bi bi-info-circle text-white" style={{ fontSize: '1rem' }}></i>
                </div>
                <div>
                  <div style={{ color: '#374151', fontWeight: '600', fontSize: '0.875rem' }}>Portfolio Update Available</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Your portfolio has been updated with the latest market data</div>
                </div>
              </div>
              <button 
                className="btn btn-sm px-3 py-2"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                View Details
              </button>
            </div>
          </Col>
        </Row>

      </Container>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(1deg); }
          66% { transform: translateY(-25px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-200%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        
        .space-y-4 > * + * {
          margin-top: 16px;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 25px 80px rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  )
}
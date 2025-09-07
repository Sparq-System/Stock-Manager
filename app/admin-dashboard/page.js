'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    totalVolume: 0,
    activeTrades: 0,
    totalProfit: 0,
    portfolioValue: 0,
    totalInvestment: 0,
    totalUnits: 0,
    totalValuation: 0,
    avgReturn: 0
  })
  const [chartData, setChartData] = useState({
    navHistory: [],
    tradeDistribution: [],
    monthlyGrowth: [],
    profitLoss: []
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchStats()
    fetchChartData()
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
      // Try to get token from localStorage first, then from cookies
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) {
        console.error('No authentication token found for stats')
        return
      }

      const [usersRes, tradesRes, navRes, portfolioRes] = await Promise.all([
        fetch('/api/users?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/trades?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/nav', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/portfolio-totals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (usersRes.ok && tradesRes.ok) {
        const usersData = await usersRes.json()
        const tradesData = await tradesRes.json()
        const navData = navRes.ok ? await navRes.json() : { navs: [] }
        const portfolioData = portfolioRes.ok ? await portfolioRes.json() : { data: { totalUnits: 0, totalInvestment: 0 } }
        
        const trades = tradesData.trades || []
        const users = usersData.users || []
        const currentNAV = navData.navs?.[0]?.value || 100
        
        // Calculate comprehensive metrics
        const totalVolume = trades.reduce((sum, trade) =>
          sum + (trade.purchaseRate * trade.unitsPurchased), 0)
        
        const activeTrades = trades.filter(trade => trade.status === 'active').length
        
        const totalProfit = trades.reduce((sum, trade) => {
          if (trade.status === 'sold' && trade.sellingPrice) {
            const profit = (trade.sellingPrice - trade.purchaseRate) * trade.unitsSold
            return sum + profit
          }
          return sum
        }, 0)
        
        // Use portfolio totals from PortfolioTotals collection
        const totalUnits = portfolioData.data?.totalUnits || 0
        const portfolioValue = totalUnits * currentNAV
        const totalInvestment = portfolioData.data?.totalInvestment || 0
        const totalValuation = totalUnits * currentNAV
        
        const avgReturn = trades.length > 0 ? (totalProfit / totalVolume) * 100 : 0

        setStats({
          totalUsers: users.length,
          totalTrades: trades.length,
          totalVolume,
          activeTrades,
          totalProfit,
          portfolioValue,
          totalInvestment,
          totalUnits,
          totalValuation,
          avgReturn
        })
      } else {
        console.error('Failed to fetch stats')
        if (usersRes.status === 401 || tradesRes.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchChartData = async () => {
    try {
      // Try to get token from localStorage first, then from cookies
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) return

      const [navRes, tradesRes, usersRes] = await Promise.all([
        fetch('/api/nav', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/trades?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users?all=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (navRes.ok && tradesRes.ok && usersRes.ok) {
        const navData = await navRes.json()
        const tradesData = await tradesRes.json()
        const usersData = await usersRes.json()
        
        const navHistory = navData.navs?.slice(0, 30).reverse() || []
        const trades = tradesData.trades || []
        const users = usersData.users || []
        
        // NAV History for line chart
        const navChartData = {
          labels: navHistory.map(nav => new Date(nav.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })),
          datasets: [{
            label: 'NAV Value',
            data: navHistory.map(nav => nav.value),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
          }]
        }
        
        // Trade Status Distribution for doughnut chart
        const tradeStatusCounts = trades.reduce((acc, trade) => {
          acc[trade.status] = (acc[trade.status] || 0) + 1
          return acc
        }, {})
        
        const tradeDistributionData = {
          labels: Object.keys(tradeStatusCounts),
          datasets: [{
            data: Object.values(tradeStatusCounts),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0'
            ]
          }]
        }
        
        // Monthly user growth for bar chart
        const monthlyUsers = users.reduce((acc, user) => {
          const month = new Date(user.dateOfJoining).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {})
        
        const monthlyGrowthData = {
          labels: Object.keys(monthlyUsers).slice(-6),
          datasets: [{
            label: 'New Users',
            data: Object.values(monthlyUsers).slice(-6),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        }
        
        setChartData({
          navHistory: navChartData,
          tradeDistribution: tradeDistributionData,
          monthlyGrowth: monthlyGrowthData,
          profitLoss: []
        })
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    position: 'fixed',
    width: '100%',
    height: '100vh',
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
    <div style={{ ...pageStyle, position: 'fixed', width: '100%', height: '100vh' }}>
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
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Navbar user={user} isAdmin={true} />
      </div>
      <div className="d-flex">
        <div style={{ position: 'fixed', left: 0, top: '76px', bottom: 0, zIndex: 999 }}>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        <div 
          className="flex-grow-1" 
          style={{
            marginLeft: isSidebarCollapsed ? '80px' : '280px',
            marginTop: '76px',
            height: 'calc(100vh - 76px)',
            overflowY: 'auto',
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: 0,
            width: `calc(100vw - ${isSidebarCollapsed ? '80px' : '280px'})`
          }}
        >
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

            {/* Dynamic Stats Cards - Reorganized into 2 rows with 3 cards each */}
            <div className="d-flex flex-wrap gap-4 mb-4" style={{ minHeight: 'auto' }}>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Total Users</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: '#2c3e50', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>{stats.totalUsers}</h2>
                        <small className="text-success fw-semibold">Active Clients</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Active Trades</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: '#2c3e50', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>{stats.activeTrades}</h2>
                        <small className="text-info fw-semibold">of {stats.totalTrades} total</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                        <i className="bi bi-pie-chart text-white fs-3"></i>
                      </div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Total Units</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: '#2c3e50', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>{stats.totalUnits.toLocaleString()}</h2>
                        <small className="text-info fw-semibold">Portfolio Units</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            
            {/* Second Row of Stats Cards */}
            <div className="d-flex flex-wrap gap-4 mb-5" style={{ minHeight: 'auto' }}>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-cash-stack text-white fs-3"></i>
                      </div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Total Investment</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: '#2c3e50', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>₹{stats.totalInvestment.toLocaleString()}</h2>
                        <small className="text-primary fw-semibold">Invested Amount</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                        <i className="bi bi-calculator text-white fs-3"></i>
                      </div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Total Valuation</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: '#2c3e50', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>₹{stats.totalValuation.toLocaleString()}</h2>
                        <small className="text-info fw-semibold">Units × NAV</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div style={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px', maxWidth: 'none' }}>
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
                          background: (stats.totalValuation - stats.totalInvestment) >= 0 
                            ? 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)'
                            : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className={`bi ${(stats.totalValuation - stats.totalInvestment) >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'} text-white fs-3`}></i>
                      </div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <h6 className="text-muted mb-1 fw-medium">Profit & Loss</h6>
                        <h2 className="mb-0 fw-bold text-truncate" style={{ color: (stats.totalValuation - stats.totalInvestment) >= 0 ? '#28a745' : '#dc3545', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}>₹{(stats.totalValuation - stats.totalInvestment).toLocaleString()}</h2>
                        <small className={(stats.totalValuation - stats.totalInvestment) >= 0 ? 'text-success' : 'text-danger'}>Total Valuation - Total Investment</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Charts Section */}
             <Row className="g-4 mb-5">
               <Col lg={12}>
                 <Card 
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                     backdropFilter: 'blur(25px)',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '24px',
                     boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                     transition: 'all 0.4s ease'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)'
                     e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.12)'
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)'
                     e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)'
                   }}
                 >
                  <Card.Header 
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '1.5rem 1.5rem 0'
                    }}
                  >
                    <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>NAV Performance History</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div style={{ height: '350px' }}>
                      {chartData.navHistory.labels && chartData.navHistory.labels.length > 0 ? (
                        <Line 
                          data={chartData.navHistory}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: false,
                                grid: {
                                  color: 'rgba(0,0,0,0.1)',
                                },
                                ticks: {
                                  callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                  }
                                }
                              },
                              x: {
                                grid: {
                                  color: 'rgba(0,0,0,0.1)',
                                }
                              }
                            },
                            elements: {
                              point: {
                                radius: 4,
                                hoverRadius: 6
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <div className="text-center">
                            <div className="spinner-border text-primary mb-3" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted">Loading NAV data...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                 <Card 
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                     backdropFilter: 'blur(25px)',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '24px',
                     boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                     transition: 'all 0.4s ease',
                     marginBottom: '2rem'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)'
                     e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.12)'
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)'
                     e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)'
                   }}
                 >
                  <Card.Header 
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '1.5rem 1.5rem 0'
                    }}
                  >
                    <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>Trade Status Distribution</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <div style={{ height: '250px' }}>
                      {chartData.tradeDistribution.labels && chartData.tradeDistribution.labels.length > 0 ? (
                        <Doughnut 
                          data={chartData.tradeDistribution}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  padding: 20,
                                  usePointStyle: true
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <div className="text-center">
                            <div className="spinner-border text-primary mb-3" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted">Loading trade data...</p>
                          </div>
                        </div>
                      )}
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
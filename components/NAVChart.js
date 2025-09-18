'use client'
import { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function NAVChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })
  const [loading, setLoading] = useState(true)
  const [navData, setNavData] = useState([])

  useEffect(() => {
    fetchNAVData()
  }, [])

  useEffect(() => {
    if (navData.length > 0) {
      generateChartData()
    }
  }, [navData])

  const fetchNAVData = async () => {
    try {
      setLoading(true)
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

      const response = await fetch('/api/nav', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNavData(data.navs || [])
      } else {
        console.error('Failed to fetch NAV data')
      }
    } catch (error) {
      console.error('Error fetching NAV data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = () => {
    if (!navData.length) return

    // Sort by date ascending
    const sortedData = navData.sort((a, b) => new Date(a.date) - new Date(b.date))

    const labels = sortedData.map(nav => {
      const date = new Date(nav.date)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    })

    const navValues = sortedData.map(nav => nav.value)

    setChartData({
      labels,
      datasets: [
        {
          label: 'NAV (Net Asset Value)',
          data: navValues,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: 'rgb(16, 185, 129)',
          pointHoverBackgroundColor: 'rgb(5, 150, 105)',
          pointHoverBorderColor: 'rgb(5, 150, 105)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `NAV: ₹${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toFixed(2)
          },
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280',
          maxTicksLimit: 8
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }

  const buttonStyle = {
    borderRadius: '25px',
    padding: '8px 20px',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    border: 'none',
    margin: '0 4px'
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg" style={cardStyle}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-3 p-2 me-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-graph-up text-white fs-5"></i>
              </div>
              <h5 className="mb-0 fw-bold text-dark">NAV Performance</h5>
            </div>
          </div>
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '350px',
              background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <div className="text-center">
              <div className="spinner-border text-success mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading NAV data...</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (!navData.length) {
    return (
      <Card className="border-0 shadow-lg" style={cardStyle}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-3 p-2 me-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-graph-up text-white fs-5"></i>
              </div>
              <h5 className="mb-0 fw-bold text-dark">NAV Performance</h5>
            </div>
          </div>
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '350px',
              background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <div className="text-center">
              <i className="bi bi-graph-down text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="mt-3 text-muted">No NAV Data Available</h6>
              <p className="text-muted mb-0">NAV data will appear here once available</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg" style={cardStyle}>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-3 p-2 me-3"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-graph-up text-white fs-5"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark">NAV Performance</h5>
          </div>

        </div>
        <div 
          className="position-relative"
          style={{ 
            height: '350px',
            background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Line data={chartData} options={options} />
        </div>
      </Card.Body>
    </Card>
  )
}
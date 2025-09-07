'use client'
import { useState, useEffect } from 'react'
import { Card, ButtonGroup, Button, Spinner } from 'react-bootstrap'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function InvestmentVsCurrentChart() {
  const [period, setPeriod] = useState('1Y')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    fetchHistoricalData()
  }, [period])

  const fetchHistoricalData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get token from localStorage or cookies
      let token = localStorage.getItem('token')
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]
      }

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/portfolio-history?period=${period}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        generateChartData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData({ labels: [], datasets: [] })
      return
    }

    // Sort data by date
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    const labels = sortedData.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: period === '1Y' || period === 'ALL' ? 'numeric' : undefined
      })
    })

    const investedAmounts = sortedData.map(item => item.investedAmount)
    const currentValues = sortedData.map(item => item.currentValue)

    setChartData({
      labels,
      datasets: [
        {
          label: 'Current Value',
          data: currentValues,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgb(34, 197, 94)',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        },
        {
          label: 'Invested Amount',
          data: investedAmounts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }
      ]
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
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
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y
            return `${context.dataset.label}: ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          },
          afterBody: function(tooltipItems) {
            if (tooltipItems.length >= 2) {
              const currentValue = tooltipItems.find(item => item.dataset.label === 'Current Value')?.parsed.y || 0
              const investedAmount = tooltipItems.find(item => item.dataset.label === 'Invested Amount')?.parsed.y || 0
              const returns = currentValue - investedAmount
              const returnsPercentage = investedAmount > 0 ? ((returns / investedAmount) * 100) : 0
              
              return [
                '',
                `Returns: ₹${returns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `Returns %: ${returnsPercentage.toFixed(2)}%`
              ]
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280',
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN')
          }
        }
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round'
      }
    }
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
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

  if (error) {
    return (
      <Card className="border-0 shadow-lg" style={cardStyle}>
        <Card.Body className="p-4">
          <div className="d-flex align-items-center mb-4">
            <div 
              className="rounded-3 p-2 me-3"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-exclamation-triangle text-white fs-5"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark">Investment vs Current Value</h5>
          </div>
          <div className="text-center py-4">
            <p className="text-muted mb-3">Failed to load chart data</p>
            <p className="text-danger small">{error}</p>
            <Button 
              variant="outline-primary" 
              onClick={fetchHistoricalData}
              style={buttonStyle}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Retry
            </Button>
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
              <i className="bi bi-graph-up-arrow text-white fs-5"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark">Investment vs Current Value</h5>
          </div>
          <div className="d-flex gap-2">
            {['1M', '3M', '6M', '1Y'].map((p) => (
              <button
                key={p}
                className={`btn ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{
                  ...buttonStyle,
                  background: period === p 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'transparent',
                  color: period === p ? 'white' : '#6c757d',
                  border: period === p ? 'none' : '2px solid #e9ecef',
                  transform: period === p ? 'scale(1.05)' : 'scale(1)'
                }}
                onClick={() => setPeriod(p)}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (period !== p && !loading) {
                    e.target.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    e.target.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (period !== p && !loading) {
                    e.target.style.background = 'transparent'
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ height: '400px', position: 'relative' }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted mb-0">Loading chart data...</p>
              </div>
            </div>
          ) : chartData.labels.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <i className="bi bi-graph-up text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3 mb-0">No data available for the selected period</p>
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
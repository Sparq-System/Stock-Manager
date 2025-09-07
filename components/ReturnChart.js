'use client'
import { useState, useEffect } from 'react'
import { Card, ButtonGroup, Button } from 'react-bootstrap'
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

export default function ReturnChart({ holdings }) {
  const [period, setPeriod] = useState('1Y')
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    generateChartData()
  }, [holdings, period])

  const generateChartData = () => {
    if (!holdings.length) return

    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setFullYear(now.getFullYear() - 1)
    }

    // Generate mock data for demonstration
    const labels = []
    const portfolioValue = []
    const invested = []
    
    let currentInvested = 0
    let currentValue = 0

    // Calculate initial values from holdings
    holdings.forEach(holding => {
      currentInvested += holding.totalInvestment || 0
      currentValue += (holding.remainingUnits || 0) * (holding.averagePrice || 0) * 1.1 // Mock 10% growth
    })

    for (let i = 0; i <= 12; i++) {
      const date = new Date(startDate)
      date.setMonth(startDate.getMonth() + i)
      
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
      
      // Mock growth calculation
      const growth = 1 + (Math.random() * 0.2 - 0.1) // Random between -10% to +10%
      portfolioValue.push(currentValue * growth)
      invested.push(currentInvested)
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: portfolioValue,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Invested Amount',
          data: invested,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Portfolio Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString()
          }
        }
      }
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

  return (
    <Card className="border-0 shadow-lg" style={cardStyle}>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-3 p-2 me-3"
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
          <div className="d-flex gap-2">
            {['1M', '3M', '6M', '1Y'].map((p) => (
              <button
                key={p}
                className={`btn ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{
                  ...buttonStyle,
                  background: period === p 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  color: period === p ? 'white' : '#6c757d',
                  border: period === p ? 'none' : '2px solid #e9ecef',
                  transform: period === p ? 'scale(1.05)' : 'scale(1)'
                }}
                onClick={() => setPeriod(p)}
                onMouseEnter={(e) => {
                  if (period !== p) {
                    e.target.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    e.target.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (period !== p) {
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
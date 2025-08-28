'use client'
import { useState } from 'react'
import { Card, Table, Form, InputGroup, Badge } from 'react-bootstrap'
import { format } from 'date-fns'

export default function TradesTable({ trades }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const filteredTrades = trades.filter(trade =>
    trade.stockName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (!sortField) return 0

    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === 'purchaseDate' || sortField === 'sellingDate') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const calculateReturns = (trade) => {
    if (trade.sellingPrice && trade.unitsSold > 0) {
      const invested = trade.purchaseRate * trade.unitsSold
      const returns = trade.sellingPrice * trade.unitsSold
      return returns - invested
    }
    return 0
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'primary',
      sold: 'success',
      partial: 'warning'
    }
    
    const icons = {
      active: 'bi-hourglass-split',
      sold: 'bi-check-circle',
      partial: 'bi-pause-circle'
    }
    
    return (
      <Badge bg={variants[status]} className="text-capitalize d-flex align-items-center gap-1">
        <i className={icons[status]}></i>
        {status}
      </Badge>
    )
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }

  const searchInputStyle = {
    borderRadius: '25px',
    border: '2px solid #e9ecef',
    padding: '12px 20px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(10px)'
  }

  return (
    <Card className="border-0 shadow-lg" style={cardStyle}>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-3 p-2 me-3"
              style={{
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-table text-dark fs-5"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark">Trade History</h5>
          </div>
          <div className="position-relative" style={{ width: '320px' }}>
            <Form.Control
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
              onFocus={(e) => {
                e.target.style.border = '2px solid #667eea'
                e.target.style.boxShadow = '0 0 0 0.2rem rgba(102, 126, 234, 0.25)'
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid #e9ecef'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div 
              className="position-absolute top-50 end-0 translate-middle-y me-3"
              style={{ pointerEvents: 'none' }}
            >
              <i className="bi bi-search text-muted"></i>
            </div>
          </div>
        </div>

        <div 
          className="table-responsive"
          style={{
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Table hover className="mb-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <thead style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <tr>
                <th 
                  onClick={() => handleSort('stockName')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  Stock Name <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th 
                  onClick={() => handleSort('purchaseRate')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  Purchase Rate <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th 
                  onClick={() => handleSort('purchaseDate')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 126, 234, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  Purchase Date <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Units Purchased</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Selling Price</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Selling Date</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Units Sold</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Total Returns</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade, index) => (
                <tr 
                  key={trade._id}
                  style={{
                    transition: 'all 0.3s ease',
                    background: index % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(248,249,250,0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)'
                    e.currentTarget.style.transform = 'scale(1.01)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(248,249,250,0.5)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <td className="fw-semibold" style={{ padding: '16px 20px', border: 'none', color: '#2c3e50' }}>{trade.stockName}</td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>₹{trade.purchaseRate.toFixed(2)}</td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>{format(new Date(trade.purchaseDate), 'dd MMM yyyy')}</td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>{trade.unitsPurchased.toLocaleString()}</td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>
                    {trade.sellingPrice ? `₹${trade.sellingPrice.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>
                    {trade.sellingDate 
                      ? format(new Date(trade.sellingDate), 'dd MMM yyyy') 
                      : '-'
                    }
                  </td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>{trade.unitsSold || '-'}</td>
                  <td 
                    className={`fw-semibold ${calculateReturns(trade) >= 0 ? 'text-success' : 'text-danger'}`}
                    style={{ padding: '16px 20px', border: 'none' }}
                  >
                    {calculateReturns(trade) !== 0 
                      ? `₹${calculateReturns(trade).toLocaleString()}` 
                      : '-'
                    }
                  </td>
                  <td style={{ padding: '16px 20px', border: 'none' }}>{getStatusBadge(trade.status)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {sortedTrades.length === 0 && (
          <div 
            className="text-center py-5"
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)',
              marginTop: '20px'
            }}
          >
            <div className="mb-3">
              <i className="bi bi-graph-down text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-muted mb-2">No Trades Available</h5>
            <p className="text-muted mb-0 small">Start trading to see your portfolio activity here.</p>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
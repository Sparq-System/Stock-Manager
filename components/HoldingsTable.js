'use client'
import { useState } from 'react'
import { Card, Table, Form, Badge } from 'react-bootstrap'
import { format } from 'date-fns'

export default function HoldingsTable({ holdings }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const filteredHoldings = holdings.filter(holding =>
    holding.stockName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (!sortField) return 0

    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === 'createdAt' || sortField === 'updatedAt') {
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

  const calculateCurrentValue = (holding, currentNAV = null) => {
    if (holding.status === 'sold') {
      return holding.totalRealized
    }
    return holding.remainingUnits * (currentNAV || holding.averagePrice)
  }

  const calculateReturns = (holding, currentNAV = null) => {
    const currentValue = calculateCurrentValue(holding, currentNAV)
    const investedValue = holding.remainingUnits * holding.averagePrice
    return currentValue - investedValue
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
              <i className="bi bi-briefcase text-dark fs-5"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark">Current Holdings</h5>
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
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>
                  User
                </th>
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
                >
                  Stock Name <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th 
                  onClick={() => handleSort('averagePrice')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Avg Price <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th 
                  onClick={() => handleSort('remainingUnits')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Units <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th 
                  onClick={() => handleSort('totalInvestment')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Investment <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>
                  Current Value
                </th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#495057', border: 'none' }}>
                  Returns
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px 20px',
                    fontWeight: '600',
                    color: '#495057',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Status <i className="bi bi-arrow-down-up text-muted ms-1"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding, index) => {
                const currentValue = calculateCurrentValue(holding)
                const returns = calculateReturns(holding)
                const returnsPercentage = holding.totalInvestment > 0 ? (returns / holding.totalInvestment) * 100 : 0
                
                return (
                  <tr key={holding._id || index} style={{ transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '16px 20px', border: 'none', fontWeight: '500' }}>
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          <i className="bi bi-person-circle text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-bold">{holding.user?.name || 'N/A'}</div>
                          <small className="text-muted">{holding.user?.userCode || ''}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none', fontWeight: '500' }}>
                      {holding.stockName}
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      ₹{holding.averagePrice?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      {holding.remainingUnits || 0}
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      ₹{holding.totalInvestment?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      ₹{currentValue.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      <span className={returns >= 0 ? 'text-success' : 'text-danger'}>
                        ₹{returns.toFixed(2)} ({returnsPercentage.toFixed(2)}%)
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', border: 'none' }}>
                      {getStatusBadge(holding.status)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          
          {sortedHoldings.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              </div>
              <h6 className="text-muted mb-2">No Holdings Found</h6>
              <p className="text-muted small mb-0">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start investing to see your holdings here'}
              </p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap'
import { format } from 'date-fns'
import Navbar from '../../../components/Navbar'
import Sidebar from '../../../components/Sidebar'
import StockDisplay from '../../../components/StockDisplay'

const TradeDetailsContent = ({ viewingTrade }) => {
  const [stockSymbol, setStockSymbol] = useState(null)
  const [sellTransactions, setSellTransactions] = useState([])
  
  useEffect(() => {
    const fetchSymbol = async () => {
      if (viewingTrade?.stockName) {
        try {
          const response = await fetch(`/api/stock-symbol?name=${encodeURIComponent(viewingTrade.stockName)}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          const symbol = data.symbol || null
          setStockSymbol(symbol)
        } catch (error) {
          console.error('Error fetching stock symbol:', error)
          setStockSymbol(null)
        }
      } else {
        setStockSymbol(null)
      }
    }
    
    fetchSymbol()
  }, [viewingTrade?.stockName])

  useEffect(() => {
    if (viewingTrade?.transactions) {
      console.log('🔍 Processing transactions for position:', {
        stockName: viewingTrade.stockName,
        totalTransactions: viewingTrade.transactions.length
      })
      
      // Filter sell transactions and sort by date
      const sellTxns = viewingTrade.transactions
        .filter(txn => txn.type === 'sell')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      
      console.log('🔍 Sell transactions found:', sellTxns.length)
      console.log('🔍 Sample sell transaction:', sellTxns[0])
      
      setSellTransactions(sellTxns)
    } else {
      console.log('🔍 No transactions found in position')
      setSellTransactions([])
    }
  }, [viewingTrade?.transactions])
  
  if (!viewingTrade) return null;

  // Calculate summary data using new schema
  const totalUnitsSold = viewingTrade.totalUnitsSold || 0
  const totalSaleAmount = viewingTrade.totalRealized || 0
  const totalCostOfSoldUnits = viewingTrade.avgPrice * totalUnitsSold
  const totalProfit = totalSaleAmount - totalCostOfSoldUnits
  const remainingUnits = viewingTrade.remainingUnits || 0
  const averageSellingPrice = totalUnitsSold > 0 ? totalSaleAmount / totalUnitsSold : 0
  
  // Debug logging
  console.log('=== POSITION MODAL DEBUG INFO ===')
  console.log('viewingTrade (position):', viewingTrade)
  console.log('sellTransactions:', sellTransactions)
  console.log('totalUnitsSold:', totalUnitsSold)
  console.log('totalSaleAmount (totalRealized):', totalSaleAmount)
  console.log('avgPrice:', viewingTrade.avgPrice)
  console.log('totalCostOfSoldUnits:', totalCostOfSoldUnits)
  console.log('totalProfit:', totalProfit)
  console.log('remainingUnits:', remainingUnits)
  console.log('averageSellingPrice:', averageSellingPrice)
  console.log('==================================')
  
  return (
    <div className="row g-4">
      {/* Stock Information Header */}
      <div className="col-12">
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(102, 126, 234, 0.25)',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '18px 25px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h5 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-graph-up-arrow me-2" style={{ fontSize: '20px' }}></i>
              Position Overview
            </h5>
          </div>
          <div style={{
            background: 'white',
            padding: '25px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              {/* Stock Display */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <StockDisplay 
                  stockName={viewingTrade.stockName}
                  stockSymbol={stockSymbol || 'N/A'}
                  size="large"
                  showName={true}
                />
              </div>
              
              {/* Status and Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Status:</span>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    backgroundColor: viewingTrade.status === 'active' ? '#e3f2fd' : 
                                   viewingTrade.status === 'partial' ? '#fff3e0' : '#e8f5e8',
                    color: viewingTrade.status === 'active' ? '#1976d2' : 
                           viewingTrade.status === 'partial' ? '#f57c00' : '#388e3c'
                  }}>
                    {viewingTrade.status === 'partial' ? 'Partially Sold' : 
                     viewingTrade.status === 'active' ? 'Active' : 'Fully Sold'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>Sell Transactions:</span>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: '#f8f9fa',
                    color: '#495057'
                  }}>
                    {sellTransactions.length} transactions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="col-md-4">
        <div 
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(79, 172, 254, 0.25)',
            border: 'none',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '15px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h6 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-cart-plus me-2" style={{ fontSize: '16px' }}></i>
              Purchase Details
            </h6>
          </div>
          <div style={{
            background: 'white',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>First Purchase</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {new Date(viewingTrade.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Total Units</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {Math.round(viewingTrade.totalUnitsPurchased)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Avg. Price</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  ₹{viewingTrade.avgPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ 
              padding: '14px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Total Investment
              </div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
                ₹{viewingTrade.totalInvestment.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="col-md-4">
        <div 
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(255, 107, 107, 0.25)',
            border: 'none',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '15px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h6 style={{ 
              color: 'white', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-cart-dash me-2" style={{ fontSize: '16px' }}></i>
              Sales Summary
            </h6>
          </div>
          <div style={{
            background: 'white',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Units Sold</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {Math.round(totalUnitsSold)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Avg. Sell Price</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  ₹{averageSellingPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Remaining</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {Math.round(remainingUnits)}
                </span>
              </div>
            </div>
            <div style={{ 
              padding: '14px',
              background: totalProfit >= 0 
                ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
                : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: totalProfit >= 0 
                ? '0 4px 15px rgba(46, 204, 113, 0.3)'
                : '0 4px 15px rgba(231, 76, 60, 0.3)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Realized P&L
              </div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
                {totalProfit >= 0 ? '+' : '-'}₹{Math.abs(totalProfit).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="col-md-4">
        <div 
          style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            borderRadius: '18px',
            padding: '0',
            boxShadow: '0 12px 30px rgba(168, 237, 234, 0.25)',
            border: 'none',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '15px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h6 style={{ 
              color: '#2c3e50', 
              margin: '0', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-bar-chart me-2" style={{ fontSize: '16px' }}></i>
              Performance
            </h6>
          </div>
          <div style={{
            background: 'white',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Return %</span>
                <span style={{ 
                  color: totalProfit >= 0 ? '#27ae60' : '#e74c3c', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  {totalCostOfSoldUnits > 0 ? 
                    `${totalProfit >= 0 ? '+' : ''}${((totalProfit / totalCostOfSoldUnits) * 100).toFixed(2)}%` 
                    : '0.00%'}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Sold %</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {((totalUnitsSold / viewingTrade.totalUnitsPurchased) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: '500' }}>Transactions</span>
                <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
                  {viewingTrade.transactions?.length || 0}
                </span>
              </div>
            </div>
            <div style={{ 
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Last Transaction
              </div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                {new Date(viewingTrade.lastTransactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sales Table */}
      {sellTransactions.length > 0 && (
        <div className="col-12">
          <div 
            style={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              borderRadius: '18px',
              padding: '0',
              boxShadow: '0 12px 30px rgba(255, 236, 210, 0.4)',
              border: 'none',
              overflow: 'hidden'
            }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '18px 25px',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h5 style={{ 
                color: '#8b4513', 
                margin: '0', 
                fontWeight: '700',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="bi bi-list-ul me-2" style={{ fontSize: '20px' }}></i>
                Detailed Sales History
              </h5>
            </div>
            <div style={{
              background: 'white',
              padding: '25px'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <Table hover responsive style={{ marginBottom: '0' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ 
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#8b4513',
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '15px 12px',
                        border: 'none'
                      }}>Date</th>
                      <th style={{ 
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#8b4513',
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '15px 12px',
                        border: 'none'
                      }}>Units</th>
                      <th style={{ 
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#8b4513',
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '15px 12px',
                        border: 'none'
                      }}>Price</th>
                      <th style={{ 
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#8b4513',
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '15px 12px',
                        border: 'none'
                      }}>Amount</th>
                      <th style={{ 
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#8b4513',
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '15px 12px',
                        border: 'none'
                      }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellTransactions.map((sale, index) => {
                      const saleProfit = (sale.price - viewingTrade.avgPrice) * sale.units
                      const saleProfitPercent = ((sale.price - viewingTrade.avgPrice) / viewingTrade.avgPrice) * 100
                      
                      return (
                        <tr key={sale._id || index} style={{ 
                          borderBottom: index === sellTransactions.length - 1 ? 'none' : '1px solid #f8f9fa',
                          transition: 'background-color 0.2s ease'
                        }}>
                          <td style={{ 
                            padding: '15px 12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50'
                          }}>
                            {new Date(sale.date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td style={{ 
                            padding: '15px 12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            {Math.round(sale.units)}
                          </td>
                          <td style={{ 
                            padding: '15px 12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            ₹{sale.price.toFixed(2)}
                          </td>
                          <td style={{ 
                            padding: '15px 12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            ₹{sale.amount.toFixed(2)}
                          </td>
                          <td style={{ 
                            padding: '15px 12px',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ 
                                color: saleProfit >= 0 ? '#27ae60' : '#e74c3c'
                              }}>
                                {saleProfit >= 0 ? '+' : '-'}₹{Math.abs(saleProfit).toFixed(2)}
                              </span>
                              <span style={{ 
                                fontSize: '12px',
                                color: saleProfit >= 0 ? '#27ae60' : '#e74c3c',
                                fontWeight: '500'
                              }}>
                                ({saleProfit >= 0 ? '+' : ''}{saleProfitPercent.toFixed(2)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Sales Message */}
      {sellTransactions.length === 0 && (
        <div className="col-12">
          <div 
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '18px',
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(227, 242, 253, 0.4)',
              border: '1px solid #e3f2fd'
            }}
          >
            <i className="bi bi-info-circle" style={{ 
              fontSize: '48px', 
              color: '#1976d2',
              marginBottom: '15px',
              display: 'block'
            }}></i>
            <h5 style={{ 
              color: '#1976d2', 
              fontWeight: '700',
              marginBottom: '10px'
            }}>
              No Sales Recorded
            </h5>
            <p style={{ 
              color: '#1565c0', 
              fontSize: '16px',
              margin: '0',
              fontWeight: '500'
            }}>
              This position has no sell transactions yet. All {Math.round(viewingTrade.totalUnitsPurchased)} units are still held.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TradesPage() {
  const [user, setUser] = useState(null)
  const [positions, setPositions] = useState([])
  const [displayedPositions, setDisplayedPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [viewingTrade, setViewingTrade] = useState(null)
  const [stockSymbols, setStockSymbols] = useState({})
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Modern styling constants
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

  const tableCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  }

  // Fetch user data
  useEffect(() => {
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
        } else {
          console.error('Failed to fetch user data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])

  // Fetch positions from holdings API endpoint
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        console.log('🔍 Fetching positions from /api/holdings?all=true')
         
         const response = await fetch('/api/holdings?all=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('🔍 Fetched holdings data:', data)
        
        const positionsArray = data.holdings || []
        console.log('🔍 Holdings array length:', positionsArray.length)
        console.log('🔍 Sample holding:', positionsArray[0])
        
        setPositions(positionsArray)
        setError('')
      } catch (error) {
        console.error('Error fetching positions:', error)
        setError('Failed to fetch positions. Please try again.')
        setPositions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [])

  // Process positions for display (no grouping needed as each position is already aggregated)
  const preparePositionsForDisplay = (positionsData) => {
    console.log('🔍 Preparing positions for display:', positionsData.length)
    
    return positionsData.map(position => {
      // Calculate profit using new schema
      const totalCostOfSoldUnits = position.avgPrice * (position.totalUnitsSold || 0)
      const totalRealized = position.totalRealized || 0
      const profit = totalRealized - totalCostOfSoldUnits
      const profitPercent = totalCostOfSoldUnits > 0 ? (profit / totalCostOfSoldUnits) * 100 : 0
      
      // Determine status based on remaining units
      let status = 'active'
      if (position.remainingUnits === 0) {
        status = 'sold'
      } else if (position.totalUnitsSold > 0) {
        status = 'partial'
      }
      
      console.log(`🔍 Position ${position.stockName} - Profit calculation:`, {
        avgPrice: position.avgPrice,
        totalUnitsSold: position.totalUnitsSold,
        totalCostOfSoldUnits,
        totalRealized,
        profit,
        profitPercent,
        remainingUnits: position.remainingUnits,
        status
      })
      
      return {
        ...position,
        calculatedProfit: profit,
        calculatedProfitPercent: profitPercent,
        status: status
      }
    })
  }

  useEffect(() => {
    const processedPositions = preparePositionsForDisplay(positions)
    setDisplayedPositions(processedPositions)
  }, [positions])

  // Fetch stock symbols for display
  useEffect(() => {
    const fetchStockSymbols = async () => {
      const uniqueStockNames = [...new Set(displayedPositions.map(pos => pos.stockName))]
      const symbolPromises = uniqueStockNames.map(async (stockName) => {
        try {
          const response = await fetch(`/api/stock-symbol?name=${encodeURIComponent(stockName)}`)
          if (response.ok) {
            const data = await response.json()
            return { stockName, symbol: data.symbol || 'N/A' }
          }
        } catch (error) {
          console.error(`Error fetching symbol for ${stockName}:`, error)
        }
        return { stockName, symbol: 'N/A' }
      })

      const symbols = await Promise.all(symbolPromises)
      const symbolMap = {}
      symbols.forEach(({ stockName, symbol }) => {
        symbolMap[stockName] = symbol
      })
      setStockSymbols(symbolMap)
    }

    if (displayedPositions.length > 0) {
      fetchStockSymbols()
    }
  }, [displayedPositions])

  // Filter positions based on search term
  const filteredPositions = displayedPositions.filter(position =>
    position.stockName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPositions = filteredPositions.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleViewDetails = (position) => {
    console.log('🔍 Viewing position details:', position)
    setViewingTrade(position)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'primary', text: 'Active' },
      partial: { bg: 'warning', text: 'Partial' },
      sold: { bg: 'success', text: 'Sold' }
    }
    
    const config = statusConfig[status] || { bg: 'secondary', text: status }
    return <Badge bg={config.bg}>{config.text}</Badge>
  }

  if (loading) {
    return (
      <div style={pageStyle} className="d-flex align-items-center justify-content-center">
        <div 
          className="d-flex align-items-center justify-content-center"
          style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            animation: 'spin 1s linear infinite'
          }}
        >
          <i className="bi bi-arrow-clockwise text-white" style={{ fontSize: '2rem' }}></i>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...pageStyle, position: 'fixed', width: '100%', height: '100vh' }}>
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
            overflow: 'auto',
            height: 'calc(100vh - 76px)',
            marginLeft: isSidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Container fluid className="py-4" style={containerStyle}>
            <Row>
              <Col>
                <div style={headerStyle}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h1 className="mb-2 fw-bold text-white" style={{ fontSize: '2.5rem' }}>Positions Management</h1>
                      <p className="text-white-50 mb-0 fs-5">Manage and view all stock positions 📈</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '16px',
                          animation: 'pulse 3s infinite'
                        }}
                      >
                        <i className="bi bi-graph-up text-white" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {error && (
              <Row>
                <Col>
                  <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                  </Alert>
                </Col>
              </Row>
            )}

            <Row>
              <Col>
                <Card style={tableCardStyle}>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center">
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
                          <i className="bi bi-graph-up text-white fs-4"></i>
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>All Positions ({filteredPositions.length})</h4>
                          <p className="text-muted mb-0">Track your investment positions and performance</p>
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control
                          type="text"
                          placeholder="🔍 Search positions by stock name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            width: '300px',
                            borderRadius: '16px',
                            border: '2px solid rgba(102, 126, 234, 0.2)',
                            padding: '12px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            background: 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                      </div>
                    </div>
                    <div className="table-responsive" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <Table hover style={{ marginBottom: 0, tableLayout: 'auto', width: '100%' }}>
                        <thead style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%)' }}>
                          <tr>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Stock Name</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Symbol</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Realized P&L</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPositions.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4" style={{ color: '#6c757d' }}>
                                {searchTerm ? `No positions found matching "${searchTerm}"` : 'No positions found'}
                              </td>
                            </tr>
                          ) : (
                            currentPositions.map((position, index) => (
                              <tr key={position._id || index}>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', fontWeight: '600', color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {position.stockName}
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', color: '#6c757d', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <div className="d-flex align-items-center justify-content-center">
                                    <StockDisplay 
                                      stockName={position.stockName}
                                      stockSymbol={stockSymbols[position.stockName]}
                                      size="lg"
                                      showName={false}
                                    />
                                  </div>
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <span style={{ 
                                    color: position.calculatedProfit >= 0 ? '#28a745' : '#dc3545',
                                    fontWeight: '600'
                                  }}>
                                    ₹{position.calculatedProfit?.toFixed(2) || '0.00'}
                                    {position.calculatedProfitPercent !== undefined && (
                                      <small className="d-block">
                                        ({position.calculatedProfitPercent >= 0 ? '+' : ''}{position.calculatedProfitPercent.toFixed(2)}%)
                                      </small>
                                    )}
                                  </span>
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {getStatusBadge(position.status)}
                                </td>
                                <td style={{ border: '1px solid #e9ecef', padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleViewDetails(position)}
                                    style={{
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      border: '2px solid #667eea',
                                      color: '#667eea',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <i className="bi bi-eye me-1"></i>
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ color: '#6c757d', fontSize: '14px' }}>Show:</span>
                          <Form.Select
                            size="sm"
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                            style={{
                              width: '80px',
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              fontSize: '14px'
                            }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </Form.Select>
                          <span style={{ color: '#6c757d', fontSize: '14px' }}>
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredPositions.length)} of {filteredPositions.length}
                          </span>
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            style={{
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            Previous
                          </Button>
                          {[...Array(totalPages)].map((_, i) => (
                            <Button
                              key={i + 1}
                              variant={currentPage === i + 1 ? "primary" : "outline-secondary"}
                              size="sm"
                              onClick={() => handlePageChange(i + 1)}
                              style={{
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                minWidth: '36px'
                              }}
                            >
                              {i + 1}
                            </Button>
                          ))}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            style={{
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Position Details Modal */}
      <Modal 
        show={showModal} 
        onHide={() => {
          console.log('Modal onHide triggered')
          setShowModal(false)
        }}
        size="xl" 
        centered
        backdrop="static"
        keyboard={true}
        style={{
          backdropFilter: 'blur(10px)'
        }}
      >
        <Modal.Header 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            position: 'relative'
          }}
        >
          <Modal.Title className="text-white fw-bold">
            <i className="bi bi-graph-up me-2"></i>
            Position Details
          </Modal.Title>
          <button
            type="button"
            onClick={() => {
              console.log('Custom close button clicked')
              setShowModal(false)
            }}
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)'
            }}
          >
            ×
          </button>
        </Modal.Header>
        <Modal.Body 
          style={{
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          <TradeDetailsContent viewingTrade={viewingTrade} />
        </Modal.Body>
        <Modal.Footer 
          style={{
            background: 'rgba(248,249,250,0.95)',
            border: 'none',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              border: 'none'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
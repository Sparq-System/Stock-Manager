'use client'
import { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'

const StockDisplay = ({ stockName, stockSymbol, size = 'md', showName = true }) => {
  const [stockImage, setStockImage] = useState(null)
  const [companyName, setCompanyName] = useState(stockName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Size configurations
  const sizeConfig = {
    sm: { width: '24px', height: '24px', fontSize: '14px' },
    md: { width: '32px', height: '32px', fontSize: '16px' },
    lg: { width: '48px', height: '48px', fontSize: '18px' },
    large: { width: '80px', height: '80px', fontSize: '20px' }
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  useEffect(() => {
    const fetchStockImage = async () => {
      if (!stockSymbol) return
      
      setLoading(true)
      setError(false)
      
      try {
        const response = await fetch(`/api/stock-profile?symbol=${stockSymbol}`)
        if (!response.ok) {
          throw new Error('Failed to fetch stock profile')
        }
        
        const data = await response.json()
        if (data && data.length > 0) {
          if (data[0].image) {
            setStockImage(data[0].image)
          }
          if (data[0].companyName) {
            setCompanyName(data[0].companyName)
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Error fetching stock image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStockImage()
  }, [stockSymbol])

  const renderImage = () => {
    if (loading) {
      return (
        <div 
          style={{
            width: currentSize.width,
            height: currentSize.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px'
          }}
        >
          <Spinner size="sm" />
        </div>
      )
    }

    if (error || !stockImage) {
      // Fallback: Show first letter of stock name or symbol
      const fallbackText = (stockName || stockSymbol || '?').charAt(0).toUpperCase()
      return (
        <div 
          style={{
            width: currentSize.width,
            height: currentSize.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#667eea',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          {fallbackText}
        </div>
      )
    }

    return (
      <img 
        src={stockImage}
        alt={stockName || stockSymbol}
        style={{
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: '6px',
          objectFit: 'cover'
        }}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {renderImage()}
      {showName && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            style={{
              fontSize: currentSize.fontSize,
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            {stockSymbol}
          </span>
          {companyName && companyName !== stockSymbol && (
            <span 
              style={{
                fontSize: Math.max(12, parseInt(currentSize.fontSize) - 2) + 'px',
                fontWeight: '400',
                color: '#6c757d'
              }}
            >
              {companyName}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default StockDisplay
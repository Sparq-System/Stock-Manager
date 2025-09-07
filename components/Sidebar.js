'use client'
import { Nav } from 'react-bootstrap'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Sidebar({ isCollapsed = false, onToggle }) {
  const router = useRouter()
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState(null)

  const menuItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: 'bi-speedometer2', gradient: '#667eea' },
    { path: '/admin-dashboard/users', label: 'Users', icon: 'bi-people', gradient: '#f093fb' },
    { path: '/admin-dashboard/buy-sell', label: 'Buy / Sell', icon: 'bi-arrow-left-right', gradient: '#ff6b6b' },
    { path: '/admin-dashboard/trades', label: 'Trades', icon: 'bi-graph-up', gradient: '#4facfe' },
    { path: '/admin-dashboard/investments', label: 'Investments', icon: 'bi-wallet2', gradient: '#ffecd2' },
    { path: '/admin-dashboard/transactions', label: 'Transactions', icon: 'bi-receipt', gradient: '#ff9a9e' },
    { path: '/admin-dashboard/nav', label: 'NAV', icon: 'bi-currency-rupee', gradient: '#43e97b' }
  ]

  const sidebarStyle = {
    width: isCollapsed ? '80px' : '280px',
    minHeight: 'calc(100vh - 76px)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  const getItemStyle = (item, index) => {
    const isActive = pathname === item.path
    const isHovered = hoveredItem === index
    
    return {
      cursor: 'pointer',
      borderRadius: '16px',
      marginBottom: '8px',
      padding: '12px 16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid transparent',
      background: isActive 
        ? item.gradient
        : isHovered 
          ? 'rgba(255,255,255,0.8)'
          : 'rgba(255,255,255,0.4)',
      color: isActive ? '#ffffff' : '#374151',
      transform: isHovered ? 'translateX(8px) scale(1.02)' : 'translateX(0) scale(1)',
      boxShadow: isActive 
        ? '0 8px 25px rgba(0,0,0,0.15)'
        : isHovered 
          ? '0 4px 15px rgba(0,0,0,0.1)'
          : '0 2px 8px rgba(0,0,0,0.05)'
    }
  }

  const getIconStyle = (item, index) => {
    const isActive = pathname === item.path
    const isHovered = hoveredItem === index
    
    return {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isCollapsed ? '0' : '12px',
      background: isActive 
        ? 'rgba(255,255,255,0.2)'
        : isHovered
          ? item.gradient
          : 'rgba(102, 126, 234, 0.1)',
      color: isActive 
        ? '#ffffff'
        : isHovered 
          ? '#ffffff'
          : '#667eea',
      transition: 'all 0.3s ease',
      fontSize: '18px'
    }
  }

  return (
    <div style={sidebarStyle}>
      {/* Animated background elements */}
      <div 
        className="position-absolute"
        style={{
          top: '20%',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'float 8s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          bottom: '30%',
          left: '-30px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(25px)',
          animation: 'float 6s ease-in-out infinite reverse'
        }}
      ></div>
      
      {/* Header */}
      <div 
        className="p-4 mb-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div className="d-flex align-items-center justify-content-center">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-3 p-2 me-3"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-gear-fill text-white fs-5"></i>
            </div>
            {!isCollapsed && (
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: '#374151' }}>Admin Panel</h6>
                <small className="text-muted">Management Console</small>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Nav className="flex-column px-3" style={{ position: 'relative', zIndex: 2 }}>
        {menuItems.map((item, index) => (
          <Nav.Link
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              ...getItemStyle(item, index),
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '12px' : '12px 16px'
            }}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
            className="d-flex align-items-center text-decoration-none"
            title={isCollapsed ? item.label : ''}
          >
            <div style={getIconStyle(item, index)}>
              <i className={item.icon}></i>
            </div>
            {!isCollapsed && (
              <div>
                <div className="fw-semibold" style={{ fontSize: '15px' }}>{item.label}</div>
                {pathname === item.path && (
                  <div 
                    className="position-absolute"
                    style={{
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      animation: 'pulse 2s infinite'
                    }}
                  ></div>
                )}
              </div>
            )}
          </Nav.Link>
        ))}
      </Nav>
      
      {/* Toggle Button at Bottom */}
      {onToggle && (
        <div 
          className="d-flex justify-content-center p-3 mt-auto"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: 'auto'
          }}
        >
          <button
            onClick={onToggle}
            className="btn d-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              width: isCollapsed ? '40px' : '120px',
              height: '40px',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)'
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 2px 10px rgba(102, 126, 234, 0.3)'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i 
              className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}
              style={{ fontSize: '16px' }}
            ></i>
            {!isCollapsed && (
              <span className="ms-2" style={{ fontSize: '14px', fontWeight: '500' }}>
                {isCollapsed ? 'Expand' : 'Collapse'}
              </span>
            )}
          </button>
        </div>
      )}
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
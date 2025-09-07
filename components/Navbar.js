'use client'
import { Navbar as BSNavbar, Nav, Dropdown } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function Navbar({ user, isAdmin = false }) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear both possible token storage locations
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('token')
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const navbarStyle = {
    background: isAdmin 
      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 50%, rgba(240, 147, 251, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(51, 65, 85, 0.95) 100%)',
    backdropFilter: 'blur(25px)',
    borderBottom: isAdmin 
      ? '1px solid rgba(240, 147, 251, 0.3)'
      : '1px solid rgba(148, 163, 184, 0.2)',
    padding: '16px 0',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isAdmin 
      ? '0 8px 32px rgba(102, 126, 234, 0.15)'
      : '0 8px 32px rgba(15, 23, 42, 0.12)',
    position: 'relative',
    zIndex: 1000
  }

  const brandStyle = {
    fontWeight: '800',
    fontSize: '1.6rem',
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.025em',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  }

  const dropdownToggleStyle = {
    background: isAdmin 
      ? 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(102,126,234,0.1) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    border: isAdmin 
      ? '1px solid rgba(102, 126, 234, 0.4)'
      : '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '16px',
    padding: '10px 24px',
    color: 'white',
    fontWeight: '600',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(15px)',
    boxShadow: isAdmin 
      ? '0 4px 16px rgba(102, 126, 234, 0.15)'
      : '0 4px 16px rgba(0, 0, 0, 0.1)',
    fontSize: '0.95rem'
  }

  const avatarStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.9rem',
    marginRight: '8px'
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <BSNavbar expand="lg" className="sticky-top" style={navbarStyle}>
      <div className="container-fluid px-4">
        <BSNavbar.Brand 
          href="#" 
          style={brandStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          <div className="d-flex align-items-center">
            <div 
              className="me-3 d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                background: isAdmin 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                borderRadius: '16px',
                backdropFilter: 'blur(15px)',
                boxShadow: isAdmin 
                  ? '0 8px 24px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : '0 8px 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <i className={isAdmin ? "bi bi-shield-check text-white" : "bi bi-graph-up-arrow text-white"} style={{ fontSize: '1.4rem', zIndex: 2 }}></i>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                animation: 'shimmer 3s infinite'
              }}></div>
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: '1.6rem', lineHeight: '1.2' }}>
                {isAdmin ? 'Admin Control' : 'Portfolio Pro'}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: '500',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                {isAdmin ? 'Management Panel' : 'Investment Dashboard'}
              </div>
            </div>
          </div>
        </BSNavbar.Brand>
        
        <div className="d-none d-lg-flex align-items-center me-4">
          <div className="d-flex align-items-center" style={{
            background: isAdmin 
              ? 'rgba(102, 126, 234, 0.15)'
              : 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 16px',
            backdropFilter: 'blur(10px)',
            border: isAdmin 
              ? '1px solid rgba(102, 126, 234, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <i className={isAdmin ? "bi bi-speedometer2 text-white me-2" : "bi bi-house-door text-white me-2"} style={{ fontSize: '0.9rem' }}></i>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', fontWeight: '500' }}>Dashboard</span>
            <i className="bi bi-chevron-right text-white mx-2" style={{ fontSize: '0.7rem', opacity: 0.5 }}></i>
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>
              {isAdmin ? 'Admin Panel' : 'Client Portal'}
            </span>
          </div>
        </div>
        <BSNavbar.Toggle style={{ 
          border: '1px solid rgba(255, 255, 255, 0.2)', 
          color: 'white',
          borderRadius: '8px',
          padding: '6px 10px'
        }} />
        <BSNavbar.Collapse>
          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="" 
                className="d-flex align-items-center"
                style={dropdownToggleStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = isAdmin 
                    ? 'rgba(102,126,234,0.35)'
                    : 'rgba(255,255,255,0.25)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isAdmin 
                    ? 'rgba(102,126,234,0.2)'
                    : 'rgba(255,255,255,0.15)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <div style={avatarStyle}>
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <span>{user?.firstName} {user?.lastName}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu 
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                  backdropFilter: 'blur(25px)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '20px',
                  padding: '12px',
                  minWidth: '320px',
                  boxShadow: '0 25px 50px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  marginTop: '8px'
                }}
              >
                <Dropdown.Item 
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      style={{
                        ...avatarStyle,
                        width: '48px',
                        height: '48px',
                        fontSize: '1.1rem',
                        marginRight: '12px'
                      }}
                    >
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{user?.firstName} {user?.lastName}</div>
                      <small className="text-muted">{user?.email}</small>
                      <div className="mt-1">
                        <span 
                          className="badge"
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            borderRadius: '16px',
                            padding: '6px 16px',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider style={{ 
                  margin: '12px 0', 
                  opacity: 0.15,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%)'
                }} />
                <Dropdown.Item 
                  onClick={handleLogout} 
                  className="d-flex align-items-center"
                  style={{
                    color: '#dc3545',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(220, 53, 69, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BSNavbar.Collapse>
        

      </div>
    </BSNavbar>
  )
}
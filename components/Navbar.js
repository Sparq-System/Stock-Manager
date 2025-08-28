'use client'
import { Navbar as BSNavbar, Nav, Dropdown } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function Navbar({ user }) {
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('auth-token')
    router.push('/login')
  }

  const navbarStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '12px 0',
    transition: 'all 0.3s ease'
  }

  const brandStyle = {
    fontWeight: '700',
    fontSize: '1.5rem',
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  }

  const dropdownToggleStyle = {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '25px',
    padding: '8px 20px',
    color: 'white',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
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
              className="me-2 d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              <i className="bi bi-briefcase-fill text-white fs-5"></i>
            </div>
            <span className="fw-bold">Portfolio Manager</span>
          </div>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle style={{ border: 'none', color: 'white' }} />
        <BSNavbar.Collapse>
          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="" 
                className="d-flex align-items-center"
                style={dropdownToggleStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.25)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.15)'
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
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '16px',
                  padding: '8px',
                  minWidth: '280px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                }}
              >
                <Dropdown.Item 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '8px'
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
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider style={{ margin: '8px 0', opacity: 0.1 }} />
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
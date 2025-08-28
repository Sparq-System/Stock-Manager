'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { FaEye, FaEyeSlash, FaChartLine } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Store user info and JWT token in localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin-dashboard')
      } else {
        router.push('/client-dashboard')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen position-relative overflow-hidden">
      {/* Animated Background */}
      <div className="position-absolute w-100 h-100" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -2
      }}></div>
      
      {/* Floating Elements */}
      <div className="position-absolute" style={{
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite',
        zIndex: -1
      }}></div>
      <div className="position-absolute" style={{
        top: '70%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse',
        zIndex: -1
      }}></div>
      <div className="position-absolute" style={{
        bottom: '20%',
        left: '20%',
        width: '80px',
        height: '80px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        animation: 'float 7s ease-in-out infinite',
        zIndex: -1
      }}></div>

      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-2xl" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              animation: 'slideUp 0.8s ease-out'
            }}>
              <Card.Body className="p-5">
                {/* Logo/Icon */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    animation: 'pulse 2s infinite'
                  }}>
                    <FaChartLine size={40} color="white" />
                  </div>
                  <h2 className="fw-bold mb-2" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '2rem'
                  }}>Portfolio Manager</h2>
                  <p className="text-muted mb-0">Welcome back! Please sign in to your account</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4 border-0" style={{
                    borderRadius: '12px',
                    background: 'rgba(220, 53, 69, 0.1)',
                    animation: 'shake 0.5s ease-in-out'
                  }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-2">
                      <i className="bi bi-envelope me-2"></i>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-0 shadow-sm"
                      style={{
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '16px',
                        background: 'rgba(248, 249, 250, 0.8)',
                        transition: 'all 0.3s ease',
                        animation: 'slideInLeft 0.6s ease-out'
                      }}
                      placeholder="Enter your email address"
                      onFocus={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-2">
                      <i className="bi bi-lock me-2"></i>
                      Password
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-0 shadow-sm"
                        style={{
                          borderRadius: '12px',
                          padding: '12px 16px',
                          paddingRight: '48px',
                          fontSize: '16px',
                          background: 'rgba(248, 249, 250, 0.8)',
                          transition: 'all 0.3s ease',
                          animation: 'slideInRight 0.6s ease-out 0.2s both'
                        }}
                        placeholder="Enter your password"
                        onFocus={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                        }}
                      />
                      <Button
                        variant="link"
                        className="position-absolute border-0 p-0"
                        style={{
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          textDecoration: 'none'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </Button>
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 border-0 fw-semibold"
                    disabled={loading}
                    style={{
                      background: loading ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      transform: loading ? 'scale(0.98)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                {/* Demo Credentials */}
                <div className="mt-4 p-3" style={{
                  background: 'rgba(13, 110, 253, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(13, 110, 253, 0.1)'
                }}>
                  <h6 className="text-primary mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Demo Credentials
                  </h6>
                  <small className="text-muted d-block mb-1">
                    <strong>Admin:</strong> rv@demo.com / 123456
                  </small>
                  <small className="text-muted d-block">
                    <strong>Client:</strong> adi@demo.com / 123456
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}
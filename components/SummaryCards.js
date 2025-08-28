import { Row, Col, Card } from 'react-bootstrap'

export default function SummaryCards({ data }) {
  const { investedValue, currentValue, nav } = data

  const returns = currentValue - investedValue
  const returnPercentage = investedValue > 0 ? (returns / investedValue) * 100 : 0

  const cardStyle = {
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
  }

  const hoverStyle = {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  }

  return (
    <Row className="g-4">
      <Col md={4}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-4 p-3 me-3 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  minWidth: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-wallet2 text-white fs-4"></i>
                <div 
                  className="position-absolute"
                  style={{
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
              <div className="flex-grow-1">
                <h6 className="text-muted mb-1 fw-medium">Invested Value</h6>
                <h3 className="mb-0 fw-bold text-dark">₹{investedValue.toLocaleString()}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-4 p-3 me-3 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  minWidth: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-graph-up-arrow text-white fs-4"></i>
                <div 
                  className="position-absolute"
                  style={{
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
              <div className="flex-grow-1">
                <h6 className="text-muted mb-1 fw-medium">Current Value</h6>
                <h3 className="mb-0 fw-bold text-dark">₹{currentValue.toLocaleString()}</h3>
                <div className={`mt-1 fw-semibold ${returns >= 0 ? 'text-success' : 'text-danger'}`}>
                  <i className={`bi ${returns >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
                  {returns >= 0 ? '+' : ''}₹{returns.toLocaleString()} ({returnPercentage.toFixed(2)}%)
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-4 p-3 me-3 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  minWidth: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-currency-rupee text-white fs-4"></i>
                <div 
                  className="position-absolute"
                  style={{
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
              <div className="flex-grow-1">
                <h6 className="text-muted mb-1 fw-medium">Current NAV</h6>
                <h3 className="mb-0 fw-bold text-dark">₹{nav.toFixed(2)}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
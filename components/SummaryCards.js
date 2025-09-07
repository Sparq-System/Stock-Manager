import { Row, Col, Card } from 'react-bootstrap'

export default function SummaryCards({ data }) {
  const { investedValue, currentValue, nav, totalUnits } = data

  const returns = currentValue - investedValue
  const returnPercentage = investedValue > 0 ? (returns / investedValue) * 100 : 0

  const cardStyle = {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.04)',
    backdropFilter: 'blur(10px)',
    position: 'relative'
  }

  const hoverStyle = {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15), 0 8px 30px rgba(15, 23, 42, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)'
  }

  return (
    <Row className="g-4">
      <Col xs={12} sm={6} lg={3}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.04)'
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <Card.Body className="p-3 p-md-4 d-flex align-items-center" style={{ minHeight: '120px' }}>
            <div className="d-flex align-items-center flex-wrap w-100">
              <div 
                className="rounded-4 p-2 p-md-3 me-3 mb-2 mb-md-0 position-relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  minWidth: '50px',
                  width: 'auto',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <i className="bi bi-wallet2 text-white fs-5 fs-md-4"></i>
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
              <div className="flex-grow-1 min-width-0">
                <h6 className="mb-1 fw-medium small" style={{ color: '#64748b', letterSpacing: '0.025em' }}>Invested Amount</h6>
                <h3 className="mb-0 fw-bold text-break" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', lineHeight: '1.2', color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>₹{investedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} sm={6} lg={3}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.04)'
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <Card.Body className="p-3 p-md-4 d-flex align-items-center" style={{ minHeight: '120px' }}>
            <div className="d-flex align-items-center flex-wrap w-100">
              <div 
                className="rounded-4 p-2 p-md-3 me-3 mb-2 mb-md-0 position-relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  minWidth: '50px',
                  width: 'auto',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(17, 153, 142, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <i className="bi bi-graph-up-arrow text-white fs-5 fs-md-4"></i>
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
              <div className="flex-grow-1 min-width-0">
                <h6 className="mb-1 fw-medium small" style={{ color: '#64748b', letterSpacing: '0.025em' }}>Current Value</h6>
                <h3 className="mb-0 fw-bold text-break" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', lineHeight: '1.2', color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <div className={`mt-1 fw-semibold small text-break ${returns >= 0 ? 'text-success' : 'text-danger'}`}>
                  <i className={`bi ${returns >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
                  {returns >= 0 ? '+' : ''}₹{returns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({returnPercentage.toFixed(2)}%)
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} sm={6} lg={3}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.04)'
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <Card.Body className="p-3 p-md-4 d-flex align-items-center" style={{ minHeight: '120px' }}>
            <div className="d-flex align-items-center flex-wrap w-100">
              <div 
                className="rounded-4 p-2 p-md-3 me-3 mb-2 mb-md-0 position-relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  minWidth: '50px',
                  width: 'auto',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(240, 147, 251, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <i className="bi bi-currency-rupee text-white fs-5 fs-md-4"></i>
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
              <div className="flex-grow-1 min-width-0">
                <h6 className="mb-1 fw-medium small" style={{ color: '#64748b', letterSpacing: '0.025em' }}>Current NAV</h6>
                <h3 className="mb-0 fw-bold text-break" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', lineHeight: '1.2', color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>₹{nav.toFixed(2)}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} sm={6} lg={3}>
        <Card 
          className="border-0 shadow-lg h-100"
          style={cardStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyle)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(15, 23, 42, 0.08), 0 4px 20px rgba(15, 23, 42, 0.04)'
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <Card.Body className="p-3 p-md-4 d-flex align-items-center" style={{ minHeight: '120px' }}>
            <div className="d-flex align-items-center flex-wrap w-100">
              <div 
                className="rounded-4 p-2 p-md-3 me-3 mb-2 mb-md-0 position-relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  minWidth: '50px',
                  width: 'auto',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <i className="bi bi-pie-chart text-white fs-5 fs-md-4"></i>
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
              <div className="flex-grow-1 min-width-0">
                <h6 className="mb-1 fw-medium small" style={{ color: '#64748b', letterSpacing: '0.025em' }}>Total Units</h6>
                <h3 className="mb-0 fw-bold text-break" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', lineHeight: '1.2', color: '#1e293b', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{(totalUnits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
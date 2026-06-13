import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, ROUNDED } from '../utils/common';
import { FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa';

const Analytics = () => {
  const pageContainerStyle = {
    backgroundColor: COLORS.surfaceSoft,
    minHeight: '100vh',
    padding: SPACING.xl,
  };

  const chartBoxStyle = {
    ...COMPONENTS.featureCardLight,
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.mute
  };

  return (
    <div style={pageContainerStyle}>
      <Container fluid className="p-0">
        <Row className="align-items-center mb-5">
          <Col>
            <h1 style={{ ...TYPOGRAPHY.displayMd, color: COLORS.ink, marginBottom: SPACING.xxs }}>
              Analytics
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              Gain insights into your business performance.
            </p>
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          <Col md={6}>
            <div style={chartBoxStyle}>
              <FaChartBar size={48} className="mb-3 text-primary opacity-50" />
              <h5 style={{ ...TYPOGRAPHY.headingMd, color: COLORS.charcoal }}>Monthly Revenue</h5>
              <p>Chart coming soon...</p>
            </div>
          </Col>
          <Col md={6}>
            <div style={chartBoxStyle}>
              <FaChartPie size={48} className="mb-3 text-success opacity-50" />
              <h5 style={{ ...TYPOGRAPHY.headingMd, color: COLORS.charcoal }}>Customer Distribution</h5>
              <p>Chart coming soon...</p>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col xs={12}>
            <div style={{ ...chartBoxStyle, height: '400px' }}>
              <FaChartLine size={64} className="mb-3 text-info opacity-50" />
              <h5 style={{ ...TYPOGRAPHY.headingMd, color: COLORS.charcoal }}>Cash Flow Trends</h5>
              <p>Chart coming soon...</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Analytics;

import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../utils/common';
import { FaShareSquare, FaQrcode } from 'react-icons/fa';

const Payments = () => {
  const pageContainerStyle = {
    backgroundColor: COLORS.surfaceSoft,
    minHeight: '100vh',
    padding: SPACING.xl,
  };

  return (
    <div style={pageContainerStyle}>
      <Container fluid className="p-0">
        <Row className="align-items-center mb-5">
          <Col md={8}>
            <h1 style={{ ...TYPOGRAPHY.displayMd, color: COLORS.ink, marginBottom: SPACING.xxs }}>
              Payments & Links
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              Generate payment links and track collections.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
            <button style={{ ...COMPONENTS.buttonOutlineLight, display: 'inline-flex', alignItems: 'center' }}>
              <FaQrcode style={{ marginRight: SPACING.sm }} /> Show Shop QR
            </button>
            <button style={{ ...COMPONENTS.buttonPrimary, display: 'inline-flex', alignItems: 'center' }}>
              <FaShareSquare style={{ marginRight: SPACING.sm }} /> New Link
            </button>
          </Col>
        </Row>

        <div style={{ ...COMPONENTS.featureCardLight, padding: 0, overflow: 'hidden' }}>
          <Table responsive hover className="mb-0" style={{ margin: 0 }}>
            <thead style={{ backgroundColor: COLORS.surfaceSoft }}>
              <tr>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Generated On</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Customer</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Amount</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Status</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>2 Hrs Ago</td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Rajesh Kumar</td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>₹ 1,500</td>
                <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ ...COMPONENTS.badgeFeature, backgroundColor: COLORS.accentWarning }}>Pending</span></td>
                <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>
                  <button style={{ ...COMPONENTS.buttonSoft, padding: `${SPACING.xs} ${SPACING.sm}`, fontSize: '0.85rem' }}>Resend</button>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Container>
    </div>
  );
};

export default Payments;

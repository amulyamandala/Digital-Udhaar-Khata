import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../utils/common';
import { FaFileDownload, FaFilter } from 'react-icons/fa';

const Transactions = () => {
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
              Transactions
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              View and filter all shop transactions in one place.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
            <button style={{ ...COMPONENTS.buttonOutlineLight, display: 'inline-flex', alignItems: 'center' }}>
              <FaFilter style={{ marginRight: SPACING.sm }} /> Filter
            </button>
            <button style={{ ...COMPONENTS.buttonPrimary, display: 'inline-flex', alignItems: 'center' }}>
              <FaFileDownload style={{ marginRight: SPACING.sm }} /> Export
            </button>
          </Col>
        </Row>

        <div style={{ ...COMPONENTS.featureCardLight, padding: 0, overflow: 'hidden' }}>
          <Table responsive hover className="mb-0" style={{ margin: 0 }}>
            <thead style={{ backgroundColor: COLORS.surfaceSoft }}>
              <tr>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Date</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Customer</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Type</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Amount</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Method</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Today, 10:30 AM</td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Rajesh Kumar</td>
                <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ ...COMPONENTS.badgeFeature }}>Credit Given</span></td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.accentDanger, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>₹ 500</td>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>N/A</td>
              </tr>
              <tr>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>Yesterday, 4:15 PM</td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>Priya Singh</td>
                <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}><span style={{ ...COMPONENTS.badgeFeature, backgroundColor: COLORS.accentTeal }}>Payment Received</span></td>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.accentTeal, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>₹ 1,000</td>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>UPI</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Container>
    </div>
  );
};

export default Transactions;

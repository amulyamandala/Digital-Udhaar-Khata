import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../utils/common';
import { FaFilePdf, FaCalendarAlt } from 'react-icons/fa';

const Statements = () => {
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
              Statements
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              Download monthly or custom reports.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
            <button style={{ ...COMPONENTS.buttonPrimary, display: 'inline-flex', alignItems: 'center' }}>
              <FaCalendarAlt style={{ marginRight: SPACING.sm }} /> Generate Report
            </button>
          </Col>
        </Row>

        <div style={{ ...COMPONENTS.featureCardLight, padding: 0, overflow: 'hidden' }}>
          <Table responsive hover className="mb-0" style={{ margin: 0 }}>
            <thead style={{ backgroundColor: COLORS.surfaceSoft }}>
              <tr>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Report Name</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Date Range</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>May 2026 Summary</td>
                <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>01 May - 31 May</td>
                <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>
                  <button style={{ ...COMPONENTS.buttonSoft, padding: `${SPACING.xs} ${SPACING.sm}`, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center' }}>
                    <FaFilePdf style={{ marginRight: SPACING.xs }} /> Download
                  </button>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Container>
    </div>
  );
};

export default Statements;

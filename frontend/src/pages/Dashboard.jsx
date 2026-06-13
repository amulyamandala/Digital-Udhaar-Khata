import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsers, FaCreditCard, FaHistory, FaPlus, FaMoneyBillWave, FaShareSquare, FaChartBar } from 'react-icons/fa';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED, COMPONENTS } from '../utils/common';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // For now, mock data until API is ready
      const mockStats = {
        totalCustomers: 45,
        totalOutstanding: 25000,
        totalRecovered: 15000,
        pendingPayments: 8
      };
      setStats(mockStats);
    } catch (err) {
      setError(t('common.error') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Inline styles using common.js
  const pageContainerStyle = {
    backgroundColor: COLORS.surfaceSoft,
    minHeight: '100vh',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    paddingLeft: SPACING.xxl,
    paddingRight: SPACING.xxl,
  };

  const cardStyle = {
    ...COMPONENTS.featureCardLight,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: SPACING.xl,
  };

  const iconContainerStyle = (color) => ({
    backgroundColor: `${color}1A`, // 10% opacity
    color: color,
    width: '56px',
    height: '56px',
    borderRadius: ROUNDED.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px'
  });

  return (
    <div style={pageContainerStyle}>
      <Container fluid className="p-0">
        {/* Header */}
        <Row className="align-items-center mb-5">
          <Col md={12}>
            <h1 style={{ ...TYPOGRAPHY.displayMd, color: COLORS.ink, marginBottom: SPACING.xxs }}>
              {t('dashboard.welcome')} {user?.name || 'User'}!
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              {user?.shopName || 'Manage your business beautifully'}
            </p>
          </Col>
        </Row>

        {error && (
          <div style={{ backgroundColor: COLORS.accentPink, color: COLORS.onPrimary, padding: SPACING.md, borderRadius: ROUNDED.md, marginBottom: SPACING.lg }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: COLORS.primary }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <Row className="g-4 mb-5">
              <Col xs={12} sm={6} lg={3}>
                <div style={cardStyle}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, marginBottom: SPACING.xxs }}>{t('dashboard.totalCustomers') || 'Total Customers'}</p>
                      <h3 style={{ ...TYPOGRAPHY.headingLg, color: COLORS.ink, margin: 0 }}>{stats?.totalCustomers || 0}</h3>
                    </div>
                    <div style={iconContainerStyle(COLORS.primary)}>
                      <FaUsers />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <div style={cardStyle}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, marginBottom: SPACING.xxs }}>{t('dashboard.totalOutstanding') || 'Total Outstanding'}</p>
                      <h3 style={{ ...TYPOGRAPHY.headingLg, color: COLORS.ink, margin: 0 }}>₹{stats?.totalOutstanding || 0}</h3>
                    </div>
                    <div style={iconContainerStyle(COLORS.accentDanger)}>
                      <FaCreditCard />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <div style={cardStyle}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, marginBottom: SPACING.xxs }}>{t('dashboard.totalRecovered') || 'Total Recovered'}</p>
                      <h3 style={{ ...TYPOGRAPHY.headingLg, color: COLORS.ink, margin: 0 }}>₹{stats?.totalRecovered || 0}</h3>
                    </div>
                    <div style={iconContainerStyle(COLORS.accentTeal)}>
                      <FaChartLine />
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <div style={cardStyle}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, marginBottom: SPACING.xxs }}>{t('dashboard.pending_payments') || 'Pending Payments'}</p>
                      <h3 style={{ ...TYPOGRAPHY.headingLg, color: COLORS.ink, margin: 0 }}>{stats?.pendingPayments || 0}</h3>
                    </div>
                    <div style={iconContainerStyle(COLORS.accentWarning)}>
                      <FaHistory />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Quick Actions */}
            <div style={{ marginBottom: SPACING.section }}>
              <h4 style={{ ...TYPOGRAPHY.headingMd, color: COLORS.ink, marginBottom: SPACING.lg }}>Quick Actions</h4>
              <div className="d-flex flex-wrap gap-3">
                <button
                  style={{ ...COMPONENTS.buttonPrimary, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => navigate('/customers')}
                >
                  <FaPlus style={{ marginRight: SPACING.xs }} /> Add Customer
                </button>
                <button
                  style={{ ...COMPONENTS.buttonSoft, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => navigate('/transactions')}
                >
                  <FaMoneyBillWave style={{ marginRight: SPACING.xs }} /> Add Transaction
                </button>
                <button
                  style={{ ...COMPONENTS.buttonSoft, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => navigate('/payments')}
                >
                  <FaShareSquare style={{ marginRight: SPACING.xs }} /> Create Payment Link
                </button>
                <button
                  style={{ ...COMPONENTS.buttonSoft, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => navigate('/analytics')}
                >
                  <FaChartBar style={{ marginRight: SPACING.xs }} /> View Report
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 style={{ ...TYPOGRAPHY.headingMd, color: COLORS.ink, marginBottom: SPACING.lg }}>{t('dashboard.recentTransactions') || 'Recent Transactions'}</h4>
              <div style={{ ...COMPONENTS.featureCardLight, padding: 0, overflow: 'hidden' }}>
                <Table responsive hover className="mb-0" style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: COLORS.surfaceSoft }}>
                    <tr>
                      <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Customer</th>
                      <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Type</th>
                      <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Amount</th>
                      <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Date</th>
                      <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Rajesh Kumar</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ ...COMPONENTS.badgeFeature }}>Credit</span></td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>₹500</td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Today</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ color: COLORS.accentTeal, fontWeight: 600 }}>✅ Complete</span></td>
                    </tr>
                    <tr>
                      <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Priya Singh</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ ...COMPONENTS.badgeFeature, backgroundColor: COLORS.accentTeal }}>Payment</span></td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>₹1000</td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>Yesterday</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}><span style={{ color: COLORS.accentTeal, fontWeight: 600 }}>✅ Complete</span></td>
                    </tr>
                    <tr>
                      <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>Arjun Patel</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}><span style={{ ...COMPONENTS.badgeFeature }}>Credit</span></td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>₹750</td>
                      <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}>2 days ago</td>
                      <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: 'none' }}><span style={{ color: COLORS.accentWarning, fontWeight: 600 }}>⏳ Pending</span></td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;

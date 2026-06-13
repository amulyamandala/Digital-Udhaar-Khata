import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FaVolumeUp, FaChartLine, FaUsers, FaCreditCard, FaHistory } from 'react-icons/fa';
import API from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  // Read Dashboard Summary Aloud
  const readDashboardAloud = () => {
    if (!stats) return;

    const text = `Dashboard Summary. Total Customers: ${stats.totalCustomers}. Total Outstanding: ${stats.totalOutstanding} rupees. Total Recovered: ${stats.totalRecovered} rupees. Pending Payments: ${stats.pendingPayments}.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col md={8}>
          <h1 className="fw-bold mb-0">
            {t('dashboard.welcome')} {user?.name || 'User'}! 🎉
          </h1>
          <p className="text-muted mb-0">{user?.shopName}</p>
        </Col>
        <Col md={4} className="text-end">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={readDashboardAloud}
            className="rounded-pill"
          >
            <FaVolumeUp className="me-2" />
            {t('common.readAloud') || 'Read Aloud'}
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <Row className="mb-4 g-3">
            <Col md={6} lg={3}>
              <Card className="border-0 shadow-sm h-100 bg-primary bg-opacity-10">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">{t('dashboard.totalCustomers')}</p>
                      <h3 className="fw-bold mb-0">{stats?.totalCustomers || 0}</h3>
                    </div>
                    <div className="fs-1 text-primary opacity-50">
                      <FaUsers />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="border-0 shadow-sm h-100 bg-danger bg-opacity-10">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">{t('dashboard.totalOutstanding')}</p>
                      <h3 className="fw-bold mb-0">₹{stats?.totalOutstanding || 0}</h3>
                    </div>
                    <div className="fs-1 text-danger opacity-50">
                      <FaCreditCard />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="border-0 shadow-sm h-100 bg-success bg-opacity-10">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">{t('dashboard.totalRecovered')}</p>
                      <h3 className="fw-bold mb-0">₹{stats?.totalRecovered || 0}</h3>
                    </div>
                    <div className="fs-1 text-success opacity-50">
                      <FaChartLine />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="border-0 shadow-sm h-100 bg-warning bg-opacity-10">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">{t('dashboard.pending_payments')}</p>
                      <h3 className="fw-bold mb-0">{stats?.pendingPayments || 0}</h3>
                    </div>
                    <div className="fs-1 text-warning opacity-50">
                      <FaHistory />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light border-0">
                  <h5 className="mb-0 fw-bold">📋 Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2 d-sm-flex">
                    <Button variant="primary" className="rounded-pill">
                      ➕ Add Customer
                    </Button>
                    <Button variant="outline-primary" className="rounded-pill">
                      💰 Add Transaction
                    </Button>
                    <Button variant="outline-primary" className="rounded-pill">
                      📤 Create Payment Link
                    </Button>
                    <Button variant="outline-primary" className="rounded-pill">
                      📊 View Report
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Transactions */}
          <Row>
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light border-0">
                  <h5 className="mb-0 fw-bold">{t('dashboard.recentTransactions')}</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead className="table-light">
                      <tr>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Rajesh Kumar</td>
                        <td><span className="badge bg-primary">Credit</span></td>
                        <td>₹500</td>
                        <td>Today</td>
                        <td>✅ Complete</td>
                      </tr>
                      <tr>
                        <td>Priya Singh</td>
                        <td><span className="badge bg-success">Payment</span></td>
                        <td>₹1000</td>
                        <td>Yesterday</td>
                        <td>✅ Complete</td>
                      </tr>
                      <tr>
                        <td>Arjun Patel</td>
                        <td><span className="badge bg-primary">Credit</span></td>
                        <td>₹750</td>
                        <td>2 days ago</td>
                        <td>⏳ Pending</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsers, FaCreditCard, FaHistory, FaPlus, FaMoneyBillWave, FaChartBar } from 'react-icons/fa';
import API from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [customersRes, transactionsRes] = await Promise.allSettled([
        API.get('/customers'),
        API.get('/transactions/shop/' + (user?.id || user?._id || '')),
      ]);

      let totalCustomers = 0;
      let totalOutstanding = 0;

      if (customersRes.status === 'fulfilled') {
        const customers = customersRes.value.data?.customers || [];
        totalCustomers = customers.length;
        totalOutstanding = customers.reduce((sum, c) => sum + (c.totalBalance || 0), 0);
      }

      let txnList = [];
      let totalRecovered = 0;
      let pendingPayments = 0;

      if (transactionsRes.status === 'fulfilled') {
        txnList = transactionsRes.value.data?.transactions || [];
        totalRecovered = txnList
          .filter((t) => t.type === 'DEBIT')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        pendingPayments = txnList.filter((t) => t.type === 'CREDIT').length;
      }

      setStats({ totalCustomers, totalOutstanding, totalRecovered, pendingPayments });
      setRecentTransactions(txnList.slice(0, 5));
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      icon: <FaUsers size={24} />,
      color: '#494fdf',
      bg: '#eef0ff',
      prefix: '',
    },
    {
      label: 'Total Outstanding',
      value: stats?.totalOutstanding ?? 0,
      icon: <FaCreditCard size={24} />,
      color: '#e23b4a',
      bg: '#fdeced',
      prefix: '₹',
    },
    {
      label: 'Total Recovered',
      value: stats?.totalRecovered ?? 0,
      icon: <FaChartLine size={24} />,
      color: '#00a87e',
      bg: '#e6f7f3',
      prefix: '₹',
    },
    {
      label: 'Credit Entries',
      value: stats?.pendingPayments ?? 0,
      icon: <FaHistory size={24} />,
      color: '#ec7e00',
      bg: '#fff4e6',
      prefix: '',
    },
  ];

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid className="px-3 px-md-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h4 className="fw-bold text-dark mb-0">
              Welcome back, {user?.name || 'User'}! 👋
            </h4>
            <p className="text-muted small mb-0">{user?.shopName || 'Your Shop'}</p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <Row className="g-3 mb-4">
              {statCards.map((card, i) => (
                <Col xs={12} sm={6} xl={3} key={i}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <p className="text-muted small mb-1">{card.label}</p>
                          <h4 className="fw-bold mb-0" style={{ color: card.color }}>
                            {card.prefix}{typeof card.value === 'number' ? card.value.toLocaleString('en-IN') : card.value}
                          </h4>
                        </div>
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: 48, height: 48, backgroundColor: card.bg, color: card.color }}
                        >
                          {card.icon}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-3">
                <h6 className="fw-bold mb-3">Quick Actions</h6>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                    onClick={() => navigate('/customers')}
                  >
                    <FaPlus /> Add Customer
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                    onClick={() => navigate('/transactions')}
                  >
                    <FaMoneyBillWave /> Add Transaction
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                    onClick={() => navigate('/analytics')}
                  >
                    <FaChartBar /> View Analytics
                  </button>
                </div>
              </Card.Body>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0">Recent Transactions</h6>
              </Card.Header>
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold text-muted small border-0">Customer</th>
                      <th className="fw-semibold text-muted small border-0">Type</th>
                      <th className="fw-semibold text-muted small border-0">Amount</th>
                      <th className="fw-semibold text-muted small border-0">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No transactions yet. <span
                            className="text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/customers')}
                          >Add a customer</span> to get started.
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((txn) => (
                        <tr key={txn._id}>
                          <td className="fw-semibold">{txn.customerName || txn.customerId?.name || '—'}</td>
                          <td>
                            <Badge bg={txn.type === 'CREDIT' ? 'danger' : 'success'} className="fw-normal">
                              {txn.type === 'CREDIT' ? 'Credit Given' : 'Payment Received'}
                            </Badge>
                          </td>
                          <td className={`fw-semibold ${txn.type === 'CREDIT' ? 'text-danger' : 'text-success'}`}>
                            ₹{(txn.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="text-muted small">
                            {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-IN') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;
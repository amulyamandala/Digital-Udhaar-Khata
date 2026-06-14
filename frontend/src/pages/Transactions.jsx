import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Table, Modal, Form, Button, Spinner, Alert, Badge, InputGroup,
} from 'react-bootstrap';
import { FaPlus, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../services/api';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'CREDIT', label: 'Credit Given' },
  { value: 'DEBIT', label: 'Payment Received' },
];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'CREDIT',
    amount: '',
    description: '',
    paymentMethod: 'CASH',
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/transactions/shop/me');
      setTransactions(res.data?.transactions || []);
    } catch (err) {
      // Fallback: try without /me
      try {
        const res2 = await API.get('/transactions');
        setTransactions(res2.data?.transactions || []);
      } catch {
        setError('Failed to load transactions.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await API.get('/customers');
      setCustomers(res.data?.customers || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
  }, [fetchTransactions, fetchCustomers]);

  const validateForm = () => {
    if (!formData.customerId) return 'Please select a customer.';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0)
      return 'Please enter a valid amount.';
    return '';
  };

  const handleAddTransaction = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setAddLoading(true);
      setFormError('');
      await API.post('/transactions', {
        customerId: formData.customerId,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod,
      });
      toast.success('Transaction recorded successfully!');
      setShowModal(false);
      setFormData({ customerId: '', type: 'CREDIT', amount: '', description: '', paymentMethod: 'CASH' });
      fetchTransactions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record transaction.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ customerId: '', type: 'CREDIT', amount: '', description: '', paymentMethod: 'CASH' });
    setFormError('');
  };

  const filtered = filterType
    ? transactions.filter((t) => t.type === filterType)
    : transactions;

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid className="px-3 px-md-4">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <h4 className="fw-bold text-dark mb-0">Transactions</h4>
            <p className="text-muted small mb-0">View and manage all shop transactions.</p>
          </Col>
          <Col xs={12} md={6}>
            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
              <InputGroup size="sm" style={{ maxWidth: 160 }}>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  size="sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
              <Button
                variant="primary"
                size="sm"
                className="d-inline-flex align-items-center gap-2 text-nowrap"
                onClick={() => setShowModal(true)}
              >
                <FaPlus /> Add Transaction
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
            {error}
          </Alert>
        )}

        {/* Table */}
        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="fw-semibold text-muted small border-0 ps-3">Date</th>
                    <th className="fw-semibold text-muted small border-0">Customer</th>
                    <th className="fw-semibold text-muted small border-0">Type</th>
                    <th className="fw-semibold text-muted small border-0">Amount</th>
                    <th className="fw-semibold text-muted small border-0">Method</th>
                    <th className="fw-semibold text-muted small border-0">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-5">
                        {filterType ? 'No transactions match the selected filter.' : 'No transactions recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((txn) => (
                      <tr key={txn._id}>
                        <td className="text-muted small ps-3">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="fw-semibold">
                          {txn.customerName || txn.customerId?.name || '—'}
                        </td>
                        <td>
                          <Badge bg={txn.type === 'CREDIT' ? 'danger' : 'success'} className="fw-normal">
                            {txn.type === 'CREDIT' ? 'Credit Given' : 'Payment Received'}
                          </Badge>
                        </td>
                        <td className={`fw-semibold ${txn.type === 'CREDIT' ? 'text-danger' : 'text-success'}`}>
                          ₹{(txn.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="text-muted small">{txn.paymentMethod || '—'}</td>
                        <td className="text-muted small">{txn.description || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>

        {/* Add Transaction Modal */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Add Transaction</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}
            <Form noValidate>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Customer <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.customerId}
                  onChange={(e) => setFormData((p) => ({ ...p, customerId: e.target.value }))}
                  disabled={addLoading}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Transaction Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                  disabled={addLoading}
                >
                  <option value="CREDIT">Credit Given (Udhaar)</option>
                  <option value="DEBIT">Payment Received (Jama)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Amount (₹) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  disabled={addLoading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Payment Method</Form.Label>
                <Form.Select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                  disabled={addLoading}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-semibold small">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Optional note"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  disabled={addLoading}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={addLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTransaction} disabled={addLoading}>
              {addLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Transactions;
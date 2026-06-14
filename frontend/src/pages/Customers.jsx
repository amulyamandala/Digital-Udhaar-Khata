import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Table, Modal, Form, Button, Spinner, Alert, Badge, InputGroup,
} from 'react-bootstrap';
import { FaPlus, FaSearch, FaWhatsapp, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState({});

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');

  const fetchCustomers = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get(`/customers${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setCustomers(res.data?.customers || []);
    } catch (err) {
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val.trim()) fetchCustomers('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Customer name is required.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (formData.phone.replace(/\D/g, '').length !== 10) return 'Enter a valid 10-digit phone number.';
    return '';
  };

  const handleAddCustomer = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setAddLoading(true);
      setFormError('');
      await API.post('/customers', {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
      });
      toast.success(`${formData.name} added successfully!`);
      setShowModal(false);
      setFormData({ name: '', phone: '', address: '', city: '', notes: '' });
      fetchCustomers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add customer.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSendReminder = async (customer) => {
    try {
      setReminderLoading((prev) => ({ ...prev, [customer._id]: true }));
      await API.post('/whatsapp/send-reminder', { customerId: customer._id });
      toast.success(`Reminder sent to ${customer.name}!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reminder.';
      toast.error(msg);
    } finally {
      setReminderLoading((prev) => ({ ...prev, [customer._id]: false }));
    }
  };

  const handleViewLedger = async (customer) => {
    setSelectedCustomer(customer);
    setShowLedgerModal(true);
    setLedger([]);
    setLedgerLoading(true);
    try {
      const res = await API.get(`/customers/${customer._id}/ledger`);
      setLedger(res.data?.transactions || []);
    } catch (err) {
      toast.error('Failed to load ledger.');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', phone: '', address: '', city: '', notes: '' });
    setFormError('');
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid className="px-3 px-md-4">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <h4 className="fw-bold text-dark mb-0">Customers</h4>
            <p className="text-muted small mb-0">Manage your shop's customers and credit ledgers.</p>
          </Col>
          <Col xs={12} md={6}>
            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
              <Form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1 flex-md-grow-0">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size="sm"
                  />
                  <Button variant="outline-secondary" type="submit" size="sm">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form>
              <Button
                variant="primary"
                size="sm"
                className="d-inline-flex align-items-center gap-2 text-nowrap"
                onClick={() => setShowModal(true)}
              >
                <FaPlus /> Add Customer
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
                    <th className="fw-semibold text-muted small border-0 ps-3">Name</th>
                    <th className="fw-semibold text-muted small border-0">Phone</th>
                    <th className="fw-semibold text-muted small border-0">Total Due</th>
                    <th className="fw-semibold text-muted small border-0">Last Transaction</th>
                    <th className="fw-semibold text-muted small border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-5">
                        {searchTerm ? 'No customers found for your search.' : 'No customers yet. Add your first customer!'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust._id}>
                        <td className="fw-semibold ps-3">{cust.name}</td>
                        <td className="text-muted">{cust.phone}</td>
                        <td>
                          <span className={`fw-bold ${(cust.totalBalance || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                            ₹{(cust.totalBalance || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {cust.lastTransactionDate
                            ? new Date(cust.lastTransactionDate).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="d-inline-flex align-items-center gap-1"
                              onClick={() => handleViewLedger(cust)}
                            >
                              <FaEye /> Ledger
                            </Button>
                            {(cust.totalBalance || 0) > 0 && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="d-inline-flex align-items-center gap-1"
                                disabled={!!reminderLoading[cust._id]}
                                onClick={() => handleSendReminder(cust)}
                              >
                                {reminderLoading[cust._id] ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <FaWhatsapp />
                                )}
                                {reminderLoading[cust._id] ? 'Sending...' : 'Remind'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>

        {/* Add Customer Modal */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Add New Customer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}
            <Form noValidate>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Customer full name"
                  disabled={addLoading}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Phone <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  disabled={addLoading}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  disabled={addLoading}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  disabled={addLoading}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-semibold small">Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes"
                  disabled={addLoading}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={addLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCustomer} disabled={addLoading}>
              {addLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Adding...
                </>
              ) : (
                'Add Customer'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Ledger Modal */}
        <Modal show={showLedgerModal} onHide={() => setShowLedgerModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              {selectedCustomer?.name} — Ledger
              {selectedCustomer && (
                <span className={`ms-3 fs-6 fw-normal ${(selectedCustomer.totalBalance || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                  Balance: ₹{(selectedCustomer?.totalBalance || 0).toLocaleString('en-IN')}
                </span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {ledgerLoading ? (
              <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : ledger.length === 0 ? (
              <p className="text-center text-muted py-3">No transactions recorded for this customer.</p>
            ) : (
              <div className="table-responsive">
                <Table hover size="sm" className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold small">Date</th>
                      <th className="fw-semibold small">Type</th>
                      <th className="fw-semibold small">Amount</th>
                      <th className="fw-semibold small">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((txn) => (
                      <tr key={txn._id}>
                        <td className="text-muted small">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td>
                          <Badge bg={txn.type === 'CREDIT' ? 'danger' : 'success'} className="fw-normal">
                            {txn.type === 'CREDIT' ? 'Credit Given' : 'Payment Received'}
                          </Badge>
                        </td>
                        <td className={`fw-semibold ${txn.type === 'CREDIT' ? 'text-danger' : 'text-success'}`}>
                          ₹{(txn.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="text-muted small">{txn.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLedgerModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Customers;
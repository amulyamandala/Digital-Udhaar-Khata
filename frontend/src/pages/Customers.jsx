import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Modal, Form, Button } from 'react-bootstrap';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../utils/common';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  // Fetch customers (initial and after changes)
  const fetchCustomers = async (query = '') => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/customers${query ? `?search=${encodeURIComponent(query)}` : ''}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => {
    fetchCustomers(searchTerm);
  };

  const handleAddCustomer = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', phone: '', address: '', city: '', state: '', pincode: '', notes: '' });
        fetchCustomers();
      } else {
        const err = await res.json();
        console.error('Add customer error', err);
      }
    } catch (err) {
      console.error('Add customer exception', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
              Customers
            </h1>
            <p style={{ ...TYPOGRAPHY.bodyLg, color: COLORS.mute, margin: 0 }}>
              Manage your shop's customers and their ledgers.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
            <input
              type="text"
              placeholder={t('Search customers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...COMPONENTS.textInput, width: '180px' }}
            />
            <Button variant="outline-light" onClick={handleSearch} style={{ ...COMPONENTS.buttonOutlineLight, display: 'inline-flex', alignItems: 'center' }}>
              <FaSearch style={{ marginRight: SPACING.sm }} /> {t('Search')}
            </Button>
            <Button variant="primary" onClick={() => setShowModal(true)} style={{ ...COMPONENTS.buttonPrimary, display: 'inline-flex', alignItems: 'center' }}>
              <FaPlus style={{ marginRight: SPACING.sm }} /> {t('Add Customer')}
            </Button>
          </Col>
        </Row>

        <div style={{ ...COMPONENTS.featureCardLight, padding: 0, overflow: 'hidden' }}>
          <Table responsive hover className="mb-0" style={{ margin: 0 }}>
            <thead style={{ backgroundColor: COLORS.surfaceSoft }}>
              <tr>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Name</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Phone</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Total Due</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Last Transaction</th>
                <th style={{ ...TYPOGRAPHY.bodySm, color: COLORS.mute, padding: SPACING.lg, borderBottom: `1px solid ${COLORS.hairlineLight}`, borderTop: 'none' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust._id}>
                  <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>{cust.name}</td>
                  <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>{cust.phone}</td>
                  <td style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.accentDanger, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>{`₹ ${cust.totalBalance || 0}`}</td>
                  <td style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.mute, padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>{cust.lastTransactionDate ? new Date(cust.lastTransactionDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: SPACING.lg, verticalAlign: 'middle', borderBottom: `1px solid ${COLORS.hairlineLight}` }}>
                    <button style={{ ...COMPONENTS.buttonSoft, padding: `${SPACING.xs} ${SPACING.sm}`, fontSize: '0.85rem' }}>View Ledger</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
          {/* Add Customer Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>{t('Add New Customer')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>{t('Name')}</Form.Label>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('Enter name')} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formPhone">
                  <Form.Label>{t('Phone')}</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder={t('Enter phone')} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formAddress">
                  <Form.Label>{t('Address')}</Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleInputChange} placeholder={t('Enter address')} />
                </Form.Group>
                {/* Additional optional fields can be added here */}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>{t('Cancel')}</Button>
              <Button variant="primary" onClick={handleAddCustomer}>{t('Add')}</Button>
            </Modal.Footer>
          </Modal>
      </Container>
    </div>
  );
};

export default Customers;

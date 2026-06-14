import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Spinner, Alert, Table, Badge,
} from 'react-bootstrap';
import { FaFilePdf, FaWhatsapp, FaDownload, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const Statements = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { transactions, totalCredit, totalDebit, customer }
  const [pdfLoading, setPdfLoading] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch customers on mount ─────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await API.get('/customers');
      setCustomers(res.data?.customers || []);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) || null;

  // ── Preview transactions ─────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!selectedCustomerId) {
      setError('Please select a customer first.');
      return;
    }
    setError('');
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await API.get(
        `/transactions/customer/${selectedCustomerId}`
      );
      const all = res.data || [];
      // Filter by selected month/year
      const filtered = all.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      });
      const totalCredit = filtered.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
      const totalDebit = filtered.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
      setPreview({ transactions: filtered, totalCredit, totalDebit });
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Download PDF ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!selectedCustomerId) return;
    try {
      setPdfLoading(true);
      const res = await API.get(
        `/statements/download/${selectedCustomerId}?month=${selectedMonth}&year=${selectedYear}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCustomer?.name || 'Customer'}_${MONTHS[selectedMonth]}_${selectedYear}_Statement.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('✅ PDF downloaded successfully!');
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Send via WhatsApp ────────────────────────────────────────────────────────
  const handleSendWhatsApp = async () => {
    if (!selectedCustomerId) return;
    try {
      setWaLoading(true);
      await API.post('/whatsapp/send-statement', { customerId: selectedCustomerId });
      toast.success(`📲 Statement sent to ${selectedCustomer?.name} via WhatsApp!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp statement.');
    } finally {
      setWaLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid className="px-3 px-md-4">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Col>
            <h4 className="fw-bold text-dark mb-0">Statements</h4>
            <p className="text-muted small mb-0">Generate and download monthly ledger statements as PDF.</p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              {/* Customer Selector */}
              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold small d-flex align-items-center gap-1">
                  <FaUser className="text-primary" /> Customer
                </Form.Label>
                <Form.Select
                  value={selectedCustomerId}
                  onChange={(e) => { setSelectedCustomerId(e.target.value); setPreview(null); }}
                >
                  <option value="">— Select a customer —</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Month Selector */}
              <Col xs={6} md={3}>
                <Form.Label className="fw-semibold small d-flex align-items-center gap-1">
                  <FaCalendarAlt className="text-primary" /> Month
                </Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPreview(null); }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </Form.Select>
              </Col>

              {/* Year Selector */}
              <Col xs={6} md={2}>
                <Form.Label className="fw-semibold small">Year</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(Number(e.target.value)); setPreview(null); }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </Col>

              {/* Action buttons */}
              <Col xs={12} md={3} className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  onClick={handlePreview}
                  disabled={!selectedCustomerId || previewLoading}
                  className="d-inline-flex align-items-center gap-1"
                >
                  {previewLoading ? <Spinner animation="border" size="sm" /> : <FaCalendarAlt />}
                  Preview
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDownloadPDF}
                  disabled={!selectedCustomerId || pdfLoading}
                  className="d-inline-flex align-items-center gap-1"
                >
                  {pdfLoading ? <Spinner animation="border" size="sm" /> : <FaFilePdf />}
                  {pdfLoading ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button
                  variant="success"
                  onClick={handleSendWhatsApp}
                  disabled={!selectedCustomerId || waLoading}
                  className="d-inline-flex align-items-center gap-1"
                >
                  {waLoading ? <Spinner animation="border" size="sm" /> : <FaWhatsapp />}
                  {waLoading ? 'Sending...' : 'Send WhatsApp'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Customer Summary Card */}
        {selectedCustomer && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderLeft: '4px solid #4f46e5' }}>
            <Card.Body className="py-3">
              <Row className="align-items-center">
                <Col>
                  <div className="fw-bold text-dark">{selectedCustomer.name}</div>
                  <div className="text-muted small">{selectedCustomer.phone} {selectedCustomer.address && `• ${selectedCustomer.address}`}</div>
                </Col>
                <Col xs="auto">
                  <div className="text-end">
                    <div className="text-muted small">Outstanding Balance</div>
                    <div className={`fw-bold fs-5 ${(selectedCustomer.totalBalance || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                      ₹{(selectedCustomer.totalBalance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Preview Table */}
        {preview && (
          <div className="bg-white rounded-3 shadow-sm overflow-hidden">
            {/* Summary row */}
            <div className="px-4 py-3 border-bottom d-flex justify-content-between flex-wrap gap-3 align-items-center">
              <span className="fw-semibold text-dark">
                {MONTHS[selectedMonth]} {selectedYear} — {preview.transactions.length} transaction{preview.transactions.length !== 1 ? 's' : ''}
              </span>
              <div className="d-flex gap-3">
                <span>
                  <span className="text-muted small me-1">Credit:</span>
                  <span className="fw-bold text-danger">₹{preview.totalCredit.toLocaleString('en-IN')}</span>
                </span>
                <span>
                  <span className="text-muted small me-1">Payments:</span>
                  <span className="fw-bold text-success">₹{preview.totalDebit.toLocaleString('en-IN')}</span>
                </span>
              </div>
            </div>

            {preview.transactions.length === 0 ? (
              <div className="text-center text-muted py-5">
                No transactions found for {MONTHS[selectedMonth]} {selectedYear}.
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold text-muted small border-0 ps-3">Date</th>
                      <th className="fw-semibold text-muted small border-0">Type</th>
                      <th className="fw-semibold text-muted small border-0">Amount</th>
                      <th className="fw-semibold text-muted small border-0">Method</th>
                      <th className="fw-semibold text-muted small border-0">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.transactions.map((txn) => (
                      <tr key={txn._id}>
                        <td className="text-muted small ps-3">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN')}
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
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Footer actions */}
            <div className="px-4 py-3 border-top bg-light d-flex gap-2 justify-content-end flex-wrap">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="d-inline-flex align-items-center gap-1"
              >
                {pdfLoading ? <Spinner animation="border" size="sm" /> : <FaDownload />}
                Download PDF
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleSendWhatsApp}
                disabled={waLoading}
                className="d-inline-flex align-items-center gap-1"
              >
                {waLoading ? <Spinner animation="border" size="sm" /> : <FaWhatsapp />}
                Send via WhatsApp
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!preview && !previewLoading && (
          <div className="bg-white rounded-3 shadow-sm text-center py-5 text-muted">
            <FaFilePdf size={40} className="mb-3 opacity-25" />
            <p className="mb-1 fw-semibold">No preview yet</p>
            <p className="small">Select a customer and month, then click <strong>Preview</strong> or <strong>Download PDF</strong>.</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Statements;

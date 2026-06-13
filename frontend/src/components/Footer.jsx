import React from 'react';
import { Container, Row, Col, Text } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white py-5 mt-5">
      <Container>
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-4">
            <h6 className="fw-bold mb-3">🏪 Udhaar Khata</h6>
            <p className="text-muted small">
              Digital ledger for Indian Kirana stores. Manage customer credit with ease.
            </p>
          </Col>

          <Col md={3} sm={6} className="mb-4">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="#/" className="text-muted text-decoration-none small">Dashboard</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">Customers</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">Transactions</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">Analytics</a></li>
            </ul>
          </Col>

          <Col md={3} sm={6} className="mb-4">
            <h6 className="fw-bold mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><a href="#/" className="text-muted text-decoration-none small">Help Center</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">Contact Us</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">Documentation</a></li>
              <li><a href="#/" className="text-muted text-decoration-none small">FAQ</a></li>
            </ul>
          </Col>

          <Col md={3} sm={6} className="mb-4">
            <h6 className="fw-bold mb-3">Follow Us</h6>
            <div className="d-flex gap-3">
              <a href="#/" className="text-muted text-decoration-none">
                <FaFacebook size={20} />
              </a>
              <a href="#/" className="text-muted text-decoration-none">
                <FaTwitter size={20} />
              </a>
              <a href="#/" className="text-muted text-decoration-none">
                <FaInstagram size={20} />
              </a>
              <a href="#/" className="text-muted text-decoration-none">
                <FaLinkedin size={20} />
              </a>
            </div>
          </Col>
        </Row>

        <hr className="bg-secondary" />

        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="text-muted small mb-0">
              &copy; {currentYear} Udhaar Khata. All rights reserved.
            </p>
          </Col>

          <Col md={6} className="text-center text-md-end">
            <a href="#/" className="text-muted text-decoration-none small me-3">
              Privacy Policy
            </a>
            <a href="#/" className="text-muted text-decoration-none small me-3">
              Terms of Service
            </a>
            <a href="#/" className="text-muted text-decoration-none small">
              Cookie Policy
            </a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

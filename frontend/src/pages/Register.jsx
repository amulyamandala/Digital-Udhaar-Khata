import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shopName: '',
    language: 'en',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.phone || !formData.shopName.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register({
        name: formData.name.trim(),
        phone: formData.phone,
        shopName: formData.shopName.trim(),
        language: formData.language,
        password: formData.password,
      });

      if (result.success) {
        toast.success('Shop registered successfully!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        toast.error(result.error || 'Registration failed.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center py-4"
      style={{ background: 'linear-gradient(135deg, #edeaeaff 0%, #fbfbfbff 100%)' }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={6} xl={5}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4 p-sm-5">
                <div className="text-center mb-4">
                  <div className="fs-1 mb-2">🏪</div>
                  <h2 className="fw-bold text-dark mb-1">Register Your Shop</h2>
                  <p className="text-muted small mb-0">Start managing your credit ledger</p>
                </div>

                {error && (
                  <Alert variant="danger" className="rounded-3 py-2" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark small">Owner Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Your full name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="py-2 rounded-3"
                      disabled={loading}
                      autoComplete="name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark small">Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="10-digit mobile number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="py-2 rounded-3"
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark small">Shop Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Sharma Kirana Store"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="py-2 rounded-3"
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark small">Preferred Language</Form.Label>
                    <Form.Select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="py-2 rounded-3"
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark small">Password <span className="text-danger">*</span></Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="py-2 rounded-3 rounded-end-0"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <Button
                        variant="outline-secondary"
                        className="rounded-3 rounded-start-0"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        type="button"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark small">Confirm Password <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="py-2 rounded-3"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-2 fw-bold rounded-3"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Registering...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Form>

                <hr className="my-4" />
                <p className="text-center text-muted small mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                    Sign in
                  </Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
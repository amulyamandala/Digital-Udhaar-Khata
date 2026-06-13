import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.phone || !formData.shopName || !formData.password) {
      setError(t('auth.fillAllFields'));
      return false;
    }

    if (formData.phone.length !== 10) {
      setError(t('auth.phoneInvalid'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        phone: formData.phone,
        shopName: formData.shopName,
        language: formData.language,
        password: formData.password,
      });

      if (result.success) {
        toast.success(t('auth.registerSuccess'));
        navigate('/dashboard');
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('auth.registerError');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-gradient d-flex align-items-center py-5" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="display-5 fw-bold mb-2">🏪</h1>
                  <h2 className="fw-bold text-dark mb-2">{t('auth.registerShop')}</h2>
                  <p className="text-muted">{t('auth.registerSubtitle')}</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="border-0 rounded-3" dismissible>
                    {error}
                  </Alert>
                )}

                {/* Register Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Name */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.ownerName')}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Phone */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.phone')}</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="9999999999"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                      maxLength="10"
                    />
                  </Form.Group>

                  {/* Shop Name */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.shopName')}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="My Kirana Store"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Language */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.language')}</Form.Label>
                    <Form.Select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.password')}</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="py-3 rounded-3 rounded-end-0 border-2"
                        disabled={loading}
                      />
                      <Button
                        variant="outline-secondary"
                        className="rounded-3 rounded-start-0 border-2"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-dark">{t('auth.confirmPassword')}</Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    className="w-100 py-3 fw-bold fs-5 rounded-3 border-0"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {t('auth.registering')}
                      </>
                    ) : (
                      t('auth.register')
                    )}
                  </Button>
                </Form>

                {/* Login Link */}
                <hr className="my-4" />
                <p className="text-center text-muted mb-0">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-bold">
                    {t('auth.loginNow')}
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

import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load remembered phone on mount
  React.useEffect(() => {
    const rememberedPhone = localStorage.getItem('rememberedPhone');
    if (rememberedPhone) {
      setPhone(rememberedPhone);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone || !password) {
      setError(t('auth.fillAllFields'));
      setLoading(false);
      return;
    }

    try {
      const result = await login(phone, password);
      
      if (result.success) {
        // Save phone if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedPhone', phone);
        } else {
          localStorage.removeItem('rememberedPhone');
        }

        toast.success(t('auth.loginSuccess'));
        navigate('/dashboard');
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('auth.loginError');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-gradient d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="display-5 fw-bold mb-2">🏪</h1>
                  <h2 className="fw-bold text-dark mb-2">Udhaar Khata</h2>
                  <p className="text-muted">{t('auth.loginSubtitle')}</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="border-0 rounded-3" dismissible>
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Phone */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-dark">{t('auth.phone')}</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="9999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="py-3 rounded-3 border-2"
                      disabled={loading}
                      maxLength="10"
                    />
                    <Form.Text className="text-muted">
                      {t('auth.phoneHelp')}
                    </Form.Text>
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">{t('auth.password')}</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  {/* Remember Me */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      label={t('auth.rememberMe')}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-100 py-3 fw-bold fs-5 rounded-3 border-0"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {t('auth.loggingIn')}
                      </>
                    ) : (
                      t('auth.login')
                    )}
                  </Button>
                </Form>

                {/* Forgot Password Link */}
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-primary text-decoration-none fw-bold">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>

                {/* Register Link */}
                <hr className="my-4" />
                <p className="text-center text-muted mb-0">
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" className="text-primary text-decoration-none fw-bold">
                    {t('auth.registerNow')}
                  </Link>
                </p>
              </Card.Body>
            </Card>

            {/* Demo Credentials */}
            <Card className="mt-4 border-0 bg-light">
              <Card.Body className="small text-muted">
                <p className="fw-bold mb-2">📝 Demo Credentials:</p>
                <p className="mb-1">Phone: 9999999999</p>
                <p className="mb-0">Password: Test@123</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;

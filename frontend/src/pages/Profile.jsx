import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaUser, FaStore, FaCreditCard, FaLock } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Personal Info Form
  const [personalData, setPersonalData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language: user?.language || 'en',
  });

  // Shop Info Form
  const [shopData, setShopData] = useState({
    shopName: user?.shopName || '',
    shopAddress: user?.shopAddress || '',
    shopGSTIN: user?.shopGSTIN || '',
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Handle Personal Data Change
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Shop Data Change
  const handleShopChange = (e) => {
    const { name, value } = e.target;
    setShopData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Password Change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Save Personal Info
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(personalData);
      if (result.success) {
        toast.success(t('profile.updateSuccess'));
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Save Shop Info
  const handleSaveShop = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(shopData);
      if (result.success) {
        toast.success(t('profile.updateSuccess'));
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (result.success) {
        toast.success(t('profile.passwordChangeSuccess'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="fw-bold mb-0">{t('profile.title')}</h1>
          <p className="text-muted">{t('profile.personal_info')}</p>
        </Col>
      </Row>

      <Row>
        <Col lg={3} className="mb-4">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <div className="avatar mb-3">
                <div
                  className="w-100 h-100 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                  style={{ width: '100px', height: '100px', margin: '0 auto', fontSize: '3rem' }}
                >
                  <FaUser />
                </div>
              </div>
              <h5 className="fw-bold">{user?.name}</h5>
              <p className="text-muted small">{user?.shopName}</p>
              <p className="text-muted small">
                <FaCreditCard className="me-1" />
                {user?.subscriptionPlan}
              </p>
            </Card.Body>
          </Card>

          {/* Info Card */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Body>
              <p className="mb-2">
                <strong>{t('common.phone')}:</strong>
              </p>
              <p className="text-muted">{user?.phone}</p>

              <hr />

              <p className="mb-2">
                <strong>{t('profile.email')}:</strong>
              </p>
              <p className="text-muted">{user?.email || 'Not set'}</p>

              <hr />

              <p className="mb-2">
                <strong>{t('profile.language')}:</strong>
              </p>
              <p className="text-muted">{user?.language?.toUpperCase()}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
            {/* Personal Info Tab */}
            <Tab eventKey="personal" title={<><FaUser className="me-2" /> Personal</>}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Form onSubmit={handleSavePersonal}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.personal_info')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={personalData.name}
                            onChange={handlePersonalChange}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.email')}</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={personalData.email}
                            onChange={handlePersonalChange}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.language')}</Form.Label>
                          <Form.Select
                            name="language"
                            value={personalData.language}
                            onChange={handlePersonalChange}
                            className="rounded-3"
                          >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="te">తెలుగు</option>
                            <option value="ta">தமிழ்</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      variant="primary"
                      className="rounded-pill px-4"
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('profile.save_changes')}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Shop Info Tab */}
            <Tab eventKey="shop" title={<><FaStore className="me-2" /> Shop</>}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Form onSubmit={handleSaveShop}>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.shop_name')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="shopName"
                            value={shopData.shopName}
                            onChange={handleShopChange}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.address')}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="shopAddress"
                            value={shopData.shopAddress}
                            onChange={handleShopChange}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">{t('profile.gstin')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="shopGSTIN"
                            value={shopData.shopGSTIN}
                            onChange={handleShopChange}
                            placeholder="22ABCDE1234F0Z5"
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      variant="primary"
                      className="rounded-pill px-4"
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('profile.save_changes')}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Security Tab */}
            <Tab eventKey="security" title={<><FaLock className="me-2" /> Security</>}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">{t('profile.change_password')}</h5>

                  <Form onSubmit={handleChangePassword}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">{t('auth.current_password')}</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="rounded-3"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">{t('auth.new_password')}</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="rounded-3"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">{t('auth.confirmPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="rounded-3"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="danger"
                      className="rounded-pill px-4"
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('profile.change_password')}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

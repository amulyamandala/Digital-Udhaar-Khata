import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, Offcanvas, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  const menuItems = [
    { label: t('navbar.dashboard'), path: '/dashboard', icon: '📊' },
    { label: t('navbar.customers'), path: '/customers', icon: '👥' },
    { label: t('navbar.transactions'), path: '/transactions', icon: '💰' },
    { label: t('navbar.payments'), path: '/payments', icon: '💳' },
    { label: t('navbar.statements'), path: '/statements', icon: '📄' },
    { label: t('navbar.analytics'), path: '/analytics', icon: '📈' },
    { label: t('navbar.voice'), path: '/voice', icon: '🎤' },
  ];

  return (
    <>
      <Navbar bg="dark" expand="lg" sticky="top" className="shadow-sm">
        <Container>
          <Navbar.Brand 
            onClick={() => navigate('/dashboard')} 
            style={{ cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold' }}
            className="text-primary"
          >
            🏪 Udhaar Khata
          </Navbar.Brand>

          {/* Desktop Menu */}
          <Nav className="ms-auto d-none d-lg-flex align-items-center gap-3">
            {menuItems.map((item) => (
              <Nav.Link
                key={item.path}
                onClick={() => navigate(item.path)}
                className="text-white"
              >
                {item.label}
              </Nav.Link>
            ))}

            {/* Language Dropdown */}
            <Dropdown className="ms-2">
              <Dropdown.Toggle variant="outline-light" size="sm" className="border-0">
                🌐 {i18n.language.toUpperCase()}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleLanguageChange('en')}>
                  English
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleLanguageChange('hi')}>
                  हिंदी (Hindi)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleLanguageChange('te')}>
                  తెలుగు (Telugu)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleLanguageChange('ta')}>
                  தமிழ் (Tamil)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Profile Dropdown */}
            <Dropdown className="ms-2">
              <Dropdown.Toggle variant="outline-light" size="sm" className="border-0">
                <FaUser /> {user?.shopName || 'Profile'}
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <FaCog className="me-2" /> {t('navbar.profile')}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> {t('navbar.logout')}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>

          {/* Mobile Menu Button */}
          <Button
            variant="outline-light"
            className="d-lg-none border-0"
            onClick={() => setShowOffcanvas(true)}
          >
            <FaBars size={24} />
          </Button>
        </Container>
      </Navbar>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
        responsive="lg"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column gap-2">
            {menuItems.map((item) => (
              <Nav.Link
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowOffcanvas(false);
                }}
                className="fw-bold text-dark"
              >
                {item.icon} {item.label}
              </Nav.Link>
            ))}

            <hr />

            {/* Mobile Language Selection */}
            <div className="mb-3">
              <h6 className="fw-bold mb-2">Language</h6>
              {['en', 'hi', 'te', 'ta'].map((lang) => (
                <Button
                  key={lang}
                  size="sm"
                  variant={i18n.language === lang ? 'primary' : 'outline-secondary'}
                  className="w-100 mb-2"
                  onClick={() => {
                    handleLanguageChange(lang);
                    setShowOffcanvas(false);
                  }}
                >
                  {lang.toUpperCase()}
                </Button>
              ))}
            </div>

            <hr />

            {/* Mobile Profile */}
            <Button
              variant="outline-primary"
              className="w-100 mb-2"
              onClick={() => {
                navigate('/profile');
                setShowOffcanvas(false);
              }}
            >
              <FaUser className="me-2" /> {t('navbar.profile')}
            </Button>

            <Button
              variant="outline-danger"
              className="w-100"
              onClick={() => {
                handleLogout();
                setShowOffcanvas(false);
              }}
            >
              <FaSignOutAlt className="me-2" /> {t('navbar.logout')}
            </Button>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NavBar;

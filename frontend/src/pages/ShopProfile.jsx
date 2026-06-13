import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Image, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from "../utils/common";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    shopName: "",
    shopAddress: "",
    shopGSTIN: "",
    shopQRCodeUrl: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        shopName: user.shopName || "",
        shopAddress: user.shopAddress || "",
        shopGSTIN: user.shopGSTIN || "",
        shopQRCodeUrl: user.shopQRCodeUrl || "",
      });
    }
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "shopQRCodeFile" && files && files[0]) {
      // Convert to base64 string for simplicity
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, shopQRCodeUrl: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.put("/auth/profile", form);
      // Update auth context with new data
      setUser(res.data.user);
      alert("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.surfaceSoft, minHeight: "100vh", padding: SPACING.xl }}>
      <Container fluid className="p-0">
        <Row className="align-items-center mb-5">
          <Col md={12} className="d-flex align-items-center gap-3">
            <Button variant="link" onClick={() => navigate("/dashboard")} style={{ color: COLORS.ink, textDecoration: "none" }}>
              <ArrowLeft size={20} />
            </Button>
            <h2 style={{ ...TYPOGRAPHY.headingLg, margin: 0, color: COLORS.ink }}>
              Shop Profile
            </h2>
          </Col>
        </Row>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit} style={COMPONENTS.featureCardLight}>
          <Form.Group className="mb-4" controlId="shopName">
            <Form.Label style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink }}>Shop Name</Form.Label>
            <Form.Control
              type="text"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              placeholder="Enter shop name"
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="shopAddress">
            <Form.Label style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink }}>Address</Form.Label>
            <Form.Control
              type="text"
              name="shopAddress"
              value={form.shopAddress}
              onChange={handleChange}
              placeholder="Shop address"
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="shopGSTIN">
            <Form.Label style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink }}>GSTIN</Form.Label>
            <Form.Control
              type="text"
              name="shopGSTIN"
              value={form.shopGSTIN}
              onChange={handleChange}
              placeholder="GSTIN (optional)"
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="shopQRCode">
            <Form.Label style={{ ...TYPOGRAPHY.bodyMdBold, color: COLORS.ink }}>Shop QR Code (UPI)</Form.Label>
            {form.shopQRCodeUrl && (
              <div className="mb-2">
                <Image src={form.shopQRCodeUrl} alt="Shop QR" fluid style={{ maxHeight: "200px" }} />
              </div>
            )}
            <Form.Control type="file" name="shopQRCodeFile" accept="image/*" onChange={handleChange} />
            <Form.Text className="text-muted">Upload a QR image or paste a link.</Form.Text>
          </Form.Group>
          <Button type="submit" disabled={saving} style={COMPONENTS.buttonOutlineLight}>
            {saving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Save Changes"}
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default ShopProfile;

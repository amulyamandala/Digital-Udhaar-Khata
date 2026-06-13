const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, phone, shopName, language, password, email, shopAddress, shopGSTIN } = req.body;

    if (!name || !phone || !shopName || !password) {
      return res.status(400).json({ message: "Name, phone, shopName, and password are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ phone }, { shopName }] });
    if (existingUser) {
      return res.status(409).json({ message: "Phone number or Shop Name already registered" });
    }

    // Create user
    const newUser = await User.create({
      name,
      phone,
      shopName,
      email,
      language: language || "en",
      password,
      shopAddress,
      shopGSTIN,
      subscriptionPlan: "free",
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { id: newUser._id, phone: newUser.phone },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "2d" }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_REFRESH || "refresh_secret",
      { expiresIn: "7d" }
    );

    // Save refresh token
    newUser.refreshToken = refreshToken;
    await newUser.save();

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Registration successful",
      accessToken,
      refreshToken,
      user: newUser.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    // Find user
    const user = await User.findOne({ phone }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "2d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH || "refresh_secret",
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGOUT
router.post("/logout", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHECK AUTH
router.get("/check-auth", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Authenticated", user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET PROFILE
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.toJSON());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROFILE
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, language, shopName, shopAddress, shopGSTIN, shopCategory, twoFactorEnabled, shopQRCodeUrl } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (language) user.language = language;
    if (shopName) user.shopName = shopName;
    if (shopAddress) user.shopAddress = shopAddress;
    if (shopGSTIN) user.shopGSTIN = shopGSTIN;
    if (shopCategory) user.shopCategory = shopCategory;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
    if (shopQRCodeUrl) user.shopQRCodeUrl = shopQRCodeUrl;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHANGE PASSWORD
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REFRESH TOKEN
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH || "refresh_secret");
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "2d" }
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
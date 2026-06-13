import exp from "express";
import { UserModel } from "../models/userModel.js";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { verifyToken } from "../middleware/verifyToken.js";

const { sign, verify } = jwt;
export const authApp = exp.Router();

// Initialize Twilio Client
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// REGISTER
authApp.post("/register", async (req, res) => {
  try {
    const { name, phone, shopName, language, password, subscriptionPlan } = req.body;
    
    if (!name || !phone || !shopName || !password) {
      return res.status(400).json({ message: "Name, phone, shopName, and password are required" });
    }

    // check existing user
    const existingUser = await UserModel.findOne({ $or: [{ phone }, { shopName }] });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number or Shop Name already registered" });
    }

    // hash password
    const hashedPassword = await hash(password, 12);

    // create user
    const newUser = await UserModel.create({
      name,
      phone,
      shopName,
      language: language || "english",
      password: hashedPassword,
      subscriptionPlan: subscriptionPlan || "free"
    });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: "Registration successful", user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
authApp.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    // check user
    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // access token
    const token = sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    // refresh token
    const refreshToken = sign(
      { id: user._id },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" }
    );

    // save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // cookies
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(200).json({ message: "Login successful", token, refreshToken, user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGOUT
authApp.get("/logout", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (user) {
      user.refreshToken = "";
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
authApp.get("/check-auth", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Authenticated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET PROFILE
authApp.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROFILE/LANGUAGE
authApp.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, language, shopName } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (language) user.language = language;
    if (shopName) user.shopName = shopName;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(200).json({ message: "Profile updated successfully", user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PASSWORD
authApp.put("/password", verifyToken, async (req, res) => {
  try {
    const { password, newpassword } = req.body;
    if (!password || !newpassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // old password check
    const isPassValid = await compare(password, user.password);
    if (!isPassValid) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    // same password check
    const isSame = await compare(newpassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: "New password cannot be same as old password" });
    }

    // hash new password
    const hashedPassword = await hash(newpassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REFRESH TOKEN
authApp.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const decoded = verify(refreshToken, process.env.JWT_REFRESH);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // new access token
    const newAccessToken = sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ message: "Token refreshed", token: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// SEND OTP
authApp.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    // generate random 6 digit otp
    const otp = Math.floor(100000 + Math.random() * 900000);
    // save otp temporarily
    global.otpStore = global.otpStore || {};
    global.otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: `Your Udhaar Khata verification OTP is ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${phone}`
        });
      } catch (twilioErr) {
        console.error("Twilio send failed, fallback to log:", twilioErr.message);
      }
    }
    
    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    res.status(200).json({ message: "OTP sent successfully", devOtp: otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// VERIFY OTP
authApp.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }
    global.otpStore = global.otpStore || {};
    const storedOtpData = global.otpStore[phone];

    if (!storedOtpData) {
      return res.status(404).json({ message: "OTP not found or expired" });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      delete global.otpStore[phone];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedOtpData.otp.toString() !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    delete global.otpStore[phone];
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
import exp from "express";
import { UserModel } from "../models/userModel.js";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

const { sign, verify } = jwt;

export const authApp=exp.Router();
// REGISTER
authApp.post("/register",async(req,res)=>{
  try{
    const{name,phone,shopName,language,password,subscriptionPlan}=req.body;
    // check existing user
    const existingUser=await UserModel.findOne({$or: [{ phone }, { shopName }]});

    if(existingUser){
      return res.status(400).json({message: "User already exists"});
    }
    // hash password
    const hashedPassword=await hash(password, 12);

    // create user
    const newUser = await UserModel.create({
      name,
      phone,
      shopName,
      language,
      password: hashedPassword,
      subscriptionPlan
    });

    res.status(201).json({
      message: "Registration successful",
      user: newUser
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


// LOGIN
authApp.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // check user
    const user = await UserModel.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // compare password
    const isPasswordValid = await compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    // access token
    const token = sign(
      {
        id: user._id,
        phone: user.phone
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d"
      }
    );

    // refresh token
    const refreshToken = sign(
      {
        id: user._id
      },
      process.env.JWT_REFRESH,
      {
        expiresIn: "7d"
      }
    );

    // save refresh token
    user.refreshToken = refreshToken;

    await user.save();

    // cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


// SEND OTP
authApp.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required"
      });
    }

    // generate random 6 digit otp
    const otp = Math.floor(
      100000 + Math.random() * 900000
    );

    // save otp temporarily
    global.otpStore = global.otpStore || {};

    global.otpStore[phone] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    // TODO:
    // send OTP using Twilio / MSG91

    console.log(`OTP for ${phone}: ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


// VERIFY OTP
authApp.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP required"
      });
    }

    global.otpStore = global.otpStore || {};

    const storedOtpData =
      global.otpStore[phone];

    // no otp found
    if (!storedOtpData) {
      return res.status(404).json({
        message: "OTP not found"
      });
    }

    // check expiry
    if (
      Date.now() > storedOtpData.expiresAt
    ) {
      delete global.otpStore[phone];

      return res.status(400).json({
        message: "OTP expired"
      });
    }

    // check otp
    if (
      storedOtpData.otp.toString() !==
      otp.toString()
    ) {
      return res.status(401).json({
        message: "Invalid OTP"
      });
    }

    // delete otp after verification
    delete global.otpStore[phone];

    res.status(200).json({
      message: "OTP verified successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});
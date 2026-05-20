import exp from "express";
import { UserModel } from "../models/userModel.js";
import { hash, compare } from "bcrypt";
import { verifyToken } from "../middleware/verifyToken.js";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
export const userApp=exp.Router();
// REGISTER
userApp.post("/register",async(req,res)=>{
  try {
    const {name,phone,shopName,language,password,subscriptionPlan}=req.body;
    // check existing user
    const existingUser=await UserModel.findOne({$or:[{ phone },{ shopName }]});
if(existingUser){
      return res.status(400).json({message:"User already exists"});}
    // hash password
    const hashedPassword=await hash(password, 12);

    // create user
    const newUser=await UserModel.create({name,phone,shopName,language,subscriptionPlan,password:hashedPassword});

    res.status(201).json({message:"Registration successful",user: newUser});
  } catch(err){
    res.status(500).json({message: err.message});
  }
});
// LOGIN
userApp.post("/login",async(req,res)=>{
  try {
    const { phone, password }=req.body;
    // find user
    const user=await UserModel.findOne({ phone });

    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    // compare password
    const isPasswordValid=await compare(password,user.password);

    if(!isPasswordValid){
      return res.status(401).json({ message: "Invalid password" });
    }

    // access token
    const token=sign(
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
    const refreshToken=sign({id: user._id},process.env.JWT_REFRESH,{expiresIn: "7d"});

    // save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // cookies
    res.cookie("token",token,{
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.cookie("refreshToken",refreshToken,{
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.status(200).json({message: "Login successful",token,refreshToken});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});


// LOGOUT
userApp.get("/logout",verifyToken,async(req, res)=>{
  try {
    const user=await UserModel.findById(req.user.id);

    if(!user){
      return res.status(404).json({ message: "User not found" });
    }

    user.refreshToken = "";
    await user.save();

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logout successful"
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});


// CHECK AUTH
userApp.get("/check-auth",verifyToken,async(req,res)=>{
  try {
    res.status(200).json({message: "Authenticated",user: req.user});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});


// GET PROFILE
userApp.get("/profile",verifyToken,async(req,res)=>{
  try {
    const user = await UserModel.findById(req.user.id).select(
      "-password -refreshToken"
    );

    if(!user){
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});


// UPDATE PASSWORD
userApp.put("/password",verifyToken,async(req, res)=>{
  try {
    const { password, newpassword } = req.body;

    const user=await UserModel.findById(req.user.id);

    if (!user){
      return res.status(404).json({ message: "User not found" });
    }

    // old password check
    const isPassValid = await compare(password,user.password);
    if (!isPassValid) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    // same password check
    const isSame=await compare(newpassword,user.password);

    if (isSame) {
      return res.status(400).json({message:"New password cannot be same as old password"});
    }

    // hash new password
    const hashedPassword = await hash(newpassword, 12);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({message: "Password updated successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});


// REFRESH TOKEN
userApp.post("/refresh",async(req, res)=>{
  try {
    const refreshToken =req.cookies.refreshToken ||req.body.refreshToken;

    if (!refreshToken){
      return res.status(401).json({
        message: "Refresh token not found"
      });
    }

    const decoded = verify(
      refreshToken,
      process.env.JWT_REFRESH
    );

    const user = await UserModel.findById(decoded.id);

    if (
      !user ||
      user.refreshToken !== refreshToken
    ) {
      return res.status(403).json({
        message: "Invalid refresh token"
      });
    }

    // new access token
    const newAccessToken = sign(
      {
        id: user._id,
        phone: user.phone
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d"
      }
    );

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.status(200).json({
      message: "Token refreshed",
      token: newAccessToken
    });
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired refresh token"
    });
  }
});
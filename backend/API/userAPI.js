import exp from "express";
import { UserModel } from "../models/userModel";
import {hash , compare} from "bcrypt"
import { verifyToken } from "../middleware/verifyToken";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
const{sign,verify}=jwt
export const userApp=exp.Router()
//registration
userApp.post("/register",async(req,res,next)=>{

})
//login
userApp.post("/login",async(req,res)=>{

})
//logout 
userApp.get("/logout",(req,res)=>{

})
//check-auth
userApp.get("/check-auth",async(req,res)=>{

})
//get profile
userApp.get("/profile",verifyToken,async(req,res)=>{


})
//update profile password
userApp.put("/password",async(req,res)=>{
    const{email,password,newpassword}=req.body
    const user=await UserModel.findOne({email})
    console.log("password:", password);
    console.log("newpassword:", newpassword);
    console.log("user.password:", user?.password);
    if(!user)
        return res.status(404).json({message:"Email not found"})
    const isPassValid=await compare(password,user.password)
    if(!isPassValid)
        return res.status(401).json({message:"Password Invalid"})
    const isSame=await compare(newpassword,user.password)
    if(isSame){
        return res.status(400).json({message:"The password is same as old"})
    }
    const hashed=await hash(newpassword,12)
    const modified=await UserModel.findOneAndUpdate({email:email},{$set:{password:hashed}},{new:true,runValidators:true})
    res.status(200).json({message:"Password updated"})
})



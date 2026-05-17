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
//update profile

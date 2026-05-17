import exp from "express";
import { UserModel } from "../models/userModel";
import {hash , compare} from "bcrypt"
import { verifyToken } from "../middleware/verifyToken";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
const{sign,verify}=jwt
export const userApp=exp.Router()
userApp.post("/register",async(req,res,next)=>{

})
userApp.post("/login",async(req,res)=>{

})
userApp.get("/logout",(req,res)=>{
    
})
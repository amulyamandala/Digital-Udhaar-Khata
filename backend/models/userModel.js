import { Schema,model } from "mongoose";
const userSchema=new Schema({
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Password required"]
    },
    refreshToken:{
        type:String
    }
},{
     timestamps:true,
     versionKey:false,
     strict:"throw"
})
export const UserModel=model("user",userSchema)
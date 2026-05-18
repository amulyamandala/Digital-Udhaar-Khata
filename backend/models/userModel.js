import { Schema,model } from "mongoose";
const userSchema=new Schema({
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    phone:{
        type:Number,
        required:[true,"Phone is required"],
        unique:true
    },
    shopName:{
        type:String,
        required:[true,"Shop name required"],
        unique:true
    },
    language:{
        type:String,
        default:"english"
    },
  subscriptionPlan:{
         type:String,
         enum:["free","premium"]
  },
  createdAt:{
        type:Date,
        default:Date.now
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
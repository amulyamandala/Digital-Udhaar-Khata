import { Schema,model } from "mongoose";
const customerSchema=new Schema({
    shopId:{
        type:Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Shop Id is required"]

    },
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    phone:{
        type:Number,
        required:[true,"Phone is required"]
    },
    address:{
        type:String,
        required:[true,"address is required"]
    },
    familyGroupId:{
        type:Schema.Types.ObjectId
    },
    trustScore:{
        type:String
    },
     totalBalance:{
      type:Number
     },
     notes:{
      type:String
     },
     createdAt:{
        type:Date
     }
})
export const CustomerModel=model("customer",customerSchema)

import { Schema, model } from "mongoose";
const paymentSchema=new Schema(
  {
    customerId: {
      type:Schema.Types.ObjectId,
      ref:"customer",
      required:[true, "Customer ID is required"]
    },

    shopId:{
      type:Schema.Types.ObjectId,
      ref:"user",
      required:[true, "Shop ID is required"]
    },

    amount:{
      type:Number,
      required:[true, "Amount is required"],
      min:[1, "Amount must be greater than 0"]
    },

    paymentLink:{
      type:String,
      required:[true, "Payment link is required"]
    },

    paymentStatus:{
      type:String,
      enum:["PENDING", "SUCCESS", "FAILED"],
      default:"PENDING"
    },

    paymentMethod:{
      type:String,
      enum:["UPI", "CARD", "BANK_TRANSFER", "CASH"],
      default:"UPI"
    },

    transactionId:{
      type:String,
      unique:true
    },

    paidAt:{
      type:Date
    }
  },
  {
    timestamps:true,
    versionKey:false,
    strict:"throw"
  }
);

export const PaymentModel=model("payment", paymentSchema);
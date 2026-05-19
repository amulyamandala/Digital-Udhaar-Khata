import { Schema, model } from "mongoose";
const transactionSchema = new Schema(
  {
    customerId:{
      type:Schema.Types.ObjectId,
      ref:"customer",
      required:[true, "Customer ID is required"]
    },
    shopId:{
      type:Schema.Types.ObjectId,
      ref:"user",
      required:[true, "Shop ID is required"]
    },
    type:{
      type:String,
      enum:["CREDIT", "DEBIT"],
      required:[true, "Transaction type is required"]
    },

    amount:{
      type:Number,
      required:[true, "Amount is required"],
      min:[1, "Amount must be greater than 0"]
    },

    description:{
      type:String,
      trim:true,
      maxlength:[200, "Description too long"]
    },

    paymentMethod: {
      type:String,
      enum:["CASH", "UPI", "BANK_TRANSFER", "CARD"],
      default:"CASH"
    },

    createdBy: {
      type:Schema.Types.ObjectId,
      ref:"user",
      required:[true, "Created by field is required"]
    },

    transactionDate:{
      type:Date,
      default:Date.now
    }
  },
  {
    timestamps:true,
    versionKey:false,
    strict:"throw"
  }
);
export const TransactionModel=model("transaction", transactionSchema);
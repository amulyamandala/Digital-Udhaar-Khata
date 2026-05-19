import { Schema, model } from "mongoose";
const statementSchema=new Schema(
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
    month:{
      type:String,
      required:[true, "Month is required"]
    },
    year:{
      type:Number,
      required:[true, "Year is required"]
    },
    pdfUrl:{
      type: String,
      required: [true, "PDF URL is required"]
    }, 
    totalCredit:{
      type:Number,
      default:0
    },

    totalDebit:{
      type:Number,
      default:0
    },
    closingBalance:{
      type:Number,
      default:0
    },
    generatedAt:{
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

export const StatementModel=model("statement", statementSchema);
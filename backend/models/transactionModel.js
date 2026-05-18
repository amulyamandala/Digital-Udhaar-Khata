import { Schema, model } from "mongoose";
const transactionSchema=new Schema({
  customerId:{
    type:Schema.Types.ObjectId
  },
  shopId:{
    type:Schema.Types.ObjectId
  },
  type:{

  }, // CREDIT or DEBIT
  amount:{

  },
  description:{

  },
  paymentMethod:{

  },
  createdBy:{

  },
  createdAt:{
    
  }

})
export const TransactionModel=model("transaction",transactionSchema)
import { Schema, model } from "mongoose";
const transactionSchema=new Schema({
  customerId:{
    type:Schema.Types.ObjectId
  },
  shopId:{
    type:Schema.Types.ObjectId
  },
  type:{
    

  }, 
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
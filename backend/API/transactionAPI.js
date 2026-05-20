import exp from "express";
import { TransactionModel } from "../models/transactionModel.js";
import { CustomerModel } from "../models/customerModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
export const transactionApp = exp.Router();
// ADD TRANSACTION
transactionApp.post("/",verifyToken,async(req,res)=>{
  try {
    const {customerId,type,amount,description,paymentMethod} = req.body;
    // check customer
    const customer = await CustomerModel.findOne({_id: customerId,shopId: req.user.id});
    if (!customer) {
      return res.status(404).json({message: "Customer not found"});
    }
    // create transaction
    const transaction =
      await TransactionModel.create({customerId,shopId: req.user.id,type,amount,description,paymentMethod,createdBy: req.user.id});
    // update customer balance
    if (type==="CREDIT") {
      customer.totalBalance += amount;
    }
    if (type==="DEBIT") {
      customer.totalBalance -= amount;
    }
    await customer.save();
    res.status(201).json({message: "Transaction added successfully",transaction});
  } catch(err){
    res.status(500).json({message: err.message});
  }
});
// GET TRANSACTIONS OF SINGLE CUSTOMER
transactionApp.get("/customer/:id",verifyToken,async(req,res)=>{
    try {
      const transactions =await TransactionModel.find({customerId: req.params.id,shopId: req.user.id})
          .populate("customerId", "name phone")
          .sort({ createdAt: -1 });
      res.status(200).json(transactions);
    } catch (err) 
    {
      res.status(500).json({message: err.message
      });
    }
  }
);
// GET ALL SHOP TRANSACTIONS
transactionApp.get("/shop/:shopId",verifyToken,async(req,res)=>{
    try {
      // prevent accessing other shop data
      if (req.params.shopId !== req.user.id) {
        return res.status(403).json({message: "Unauthorized access"});
      }
      const transactions =await TransactionModel.find({shopId: req.user.id})
          .populate("customerId", "name phone")
          .sort({ createdAt: -1 });
      res.status(200).json(transactions);
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
// UPDATE TRANSACTION
transactionApp.put("/:id",verifyToken,async(req,res)=>{
    try {
      const transaction =
        await TransactionModel.findOne({_id: req.params.id,shopId: req.user.id});
      if (!transaction) {
        return res.status(404).json({message: "Transaction not found"});
      }
      const updatedTransaction =
        await TransactionModel.findByIdAndUpdate(req.params.id,req.body,{new: true,runValidators: true});
      res.status(200).json({message: "Transaction updated successfully",transaction: updatedTransaction});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
// DELETE TRANSACTION
transactionApp.delete("/:id",verifyToken,async(req,res)=>{
    try {
      const transaction =
        await TransactionModel.findOne({_id: req.params.id,shopId: req.user.id});
      if (!transaction) {
        return res.status(404).json({message: "Transaction not found"});
      }
      // restore customer balance
      const customer =await CustomerModel.findById( transaction.customerId);
      if (transaction.type === "CREDIT") {
        customer.totalBalance -=
          transaction.amount;
      }
      if (transaction.type === "DEBIT") {
        customer.totalBalance +=
          transaction.amount;
      }
      await customer.save();
      // delete transaction
      await TransactionModel.findByIdAndDelete(req.params.id);
      res.status(200).json({message: "Transaction deleted successfully"});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
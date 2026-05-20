import exp from "express";
import { CustomerModel } from "../models/customerModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
export const customerApp = exp.Router();
// ADD CUSTOMER
customerApp.post("/",verifyToken,async(req,res)=>{
  try{
    const{name,phone,address,familyGroupId,notes} = req.body;
    // check existing customer
    const existingCustomer =await CustomerModel.findOne({phone,shopId: req.user.id});
    if (existingCustomer) {
      return res.status(400).json({message: "Customer already exists"});
    }
    // create customer
    const newCustomer=await CustomerModel.create({shopId: req.user.id,name,phone,address,familyGroupId,notes});
    res.status(201).json({message: "Customer added successfully",customer: newCustomer});
  } catch (err){
    res.status(500).json({message: err.message});
  }
});
// GET ALL CUSTOMERS
customerApp.get("/",verifyToken,async(req,res)=>{
  try {
    const customers =await CustomerModel.find({shopId: req.user.id}).sort({ createdAt: -1 });
    res.status(200).json(customers);
  }catch (err) {
    res.status(500).json({message: err.message});
  }
});
// GET SINGLE CUSTOMER
customerApp.get("/:id",verifyToken,async(req,res)=>{
  try{
    const customer=await CustomerModel.findOne({_id: req.params.id,shopId: req.user.id});
    if (!customer) {
        return res.status(404).json({message: "Customer not found"});
    }
    res.status(200).json(customer);
  }catch(err)
  {
    res.status(500).json({message: err.message});
  }
});
// UPDATE CUSTOMER
customerApp.put("/:id",verifyToken,async(req,res)=>{
  try {
    const updatedCustomer =await CustomerModel.findOneAndUpdate({_id: req.params.id,shopId: req.user.id},req.body,{new: true,runValidators: true});
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found"});
    }
    res.status(200).json({message: "Customer updated successfully",customer: updatedCustomer});
  } catch (err){
    res.status(500).json({message: err.message});
  }
});
// DELETE CUSTOMER
customerApp.delete("/:id",verifyToken,async(req,res)=>{
  try {
    const deletedCustomer =await CustomerModel.findOneAndDelete({_id: req.params.id,shopId: req.user.id});
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found"});
    }

    res.status(200).json({message: "Customer deleted successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});
// GET CUSTOMER BALANCE
customerApp.get("/:id/balance",verifyToken,async(req,res)=>{
    try {
      const customer =await CustomerModel.findOne({_id: req.params.id,shopId: req.user.id});
      if (!customer) {
        return res.status(404).json({message: "Customer not found"});
      }
      res.status(200).json({customerName: customer.name,totalBalance: customer.totalBalance,trustScore: customer.trustScore});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
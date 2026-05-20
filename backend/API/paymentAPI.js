import exp from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { verifyToken } from "../middleware/verifyToken.js";
import { PaymentModel } from "../models/paymentModel.js";
import { CustomerModel } from "../models/customerModel.js";
export const paymentApp = exp.Router();
// RAZORPAY CONFIG
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
// CREATE PAYMENT LINK
paymentApp.post("/create-link",verifyToken,async(req,res)=>{
    try {
      const { customerId, amount } = req.body;
      // check customer
      const customer =await CustomerModel.findOne({ _id: customerId, shopId: req.user.id});
      if (!customer) {
        return res.status(404).json({message: "Customer not found"});
      }
      // create payment link
      const paymentLink =await razorpay.paymentLink.create({
        amount: amount * 100,
          currency: "INR",
            customer: {
            name: customer.name,
            contact: customer.phone
          },
          notify: {
            sms: true,
            email: false
          },
          reminder_enable: true,
          callback_url:
            "http://localhost:3000/payment-success",
          callback_method: "get"
        });
      // save payment
      const payment =await PaymentModel.create(
        {customerId: customer._id,
          shopId: req.user.id,
          amount,
          paymentLink: paymentLink.short_url,
          paymentStatus: "PENDING",
          paymentMethod: "UPI",
          transactionId: paymentLink.id
        });

      res.status(201).json({message:"Payment link created successfully",paymentLink:paymentLink.short_url,payment});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
// PAYMENT WEBHOOK
paymentApp.post("/webhook",async(req,res)=>{
    try {
      const secret =process.env.RAZORPAY_WEBHOOK_SECRET;
      const shasum =
        crypto.createHmac(
          "sha256",
          secret
        );
      shasum.update(JSON.stringify(req.body));
      const digest =shasum.digest("hex");
      // verify signature
      if (digest !==req.headers["x-razorpay-signature"]) {
        return res.status(400).json({message: "Invalid signature"});
      }
      const event = req.body.event;
      // payment success
      if (event==="payment_link.paid") 
        {
        const paymentEntity =req.body.payload.payment_link.entity;
        // update payment
        const payment =await PaymentModel.findOne({transactionId:paymentEntity.id});

        if (payment) {
      payment.paymentStatus =
            "SUCCESS";
          payment.paidAt =
            new Date();
          await payment.save();
          // reduce customer balance
          const customer =await CustomerModel.findById(payment.customerId);

          if (customer) {
            customer.totalBalance -=
              payment.amount;

            await customer.save();
          }
        }
      }
      res.status(200).json({status: "ok"});
    } catch (err) {
      res.status(500).json({message: err.message});
    }});
// PAYMENT HISTORY
paymentApp.get("/history",verifyToken,async(req,res)=>{
    try {
      const payments =await PaymentModel.find({shopId: req.user.id})
          .populate(
            "customerId",
            "name phone"
          )
          .sort({ createdAt: -1 });

      res.status(200).json(payments);
    } catch (err) {
      res.status(500).json({message: err.message});
    }});
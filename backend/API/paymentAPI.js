const exp = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { verifyToken  } = require("../middleware/verifyToken.js");
const PaymentModel = require("../models/paymentModel.js");
const CustomerModel = require("../models/customerModel.js");
const TransactionModel = require("../models/transactionModel.js");

const paymentApp = exp.Router();

// RAZORPAY CONFIG
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mocksecret"
});

// CREATE PAYMENT LINK
paymentApp.post("/create-link", verifyToken, async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    
    // check customer
    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Default short url
    let shortUrl = `http://localhost:3000/pay-mock/${customer._id}?amount=${amount}`;
    let razorpayLinkId = "mock-link-" + Date.now();

    // If key credentials exist, execute Razorpay link creation
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const paymentLink = await razorpay.paymentLink.create({
          amount: amount * 100,
          currency: "INR",
          customer: {
            name: customer.name,
            contact: customer.phone
          },
          notify: { sms: true, email: false },
          reminder_enable: true,
          callback_url: `http://localhost:3000/payment-success`,
          callback_method: "get"
        });
        shortUrl = paymentLink.short_url;
        razorpayLinkId = paymentLink.id;
      } catch (razorpayErr) {
        console.error("Razorpay link API call failed, using mock path:", razorpayErr.message);
      }
    }

    // save payment record
    const payment = await PaymentModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      amount,
      paymentLink: shortUrl,
      paymentStatus: "PENDING",
      paymentMethod: "UPI",
      transactionId: razorpayLinkId
    });

    res.status(201).json({ message: "Payment link created successfully", paymentLink: shortUrl, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PAYMENT WEBHOOK (Razorpay callback verification)
paymentApp.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (secret) {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");
      
      if (digest !== req.headers["x-razorpay-signature"]) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    const event = req.body.event;
    if (event === "payment_link.paid") {
      const paymentEntity = req.body.payload.payment_link.entity;
      
      // Find payment record
      const payment = await PaymentModel.findOne({ transactionId: paymentEntity.id });
      if (payment && payment.paymentStatus !== "SUCCESS") {
        payment.paymentStatus = "SUCCESS";
        payment.paidAt = new Date();
        await payment.save();

        // Adjust customer balance
        const customer = await CustomerModel.findById(payment.customerId);
        if (customer) {
          customer.totalBalance -= payment.amount;
          await customer.save();

          // Sync family
          if (customer.familyGroupId) {
            await CustomerModel.updateMany(
              { familyGroupId: customer.familyGroupId, _id: { $ne: customer._id } },
              { $inc: { totalBalance: -payment.amount } }
            );
          }

          // Create ledger entry for this payment
          await TransactionModel.create({
            customerId: customer._id,
            shopId: payment.shopId,
            type: "DEBIT",
            amount: payment.amount,
            description: "Online payment via Razorpay Link",
            paymentMethod: "UPI",
            createdBy: payment.shopId
          });
        }
      }
    }
    res.status(200).json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MOCK PAYMENT GATEWAY SIMULATION (Allows public payments without tokens)
paymentApp.post("/mock-pay", async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    
    if (!customerId || !amount) {
      return res.status(400).json({ message: "Customer ID and amount are required" });
    }

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Reduce customer balance
    customer.totalBalance -= Number(amount);
    await customer.save();

    // Sync family
    if (customer.familyGroupId) {
      await CustomerModel.updateMany(
        { familyGroupId: customer.familyGroupId, _id: { $ne: customer._id } },
        { $inc: { totalBalance: -Number(amount) } }
      );
    }

    // Create DEBIT (payment) transaction record
    const transaction = await TransactionModel.create({
      customerId: customer._id,
      shopId: customer.shopId,
      type: "DEBIT",
      amount: Number(amount),
      description: "Cleared online via simulation terminal",
      paymentMethod: "UPI",
      createdBy: customer.shopId
    });

    // Mark pending payments as success
    await PaymentModel.updateMany(
      { customerId: customer._id, paymentStatus: "PENDING" },
      { $set: { paymentStatus: "SUCCESS", paidAt: new Date() } }
    );

    res.status(200).json({ message: "Payment simulation successful", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PAYMENT HISTORY
paymentApp.get("/history", verifyToken, async (req, res) => {
  try {
    const payments = await PaymentModel.find({ shopId: req.user.id })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = paymentApp;

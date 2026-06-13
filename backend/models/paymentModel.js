const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shop ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be greater than 0"],
    },
    paymentLink: {
      type: String,
      required: [true, "Payment link is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "BANK_TRANSFER", "CASH", "WALLET"],
      default: "UPI",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: Date,
    failureReason: String,
    attemptCount: {
      type: Number,
      default: 1,
    },
    reminderSentCount: {
      type: Number,
      default: 0,
    },
    expiresAt: Date,
    notes: String,
    description: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
paymentSchema.index({ shopId: 1, customerId: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ paymentStatus: 1, expiresAt: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
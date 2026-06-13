const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: [true, "Transaction type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be greater than 0"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description too long"],
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "ONLINE", "CHEQUE"],
      default: "CASH",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by field is required"],
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    referenceNumber: String,
    voiceCommandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoiceCommand",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    category: {
      type: String,
      enum: ["PURCHASE", "PAYMENT", "ADJUSTMENT", "REFUND"],
      default: "PURCHASE",
    },
    notes: String,
    reconciled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
transactionSchema.index({ shopId: 1, customerId: 1, transactionDate: -1 });
transactionSchema.index({ shopId: 1, transactionDate: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
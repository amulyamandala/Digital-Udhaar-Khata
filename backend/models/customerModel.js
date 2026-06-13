const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shop Id is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    email: String,
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: String,
    state: String,
    pincode: String,
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    trustScoreReason: {
      type: String,
      enum: ["green", "yellow", "red"],
      default: "green",
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    totalCredit: {
      type: Number,
      default: 0,
    },
    totalDebit: {
      type: Number,
      default: 0,
    },
    lastTransactionDate: Date,
    lastPaymentDate: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes too long"],
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "te", "ta"],
      default: "en",
    },
    preferredContactMethod: {
      type: String,
      enum: ["SMS", "WHATSAPP", "BOTH"],
      default: "WHATSAPP",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: String,
    photo: String,
    onPaymentReminder: {
      type: Boolean,
      default: true,
    },
    reminderFrequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"],
      default: "WEEKLY",
    },
    repaymentConsistency: Number, // percentage
    delayedPayments: {
      type: Number,
      default: 0,
    },
    paymentFrequency: Number, // number of payments
    customFields: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
customerSchema.index({ shopId: 1, phone: 1 });
customerSchema.index({ shopId: 1, name: "text" });

module.exports = mongoose.model("Customer", customerSchema);
const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reminderType: {
      type: String,
      enum: ["FRIENDLY", "STRONG", "OVERDUE"],
      default: "FRIENDLY",
    },
    channel: {
      type: String,
      enum: ["SMS", "WHATSAPP", "BOTH"],
      default: "WHATSAPP",
    },
    message: String,
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    sentAt: Date,
    failureReason: String,
    nextRetry: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
    scheduledFor: Date,
    language: {
      type: String,
      enum: ["en", "hi", "te", "ta"],
      default: "en",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);

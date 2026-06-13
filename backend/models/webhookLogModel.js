const mongoose = require("mongoose");

const webhookLogSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    source: {
      type: String,
      enum: ["RAZORPAY", "TWILIO", "WHATSAPP"],
      required: true,
    },
    event: String,
    payload: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
    response: mongoose.Schema.Types.Mixed,
    error: String,
    processedAt: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("WebhookLog", webhookLogSchema);

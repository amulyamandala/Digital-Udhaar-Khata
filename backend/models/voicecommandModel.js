const mongoose = require("mongoose");

const voiceCommandSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shop ID is required"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    audioUrl: {
      type: String,
      required: [true, "Audio URL is required"],
    },
    transcript: {
      type: String,
      required: [true, "Transcript is required"],
    },
    parsedData: {
      customerName: String,
      amount: Number,
      type: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
      },
      description: String,
    },
    language: {
      type: String,
      enum: ["en", "hi", "te", "ta"],
      default: "en",
    },
    commandType: {
      type: String,
      enum: ["ADD_CREDIT", "ADD_DEBIT", "CHECK_BALANCE", "ADD_CUSTOMER"],
      default: "ADD_CREDIT",
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
      default: "PENDING",
    },
    confidenceScore: Number,
    error: String,
    processedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("VoiceCommand", voiceCommandSchema);
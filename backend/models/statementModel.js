const mongoose = require("mongoose");

const statementSchema = new mongoose.Schema(
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
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    pdfUrl: String,
    cloudinaryPublicId: String,
    totalCredit: {
      type: Number,
      default: 0,
    },
    totalDebit: {
      type: Number,
      default: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    closingBalance: {
      type: Number,
      default: 0,
    },
    transactionCount: Number,
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    sentVia: {
      type: String,
      enum: ["EMAIL", "SMS", "WHATSAPP", "MANUAL"],
    },
    sentAt: Date,
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
statementSchema.index({ shopId: 1, customerId: 1, year: 1, month: 1 });

module.exports = mongoose.model("Statement", statementSchema);
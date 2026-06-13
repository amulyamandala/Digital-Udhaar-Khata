const mongoose = require("mongoose");

const analyticsLogSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    totalCustomers: Number,
    activeCustomers: Number,
    totalOutstanding: Number,
    totalRecovered: Number,
    monthlyCredit: Number,
    monthlyDebit: Number,
    paymentsReceived: Number,
    remindersRequired: Number,
    trustedCustomers: Number,
    riskCustomers: Number,
    topCustomers: [
      {
        customerId: mongoose.Schema.Types.ObjectId,
        name: String,
        balance: Number,
      },
    ],
    conversionRate: Number,
    averageTransactionValue: Number,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("AnalyticsLog", analyticsLogSchema);

const exp = require("express");
const { verifyToken  } = require("../middleware/verifyToken.js");
const CustomerModel = require("../models/customerModel.js");
const TransactionModel = require("../models/transactionModel.js");
const PaymentModel = require("../models/paymentModel.js");

const analyticsApp = exp.Router();

// UNIFIED DASHBOARD ANALYTICS ENDPOINT
analyticsApp.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const shopId = req.user.id;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 1. Total customers
    const totalCustomers = await CustomerModel.countDocuments({ shopId });

    // 2. Total Outstanding Credit
    const totalOutstandingResult = await CustomerModel.aggregate([
      { $match: { shopId, totalBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$totalBalance" } } }
    ]);
    const totalOutstanding = totalOutstandingResult[0]?.total || 0;

    // 3. Total Recovered (Sum of all DEBIT/Repayment transactions)
    const totalRecoveredResult = await TransactionModel.aggregate([
      { $match: { shopId, type: "DEBIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRecovered = totalRecoveredResult[0]?.total || 0;

    // 4. Monthly transactions count
    const monthlyTransactionsCount = await TransactionModel.countDocuments({
      shopId,
      createdAt: { $gte: startOfMonth }
    });

    // 5. Pending payments link count
    const pendingPaymentsCount = await PaymentModel.countDocuments({
      shopId,
      paymentStatus: "PENDING"
    });

    // 6. Monthly Credit Trend (Jan - Dec)
    const creditTrendResult = await TransactionModel.aggregate([
      {
        $match: {
          shopId,
          type: "CREDIT",
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 7. Monthly Recovery Trend (Jan - Dec)
    const recoveryTrendResult = await TransactionModel.aggregate([
      {
        $match: {
          shopId,
          type: "DEBIT",
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 8. Top Defaulters (Customers with largest outstanding credit)
    const topDefaulters = await CustomerModel.find({ shopId, totalBalance: { $gt: 0 } })
      .sort({ totalBalance: -1 })
      .limit(5)
      .select("name phone totalBalance trustScore");

    // Map aggregates to 12-month format for charts
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = months.map((m, index) => {
      const monthNum = index + 1;
      const creditMatch = creditTrendResult.find(item => item._id === monthNum);
      const recoveryMatch = recoveryTrendResult.find(item => item._id === monthNum);
      return {
        month: m,
        credit: creditMatch ? creditMatch.total : 0,
        recovery: recoveryMatch ? recoveryMatch.total : 0
      };
    });

    res.status(200).json({
      message: "Dashboard analytics fetched successfully",
      summary: {
        totalCustomers,
        totalOutstanding,
        totalRecovered,
        monthlyTransactionsCount,
        pendingPaymentsCount
      },
      chartData,
      topDefaulters
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TOP DEFAULTERS (Individual endpoint)
analyticsApp.get("/top-defaulters", verifyToken, async (req, res) => {
  try {
    const customers = await CustomerModel.find({ shopId: req.user.id })
      .sort({ totalBalance: -1 })
      .limit(10)
      .select("name phone totalBalance trustScore");

    res.status(200).json({
      message: "Top defaulters fetched successfully",
      customers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MONTHLY CREDIT ANALYTICS (Individual endpoint)
analyticsApp.get("/monthly-credit", verifyToken, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyCredit = await TransactionModel.aggregate([
      {
        $match: {
          shopId: req.user.id,
          type: "CREDIT",
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalCredit: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    res.status(200).json({
      message: "Monthly credit analytics fetched successfully",
      monthlyCredit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RECOVERY RATE ANALYTICS (Individual endpoint)
analyticsApp.get("/recovery-rate", verifyToken, async (req, res) => {
  try {
    const totalCredit = await TransactionModel.aggregate([
      { $match: { shopId: req.user.id, type: "CREDIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalDebit = await TransactionModel.aggregate([
      { $match: { shopId: req.user.id, type: "DEBIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const creditAmount = totalCredit[0]?.total || 0;
    const debitAmount = totalDebit[0]?.total || 0;

    let recoveryRate = 0;
    if (creditAmount > 0) {
      recoveryRate = (debitAmount / creditAmount) * 100;
    }

    res.status(200).json({
      message: "Recovery analytics fetched successfully",
      totalCredit: creditAmount,
      totalRecovered: debitAmount,
      recoveryRate: recoveryRate.toFixed(2) + "%"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = analyticsApp;

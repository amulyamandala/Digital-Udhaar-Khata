import exp from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { CustomerModel } from "../models/customerModel.js";
import { TransactionModel } from "../models/transactionModel.js";
export const analyticsApp = exp.Router();

// TOP DEFAULTERS
analyticsApp.get("/top-defaulters",verifyToken,async(req,res)=>{
    try {
      const customers =
        await CustomerModel.find({
          shopId: req.user.id})
          .sort({ totalBalance: -1 })
          .limit(10)
          .select(
            "name phone totalBalance trustScore"
          );

      res.status(200).json({
        message:
          "Top defaulters fetched successfully",

        customers
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// MONTHLY CREDIT ANALYTICS
analyticsApp.get(
  "/monthly-credit",
  verifyToken,
  async (req, res) => {
    try {
      const currentYear =
        new Date().getFullYear();

      const monthlyCredit =
        await TransactionModel.aggregate([
          {
            $match: {
              shopId: req.user.id,
              type: "CREDIT",
              createdAt: {
                $gte: new Date(
                  `${currentYear}-01-01`
                ),
                $lte: new Date(
                  `${currentYear}-12-31`
                )
              }
            }
          },

          {
            $group: {
              _id: {
                month: {
                  $month: "$createdAt"
                }
              },

              totalCredit: {
                $sum: "$amount"
              }
            }
          },

          {
            $sort: {
              "_id.month": 1
            }
          }
        ]);

      res.status(200).json({
        message:
          "Monthly credit analytics fetched successfully",

        monthlyCredit
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// RECOVERY RATE ANALYTICS
analyticsApp.get(
  "/recovery-rate",
  verifyToken,
  async (req, res) => {
    try {
      // total credit
      const totalCredit =
        await TransactionModel.aggregate([
          {
            $match: {
              shopId: req.user.id,
              type: "CREDIT"
            }
          },

          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount"
              }
            }
          }
        ]);

      // total debit / repayments
      const totalDebit =
        await TransactionModel.aggregate([
          {
            $match: {
              shopId: req.user.id,
              type: "DEBIT"
            }
          },

          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount"
              }
            }
          }
        ]);

      const creditAmount =
        totalCredit[0]?.total || 0;

      const debitAmount =
        totalDebit[0]?.total || 0;

      // recovery percentage
      let recoveryRate = 0;

      if (creditAmount > 0) {
        recoveryRate =
          (debitAmount / creditAmount) *
          100;
      }

      res.status(200).json({
        message:
          "Recovery analytics fetched successfully",

        totalCredit: creditAmount,

        totalRecovered:
          debitAmount,

        recoveryRate:
          recoveryRate.toFixed(2) + "%"
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);
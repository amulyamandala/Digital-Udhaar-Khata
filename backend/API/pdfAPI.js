import exp from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { verifyToken } from "../middleware/verifyToken.js";
import { CustomerModel } from "../models/customerModel.js";
import { TransactionModel } from "../models/transactionModel.js";
import { StatementModel } from "../models/statementModel.js";
export const statementApp = exp.Router();
// GENERATE MONTHLY STATEMENT PDF
statementApp.get("/monthly/:customerId",verifyToken,async(req,res)=>{
    try {
      const customerId =req.params.customerId;
      // check customer
      const customer =await CustomerModel.findOne({ _id: customerId,shopId: req.user.id});

      if (!customer) {
        return res.status(404).json({message: "Customer not found"});
      }
      // get current month
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      // get transactions
      const transactions =
        await TransactionModel.find({
          customerId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }).sort({ createdAt: 1 });

      // totals
      let totalCredit = 0;
      let totalDebit = 0;

      transactions.forEach((txn) => {
        if (txn.type === "CREDIT") {
          totalCredit += txn.amount;
        }

        if (txn.type === "DEBIT") {
          totalDebit += txn.amount;
        }
      });

      // create pdf folder
      if (!fs.existsSync("statements")) {
        fs.mkdirSync("statements");
      }

      // pdf filename
      const fileName = `${customer._id}-${Date.now()}.pdf`;

      const filePath = path.join(
        "statements",
        fileName
      );

      // create pdf
      const doc = new PDFDocument();

      doc.pipe(
        fs.createWriteStream(filePath)
      );

      // title
      doc.fontSize(22).text(
        "Monthly Udhaar Statement",
        {
          align: "center"
        }
      );

      doc.moveDown();

      // customer details
      doc.fontSize(14).text(
        `Customer Name: ${customer.name}`
      );

      doc.text(
        `Phone: ${customer.phone}`
      );

      doc.text(
        `Address: ${customer.address}`
      );

      doc.moveDown();

      // transaction list
      doc.fontSize(18).text(
        "Transactions"
      );

      doc.moveDown();

      transactions.forEach((txn) => {
        doc
          .fontSize(12)
          .text(
            `${txn.type} - ₹${txn.amount} - ${txn.createdAt.toDateString()}`
          );
      });

      doc.moveDown();

      // totals
      doc.fontSize(16).text(
        `Total Credit: ₹${totalCredit}`
      );

      doc.text(
        `Total Debit: ₹${totalDebit}`
      );

      doc.text(
        `Closing Balance: ₹${customer.totalBalance}`
      );

      doc.end();

      // save statement in db
      const statement =
        await StatementModel.create({
          customerId: customer._id,
          shopId: req.user.id,
          month:
            startDate.toLocaleString(
              "default",
              {
                month: "long"
              }
            ),
          year: startDate.getFullYear(),
          pdfUrl: filePath,
          totalCredit,
          totalDebit,
          closingBalance:
            customer.totalBalance
        });

      res.status(201).json({
        message:
          "Statement generated successfully",

        statement
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// DOWNLOAD STATEMENT PDF
statementApp.get(
  "/download/:statementId",
  verifyToken,
  async (req, res) => {
    try {
      const statement =
        await StatementModel.findOne({
          _id: req.params.statementId,
          shopId: req.user.id
        });

      if (!statement) {
        return res.status(404).json({
          message: "Statement not found"
        });
      }

      // check file exists
      if (
        !fs.existsSync(statement.pdfUrl)
      ) {
        return res.status(404).json({
          message: "PDF file not found"
        });
      }

      res.download(statement.pdfUrl);
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);
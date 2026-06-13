const exp = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { verifyToken  } = require("../middleware/verifyToken.js");
const { CustomerModel  } = require("../models/customerModel.js");
const { TransactionModel  } = require("../models/transactionModel.js");
const { StatementModel  } = require("../models/statementModel.js");
const { UserModel  } = require("../models/userModel.js");
const cloudinary = require("../config/cloudinary.js");

const statementApp = exp.Router();

// Helper to upload local file to Cloudinary
const uploadFileToCloudinary = (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { resource_type: "raw", folder: "kirana_statements", access_mode: "public" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

// GENERATE MONTHLY STATEMENT PDF
statementApp.post("/monthly/:customerId", verifyToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { month, year } = req.body; // allow generating for specific month/year

    // check customer
    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "Kirana Store";

    // Setup date filter for statement
    const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth(); // 0-indexed
    const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // get transactions
    const transactions = await TransactionModel.find({
      customerId,
      shopId: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate }
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

    // create statements folder locally for temp file
    if (!fs.existsSync("statements")) {
      fs.mkdirSync("statements");
    }

    // local temp pdf path
    const fileName = `${customer._id}-${Date.now()}.pdf`;
    const filePath = path.join("statements", fileName);

    // generate pdf using PDFKit
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // shop header
    doc.fillColor("#4f46e5").fontSize(26).text(shopName.toUpperCase(), { align: "center" });
    doc.fillColor("#4b5563").fontSize(10).text("Digital credit ledger statement", { align: "center" });
    doc.moveDown();
    doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Customer & Period summary
    doc.fillColor("#1f2937").fontSize(12).text(`Customer Details:`, { underline: true });
    doc.fontSize(10).text(`Name: ${customer.name}`);
    doc.text(`Phone: +91 ${customer.phone}`);
    doc.text(`Address: ${customer.address}`);
    
    doc.moveUp(4);
    
    doc.text(`Statement Period:`, 250, doc.y, { underline: true });
    const monthName = startDate.toLocaleString("default", { month: "long" });
    doc.text(`Month: ${monthName} ${targetYear}`, 250, doc.y);
    doc.text(`Generated On: ${new Date().toLocaleDateString("en-IN")}`, 250, doc.y);
    
    // reset indentation
    doc.text("", 50, doc.y + 20);
    doc.moveDown();

    // Draw transaction table headers
    doc.fillColor("#374151").fontSize(11).text("Date", 50, doc.y, { bold: true });
    doc.text("Type", 150, doc.y, { bold: true });
    doc.text("Description", 250, doc.y, { bold: true });
    doc.text("Amount (INR)", 450, doc.y, { align: "right", bold: true });
    doc.moveDown(0.5);
    doc.strokeColor("#d1d5db").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Draw transaction rows
    doc.fillColor("#4b5563").fontSize(10);
    transactions.forEach((txn) => {
      const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN");
      const currentY = doc.y;
      
      doc.text(dateStr, 50, currentY);
      doc.text(txn.type, 150, currentY);
      doc.text(txn.description || "N/A", 250, currentY, { width: 180 });
      doc.text(`₹ ${txn.amount.toFixed(2)}`, 450, currentY, { align: "right" });
      doc.moveDown();
    });

    doc.moveDown();
    doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Draw Totals section
    doc.fillColor("#1f2937").fontSize(11);
    doc.text(`Total Credit (Udhaar):`, 250, doc.y);
    doc.text(`₹ ${totalCredit.toFixed(2)}`, 450, doc.y, { align: "right" });
    doc.moveDown();

    doc.text(`Total Recovery (Jama):`, 250, doc.y);
    doc.text(`₹ ${totalDebit.toFixed(2)}`, 450, doc.y, { align: "right" });
    doc.moveDown();

    doc.fontSize(13).fillColor("#ef4444").text(`Closing Outstanding Balance:`, 250, doc.y, { bold: true });
    doc.text(`₹ ${customer.totalBalance.toFixed(2)}`, 450, doc.y, { align: "right", bold: true });

    doc.end();

    // Wait for file writing to finish
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload to Cloudinary
    const cloudinaryResult = await uploadFileToCloudinary(filePath);
    const secureUrl = cloudinaryResult.secure_url;

    // Delete local temp file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete temp local PDF file:", err.message);
    }

    // Save statement metadata in database
    const statement = await StatementModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      month: monthName,
      year: targetYear,
      pdfUrl: secureUrl,
      totalCredit,
      totalDebit,
      closingBalance: customer.totalBalance
    });

    res.status(201).json({ message: "Statement generated successfully", statement });
  } catch (err) {
    console.error("Statement generation failed:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET STATEMENTS HISTORY FOR A CUSTOMER
statementApp.get("/customer/:customerId", verifyToken, async (req, res) => {
  try {
    const statements = await StatementModel.find({
      customerId: req.params.customerId,
      shopId: req.user.id
    }).sort({ createdAt: -1 });
    res.status(200).json(statements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DOWNLOAD STATEMENT (Redirects to Cloudinary URL or downloads locally)
statementApp.get("/download/:statementId", verifyToken, async (req, res) => {
  try {
    const statement = await StatementModel.findOne({
      _id: req.params.statementId,
      shopId: req.user.id
    });

    if (!statement) {
      return res.status(404).json({ message: "Statement not found" });
    }

    if (statement.pdfUrl.startsWith("http")) {
      // Direct redirect to Cloudinary remote file URL
      return res.redirect(statement.pdfUrl);
    }

    // Fallback if locally stored
    if (!fs.existsSync(statement.pdfUrl)) {
      return res.status(404).json({ message: "PDF file not found" });
    }
    res.download(statement.pdfUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = statementApp;

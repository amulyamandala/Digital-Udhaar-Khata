const exp = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { verifyToken } = require("../middleware/verifyToken.js");
const CustomerModel = require("../models/customerModel.js");
const TransactionModel = require("../models/transactionModel.js");
const UserModel = require("../models/userModel.js");

const statementApp = exp.Router();

// ── Helper: build the PDF into a buffer ──────────────────────────────────────
const buildStatementPDF = (customer, shop, transactions, targetMonth, targetYear) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const shopName = shop ? shop.shopName : "Kirana Store";
    const shopAddress = shop ? shop.shopAddress || "" : "";
    const monthName = new Date(targetYear, targetMonth, 1).toLocaleString("default", {
      month: "long",
    });

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill("#4f46e5");
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(shopName.toUpperCase(), 50, 22, { align: "center" });
    doc
      .fillColor("#c7d2fe")
      .fontSize(10)
      .font("Helvetica")
      .text("Digital Credit Ledger Statement", 50, 50, { align: "center" });
    if (shopAddress) {
      doc
        .fillColor("#e0e7ff")
        .fontSize(9)
        .text(shopAddress, 50, 64, { align: "center" });
    }

    doc.y = 110;

    // ── Customer + Period Info ────────────────────────────────────────────────
    doc.roundedRect(50, doc.y, 240, 95, 6).fill("#f0fdf4").stroke("#bbf7d0");
    doc
      .fillColor("#166534")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Customer Details", 62, doc.y - 90);
    doc
      .fillColor("#374151")
      .fontSize(10)
      .font("Helvetica")
      .text(`Name:  ${customer.name}`, 62, doc.y - 75)
      .text(`Phone: +91 ${customer.phone}`, 62, doc.y - 60)
      .text(`Address: ${customer.address || "—"}`, 62, doc.y - 45, { width: 215 });

    const periodBoxX = 310;
    doc.roundedRect(periodBoxX, 110, 235, 95, 6).fill("#eff6ff").stroke("#bfdbfe");
    doc
      .fillColor("#1e40af")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Statement Period", periodBoxX + 12, 120);
    doc
      .fillColor("#374151")
      .fontSize(10)
      .font("Helvetica")
      .text(`Month: ${monthName} ${targetYear}`, periodBoxX + 12, 135)
      .text(
        `Generated: ${new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        periodBoxX + 12,
        150
      )
      .text(
        `Transactions: ${transactions.length}`,
        periodBoxX + 12,
        165
      );

    doc.y = 225;
    doc.moveDown(0.5);

    // ── Table Header ─────────────────────────────────────────────────────────
    const col = { date: 50, type: 140, desc: 240, amount: 430 };
    doc.rect(50, doc.y, 495, 22).fill("#4f46e5");
    doc
      .fillColor("#ffffff")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("DATE", col.date + 5, doc.y - 16)
      .text("TYPE", col.type + 5, doc.y - 16)
      .text("DESCRIPTION", col.desc + 5, doc.y - 16)
      .text("AMOUNT (₹)", col.amount, doc.y - 16, { width: 65, align: "right" });

    doc.y += 6;

    // ── Transaction Rows ──────────────────────────────────────────────────────
    doc.font("Helvetica").fontSize(9);
    let rowBg = false;

    if (transactions.length === 0) {
      doc
        .fillColor("#6b7280")
        .text("No transactions recorded for this period.", 50, doc.y + 10, {
          align: "center",
          width: 495,
        });
      doc.y += 30;
    } else {
      transactions.forEach((txn) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }
        const rowY = doc.y;
        if (rowBg) doc.rect(50, rowY, 495, 18).fill("#f9fafb");
        rowBg = !rowBg;

        const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN");
        const isCredit = txn.type === "CREDIT";
        const typeLabel = isCredit ? "Credit (Udhaar)" : "Payment (Jama)";
        const amtColor = isCredit ? "#dc2626" : "#16a34a";

        doc
          .fillColor("#374151")
          .text(dateStr, col.date + 5, rowY + 4)
          .text(typeLabel, col.type + 5, rowY + 4)
          .text(txn.description || "—", col.desc + 5, rowY + 4, { width: 175 });

        doc.fillColor(amtColor).text(
          `${isCredit ? "-" : "+"}₹${txn.amount.toFixed(2)}`,
          col.amount,
          rowY + 4,
          { width: 65, align: "right" }
        );

        doc.y = rowY + 18;
      });
    }

    // ── Summary Footer ────────────────────────────────────────────────────────
    doc.moveDown();
    let totalCredit = 0;
    let totalDebit = 0;
    transactions.forEach((t) => {
      if (t.type === "CREDIT") totalCredit += t.amount;
      else totalDebit += t.amount;
    });

    const summaryY = Math.min(doc.y + 10, 710);
    doc.rect(50, summaryY, 495, 70).fill("#fafafa").stroke("#e5e7eb");

    doc
      .fillColor("#374151")
      .fontSize(10)
      .font("Helvetica")
      .text(`Total Credit Given (Udhaar):`, 60, summaryY + 12)
      .fillColor("#dc2626")
      .font("Helvetica-Bold")
      .text(`₹${totalCredit.toFixed(2)}`, 400, summaryY + 12, {
        width: 130,
        align: "right",
      });

    doc
      .fillColor("#374151")
      .font("Helvetica")
      .text(`Total Payments Received (Jama):`, 60, summaryY + 28)
      .fillColor("#16a34a")
      .font("Helvetica-Bold")
      .text(`₹${totalDebit.toFixed(2)}`, 400, summaryY + 28, {
        width: 130,
        align: "right",
      });

    // Outstanding balance highlight
    doc.rect(50, summaryY + 48, 495, 22).fill("#fef2f2").stroke("#fca5a5");
    doc
      .fillColor("#991b1b")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`Outstanding Balance:`, 60, summaryY + 53)
      .text(`₹${customer.totalBalance.toFixed(2)}`, 400, summaryY + 53, {
        width: 130,
        align: "right",
      });

    // ── Footer note ───────────────────────────────────────────────────────────
    doc
      .fillColor("#9ca3af")
      .fontSize(8)
      .font("Helvetica")
      .text(
        "This is a computer-generated statement. For queries, contact the shop directly.",
        50,
        doc.page.height - 40,
        { align: "center", width: 495 }
      );

    doc.end();
  });

// ── STREAM PDF DIRECTLY TO BROWSER (no Cloudinary) ──────────────────────────
// GET /api/statements/download/:customerId?month=5&year=2026
statementApp.get("/download/:customerId", verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const month =
      req.query.month !== undefined
        ? parseInt(req.query.month)
        : new Date().getMonth(); // 0-indexed
    const year =
      req.query.year !== undefined
        ? parseInt(req.query.year)
        : new Date().getFullYear();

    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopId: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const transactions = await TransactionModel.find({
      customerId,
      shopId: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: 1 });

    const pdfBuffer = await buildStatementPDF(
      customer,
      shop,
      transactions,
      month,
      year
    );

    const monthName = new Date(year, month, 1).toLocaleString("default", {
      month: "long",
    });
    const filename = `${customer.name.replace(/\s+/g, "_")}_${monthName}_${year}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF stream error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── ALL MONTHS FULL STATEMENT (all transactions) ─────────────────────────────
// GET /api/statements/download-all/:customerId
statementApp.get("/download-all/:customerId", verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopId: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);
    const transactions = await TransactionModel.find({
      customerId,
      shopId: req.user.id,
    }).sort({ createdAt: 1 });

    const now = new Date();
    const pdfBuffer = await buildStatementPDF(
      customer,
      shop,
      transactions,
      now.getMonth(),
      now.getFullYear()
    );

    const filename = `${customer.name.replace(/\s+/g, "_")}_Full_Statement.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF full statement error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = statementApp;

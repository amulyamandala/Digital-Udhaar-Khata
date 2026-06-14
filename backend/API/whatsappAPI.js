const exp = require("express");
const twilio = require("twilio");
const UserModel = require("../models/userModel.js");
const CustomerModel = require("../models/customerModel.js");
const TransactionModel = require("../models/transactionModel.js");
const ReminderModel = require("../models/remainderModel.js");
const { verifyToken } = require("../middleware/verifyToken.js");

const whatsappApp = exp.Router();

// ── Twilio client ──────────────────────────────────────────────────────────────
const hasTwilio = () =>
  !!(process.env.TWILIO_SID &&
     process.env.TWILIO_AUTH_TOKEN &&
     process.env.TWILIO_WHATSAPP_NUMBER);

const client = twilio(
  process.env.TWILIO_SID || "ACmock",
  process.env.TWILIO_AUTH_TOKEN || "mocktoken"
);

// Helper: send a WhatsApp message via Twilio
const sendWhatsApp = async (toPhone, body) => {
  if (!hasTwilio()) {
    console.log(`[DEV WhatsApp] → +91${toPhone}: ${body}`);
    return { sid: "dev-mock-sid-" + Date.now(), status: "SENT" };
  }
  try {
    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${toPhone}`,
      body,
    });
    return { sid: msg.sid, status: "SENT" };
  } catch (err) {
    console.error("Twilio WhatsApp error:", err.message);
    return { sid: null, status: "FAILED", error: err.message };
  }
};

// ── SEND WHATSAPP PAYMENT REMINDER ────────────────────────────────────────────
// POST /api/whatsapp/send-reminder
// Body: { customerId, message? }
whatsappApp.post("/send-reminder", verifyToken, async (req, res) => {
  try {
    const { customerId, message } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopId: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if ((customer.totalBalance || 0) <= 0) {
      return res
        .status(400)
        .json({ message: "Customer has no outstanding balance" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "the store";

    const finalMessage =
      message ||
      `Hello ${customer.name}, you have an outstanding balance of ₹${customer.totalBalance} at *${shopName}*. Kindly clear your dues at your earliest convenience. Thank you! 🙏`;

    const result = await sendWhatsApp(customer.phone, finalMessage);

    // Log to DB
    await ReminderModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      reminderType: "WHATSAPP",
      message: finalMessage,
      dueAmount: customer.totalBalance,
      status: result.status,
    });

    if (result.status === "FAILED") {
      return res.status(500).json({
        message: "Failed to send WhatsApp message",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "WhatsApp reminder sent successfully",
      sid: result.sid,
      sentTo: customer.phone,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── SEND MONTHLY STATEMENT VIA WHATSAPP ───────────────────────────────────────
// POST /api/whatsapp/send-statement
// Body: { customerId }
whatsappApp.post("/send-statement", verifyToken, async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopId: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "Kirana Store";

    // Last 10 transactions
    const transactions = await TransactionModel.find({
      customerId: customer._id,
      shopId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    let statement = `📒 *Ledger Statement — ${shopName}*\n`;
    statement += `👤 Customer: *${customer.name}*\n`;
    statement += `📅 Date: ${new Date().toLocaleDateString("en-IN")}\n\n`;

    if (transactions.length === 0) {
      statement += `_No transactions recorded yet._\n`;
    } else {
      statement += `*Recent Transactions:*\n`;
      transactions.forEach((txn) => {
        const d = new Date(txn.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        const label = txn.type === "CREDIT" ? "Udhaar 📤" : "Jama 📥";
        statement += `• ${d}: ${label} ₹${txn.amount}\n`;
      });
    }

    statement += `\n💰 *Outstanding Balance: ₹${customer.totalBalance}*`;

    const result = await sendWhatsApp(customer.phone, statement);

    await ReminderModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      reminderType: "WHATSAPP",
      message: statement,
      dueAmount: Math.max(customer.totalBalance, 1),
      status: result.status,
    });

    if (result.status === "FAILED") {
      return res.status(500).json({
        message: "Failed to send WhatsApp statement",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Statement sent via WhatsApp successfully",
      sid: result.sid,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── BULK WHATSAPP REMINDERS ───────────────────────────────────────────────────
// POST /api/whatsapp/bulk-remind
// Body: { customerIds: string[], message? }
whatsappApp.post("/bulk-remind", verifyToken, async (req, res) => {
  try {
    const { customerIds, message } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: "Array of customer IDs is required" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "the store";

    const results = [];

    for (const customerId of customerIds) {
      try {
        const customer = await CustomerModel.findOne({
          _id: customerId,
          shopId: req.user.id,
        });

        if (!customer || (customer.totalBalance || 0) <= 0) {
          results.push({ customerId, status: "SKIPPED" });
          continue;
        }

        const msg =
          message ||
          `Hello ${customer.name}, you have an outstanding balance of ₹${customer.totalBalance} at *${shopName}*. Please clear your dues. Thank you!`;

        const result = await sendWhatsApp(customer.phone, msg);

        await ReminderModel.create({
          customerId: customer._id,
          shopId: req.user.id,
          reminderType: "WHATSAPP",
          message: msg,
          dueAmount: customer.totalBalance,
          status: result.status,
        });

        results.push({
          customerId,
          customerName: customer.name,
          status: result.status,
        });
      } catch (err) {
        results.push({ customerId, status: "FAILED", error: err.message });
      }
    }

    res.status(200).json({ message: "Bulk reminders processed", results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── WHATSAPP WEBHOOK (incoming messages) ─────────────────────────────────────
whatsappApp.post("/webhook/whatsapp", async (req, res) => {
  try {
    const incomingMessage = req.body.Body?.trim();
    const sender = req.body.From?.replace("whatsapp:", "").trim();

    if (!incomingMessage || !sender) {
      return res.status(400).send("No message or sender");
    }

    const rawPhone = sender.startsWith("+91") ? sender.replace("+91", "") : sender;

    // Is sender a shopkeeper?
    const shopkeeper = await UserModel.findOne({ phone: rawPhone });
    if (shopkeeper) {
      return res.status(200).send(
        `Welcome, ${shopkeeper.name}! Use the Udhaar Khata app to manage your ledger.`
      );
    }

    // Is sender a customer?
    const customer = await CustomerModel.findOne({ phone: rawPhone });
    if (customer) {
      const shop = await UserModel.findById(customer.shopId);
      const shopName = shop ? shop.shopName : "Kirana Store";
      const clean = incomingMessage.toLowerCase();

      if (clean.includes("balance") || clean.includes("dues")) {
        return res.status(200).send(
          `Hello ${customer.name},\nYour outstanding balance at *${shopName}* is ₹${customer.totalBalance}.\nThank you!`
        );
      }

      if (clean.includes("history") || clean.includes("ledger")) {
        const txns = await TransactionModel.find({ customerId: customer._id })
          .sort({ createdAt: -1 })
          .limit(5);

        let reply = `*Last ${txns.length} transactions at ${shopName}:*\n`;
        txns.forEach((t) => {
          const d = new Date(t.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short",
          });
          reply += `• ${d}: ${t.type === "CREDIT" ? "Udhaar" : "Paid"} ₹${t.amount}\n`;
        });
        reply += `\n*Outstanding: ₹${customer.totalBalance}*`;
        return res.status(200).send(reply);
      }

      return res.status(200).send(
        `Hello ${customer.name}! Welcome to *${shopName}* Digital Khata.\n\nReply:\n• *BALANCE* — check dues\n• *HISTORY* — view transactions`
      );
    }

    res.status(200).send(
      "Welcome to Udhaar Khata. Phone not registered. Contact your store owner."
    );
  } catch (err) {
    console.error("WhatsApp webhook error:", err.message);
    res.status(200).send("An error occurred. Please try again.");
  }
});

module.exports = whatsappApp;

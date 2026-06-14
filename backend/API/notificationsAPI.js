const exp = require("express");
const twilio = require("twilio");
const OpenAI = require("openai");
const { verifyToken  } = require("../middleware/verifyToken.js");
const CustomerModel = require("../models/customerModel.js");
const UserModel = require("../models/userModel.js");
const ReminderModel = require("../models/remainderModel.js"); // named remainderModel.js in files

const notificationApp = exp.Router();

const client = twilio(
  process.env.TWILIO_SID || "ACmock",
  process.env.TWILIO_AUTH_TOKEN || "mocktoken"
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-openai-key"
});

// Helper to check Twilio setup
const hasTwilio = () => !!(process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN);

// SEND SMS REMINDER
notificationApp.post("/send-sms", verifyToken, async (req, res) => {
  try {
    const { customerId, message } = req.body;
    
    if (!customerId || !message) {
      return res.status(400).json({ message: "Customer ID and message are required" });
    }

    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let twilioSid = "mock-sms-sid-" + Date.now();
    let status = "SENT";

    if (hasTwilio()) {
      try {
        const sms = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${customer.phone}`
        });
        twilioSid = sms.sid;
      } catch (err) {
        console.error("Twilio SMS failed, falling back to log:", err.message);
        status = "FAILED";
      }
    } else {
      console.log(`[DEV MODE] SMS to +91${customer.phone}: ${message}`);
    }

    // Record reminder log in DB
    await ReminderModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      reminderType: "SMS",
      message,
      dueAmount: customer.totalBalance || 1,
      status
    });

    res.status(200).json({ message: "SMS reminder sent successfully", sid: twilioSid, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND WHATSAPP REMINDER
notificationApp.post("/send-whatsapp", verifyToken, async (req, res) => {
  try {
    const { customerId, message } = req.body;
    
    if (!customerId || !message) {
      return res.status(400).json({ message: "Customer ID and message are required" });
    }

    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let twilioSid = "mock-whatsapp-sid-" + Date.now();
    let status = "SENT";

    if (hasTwilio() && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const whatsapp = await client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:+91${customer.phone}`
        });
        twilioSid = whatsapp.sid;
      } catch (err) {
        console.error("Twilio WhatsApp failed, falling back to log:", err.message);
        status = "FAILED";
      }
    } else {
      console.log(`[DEV MODE] WhatsApp to +91${customer.phone}: ${message}`);
    }

    // Record reminder log in DB
    await ReminderModel.create({
      customerId: customer._id,
      shopId: req.user.id,
      reminderType: "WHATSAPP",
      message,
      dueAmount: customer.totalBalance || 1,
      status
    });

    res.status(200).json({ message: "WhatsApp reminder sent successfully", sid: twilioSid, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GENERATE AI PAYMENTS RECOVERY REMINDER
notificationApp.post("/ai-reminder", verifyToken, async (req, res) => {
  try {
    const { customerId, tone, language, paymentLink } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "Kirana Store";

    const targetTone = tone || "friendly"; // friendly, strong, overdue
    const targetLang = language || customer.language || shop.language || "english"; // english, hindi, telugu, tamil
    const linkStr = paymentLink || `[Payment Link]`;

    // Instruct OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an expert payment recovery assistant for Kirana stores.
Write a short payment reminder text message in ${targetLang}.
The customer owes outstanding credit to the shop.

Tone guidelines:
- friendly: Extremely polite, appreciative of relationship, gentle suggestion.
- strong: Professional, firm, asking to clear balance to maintain credit facility.
- overdue: Urgent, stating balance is highly overdue, warning of immediate action or block on further credit.

Requirements:
1. Customer Name: ${customer.name}
2. Shop Name: ${shopName}
3. Pending Amount: ₹${customer.totalBalance}
4. Must include placeholder for payment link exactly as: ${linkStr}
5. Keep it short, direct, and under 160 characters (perfect for SMS).
6. Return ONLY the raw reminder message text. Do not add any intros, wrappers, or quotes.
`
        },
        {
          role: "user",
          content: `Generate a ${targetTone} payment reminder.`
        }
      ]
    });

    const generatedMessage = completion.choices[0].message.content.trim();

    res.status(200).json({
      message: "AI reminder generated successfully",
      tone: targetTone,
      language: targetLang,
      reminderText: generatedMessage
    });
  } catch (err) {
    console.error("AI Reminder generation failed:", err.message);
    // Fallback static message in case OpenAI fails
    try {
      const customer = await CustomerModel.findById(req.body.customerId);
      const shop = await UserModel.findById(req.user.id);
      const name = customer ? customer.name : "Customer";
      const bal = customer ? customer.totalBalance : 0;
      const shopName = shop ? shop.shopName : "Store";
      const link = req.body.paymentLink || "[Payment Link]";
      res.status(200).json({
        message: "Fallback reminder generated",
        reminderText: `Hello ${name}, your outstanding credit at ${shopName} is ₹${bal}. Please repay using link: ${link}. Thank you.`
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: err.message });
    }
  }
});

// BULK SEND REMINDERS
notificationApp.post("/bulk", verifyToken, async (req, res) => {
  try {
    const { customerIds, reminderType, messages } = req.body; // array of IDs, type: SMS or WHATSAPP, messages: object/string
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: "Array of Customer IDs is required" });
    }

    const type = reminderType || "SMS";
    const results = [];

    for (const customerId of customerIds) {
      try {
        const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
        if (!customer) {
          results.push({ customerId, status: "SKIPPED", error: "Customer not found" });
          continue;
        }

        const msgText = (messages && messages[customerId]) || 
          `Dear ${customer.name}, please clear your outstanding credit of ₹${customer.totalBalance}. Thank you.`;

        let status = "SENT";
        if (hasTwilio()) {
          try {
            if (type === "SMS") {
              await client.messages.create({
                body: msgText,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${customer.phone}`
              });
            } else if (type === "WHATSAPP" && process.env.TWILIO_WHATSAPP_NUMBER) {
              await client.messages.create({
                body: msgText,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:+91${customer.phone}`
              });
            }
          } catch (e) {
            status = "FAILED";
          }
        } else {
          console.log(`[DEV MODE BULK] ${type} to +91${customer.phone}: ${msgText}`);
        }

        // Record
        await ReminderModel.create({
          customerId: customer._id,
          shopId: req.user.id,
          reminderType: type,
          message: msgText,
          dueAmount: customer.totalBalance || 1,
          status
        });

        results.push({ customerId, customerName: customer.name, status });
      } catch (err) {
        results.push({ customerId, status: "FAILED", error: err.message });
      }
    }

    res.status(200).json({ message: "Bulk reminders processed", results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = notificationApp;

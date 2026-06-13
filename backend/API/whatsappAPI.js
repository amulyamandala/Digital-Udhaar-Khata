const exp = require("express");
const twilio = require("twilio");
const OpenAI = require("openai");
const Razorpay = require("razorpay");
const { UserModel  } = require("../models/userModel.js");
const { CustomerModel  } = require("../models/customerModel.js");
const { TransactionModel  } = require("../models/transactionModel.js");
const { PaymentModel  } = require("../models/paymentModel.js");
const { verifyToken  } = require("../middleware/verifyToken.js");

const whatsappApp = exp.Router();

const client = twilio(
  process.env.TWILIO_SID || "ACmock",
  process.env.TWILIO_AUTH_TOKEN || "mocktoken"
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-openai-key"
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mocksecret"
});

// Helper to generate a Razorpay payment link on the fly
const generateQuickPaymentLink = async (customer, amount, shop) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return `http://localhost:3000/pay-mock/${customer._id}?amount=${amount}`;
  }
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      customer: {
        name: customer.name,
        contact: customer.phone
      },
      notify: { sms: true, email: false },
      reminder_enable: false,
      callback_url: "http://localhost:3000/payment-success",
      callback_method: "get"
    });
    
    // Save record
    await PaymentModel.create({
      customerId: customer._id,
      shopId: shop._id,
      amount,
      paymentLink: paymentLink.short_url,
      paymentStatus: "PENDING",
      paymentMethod: "UPI",
      transactionId: paymentLink.id
    });

    return paymentLink.short_url;
  } catch (err) {
    console.error("Razorpay link creation failed in chatbot:", err.message);
    return `http://localhost:3000/pay-mock/${customer._id}?amount=${amount}`;
  }
};

// WEBHOOK FOR INCOMING WHATSAPP MESSAGES (Twilio Webhook)
whatsappApp.post("/webhook/whatsapp", async (req, res) => {
  try {
    const incomingMessage = req.body.Body?.trim();
    const sender = req.body.From?.replace("whatsapp:", "").trim(); // E.g., +919999999999
    
    if (!incomingMessage || !sender) {
      return res.status(400).send("No message or sender specified");
    }

    // Extract number without country code for DB matching (assuming Indian +91 numbers)
    const rawPhone = sender.startsWith("+91") ? sender.replace("+91", "") : sender;

    // 1. Check if sender is a Shopkeeper
    const shopkeeper = await UserModel.findOne({ phone: Number(rawPhone) });
    
    if (shopkeeper) {
      // Shopkeeper Mode: Parse message via AI to create a transaction
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are an AI assistant for a Kirana Store Credit Ledger system.
Analyze the message from a shopkeeper and extract the details.
The message is a quick text entry like "Ravi 500 udhaar" or "Ramesh 200 jama".

Extract:
1. customerName (string)
2. amount (number)
3. transactionType ("CREDIT" | "DEBIT")
   - "udhaar", "credit", "उधार" mean CREDIT.
   - "jama", "debit", "received", "paid", "जमा" mean DEBIT.

Return a JSON object only:
{
  "customerName": string | null,
  "amount": number | null,
  "transactionType": "CREDIT" | "DEBIT" | null
}
`
          },
          {
            role: "user",
            content: incomingMessage
          }
        ]
      });

      const parsedData = JSON.parse(completion.choices[0].message.content);
      
      if (!parsedData.customerName || !parsedData.amount || !parsedData.transactionType) {
        return res.status(200).send(`Could not understand the entry. Please write in format: [Customer Name] [Amount] [udhaar/jama]. Example: "Ravi 500 udhaar"`);
      }

      // Find customer in this shopkeeper's shop
      const customer = await CustomerModel.findOne({
        name: { $regex: new RegExp("^" + parsedData.customerName + "$", "i") },
        shopId: shopkeeper._id
      });

      if (!customer) {
        return res.status(200).send(`Customer "${parsedData.customerName}" not found in your Udhaar Khata ledger.`);
      }

      // Create transaction
      const transaction = await TransactionModel.create({
        customerId: customer._id,
        shopId: shopkeeper._id,
        type: parsedData.transactionType,
        amount: parsedData.amount,
        description: "Recorded via WhatsApp Chatbot",
        paymentMethod: "CASH",
        createdBy: shopkeeper._id
      });

      // Update balance
      const amountChange = transaction.type === "CREDIT" ? transaction.amount : -transaction.amount;
      customer.totalBalance += amountChange;
      await customer.save();

      // Sync family
      if (customer.familyGroupId) {
        await CustomerModel.updateMany(
          { familyGroupId: customer.familyGroupId, _id: { $ne: customer._id } },
          { $inc: { totalBalance: amountChange } }
        );
      }

      return res.status(200).send(`✅ Recorded: ₹${parsedData.amount} ${transaction.type === "CREDIT" ? "Udhaar (Credit)" : "Jama (Repayment)"} for *${customer.name}*.\nNew outstanding balance: ₹${customer.totalBalance}.`);
    }

    // 2. Check if sender is a Customer
    const customer = await CustomerModel.findOne({ phone: rawPhone });
    
    if (customer) {
      const shop = await UserModel.findById(customer.shopId);
      const shopNameStr = shop ? shop.shopName : "Kirana Store";

      const cleanMsg = incomingMessage.toLowerCase();
      
      // Balance inquiry
      if (cleanMsg.includes("balance") || cleanMsg.includes("dues") || cleanMsg.includes("amount")) {
        if (customer.totalBalance <= 0) {
          return res.status(200).send(`Hello ${customer.name},\nYou have no outstanding dues with *${shopNameStr}*. Your current balance is ₹${customer.totalBalance}.\nThank you!`);
        }
        
        // Generate a dynamic Razorpay link
        const paymentLink = await generateQuickPaymentLink(customer, customer.totalBalance, shop);

        return res.status(200).send(`Hello ${customer.name},\nYour outstanding credit balance with *${shopNameStr}* is *₹${customer.totalBalance}*.\n\nYou can clear your dues instantly using this payment link:\n${paymentLink}\n\nThank you!`);
      }

      // History inquiry
      if (cleanMsg.includes("history") || cleanMsg.includes("ledger") || cleanMsg.includes("transactions")) {
        const transactions = await TransactionModel.find({ customerId: customer._id })
          .sort({ createdAt: -1 })
          .limit(5);

        if (transactions.length === 0) {
          return res.status(200).send(`Hello ${customer.name},\nNo transactions recorded yet in your ledger with *${shopNameStr}*.`);
        }

        let reply = `*Last 5 Transactions at ${shopNameStr}:*\n`;
        transactions.forEach((txn) => {
          const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          reply += `• ${dateStr}: ${txn.type === "CREDIT" ? "Bought" : "Paid"} ₹${txn.amount}\n`;
        });
        
        reply += `\n*Outstanding Balance: ₹${customer.totalBalance}*`;
        return res.status(200).send(reply);
      }

      // Default menu for customer
      return res.status(200).send(`Hello ${customer.name},\nWelcome to *${shopNameStr}* Digital Khata.\n\nReply with:\n1. *BALANCE* - Check your outstanding credit & pay online\n2. *HISTORY* - View your last 5 transactions`);
    }

    // 3. Sender is neither shopkeeper nor customer
    res.status(200).send(`Welcome to Udhaar Khata Chatbot. We couldn't recognize this phone number. Please contact your local Kirana store owner to register your ledger.`);
  } catch (err) {
    console.error("WhatsApp webhook error:", err.message);
    res.status(200).send("An error occurred. Please try again later.");
  }
});

// SEND PAYMENT REMINDER
whatsappApp.post("/send-reminder", verifyToken, async (req, res) => {
  try {
    const { customerId, message } = req.body;
    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const finalMessage = message || `Hello ${customer.name}, your pending balance is ₹${customer.totalBalance}. Please clear your dues. Thank you.`;

    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+91${customer.phone}`,
        body: finalMessage
      });
    } else {
      console.log(`[DEV MODE] WhatsApp reminder to +91${customer.phone}: ${finalMessage}`);
    }

    res.status(200).json({ message: "Reminder sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND MONTHLY STATEMENT
whatsappApp.post("/send-statement", verifyToken, async (req, res) => {
  try {
    const { customerId, statementId } = req.body;
    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const shop = await UserModel.findById(req.user.id);
    const shopName = shop ? shop.shopName : "Kirana Store";

    const transactions = await TransactionModel.find({ customerId: customer._id }).sort({ createdAt: -1 });

    let statement = `*Monthly Ledger Statement for ${customer.name}*\nShop: *${shopName}*\n\n`;
    transactions.forEach((txn) => {
      const dateStr = new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      statement += `${dateStr}: ${txn.type} - ₹${txn.amount}\n`;
    });
    statement += `\n*Outstanding Balance: ₹${customer.totalBalance}*`;

    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+91${customer.phone}`,
        body: statement
      });
    } else {
      console.log(`[DEV MODE] WhatsApp statement to +91${customer.phone}:\n${statement}`);
    }

    res.status(200).json({ message: "Statement sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = whatsappApp;

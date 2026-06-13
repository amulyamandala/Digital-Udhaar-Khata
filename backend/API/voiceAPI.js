const exp = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { verifyToken  } = require("../middleware/verifyToken.js");
const { CustomerModel  } = require("../models/customerModel.js");
const { TransactionModel  } = require("../models/transactionModel.js");

const voiceApp = exp.Router();

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-openai-key"
});

// Configure Multer Storage for audio recording uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname + (path.extname(file.originalname) ? "" : ".webm"));
  }
});
const upload = multer({ storage });

// UPLOAD AUDIO (Upload-only endpoint)
voiceApp.post("/upload", verifyToken, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file required" });
    }
    res.status(200).json({ message: "Audio uploaded successfully", file: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PARSE VOICE COMMANDS & TRANSACTIONS
voiceApp.post("/parse", verifyToken, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file required" });
    }

    const audioPath = req.file.path;

    // 1. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });
    
    const transcript = transcription.text;
    console.log("Transcribed text:", transcript);

    // Clean up uploaded file
    try {
      fs.unlinkSync(audioPath);
    } catch (fsErr) {
      console.error("Temp file cleanup failed:", fsErr.message);
    }

    // 2. Parse text with GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Analyze the user's spoken command (which might be in English, Hindi, Telugu, or Tamil).
Determine the intent of the command. The intent can be one of:
1. CREATE_TRANSACTION: User wants to record a credit (udhaar) or repayment (jama).
   - Look for terms like: "udhaar", "credit", "उधार", "दिए" for CREDIT.
   - Look for terms like: "jama", "debit", "received", "paid", "जमा", "मिले" for DEBIT.
2. VIEW_PROFILE: User wants to open a customer's profile (e.g. "open Ravi", "Ravi ledger").
3. CHECK_BALANCE: User wants to see what a customer owes (e.g. "what is Ravi's balance", "Ravi balance check").
4. NAVIGATE_DASHBOARD: User wants to go to home/dashboard (e.g. "go home", "dashboard page").
5. ADD_CUSTOMER: User wants to register a new customer (e.g. "add customer", "create new user").
6. UNKNOWN: Any other query.

Return a JSON object with:
{
  "intent": "CREATE_TRANSACTION" | "VIEW_PROFILE" | "CHECK_BALANCE" | "NAVIGATE_DASHBOARD" | "ADD_CUSTOMER" | "UNKNOWN",
  "customerName": "Ravi" (or null if not mentioned or not clear),
  "amount": number (or null if not mentioned),
  "transactionType": "CREDIT" | "DEBIT" (or null)
}
`
        },
        {
          role: "user",
          content: transcript
        }
      ]
    });

    const parsedData = JSON.parse(completion.choices[0].message.content);
    console.log("Parsed data from GPT:", parsedData);

    // 3. Process Intent
    if (parsedData.intent === "CREATE_TRANSACTION" && parsedData.customerName && parsedData.amount) {
      // Find customer
      const customer = await CustomerModel.findOne({
        name: { $regex: new RegExp("^" + parsedData.customerName + "$", "i") },
        shopId: req.user.id
      });

      if (!customer) {
        // Find close matches if exact not found
        const closeMatch = await CustomerModel.findOne({
          name: { $regex: parsedData.customerName, $options: "i" },
          shopId: req.user.id
        });

        if (closeMatch) {
          return res.status(200).json({
            status: "NEED_CONFIRMATION",
            transcript,
            parsedData: {
              ...parsedData,
              customerName: closeMatch.name,
              customerId: closeMatch._id
            },
            message: `Did you mean ${closeMatch.name}?`
          });
        }

        return res.status(200).json({
          status: "NOT_FOUND",
          transcript,
          parsedData,
          message: `Customer "${parsedData.customerName}" not found.`
        });
      }

      // Create transaction automatically
      const transaction = await TransactionModel.create({
        customerId: customer._id,
        shopId: req.user.id,
        type: parsedData.transactionType || "CREDIT",
        amount: parsedData.amount,
        description: "Recorded via Voice",
        paymentMethod: "CASH",
        createdBy: req.user.id
      });

      // Update customer balance
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

      // Recalculate trust score
      // We will perform trust score update in the background
      CustomerModel.findOne({ _id: customer._id }).then(async (c) => {
        if (!c) return;
        const txns = await TransactionModel.find({ customerId: c._id, shopId: req.user.id }).sort({ createdAt: -1 });
        let balancePenalty = c.totalBalance > 10000 ? 25 : c.totalBalance > 5000 ? 15 : c.totalBalance > 2000 ? 5 : 0;
        let delayPenalty = 0;
        const credits = txns.filter(t => t.type === "CREDIT");
        if (credits.length > 0) {
          const ageDays = (Date.now() - new Date(credits[credits.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24);
          delayPenalty = ageDays > 60 ? 50 : ageDays > 30 ? 30 : ageDays > 15 ? 15 : 0;
        }
        const finalScore = Math.max(0, Math.min(100, 100 - balancePenalty - delayPenalty));
        c.trustScore = Math.round(finalScore);
        await c.save();
        if (c.familyGroupId) {
          await CustomerModel.updateMany({ familyGroupId: c.familyGroupId }, { trustScore: c.trustScore });
        }
      }).catch(err => console.error("Trust score update failed:", err));

      return res.status(201).json({
        status: "SUCCESS",
        transcript,
        parsedData: {
          ...parsedData,
          customerId: customer._id
        },
        transaction,
        message: `Successfully recorded ₹${parsedData.amount} ${transaction.type === "CREDIT" ? "udhaar" : "repayment"} for ${customer.name}.`
      });
    }

    // For other intents, return parsed info so the React frontend can navigate or act
    if (parsedData.customerName) {
      const customer = await CustomerModel.findOne({
        name: { $regex: parsedData.customerName, $options: "i" },
        shopId: req.user.id
      });
      if (customer) {
        parsedData.customerId = customer._id;
        parsedData.customerName = customer.name;
      }
    }

    res.status(200).json({
      status: "NAVIGATE",
      transcript,
      parsedData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = voiceApp;

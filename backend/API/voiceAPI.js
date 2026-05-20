import exp from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

import { verifyToken } from "../middleware/verifyToken.js";
import { CustomerModel } from "../models/customerModel.js";
import { TransactionModel } from "../models/transactionModel.js";

export const voiceApp = exp.Router();
// OPENAI CONFIG
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// MULTER STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  }
});

const upload = multer({ storage });


// UPLOAD AUDIO
voiceApp.post(
  "/upload",
  verifyToken,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Audio file required"
        });
      }

      res.status(200).json({
        message: "Audio uploaded successfully",
        file: req.file.filename
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// PARSE VOICE TO TRANSACTION
voiceApp.post(
  "/parse",
  verifyToken,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Audio file required"
        });
      }

      // audio path
      const audioPath = req.file.path;

      // speech to text
      const transcription =
        await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: "whisper-1"
        });

      const transcript =
        transcription.text;

      // example:
      // "Ravi 500 udhaar"

      // AI parsing prompt
      const completion =
        await openai.chat.completions.create({
          model: "gpt-4.1-mini",

          messages: [
            {
              role: "system",
              content: `
Extract:
1. customerName
2. amount
3. transactionType

transactionType can only be:
CREDIT or DEBIT

Return only JSON.
`
            },

            {
              role: "user",
              content: transcript
            }
          ]
        });

      // parsed AI response
      const parsedText =
        completion.choices[0].message.content;

      const parsedData =
        JSON.parse(parsedText);

      // find customer
      const customer =
        await CustomerModel.findOne({
          name: {
            $regex: parsedData.customerName,
            $options: "i"
          },
          shopId: req.user.id
        });

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found"
        });
      }

      // create transaction
      const transaction =
        await TransactionModel.create({
          customerId: customer._id,
          shopId: req.user.id,
          type: parsedData.transactionType,
          amount: parsedData.amount,
          description: "Voice transaction",
          paymentMethod: "CASH",
          createdBy: req.user.id
        });

      // update balance
      if (
        parsedData.transactionType ===
        "CREDIT"
      ) {
        customer.totalBalance +=
          parsedData.amount;
      }

      if (
        parsedData.transactionType ===
        "DEBIT"
      ) {
        customer.totalBalance -=
          parsedData.amount;
      }

      await customer.save();

      res.status(201).json({
        message:
          "Voice transaction added successfully",

        transcript,

        parsedData,

        transaction
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);
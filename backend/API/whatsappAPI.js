import exp from "express";
import twilio from "twilio";
import { CustomerModel } from "../models/customerModel.js";
import { TransactionModel } from "../models/transactionModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
export const whatsappApp = exp.Router();
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
// WEBHOOK FOR INCOMING WHATSAPP MESSAGES
whatsappApp.post("/webhook/whatsapp",async(req,res)=>{
    try {
      const incomingMessage =req.body.Body?.toLowerCase();

      const sender =req.body.From?.replace("whatsapp:","");

      // find customer
      const customer =await CustomerModel.findOne({phone: sender});

      if (!customer) {
        return res.status(404).send("Customer not found");
      }

      // balance enquiry
      if (incomingMessage.includes("balance")) {
        return res.status(200).send(`Your current balance is ₹${customer.totalBalance}`);
      }

      // transaction history
      if (incomingMessage.includes("history")) {
        const transactions =await TransactionModel.find({customerId: customer._id})
            .sort({ createdAt: -1 })
            .limit(5);

        let message ="Last 5 Transactions:\n";
        transactions.forEach((txn) => {message += `${txn.type} - ₹${txn.amount}`;});

        return res.status(200).send(message);
      }

      res.status(200).send(`
Send:
1. BALANCE
2. HISTORY
      `);
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);


// SEND PAYMENT REMINDER
whatsappApp.post("/send-reminder",verifyToken,async(req,res)=>{
    try {
      const { customerId } = req.body;

      const customer =await CustomerModel.findOne({_id: customerId,shopId: req.user.id});

      if (!customer) {
        return res.status(404).json({message: "Customer not found"});
      }

      const message = `
Hello ${customer.name},

Your pending balance is ₹${customer.totalBalance}.

Please clear your dues.

Thank you.
      `;

      // send whatsapp message
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+91${customer.phone}`,
        body: message
      });

      res.status(200).json({message:"Reminder sent successfully"});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);


// SEND MONTHLY STATEMENT
whatsappApp.post("/send-statement",verifyToken,async(req,res)=>{
    try {
      const { customerId } = req.body;

      const customer =await CustomerModel.findOne({_id: customerId,shopId: req.user.id});

      if (!customer) {
        return res.status(404).json({message: "Customer not found"});
      }

      const transactions =await TransactionModel.find({customerId: customer._id}).sort({ createdAt: -1 });

      let statement = `
Monthly Statement for ${customer.name}

`;

      transactions.forEach((txn) => {
        statement += `
${txn.type} - ₹${txn.amount}
`;
      });

      statement += `

Total Balance: ₹${customer.totalBalance}
`;

      // send whatsapp message
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+91${customer.phone}`,
        body: statement
      });

      res.status(200).json({message:"Statement sent successfully"});
    } catch (err) {
      res.status(500).json({message: err.message});
    }
  }
);
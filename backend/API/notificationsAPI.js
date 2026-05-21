import exp from "express";
import twilio from "twilio";

import { verifyToken } from "../middleware/verifyToken.js";

import { CustomerModel } from "../models/customerModel.js";

export const notificationApp = exp.Router();


// TWILIO CONFIG
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);


// SEND SMS
notificationApp.post(
  "/send-sms",
  verifyToken,
  async (req, res) => {
    try {
      const {
        customerId,
        message
      } = req.body;

      // check customer
      const customer =
        await CustomerModel.findOne({
          _id: customerId,
          shopId: req.user.id
        });

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found"
        });
      }

      // send sms
      const sms =
        await client.messages.create({
          body: message,

          from:
            process.env.TWILIO_PHONE_NUMBER,

          to: `+91${customer.phone}`
        });

      res.status(200).json({
        message:
          "SMS sent successfully",

        sid: sms.sid
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// SEND WHATSAPP MESSAGE
notificationApp.post(
  "/send-whatsapp",
  verifyToken,
  async (req, res) => {
    try {
      const {
        customerId,
        message
      } = req.body;

      // check customer
      const customer =
        await CustomerModel.findOne({
          _id: customerId,
          shopId: req.user.id
        });

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found"
        });
      }

      // send whatsapp message
      const whatsapp =
        await client.messages.create({
          body: message,

          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,

          to: `whatsapp:+91${customer.phone}`
        });

      res.status(200).json({
        message:
          "WhatsApp message sent successfully",

        sid: whatsapp.sid
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);
import exp from 'express'
import { connect } from 'mongoose'
import { config } from 'dotenv'
import cookieParser from "cookie-parser"
import cors from 'cors'
import fs from 'fs'
import path from 'path'

import { authApp } from './API/authAPI.js'
import { customerApp } from './API/customerAPI.js'
import { transactionApp } from './API/transactionAPI.js'
import { analyticsApp } from './API/analyticsAPI.js'
import { notificationApp } from './API/notificationsAPI.js'
import { statementApp } from './API/pdfAPI.js'
import { paymentApp } from './API/paymentAPI.js'
import { voiceApp } from './API/voiceAPI.js'
import { whatsappApp } from './API/whatsappAPI.js'

config()

// Create required directories if they don't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
if (!fs.existsSync("statements")) {
  fs.mkdirSync("statements");
}

const app = exp()

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}))

app.use(exp.json())
app.use(exp.urlencoded({ extended: true }))
app.use(cookieParser())

// Serve uploads and statements statically
app.use("/uploads", exp.static("uploads"))
app.use("/statements-files", exp.static("statements"))

// Routes
app.use("/auth", authApp)
app.use("/customers", customerApp)
app.use("/transactions", transactionApp)
app.use("/analytics", analyticsApp)
app.use("/notifications", notificationApp)
app.use("/statements", statementApp)
app.use("/payments", paymentApp)
app.use("/voice", voiceApp)
app.use("/whatsapp", whatsappApp)

const port = process.env.PORT || 5000

const connectionDb = async () => {
  try {
    await connect(process.env.DB_URL);
    console.log("Connected to MongoDB database");
    app.listen(port, () => console.log(`Server started on port ${port}`))
  } catch (err) {
    console.error("Database connection failed:", err.message)
    process.exit(1)
  }
}
connectionDb()

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Invalid path" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err.message)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: "Validation failed", errors: err.errors })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: "Invalid ID format" })
  }
  
  res.status(500).json({ message: err.message || "Internal server error" })
})

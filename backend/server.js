const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

// Create required directories if they don't exist
const directories = ["uploads", "statements"];
directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Import routes
const authAPI = require("./API/authAPI");
const customerAPI = require("./API/customerAPI_new");
const transactionAPI = require("./API/transactionAPI");
const paymentAPI = require("./API/paymentAPI");
const notificationsAPI = require("./API/notificationsAPI");
const voiceAPI = require("./API/voiceAPI");
const analyticsAPI = require("./API/analyticsAPI");
const whatsappAPI = require("./API/whatsappAPI");
const statementsAPI = require("./API/pdfAPI");

const app = express();

// Security & Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Static Files
app.use("/uploads", express.static("uploads"));
app.use("/statements", express.static("statements"));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URL || "mongodb://localhost:27017/udhaar-khata", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB Connected");
  } catch (err) {
    console.error("✗ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

// API Routes
app.use("/api/auth", authAPI);
app.use("/api/customers", customerAPI);
app.use("/api/transactions", transactionAPI);
app.use("/api/payments", paymentAPI);
app.use("/api/notifications", notificationsAPI);
app.use("/api/statements", statementsAPI);
app.use("/api/voice", voiceAPI);
app.use("/api/analytics", analyticsAPI);
app.use("/api/whatsapp", whatsappAPI);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Udhaar Khata Server is running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Status
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    version: "1.0.0",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n✓ Udhaar Khata Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  URL: http://localhost:${PORT}\n`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("\n✓ SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    console.log("✓ Server closed");
    await mongoose.connection.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  });
});

module.exports = app;

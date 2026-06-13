const express = require("express");
const Customer = require("../models/customerModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

// GET PUBLIC CUSTOMER INFO (for payment pages)
router.get("/public/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const shop = await User.findById(customer.shopId).select("shopName");
    res.status(200).json({
      name: customer.name,
      totalBalance: customer.totalBalance,
      shopName: shop ? shop.shopName : "Kirana Store",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL CUSTOMERS
router.get("/", verifyToken, async (req, res) => {
  try {
    const { search, sortBy = "name", order = "asc", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { shopId: req.user.id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    let sortObj = {};
    sortObj[sortBy] = order === "desc" ? -1 : 1;

    const customers = await Customer.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      customers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE CUSTOMER
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      notes,
      preferredLanguage,
      preferredContactMethod,
      onPaymentReminder,
      reminderFrequency,
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: "Name, phone, and address are required" });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      shopId: req.user.id,
      phone,
    });

    if (existingCustomer) {
      return res.status(409).json({ message: "Customer with this phone already exists" });
    }

    const customer = await Customer.create({
      shopId: req.user.id,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      notes,
      preferredLanguage: preferredLanguage || "en",
      preferredContactMethod: preferredContactMethod || "WHATSAPP",
      onPaymentReminder: onPaymentReminder !== false,
      reminderFrequency: reminderFrequency || "WEEKLY",
      trustScore: 100,
      trustScoreReason: "green",
    });

    // Update shop stats
    const user = await User.findById(req.user.id);
    user.totalCustomers = (user.totalCustomers || 0) + 1;
    await user.save();

    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE CUSTOMER
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.id,
    }).populate("familyGroupId");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Get recent transactions
    const transactions = await Transaction.find({
      customerId: customer._id,
    })
      .sort({ transactionDate: -1 })
      .limit(20);

    res.status(200).json({ customer, recentTransactions: transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE CUSTOMER
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      notes,
      preferredLanguage,
      preferredContactMethod,
      isBlocked,
      blockReason,
      onPaymentReminder,
      reminderFrequency,
    } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (city) customer.city = city;
    if (state) customer.state = state;
    if (pincode) customer.pincode = pincode;
    if (notes) customer.notes = notes;
    if (preferredLanguage) customer.preferredLanguage = preferredLanguage;
    if (preferredContactMethod) customer.preferredContactMethod = preferredContactMethod;
    if (isBlocked !== undefined) customer.isBlocked = isBlocked;
    if (blockReason) customer.blockReason = blockReason;
    if (onPaymentReminder !== undefined) customer.onPaymentReminder = onPaymentReminder;
    if (reminderFrequency) customer.reminderFrequency = reminderFrequency;

    await customer.save();

    res.status(200).json({ message: "Customer updated successfully", customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE CUSTOMER
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Delete associated transactions
    await Transaction.deleteMany({ customerId: customer._id });

    // Update shop stats
    const user = await User.findById(req.user.id);
    user.totalCustomers = Math.max(0, (user.totalCustomers || 1) - 1);
    await user.save();

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CUSTOMER STATS & BALANCE
router.get("/:id/stats", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const transactions = await Transaction.find({
      customerId: customer._id,
    });

    const monthlyTransactions = await Transaction.aggregate([
      { $match: { customerId: customer._id } },
      {
        $group: {
          _id: {
            month: { $month: "$transactionDate" },
            year: { $year: "$transactionDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json({
      totalTransactions: transactions.length,
      totalCredit: transactions
        .filter((t) => t.type === "CREDIT")
        .reduce((sum, t) => sum + t.amount, 0),
      totalDebit: transactions
        .filter((t) => t.type === "DEBIT")
        .reduce((sum, t) => sum + t.amount, 0),
      currentBalance: customer.totalBalance,
      lastTransaction: transactions[0]?.transactionDate || null,
      trustScore: customer.trustScore,
      trustReason: customer.trustScoreReason,
      monthlyActivity: monthlyTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEARCH CUSTOMERS
router.post("/search/query", verifyToken, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const customers = await Customer.find(
      {
        shopId: req.user.id,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { phone: { $regex: query, $options: "i" } },
          { address: { $regex: query, $options: "i" } },
        ],
      },
      { name: 1, phone: 1, totalBalance: 1, _id: 1, trustScoreReason: 1 }
    ).limit(10);

    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CUSTOMER LEDGER
router.get("/:id/ledger", verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    let matchStage = { customerId: require("mongoose").Types.ObjectId(req.params.id) };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      matchStage.transactionDate = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(matchStage)
      .sort({ transactionDate: -1 })
      .populate("createdBy", "name");

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
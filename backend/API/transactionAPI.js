const exp = require("express");
const { TransactionModel  } = require("../models/transactionModel.js");
const { CustomerModel  } = require("../models/customerModel.js");
const { verifyToken  } = require("../middleware/verifyToken.js");

const transactionApp = exp.Router();

// Helper to sync family balance
const syncFamilyBalance = async (customer, amountChange) => {
  if (customer.familyGroupId) {
    // Update all family members in the same group (except the current one, which is saved separately)
    await CustomerModel.updateMany(
      { familyGroupId: customer.familyGroupId, _id: { $ne: customer._id } },
      { $inc: { totalBalance: amountChange } }
    );
  }
};

// Helper to calculate and update trust score
async function calculateAndUpdateTrustScore(customerId, shopId) {
  const customer = await CustomerModel.findOne({ _id: customerId, shopId });
  if (!customer) return;

  if (customer.totalBalance <= 0) {
    customer.trustScore = 100;
    await customer.save();
    if (customer.familyGroupId) {
      await CustomerModel.updateMany(
        { familyGroupId: customer.familyGroupId },
        { trustScore: 100 }
      );
    }
    return;
  }

  // Get all transactions for this customer
  const txns = await TransactionModel.find({ customerId, shopId }).sort({ createdAt: -1 });
  
  let balancePenalty = 0;
  if (customer.totalBalance > 10000) balancePenalty = 25;
  else if (customer.totalBalance > 5000) balancePenalty = 15;
  else if (customer.totalBalance > 2000) balancePenalty = 5;

  let delayPenalty = 0;
  const credits = txns.filter(t => t.type === "CREDIT");
  if (credits.length > 0) {
    const oldestCredit = credits[credits.length - 1]; // sorted by createdAt: -1, so last is oldest
    const ageDays = (Date.now() - new Date(oldestCredit.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 60) delayPenalty = 50;
    else if (ageDays > 30) delayPenalty = 30;
    else if (ageDays > 15) delayPenalty = 15;
  }

  let repaymentReward = 0;
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDebits = txns.filter(t => t.type === "DEBIT" && t.createdAt >= lastMonth);
  repaymentReward = Math.min(20, recentDebits.length * 5);

  let frequencyReward = 0;
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTxns = txns.filter(t => t.createdAt >= lastWeek);
  if (recentTxns.length > 0) frequencyReward = 5;

  const finalScore = Math.max(0, Math.min(100, 100 - balancePenalty - delayPenalty + repaymentReward + frequencyReward));
  customer.trustScore = Math.round(finalScore);
  await customer.save();

  // Sync trust score across family members
  if (customer.familyGroupId) {
    await CustomerModel.updateMany(
      { familyGroupId: customer.familyGroupId },
      { trustScore: customer.trustScore }
    );
  }
}

// ADD TRANSACTION
transactionApp.post("/", verifyToken, async (req, res) => {
  try {
    const { customerId, type, amount, description, paymentMethod } = req.body;
    
    if (!customerId || !type || !amount) {
      return res.status(400).json({ message: "Customer ID, type, and amount are required" });
    }

    // check customer
    const customer = await CustomerModel.findOne({ _id: customerId, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // create transaction
    const transaction = await TransactionModel.create({
      customerId,
      shopId: req.user.id,
      type,
      amount,
      description: description || "",
      paymentMethod: paymentMethod || "CASH",
      createdBy: req.user.id
    });

    // update customer balance
    const amountChange = type === "CREDIT" ? amount : -amount;
    customer.totalBalance += amountChange;
    await customer.save();

    // sync family balance
    await syncFamilyBalance(customer, amountChange);

    // update trust score
    await calculateAndUpdateTrustScore(customerId, req.user.id);

    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET TRANSACTIONS OF SINGLE CUSTOMER
transactionApp.get("/customer/:id", verifyToken, async (req, res) => {
  try {
    const transactions = await TransactionModel.find({ customerId: req.params.id, shopId: req.user.id })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL SHOP TRANSACTIONS
transactionApp.get("/shop/:shopId", verifyToken, async (req, res) => {
  try {
    if (req.params.shopId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    const transactions = await TransactionModel.find({ shopId: req.user.id })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE TRANSACTION
transactionApp.put("/:id", verifyToken, async (req, res) => {
  try {
    const { amount, type, description, paymentMethod } = req.body;
    const transaction = await TransactionModel.findOne({ _id: req.params.id, shopId: req.user.id });
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const customer = await CustomerModel.findById(transaction.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer associated with transaction not found" });
    }

    // Calculate balance diff
    const oldChange = transaction.type === "CREDIT" ? -transaction.amount : transaction.amount;
    let newChange = 0;
    const finalType = type || transaction.type;
    const finalAmount = amount !== undefined ? amount : transaction.amount;
    
    if (finalType === "CREDIT") {
      newChange = finalAmount;
    } else {
      newChange = -finalAmount;
    }

    const netBalanceChange = oldChange + newChange;

    // Save updated transaction
    transaction.amount = finalAmount;
    transaction.type = finalType;
    if (description !== undefined) transaction.description = description;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
    await transaction.save();

    // Update customer and family balance
    customer.totalBalance += netBalanceChange;
    await customer.save();
    await syncFamilyBalance(customer, netBalanceChange);

    // Recalculate trust score
    await calculateAndUpdateTrustScore(customer._id, req.user.id);

    res.status(200).json({ message: "Transaction updated successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE TRANSACTION
transactionApp.delete("/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await TransactionModel.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // restore customer balance
    const customer = await CustomerModel.findById(transaction.customerId);
    if (customer) {
      const restoreChange = transaction.type === "CREDIT" ? -transaction.amount : transaction.amount;
      customer.totalBalance += restoreChange;
      await customer.save();
      await syncFamilyBalance(customer, restoreChange);
    }

    // delete transaction
    await TransactionModel.findByIdAndDelete(req.params.id);

    // update trust score
    if (customer) {
      await calculateAndUpdateTrustScore(customer._id, req.user.id);
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = transactionApp;

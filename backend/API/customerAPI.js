const exp = require("express");
const { CustomerModel  } = require("../models/customerModel.js");
const { TransactionModel  } = require("../models/transactionModel.js");
const { UserModel  } = require("../models/userModel.js");
const { verifyToken  } = require("../middleware/verifyToken.js");

const customerApp = exp.Router();

// GET PUBLIC CUSTOMER INFO (No auth token required for payment link page)
customerApp.get("/public/:id", async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const shop = await UserModel.findById(customer.shopId).select("shopName");
    res.status(200).json({
      name: customer.name,
      totalBalance: customer.totalBalance,
      shopName: shop ? shop.shopName : "Kirana Store"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD CUSTOMER
customerApp.post("/", verifyToken, async (req, res) => {
  try {
    const { name, phone, address, notes, linkCustomerId } = req.body;
    
    if (!name || !phone || !address) {
      return res.status(400).json({ message: "Name, phone, and address are required" });
    }

    // check existing customer
    const existingCustomer = await CustomerModel.findOne({ phone, shopId: req.user.id });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer with this phone number already exists in your shop" });
    }

    let familyGroupId = undefined;
    let initialBalance = 0;

    // Handle Family Khata linking
    if (linkCustomerId) {
      const parentCustomer = await CustomerModel.findOne({ _id: linkCustomerId, shopId: req.user.id });
      if (parentCustomer) {
        if (!parentCustomer.familyGroupId) {
          parentCustomer.familyGroupId = parentCustomer._id;
          await parentCustomer.save();
        }
        familyGroupId = parentCustomer.familyGroupId;
        initialBalance = parentCustomer.totalBalance; // share same balance
      }
    }

    // create customer
    const newCustomer = await CustomerModel.create({
      shopId: req.user.id,
      name,
      phone,
      address,
      familyGroupId,
      totalBalance: initialBalance,
      notes: notes || ""
    });

    res.status(201).json({ message: "Customer added successfully", customer: newCustomer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL CUSTOMERS (WITH OPTIONAL SEARCH)
customerApp.get("/", verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { shopId: req.user.id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await CustomerModel.find(query).sort({ updatedAt: -1 });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET FAMILY MEMBERS FOR A GROUP
customerApp.get("/family/:familyGroupId", verifyToken, async (req, res) => {
  try {
    const members = await CustomerModel.find({
      familyGroupId: req.params.familyGroupId,
      shopId: req.user.id
    }).sort({ name: 1 });
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE CUSTOMER
customerApp.get("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await CustomerModel.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE CUSTOMER
customerApp.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, phone, address, notes, linkCustomerId, unlinkFamily } = req.body;
    const customer = await CustomerModel.findOne({ _id: req.params.id, shopId: req.user.id });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (notes !== undefined) customer.notes = notes;

    // Handle family changes
    if (unlinkFamily) {
      customer.familyGroupId = undefined;
    } else if (linkCustomerId) {
      const parentCustomer = await CustomerModel.findOne({ _id: linkCustomerId, shopId: req.user.id });
      if (parentCustomer) {
        if (!parentCustomer.familyGroupId) {
          parentCustomer.familyGroupId = parentCustomer._id;
          await parentCustomer.save();
        }
        customer.familyGroupId = parentCustomer.familyGroupId;
        customer.totalBalance = parentCustomer.totalBalance; // sync outstanding balance
      }
    }

    await customer.save();
    res.status(200).json({ message: "Customer updated successfully", customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE CUSTOMER
customerApp.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Check customer exists
    const customer = await CustomerModel.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Delete customer transactions
    await TransactionModel.deleteMany({ customerId: req.params.id, shopId: req.user.id });

    // Delete customer
    await CustomerModel.findOneAndDelete({ _id: req.params.id, shopId: req.user.id });

    res.status(200).json({ message: "Customer and their ledger deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET CUSTOMER BALANCE
customerApp.get("/:id/balance", verifyToken, async (req, res) => {
  try {
    const customer = await CustomerModel.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({
      customerName: customer.name,
      totalBalance: customer.totalBalance,
      trustScore: customer.trustScore
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = customerApp;

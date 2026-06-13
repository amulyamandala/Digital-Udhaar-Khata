const mongoose = require("mongoose");

const familyGroupSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    members: [
      {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
        name: String,
        relationship: String,
      },
    ],
    totalBalance: {
      type: Number,
      default: 0,
    },
    creditLimit: Number,
    notes: String,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("FamilyGroup", familyGroupSchema);

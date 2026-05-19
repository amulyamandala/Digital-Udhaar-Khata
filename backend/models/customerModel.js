import { Schema, model } from "mongoose";

const customerSchema= new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Shop Id is required"]
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true
    },

    familyGroupId: {
      type: Schema.Types.ObjectId
    },

    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },

    totalBalance: {
      type: Number,
      default: 0
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes too long"]
    }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw"
  }
);

export const CustomerModel = model("customer", customerSchema);
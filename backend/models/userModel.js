const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
    },
    shopName: {
      type: String,
      required: [true, "Shop name required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    language: {
      type: String,
      enum: ["en", "hi", "te", "ta"],
      default: "en",
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    subscriptionExpiry: Date,
    refreshToken: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    profilePicture: String,
    shopQRCodeUrl: String,
    shopAddress: String,
    shopGSTIN: String,
    shopCategory: {
      type: String,
      enum: ["grocery", "general_store", "medical", "hardware", "other"],
      default: "general_store",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalCustomers: {
      type: Number,
      default: 0,
    },
    totalOutstanding: {
      type: Number,
      default: 0,
    },
    totalRecovered: {
      type: Number,
      default: 0,
    },
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
    whatsappBusinessNumber: String,
    razorpayKeyId: String,
    razorpayKeySecret: String,
    twilioAccountSid: String,
    twilioAuthToken: String,
    twilioPhoneNumber: String,
    openAIApiKey: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to hide sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.twoFactorSecret;
  delete obj.razorpayKeySecret;
  delete obj.twilioAuthToken;
  delete obj.openAIApiKey;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
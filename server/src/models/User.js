const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    onboardingStatus: {
      type: String,
      enum: ["registered", "completed"],
      default: "registered"
    }
  },
  {
    timestamps: true
  }
);

module.exports = {
  User: mongoose.model("User", userSchema)
};

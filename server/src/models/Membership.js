const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    role: {
      type: String,
      enum: ["OWNER", "STAFF"],
      default: "STAFF"
    }
  },
  {
    timestamps: true
  }
);

membershipSchema.index({ userId: 1, companyId: 1 }, { unique: true });

module.exports = {
  Membership: mongoose.model("Membership", membershipSchema)
};

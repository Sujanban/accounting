const mongoose = require("mongoose");

function applySoftDeleteFields(schema) {
  schema.add({
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  });
}

function applyAuditFields(schema) {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  });
}

module.exports = {
  applySoftDeleteFields,
  applyAuditFields
};

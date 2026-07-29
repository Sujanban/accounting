const { Membership } = require("../models/Membership");
const { Branch } = require("../models/Branch");
const { Warehouse } = require("../models/Warehouse");
const { Attachment } = require("../models/Attachment");

async function getUsage(companyId) {
  const [users, branches, warehouses, storage] = await Promise.all([
    Membership.countDocuments({ companyId }),
    Branch.countDocuments({ companyId, isActive: true }),
    Warehouse.countDocuments({ companyId, isActive: true }),
    Attachment.aggregate([{ $match: { companyId, isActive: true } }, { $group: { _id: null, bytes: { $sum: "$sizeBytes" } } }]),
  ]);
  return { users, branches, warehouses, storageBytes: Number(storage[0]?.bytes || 0) };
}

module.exports = { getUsage };

const { Branch } = require("../models/Branch");
const { Warehouse } = require("../models/Warehouse");
const { ApiError } = require("../utils/apiError");
const mongoose = require("mongoose");

function map(model) { return { id: model._id, companyId: model.companyId, branchId: model.branchId, branchCode: model.branchCode, name: model.name, address: model.address, phone: model.phone, email: model.email, managerId: model.managerId, description: model.description, isDefault: model.isDefault, isActive: model.isActive, createdAt: model.createdAt, updatedAt: model.updatedAt }; }
async function listBranches(companyId) { return (await Branch.find({ companyId, isActive: true }).sort({ name: 1 }).lean()).map(map); }
async function createBranch(companyId, actorUserId, payload) { const count = await Branch.countDocuments({ companyId, isActive: true }); if (payload.isDefault) await Branch.updateMany({ companyId }, { $set: { isDefault: false } }); const branch = await Branch.create({ companyId, branchCode: payload.branchCode.trim().toUpperCase(), name: payload.name.trim(), address: payload.address?.trim() || null, phone: payload.phone?.trim() || null, email: payload.email?.trim().toLowerCase() || null, managerId: payload.managerId || null, isDefault: payload.isDefault === true || count === 0, createdBy: actorUserId, updatedBy: actorUserId }); return map(branch); }
async function listWarehouses(companyId, query = {}) {
  const filters = { companyId };
  if (query.branchId !== undefined) {
    if (typeof query.branchId !== "string" || !mongoose.isObjectIdOrHexString(query.branchId)) throw new ApiError(422, "Branch must be a valid identifier.");
    filters.branchId = query.branchId;
  }
  if (query.isActive !== undefined && !["true", "false", "all"].includes(query.isActive)) throw new ApiError(422, "Warehouse status filter is invalid.");
  if (query.isActive === "false") filters.isActive = false;
  else if (query.isActive !== "all") filters.isActive = true;
  return (await Warehouse.find(filters).sort({ name: 1 }).lean()).map(map);
}
async function createWarehouse(companyId, actorUserId, payload) { const branch = await Branch.findOne({ _id: payload.branchId, companyId, isActive: true }).lean(); if (!branch) throw new ApiError(400, "A valid active branch is required."); const count = await Warehouse.countDocuments({ companyId, branchId: branch._id, isActive: true }); if (payload.isDefault) await Warehouse.updateMany({ companyId, branchId: branch._id }, { $set: { isDefault: false } }); const warehouse = await Warehouse.create({ companyId, branchId: branch._id, name: payload.name.trim(), address: payload.address?.trim() || null, description: payload.description?.trim() || null, isDefault: payload.isDefault === true || count === 0, createdBy: actorUserId, updatedBy: actorUserId }); return map(warehouse); }
async function updateWarehouse(companyId, actorUserId, id, payload) { const warehouse = await Warehouse.findOne({ _id: id, companyId, isActive: true }); if (!warehouse) throw new ApiError(404, "Warehouse was not found."); const branch = await Branch.findOne({ _id: payload.branchId, companyId, isActive: true }).lean(); if (!branch) throw new ApiError(422, "A valid active branch is required."); if (payload.isDefault) await Warehouse.updateMany({ companyId, branchId: branch._id }, { $set: { isDefault: false } }); Object.assign(warehouse, { branchId: branch._id, name: payload.name.trim(), address: payload.address?.trim() || null, description: payload.description?.trim() || null, isDefault: payload.isDefault === true, updatedBy: actorUserId }); await warehouse.save(); return map(warehouse); }
async function archiveWarehouse(companyId, actorUserId, id) {
  const warehouse = await Warehouse.findOne({ _id: id, companyId, isActive: true });
  if (!warehouse) throw new ApiError(404, "Warehouse was not found.");
  const replacement = warehouse.isDefault
    ? await Warehouse.findOne({ _id: { $ne: warehouse._id }, companyId, branchId: warehouse.branchId, isActive: true }).sort({ createdAt: 1, _id: 1 })
    : null;
  Object.assign(warehouse, { isActive: false, isDefault: false, deletedAt: new Date(), deletedBy: actorUserId, updatedBy: actorUserId });
  await warehouse.save();
  if (replacement) {
    replacement.isDefault = true;
    replacement.updatedBy = actorUserId;
    await replacement.save();
  }
}
async function restoreWarehouse(companyId, actorUserId, id) {
  const warehouse = await Warehouse.findOne({ _id: id, companyId, isActive: false });
  if (!warehouse) throw new ApiError(404, "Archived warehouse was not found.");
  const branch = await Branch.findOne({ _id: warehouse.branchId, companyId, isActive: true }).lean();
  if (!branch) throw new ApiError(422, "Restore the warehouse's branch before restoring this warehouse.");
  const activeCount = await Warehouse.countDocuments({ companyId, branchId: warehouse.branchId, isActive: true });
  Object.assign(warehouse, { isActive: true, isDefault: activeCount === 0, deletedAt: null, deletedBy: null, updatedBy: actorUserId });
  await warehouse.save();
  return map(warehouse);
}
async function updateBranch(companyId, actorUserId, id, payload) { const branch = await Branch.findOne({ _id: id, companyId }); if (!branch) throw new ApiError(404, "Branch was not found."); if (payload.isDefault) await Branch.updateMany({ companyId }, { $set: { isDefault: false } }); Object.assign(branch, { ...payload, branchCode: payload.branchCode?.trim().toUpperCase() || branch.branchCode, name: payload.name?.trim() || branch.name, updatedBy: actorUserId }); await branch.save(); return map(branch); }
async function archiveBranch(companyId, actorUserId, id) { const branch = await Branch.findOne({ _id: id, companyId, isActive: true }); if (!branch) throw new ApiError(404, "Branch was not found."); if (branch.isDefault) throw new ApiError(409, "Set another branch as default before archiving this branch."); await Warehouse.updateMany({ companyId, branchId: branch._id }, { $set: { isActive: false, deletedAt: new Date(), deletedBy: actorUserId, updatedBy: actorUserId } }); branch.isActive = false; branch.deletedAt = new Date(); branch.deletedBy = actorUserId; branch.updatedBy = actorUserId; await branch.save(); }
async function initializeDefaultBranch(company, userId) { await Branch.updateOne({ companyId: company._id, branchCode: "MAIN" }, { $setOnInsert: { companyId: company._id, branchCode: "MAIN", name: "Main Branch", isDefault: true, isActive: true, createdBy: userId, updatedBy: userId } }, { upsert: true }); }
async function resolveDefaultBranch(companyId) { let branch = await Branch.findOne({ companyId, isDefault: true, isActive: true }).lean(); if (!branch) { await Branch.updateOne({ companyId, branchCode: "MAIN" }, { $setOnInsert: { companyId, branchCode: "MAIN", name: "Main Branch", isDefault: true, isActive: true } }, { upsert: true }); branch = await Branch.findOne({ companyId, branchCode: "MAIN", isActive: true }).lean(); } return branch; }
module.exports = { listBranches, createBranch, updateBranch, archiveBranch, listWarehouses, createWarehouse, updateWarehouse, archiveWarehouse, restoreWarehouse, initializeDefaultBranch, resolveDefaultBranch };

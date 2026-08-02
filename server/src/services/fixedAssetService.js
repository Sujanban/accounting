const { FixedAsset } = require("../models/FixedAsset");
const { Branch } = require("../models/Branch");
const { Warehouse } = require("../models/Warehouse");
const { ApiError } = require("../utils/apiError");
const transactionService = require("./transactionService");

function map(asset) {
  return {
    id: asset._id,
    branchId: asset.branchId,
    warehouseId: asset.warehouseId,
    category: asset.category,
    purchaseDate: asset.purchaseDate,
    purchaseValue: asset.purchaseValue,
    salvageValue: asset.salvageValue,
    usefulLifeMonths: asset.usefulLifeMonths,
    depreciationMethod: asset.depreciationMethod,
    status: asset.status,
  };
}

async function assertLocation(companyId, branchId, warehouseId) {
  const branch = await Branch.findOne({ _id: branchId, companyId, isActive: true }).lean();
  const warehouse = warehouseId
    ? await Warehouse.findOne({ _id: warehouseId, companyId, branchId, isActive: true }).lean()
    : true;

  if (!branch || !warehouse) throw new ApiError(422, "The selected branch or warehouse is unavailable.");
}

async function create(companyId, userId, input) {
  await assertLocation(companyId, input.branchId, input.warehouseId);
  const asset = await FixedAsset.create({
    ...input,
    companyId,
    createdBy: userId,
    updatedBy: userId,
  });
  return map(asset);
}

async function update(companyId, userId, assetId, input) {
  const asset = await FixedAsset.findOne({ _id: assetId, companyId });
  if (!asset) throw new ApiError(404, "Fixed asset was not found.");
  if (asset.status !== "ACTIVE") throw new ApiError(409, "Disposed fixed assets cannot be edited.");

  await assertLocation(companyId, input.branchId, input.warehouseId);
  Object.assign(asset, { ...input, updatedBy: userId });
  await asset.save();
  return map(asset);
}

async function list(companyId) {
  return (await FixedAsset.find({ companyId }).sort({ category: 1, purchaseDate: 1, _id: 1 }).lean()).map(map);
}

async function depreciationSchedule(companyId, assetId) {
  const asset = await FixedAsset.findOne({ _id: assetId, companyId }).lean();
  if (!asset) throw new ApiError(404, "Fixed asset was not found.");

  const purchaseValue = Number(asset.purchaseValue);
  const salvageValue = Number(asset.salvageValue);
  const life = Number(asset.usefulLifeMonths);
  let carryingValue = purchaseValue;
  const items = [];

  for (let month = 1; month <= life; month += 1) {
    const depreciation = asset.depreciationMethod === "STRAIGHT_LINE"
      ? (purchaseValue - salvageValue) / life
      : Math.min(carryingValue - salvageValue, (carryingValue * 2) / life);
    carryingValue = Math.max(salvageValue, carryingValue - depreciation);
    items.push({ month, depreciation: Number(depreciation.toFixed(2)), closingValue: Number(carryingValue.toFixed(2)) });
  }

  return { asset: map(asset), items };
}

async function createDepreciationDraft(companyId, fiscalYearId, userId, role, assetId, input) {
  const asset = await FixedAsset.findOne({ _id: assetId, companyId }).lean();
  if (!asset) throw new ApiError(404, "Fixed asset was not found.");
  if (asset.status !== "ACTIVE") throw new ApiError(409, "Only active fixed assets can be depreciated.");

  const schedule = await depreciationSchedule(companyId, assetId);
  const period = schedule.items[input.periodMonth - 1];
  if (!period) throw new ApiError(422, "The selected period is outside the asset's useful life.");

  return transactionService.createDraft(companyId, fiscalYearId, {
    actorUserId: userId,
    actorRole: role,
    transactionType: "JOURNAL",
    voucherType: "JV",
    branchId: asset.branchId,
    transactionDate: input.transactionDate,
    narration: `Manual depreciation for ${asset.category}, period ${input.periodMonth}`,
    items: [{ assetId: asset._id, type: "FIXED_ASSET_DEPRECIATION", periodMonth: input.periodMonth, amount: period.depreciation }],
    accountingEntries: [
      { ledgerId: input.expenseLedgerId, debit: period.depreciation, credit: 0, narration: `Depreciation expense — ${asset.category}` },
      { ledgerId: input.accumulatedDepreciationLedgerId, debit: 0, credit: period.depreciation, narration: `Accumulated depreciation — ${asset.category}` },
    ],
    inventoryEntries: [],
  });
}

async function createDisposalDraft(companyId, fiscalYearId, userId, role, assetId, input) {
  const asset = await FixedAsset.findOne({ _id: assetId, companyId });
  if (!asset) throw new ApiError(404, "Fixed asset was not found.");
  if (asset.status !== "ACTIVE") throw new ApiError(409, "This fixed asset has already been disposed.");
  if (input.accumulatedDepreciation > Number(asset.purchaseValue) - Number(asset.salvageValue)) throw new ApiError(422, "Accumulated depreciation cannot reduce the asset below its salvage value.");

  const carryingValue = Number(asset.purchaseValue) - input.accumulatedDepreciation;
  const difference = Number(input.proceeds) - carryingValue;
  const accountingEntries = [
    { ledgerId: input.accumulatedDepreciationLedgerId, debit: input.accumulatedDepreciation, credit: 0, narration: `Remove accumulated depreciation — ${asset.category}` },
    { ledgerId: input.proceedsLedgerId, debit: input.proceeds, credit: 0, narration: `Disposal proceeds — ${asset.category}` },
    { ledgerId: input.assetCostLedgerId, debit: 0, credit: Number(asset.purchaseValue), narration: `Remove asset cost — ${asset.category}` },
  ];
  if (difference < 0) accountingEntries.push({ ledgerId: input.gainLossLedgerId, debit: Math.abs(difference), credit: 0, narration: `Loss on disposal — ${asset.category}` });
  if (difference > 0) accountingEntries.push({ ledgerId: input.gainLossLedgerId, debit: 0, credit: difference, narration: `Gain on disposal — ${asset.category}` });

  const draft = await transactionService.createDraft(companyId, fiscalYearId, {
    actorUserId: userId,
    actorRole: role,
    transactionType: "JOURNAL",
    voucherType: "JV",
    branchId: asset.branchId,
    transactionDate: input.transactionDate,
    narration: `Fixed asset disposal — ${asset.category}`,
    items: [{ assetId: asset._id, type: "FIXED_ASSET_DISPOSAL", proceeds: input.proceeds, accumulatedDepreciation: input.accumulatedDepreciation }],
    accountingEntries,
    inventoryEntries: [],
  });
  return draft;
}

module.exports = { create, update, list, depreciationSchedule, createDepreciationDraft, createDisposalDraft };

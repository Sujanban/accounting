const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

test("active fixed assets can be updated after company-scoped branch validation", async () => {
  const asset = { _id: "asset-1", status: "ACTIVE", save: async () => {} };
  const input = { branchId: "branch-2", category: "Equipment", purchaseDate: "2026-01-01", purchaseValue: 1000, salvageValue: 100, usefulLifeMonths: 24, depreciationMethod: "STRAIGHT_LINE" };
  const { module: service, restore } = loadWithMocks("../../src/services/fixedAssetService", {
    "../models/FixedAsset": { FixedAsset: { findOne: async () => asset } },
    "../models/Branch": { Branch: { findOne: () => ({ lean: async () => ({ _id: input.branchId }) }) } },
    "../models/Warehouse": { Warehouse: {} },
    "../utils/apiError": { ApiError: class ApiError extends Error { constructor(_status, message) { super(message); } } }
  });

  try {
    const result = await service.update("company-1", "user-1", "asset-1", input);
    assert.equal(asset.category, "Equipment");
    assert.equal(asset.branchId, "branch-2");
    assert.equal(asset.updatedBy, "user-1");
    assert.equal(result.id, "asset-1");

    asset.status = "DISPOSED";
    await assert.rejects(() => service.update("company-1", "user-1", "asset-1", input), /Disposed fixed assets cannot be edited/);
  } finally {
    restore();
  }
});

test("manual depreciation creates a calculated journal draft through the transaction engine", async () => {
  const asset = { _id: "asset-1", category: "Computer", branchId: "branch-1", status: "ACTIVE", purchaseValue: 1200, salvageValue: 0, usefulLifeMonths: 12, depreciationMethod: "STRAIGHT_LINE" };
  const createDraft = async (_companyId, _fiscalYearId, payload) => payload;
  const { module: service, restore } = loadWithMocks("../../src/services/fixedAssetService", {
    "../models/FixedAsset": { FixedAsset: { findOne: () => ({ lean: async () => asset }) } },
    "../models/Branch": { Branch: {} },
    "../models/Warehouse": { Warehouse: {} },
    "../services/transactionService": { createDraft },
    "../utils/apiError": { ApiError: class ApiError extends Error { constructor(_status, message) { super(message); } } }
  });

  try {
    const draft = await service.createDepreciationDraft("company-1", "fiscal-year-1", "user-1", "ACCOUNTANT", "asset-1", {
      periodMonth: 1,
      transactionDate: "2026-07-29",
      expenseLedgerId: "expense-ledger",
      accumulatedDepreciationLedgerId: "accumulated-ledger",
    });
    assert.equal(draft.transactionType, "JOURNAL");
    assert.equal(draft.accountingEntries[0].debit, 100);
    assert.equal(draft.accountingEntries[1].credit, 100);
    assert.equal(draft.items[0].type, "FIXED_ASSET_DEPRECIATION");
  } finally {
    restore();
  }
});

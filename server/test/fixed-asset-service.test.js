const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

test("active fixed assets can be updated after company-scoped branch validation", async () => {
  const asset = { _id: "asset-1", status: "ACTIVE", save: async () => {} };
  const input = { branchId: "branch-2", assetCode: "COMP-02", category: "Equipment", purchaseDate: "2026-01-01", purchaseValue: 1000, salvageValue: 100, usefulLifeMonths: 24, depreciationMethod: "STRAIGHT_LINE" };
  const { module: service, restore } = loadWithMocks("../../src/services/fixedAssetService", {
    "../models/FixedAsset": { FixedAsset: { findOne: async () => asset } },
    "../models/Branch": { Branch: { findOne: () => ({ lean: async () => ({ _id: input.branchId }) }) } },
    "../models/Warehouse": { Warehouse: {} },
    "../utils/apiError": { ApiError: class ApiError extends Error { constructor(_status, message) { super(message); } } }
  });

  try {
    const result = await service.update("company-1", "user-1", "asset-1", input);
    assert.equal(asset.assetCode, "COMP-02");
    assert.equal(asset.branchId, "branch-2");
    assert.equal(asset.updatedBy, "user-1");
    assert.equal(result.id, "asset-1");

    asset.status = "DISPOSED";
    await assert.rejects(() => service.update("company-1", "user-1", "asset-1", input), /Disposed fixed assets cannot be edited/);
  } finally {
    restore();
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

test("deleting a default warehouse archives it and promotes an active replacement", async () => {
  let archivedSaves = 0;
  let replacementSaves = 0;
  const warehouse = {
    _id: "warehouse-1",
    branchId: "branch-1",
    isDefault: true,
    isActive: true,
    save: async () => { archivedSaves += 1; }
  };
  const replacement = {
    _id: "warehouse-2",
    isDefault: false,
    isActive: true,
    save: async () => { replacementSaves += 1; }
  };
  const Warehouse = {
    findOne: (filter) => filter._id === "warehouse-1"
      ? Promise.resolve(warehouse)
      : { sort: async () => replacement }
  };
  const { module: service, restore } = loadWithMocks("../../src/services/branchService", {
    "../models/Branch": { Branch: {} },
    "../models/Warehouse": { Warehouse },
    "../utils/apiError": { ApiError: class ApiError extends Error {} },
    mongoose: { isObjectIdOrHexString: () => true }
  });

  try {
    await service.archiveWarehouse("company-1", "user-1", "warehouse-1");

    assert.equal(warehouse.isActive, false);
    assert.equal(warehouse.isDefault, false);
    assert.equal(warehouse.deletedBy, "user-1");
    assert.ok(warehouse.deletedAt instanceof Date);
    assert.equal(replacement.isDefault, true);
    assert.equal(replacement.updatedBy, "user-1");
    assert.equal(archivedSaves, 1);
    assert.equal(replacementSaves, 1);
  } finally {
    restore();
  }
});

test("restoring a warehouse reactivates it and makes it default only when the branch is empty", async () => {
  const warehouse = {
    _id: "warehouse-1",
    branchId: "branch-1",
    isDefault: false,
    isActive: false,
    deletedAt: new Date(),
    deletedBy: "user-old",
    save: async () => {}
  };
  const Warehouse = {
    findOne: async () => warehouse,
    countDocuments: async () => 0
  };
  const Branch = {
    findOne: () => ({ lean: async () => ({ _id: "branch-1" }) })
  };
  const { module: service, restore } = loadWithMocks("../../src/services/branchService", {
    "../models/Branch": { Branch },
    "../models/Warehouse": { Warehouse },
    "../utils/apiError": { ApiError: class ApiError extends Error {} },
    mongoose: { isObjectIdOrHexString: () => true }
  });

  try {
    const result = await service.restoreWarehouse("company-1", "user-1", "warehouse-1");

    assert.equal(warehouse.isActive, true);
    assert.equal(warehouse.isDefault, true);
    assert.equal(warehouse.deletedAt, null);
    assert.equal(warehouse.deletedBy, null);
    assert.equal(warehouse.updatedBy, "user-1");
    assert.equal(result.id, "warehouse-1");
  } finally {
    restore();
  }
});

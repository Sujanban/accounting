const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

const input = {
  branchId: "branch-2",
  contactId: "contact-2",
  orderDate: "2026-07-28",
  items: [{ productId: "product-2", quantity: 3, unitPrice: 125 }],
  notes: "Updated order"
};

test("sales orders can be edited only while they are drafts", async () => {
  const order = { _id: "sales-1", status: "DRAFT", save: async () => {}, createdAt: new Date(), updatedAt: new Date() };
  const { module: service, restore } = loadWithMocks("../../src/services/salesOrderService", {
    "../models/SalesOrder": { SalesOrder: { findOne: async () => order } },
    "../models/Branch": { Branch: { findOne: () => ({ lean: async () => ({ _id: input.branchId }) }) } },
    "../models/Contact": { Contact: { findOne: () => ({ lean: async () => ({ _id: input.contactId }) }) } },
    "../models/Product": { Product: { countDocuments: async () => 1 } },
    "../utils/apiError": { ApiError: class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } } }
  });

  try {
    const result = await service.update("company-1", "user-1", "sales-1", input);
    assert.equal(order.branchId, input.branchId);
    assert.equal(order.contactId, input.contactId);
    assert.deepEqual(order.items, input.items);
    assert.equal(order.updatedBy, "user-1");
    assert.equal(result.id, "sales-1");

    order.status = "CONFIRMED";
    await assert.rejects(() => service.update("company-1", "user-1", "sales-1", input), /Only draft sales orders can be edited/);
  } finally {
    restore();
  }
});

test("purchase orders can be edited only while they are drafts", async () => {
  const order = { _id: "purchase-1", status: "DRAFT", save: async () => {}, createdAt: new Date(), updatedAt: new Date() };
  const { module: service, restore } = loadWithMocks("../../src/services/purchaseOrderService", {
    "../models/PurchaseOrder": { PurchaseOrder: { findOne: async () => order } },
    "../models/Branch": { Branch: { findOne: () => ({ lean: async () => ({ _id: input.branchId }) }) } },
    "../models/Contact": { Contact: { findOne: () => ({ lean: async () => ({ _id: input.contactId }) }) } },
    "../models/Product": { Product: { countDocuments: async () => 1 } },
    "../utils/apiError": { ApiError: class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } } }
  });

  try {
    const result = await service.update("company-1", "user-1", "purchase-1", input);
    assert.equal(order.branchId, input.branchId);
    assert.equal(order.contactId, input.contactId);
    assert.deepEqual(order.items, input.items);
    assert.equal(order.updatedBy, "user-1");
    assert.equal(result.id, "purchase-1");

    order.status = "CANCELLED";
    await assert.rejects(() => service.update("company-1", "user-1", "purchase-1", input), /Only draft purchase orders can be edited/);
  } finally {
    restore();
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

test("listVouchers delegates to the transaction engine with its fixed voucher type", async () => {
  let received = null;
  const { module: voucherService, restore } = loadWithMocks("../../src/services/voucherService", {
    "../models/Transaction": { Transaction: {} },
    "./transactionService": { listTransactions: async (...args) => { received = args; return { items: [] }; } },
    "../events/eventBus": { eventBus: {} },
    "../shared/constants/events": { DOMAIN_EVENTS: {} },
    "../utils/apiError": { ApiError: class ApiError extends Error {} }
  });

  try {
    const result = await voucherService.listVouchers("company-1", "fy-1", "SALE", { page: "2", transactionType: "JOURNAL" });
    assert.deepEqual(result, { items: [] });
    assert.deepEqual(received, ["company-1", "fy-1", { page: "2", transactionType: "SALE" }]);
  } finally {
    restore();
  }
});

test("reverseVoucher verifies the voucher type before reversing through the transaction engine", async () => {
  let received = null;
  const { module: voucherService, restore } = loadWithMocks("../../src/services/voucherService", {
    "../models/Transaction": {
      Transaction: {
        findOne: () => ({ lean: async () => ({ _id: "voucher-1", transactionType: "PURCHASE" }) })
      }
    },
    "./transactionService": {
      reverseTransaction: async (...args) => {
        received = args;
        return { id: "reversal-1" };
      }
    },
    "../events/eventBus": { eventBus: {} },
    "../shared/constants/events": { DOMAIN_EVENTS: {} },
    "../utils/apiError": { ApiError: class ApiError extends Error {} }
  });

  try {
    const result = await voucherService.reverseVoucher("company-1", "fy-1", "voucher-1", "user-1", "PURCHASE");
    assert.deepEqual(result, { id: "reversal-1" });
    assert.deepEqual(received, ["company-1", "fy-1", "voucher-1", "user-1"]);
  } finally {
    restore();
  }
});

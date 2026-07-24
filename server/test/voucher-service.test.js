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

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadWithMocks } = require("./helpers/load-with-mocks");

test("posting rejects an unbalanced draft before journal or inventory writes", async () => {
  let journalWrites = 0;
  const draft = { _id: "transaction-1", companyId: "company-1", fiscalYearId: "fy-1", branchId: "branch-1", transactionDate: new Date("2026-07-24"), voucherType: "JV", status: "DRAFT", accountingEntries: [{ ledgerId: "ledger-1", debit: 100, credit: 0 }], inventoryEntries: [] };
  const { module: service, restore } = loadWithMocks("../../src/services/transactionService", {
    mongoose: { startSession: async () => ({ withTransaction: async (work) => work(), endSession: async () => {} }), Types: { ObjectId: class { constructor(value) { this.value = value; } } } },
    "../models/Transaction": { Transaction: { findOne: () => ({ session: async () => draft }) } },
    "../models/Journal": { Journal: { create: async () => { journalWrites += 1; }, }, JournalLine: { insertMany: async () => { journalWrites += 1; } } },
    "../models/InventoryMovement": { InventoryMovement: { insertMany: async () => { journalWrites += 1; }, aggregate: () => ({ session: async () => [] }) } },
    "../models/Ledger": { Ledger: { countDocuments: () => ({ session: async () => 1 }) } },
    "../models/Product": { Product: {} }, "../models/Warehouse": { Warehouse: {} }, "../models/Setting": { Setting: {} },
    "./fiscalYearGuardService": { assertFiscalYearWritable: async () => {} }, "./voucherSequenceService": { getNextVoucherNumber: async () => "JV-1" },
    "../events/eventBus": { eventBus: { emitAsync: async () => {} } }, "../shared/constants/events": { DOMAIN_EVENTS: {} }, "./branchService": { resolveDefaultBranch: async () => ({ _id: "branch-1" }) }
  });
  try { await assert.rejects(() => service.postTransaction("company-1", "fy-1", "transaction-1", "user-1"), /Debit and credit totals must be equal/); assert.equal(journalWrites, 0); } finally { restore(); }
});

test("posting a tax invoice for a non-VAT company returns a semantic validation error", async () => {
  const draft = {
    _id: "transaction-1", companyId: "company-1", fiscalYearId: "fy-1", branchId: "branch-1",
    transactionType: "SALE", transactionDate: new Date("2026-07-24"), voucherType: "SV", status: "DRAFT",
    taxDetails: { taxableAmount: 100, vatRate: 13, vatAmount: 13, totalAmount: 113, mode: "EXCLUSIVE" },
    accountingEntries: [{ ledgerId: "party", debit: 113, credit: 0 }, { ledgerId: "sales", debit: 0, credit: 113 }],
    inventoryEntries: [],
  };
  const chain = (value) => ({ select() { return this; }, session() { return this; }, lean: async () => value });
  const { module: service, restore } = loadWithMocks("../../src/services/transactionService", {
    mongoose: { startSession: async () => ({ withTransaction: async (work) => work(), endSession: async () => {} }), Types: { ObjectId: class { constructor(value) { this.value = value; } } } },
    "../models/Transaction": { Transaction: { findOne: () => ({ session: async () => draft }) } },
    "../models/Journal": { Journal: {}, JournalLine: {} },
    "../models/InventoryMovement": { InventoryMovement: {} },
    "../models/Ledger": { Ledger: { countDocuments: () => ({ session: async () => 2 }) } },
    "../models/Product": { Product: {} }, "../models/Warehouse": { Warehouse: {} },
    "../models/Setting": { Setting: { findOne: () => chain({ accounting: { requireTransactionApproval: false } }) } },
    "../models/Company": { Company: { findById: () => chain({ panNumber: "123456789", vatRegistered: false, vatNumber: null }) } },
    "./fiscalYearGuardService": { assertFiscalYearWritable: async () => {} }, "./voucherSequenceService": { getNextVoucherNumber: async () => "SV-1" },
    "../events/eventBus": { eventBus: { emitAsync: async () => {} } }, "../shared/constants/events": { DOMAIN_EVENTS: {} }, "./branchService": { resolveDefaultBranch: async () => ({ _id: "branch-1" }) },
  });
  try {
    await assert.rejects(
      () => service.postTransaction("company-1", "fy-1", "transaction-1", "user-1"),
      (error) => error.statusCode === 422 && error.errorCode === "VALIDATION_ERROR" && /VAT-registered company/.test(error.message),
    );
  } finally {
    restore();
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateGeneralLedgerQuery,
  validateListReportQuery,
  validateStockSummaryQuery,
  validateStockLedgerQuery,
  validateContactStatementQuery,
} = require("../src/validators/reportValidators");

test("general ledger filters require a valid ledger and a chronological date range", () => {
  const errors = validateGeneralLedgerQuery({
    ledgerId: "invalid",
    from: "2026-07-25",
    to: "2026-07-24",
  });
  assert.deepEqual(errors, [
    {
      field: "to",
      message: "The end date must be on or after the start date.",
    },
    { field: "ledgerId", message: "Ledger must be a valid identifier." },
  ]);
});

test("contact statements require a contact and allow only documented report filters", () => {
  assert.deepEqual(validateContactStatementQuery({}), [
    { field: "contactId", message: "Contact must be a valid identifier." },
  ]);
  assert.deepEqual(validateContactStatementQuery({ contactId: "507f1f77bcf86cd799439011", role: "CUSTOMER" }), [
    { field: "role", message: "This filter is not supported." },
  ]);
  assert.deepEqual(
    validateContactStatementQuery({ contactId: "507f1f77bcf86cd799439011", branchId: "507f1f77bcf86cd799439012" }),
    [],
  );
});

test("list report filters reject unsupported fields and oversized limits", () => {
  const errors = validateListReportQuery({
    page: "0",
    limit: "101",
    status: "POSTED",
  });
  assert.deepEqual(errors, [
    { field: "status", message: "This filter is not supported." },
    { field: "page", message: "Page must be a positive integer." },
    {
      field: "limit",
      message: "Limit must be a positive integer no greater than 100.",
    },
  ]);
});

test("list report filters accept the documented pagination and date controls", () => {
  assert.deepEqual(
    validateListReportQuery({
      from: "2026-07-01",
      to: "2026-07-24",
      page: "2",
      limit: "20",
    }),
    [],
  );
});

test("stock summary accepts an optional warehouse filter and rejects invalid identifiers", () => {
  assert.deepEqual(validateStockSummaryQuery({ warehouseId: "invalid" }), [
    { field: "warehouseId", message: "Warehouse must be a valid identifier." },
  ]);
  assert.deepEqual(
    validateStockSummaryQuery({ warehouseId: "507f1f77bcf86cd799439011" }),
    [],
  );
});

test("stock ledger requires a valid product and accepts an optional warehouse", () => {
  assert.deepEqual(validateStockLedgerQuery({}), [
    { field: "productId", message: "Product must be a valid identifier." },
  ]);
  assert.deepEqual(
    validateStockLedgerQuery({ productId: "507f1f77bcf86cd799439011", warehouseId: "507f1f77bcf86cd799439012" }),
    [],
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const { isValidBsDate, bsToUtcDate } = require("../src/services/nepalDateService");
const { normalizeBusinessDates, serializeBusinessDates } = require("../src/utils/businessDates");
const { validateListTransactions } = require("../src/validators/transactionValidators");

test("validates real Bikram Sambat calendar days", () => {
  assert.equal(isValidBsDate("2083-01-01"), true);
  assert.equal(isValidBsDate("2083-13-01"), false);
  assert.equal(isValidBsDate("2083-01-99"), false);
  assert.equal(isValidBsDate("2083/01/01"), false);
});

test("normalizes nested BS business dates to UTC dates for persistence", () => {
  const payload = {
    transactionDate: "2083-01-01",
    filters: { fromDate: "2083-01-02" },
    createdAt: "2026-04-14T10:15:00.000Z"
  };

  normalizeBusinessDates(payload);

  assert.deepEqual(payload.transactionDate, bsToUtcDate("2083-01-01"));
  assert.deepEqual(payload.filters.fromDate, bsToUtcDate("2083-01-02"));
  assert.equal(payload.createdAt, "2026-04-14T10:15:00.000Z");
});

test("serializes business dates as BS while preserving audit timestamps", () => {
  const createdAt = new Date("2026-04-14T10:15:00.000Z");
  const companyId = new mongoose.Types.ObjectId();
  const result = serializeBusinessDates({
    companyId,
    transactionDate: new Date("2026-04-14T00:00:00.000Z"),
    createdAt,
    items: [{ purchaseDate: new Date("2026-04-15T00:00:00.000Z") }]
  });

  assert.equal(result.transactionDate, "2083-01-01");
  assert.equal(result.items[0].purchaseDate, "2083-01-02");
  assert.equal(result.createdAt, createdAt);
  assert.equal(result.companyId, companyId);
});

test("voucher list filters accept only chronological BS dates", () => {
  assert.deepEqual(validateListTransactions({ fromDate: "2083-01-01", toDate: "2083-01-31", page: "1" }), []);
  assert.ok(validateListTransactions({ fromDate: "2083-02-01", toDate: "2083-01-01" }).some((error) => error.field === "toDate"));
  assert.ok(validateListTransactions({ fromDate: "2083-13-01" }).some((error) => error.field === "fromDate"));
});

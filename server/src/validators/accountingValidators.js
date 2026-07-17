const LEDGER_GROUPS = new Set([
  "Current Assets",
  "Fixed Assets",
  "Investments",
  "Current Liabilities",
  "Long-term Liabilities",
  "Capital Account",
  "Retained Earnings",
  "Direct Income",
  "Indirect Income",
  "Direct Expenses",
  "Indirect Expenses"
]);

const BALANCE_TYPES = new Set(["DEBIT", "CREDIT"]);

function validateFiscalYear(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 3) {
    errors.push({ field: "name", message: "Fiscal year name is required." });
  }

  if (!body.startDateBS || !body.endDateBS) {
    errors.push({
      field: "fiscalYear",
      message: "Fiscal year startDateBS and endDateBS are required."
    });
  }

  return errors;
}

function validateLedger(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Ledger name is required." });
  }

  if (!LEDGER_GROUPS.has(body.accountGroup)) {
    errors.push({
      field: "accountGroup",
      message: "A valid account group is required."
    });
  }

  if (
    body.openingBalanceType !== undefined &&
    !BALANCE_TYPES.has(body.openingBalanceType)
  ) {
    errors.push({
      field: "openingBalanceType",
      message: "Opening balance type must be DEBIT or CREDIT."
    });
  }

  return errors;
}

function validateParty(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name is required." });
  }

  if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push({ field: "email", message: "A valid email is required." });
  }

  if (
    body.openingBalanceType !== undefined &&
    !BALANCE_TYPES.has(body.openingBalanceType)
  ) {
    errors.push({
      field: "openingBalanceType",
      message: "Opening balance type must be DEBIT or CREDIT."
    });
  }

  return errors;
}

function validateProduct(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Product name is required." });
  }

  if (!body.unit || body.unit.trim().length < 1) {
    errors.push({ field: "unit", message: "Unit is required." });
  }

  return errors;
}

function validateJournalEntry(body) {
  const errors = [];

  if (!body.date) {
    errors.push({ field: "date", message: "Voucher date is required." });
  }

  if (!Array.isArray(body.rows) || body.rows.length < 2) {
    errors.push({
      field: "rows",
      message: "At least two journal rows are required."
    });
  }

  return errors;
}

module.exports = {
  validateFiscalYear,
  validateLedger,
  validateParty,
  validateProduct,
  validateJournalEntry
};

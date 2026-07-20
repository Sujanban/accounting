const ACCOUNT_GROUP_TYPES = new Set([
  "Assets",
  "Liabilities",
  "Equity",
  "Income",
  "Expenses"
]);

const BALANCE_TYPES = new Set(["DEBIT", "CREDIT"]);
function rejectUnknownFields(body, allowedFields, errors) {
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      errors.push({ field, message: "This field cannot be modified." });
    }
  }
}

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

function validateAccountGroup(body) {
  const errors = [];
  rejectUnknownFields(body, new Set(["name", "type", "parentId", "description"]), errors);

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Account group name is required." });
  }

  if (!ACCOUNT_GROUP_TYPES.has(body.type)) {
    errors.push({ field: "type", message: "A valid account group type is required." });
  }

  return errors;
}

function validateAccountGroupUpdate(body) {
  const errors = [];
  rejectUnknownFields(body, new Set(["name", "type", "parentId", "description"]), errors);
  if (!Object.keys(body).length) {
    errors.push({ field: "body", message: "At least one field must be provided." });
  }
  if (body.name !== undefined && (!body.name || body.name.trim().length < 2)) {
    errors.push({ field: "name", message: "Account group name must be at least 2 characters." });
  }
  if (body.type !== undefined && !ACCOUNT_GROUP_TYPES.has(body.type)) {
    errors.push({ field: "type", message: "A valid account group type is required." });
  }
  return errors;
}

function validateLedger(body) {
  const errors = [];
  rejectUnknownFields(
    body,
    new Set(["name", "groupId", "systemCode", "openingBalance", "openingBalanceType", "description", "allowManualEntry"]),
    errors
  );

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Ledger name is required." });
  }

  if (!body.groupId) {
    errors.push({
      field: "groupId",
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

  if (
    body.allowManualEntry !== undefined &&
    typeof body.allowManualEntry !== "boolean"
  ) {
    errors.push({
      field: "allowManualEntry",
      message: "Allow manual entry must be true or false."
    });
  }

  if (body.openingBalance !== undefined && !Number.isFinite(Number(body.openingBalance))) {
    errors.push({ field: "openingBalance", message: "Opening balance must be a valid number." });
  }

  return errors;
}

function validateLedgerUpdate(body) {
  const errors = [];
  rejectUnknownFields(
    body,
    new Set(["name", "groupId", "openingBalance", "openingBalanceType", "description", "allowManualEntry"]),
    errors
  );
  if (!Object.keys(body).length) {
    errors.push({ field: "body", message: "At least one field must be provided." });
  }
  if (body.name !== undefined && (!body.name || body.name.trim().length < 2)) {
    errors.push({ field: "name", message: "Ledger name must be at least 2 characters." });
  }
  if (body.openingBalance !== undefined && !Number.isFinite(Number(body.openingBalance))) {
    errors.push({ field: "openingBalance", message: "Opening balance must be a valid number." });
  }
  if (body.openingBalanceType !== undefined && !BALANCE_TYPES.has(body.openingBalanceType)) {
    errors.push({ field: "openingBalanceType", message: "Opening balance type must be DEBIT or CREDIT." });
  }
  if (body.allowManualEntry !== undefined && typeof body.allowManualEntry !== "boolean") {
    errors.push({ field: "allowManualEntry", message: "Allow manual entry must be true or false." });
  }
  return errors;
}

function validateVoucherSequence(body) {
  const errors = [];
  rejectUnknownFields(
    body,
    new Set(["prefix", "nextNumber", "padding", "resetEveryFiscalYear"]),
    errors
  );

  if (body.prefix !== undefined && String(body.prefix).trim().length < 2) {
    errors.push({
      field: "prefix",
      message: "Voucher prefix must be at least 2 characters."
    });
  }

  if (
    body.nextNumber !== undefined &&
    (!Number.isInteger(Number(body.nextNumber)) || Number(body.nextNumber) < 1)
  ) {
    errors.push({
      field: "nextNumber",
      message: "Next number must be a positive integer."
    });
  }

  if (
    body.padding !== undefined &&
    (!Number.isInteger(Number(body.padding)) || Number(body.padding) < 1)
  ) {
    errors.push({
      field: "padding",
      message: "Padding must be a positive integer."
    });
  }

  if (
    body.resetEveryFiscalYear !== undefined &&
    typeof body.resetEveryFiscalYear !== "boolean"
  ) {
    errors.push({
      field: "resetEveryFiscalYear",
      message: "Reset every fiscal year must be true or false."
    });
  }

  return errors;
}

function validateAccountingPreferences(body) {
  const errors = [];

  if (body.accounting) {
    if (
      body.accounting.voucherNumbering !== undefined &&
      !["AUTO", "MANUAL"].includes(body.accounting.voucherNumbering)
    ) {
      errors.push({
        field: "accounting.voucherNumbering",
        message: "Voucher numbering must be AUTO or MANUAL."
      });
    }

    if (
      body.accounting.decimalPlaces !== undefined &&
      (!Number.isInteger(Number(body.accounting.decimalPlaces)) ||
        Number(body.accounting.decimalPlaces) < 0 ||
        Number(body.accounting.decimalPlaces) > 6)
    ) {
      errors.push({
        field: "accounting.decimalPlaces",
        message: "Accounting decimal places must be from 0 to 6."
      });
    }
  }

  if (body.fiscalLock) {
    if (
      body.fiscalLock.lockBeforeDate !== undefined &&
      body.fiscalLock.lockBeforeDate &&
      Number.isNaN(new Date(body.fiscalLock.lockBeforeDate).getTime())
    ) {
      errors.push({
        field: "fiscalLock.lockBeforeDate",
        message: "Lock before date must be a valid date."
      });
    }
  }

  return errors;
}

module.exports = {
  validateFiscalYear,
  validateAccountGroup,
  validateAccountGroupUpdate,
  validateLedger,
  validateLedgerUpdate,
  validateVoucherSequence,
  validateAccountingPreferences
};

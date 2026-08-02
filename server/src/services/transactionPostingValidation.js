const { ApiError } = require("../utils/apiError");

function assertTaxAccountingTotal(transaction, accountingTotals) {
  if (transaction.transactionType !== "SALE" || !transaction.taxDetails) return;
  const invoiceTotal = Number(transaction.taxDetails.totalAmount);
  if (!Number.isFinite(invoiceTotal) || Math.abs(accountingTotals.debit - invoiceTotal) > 0.01) {
    throw new ApiError(
      422,
      "The accounting total must equal the tax invoice total.",
      "VALIDATION_ERROR",
      [{ field: "accountingEntries", message: "Debit and credit totals must equal the tax invoice total." }],
    );
  }
}

module.exports = { assertTaxAccountingTotal };

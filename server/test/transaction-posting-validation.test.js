const test = require("node:test");
const assert = require("node:assert/strict");
const { assertTaxAccountingTotal } = require("../src/services/transactionPostingValidation");

test("taxable sales require the journal total to equal the invoice total", () => {
  assert.doesNotThrow(() => assertTaxAccountingTotal(
    { transactionType: "SALE", taxDetails: { totalAmount: 113 } },
    { debit: 113, credit: 113 },
  ));

  assert.throws(
    () => assertTaxAccountingTotal(
      { transactionType: "SALE", taxDetails: { totalAmount: 113 } },
      { debit: 100, credit: 100 },
    ),
    /accounting total must equal the tax invoice total/i,
  );
});

import { describe, expect, it } from "vitest";
import { areAccountingEntriesBalanced, calculateVatDetails } from "./voucher-calculations";

describe("calculateVatDetails", () => {
  it("adds VAT to an exclusive amount", () => {
    expect(calculateVatDetails(1_000, 13, "EXCLUSIVE")).toEqual({
      taxableAmount: 1_000,
      vatRate: 13,
      vatAmount: 130,
      totalAmount: 1_130,
      mode: "EXCLUSIVE",
    });
  });

  it("extracts VAT from an inclusive invoice amount", () => {
    expect(calculateVatDetails(1_130, 13, "INCLUSIVE")).toEqual({
      taxableAmount: 1_000,
      vatRate: 13,
      vatAmount: 130,
      totalAmount: 1_130,
      mode: "INCLUSIVE",
    });
  });
});

describe("areAccountingEntriesBalanced", () => {
  it("rejects rows that contain both a debit and a credit", () => {
    expect(areAccountingEntriesBalanced([
      { ledgerId: "sales", debit: 100, credit: 100 },
    ])).toBe(false);
  });

  it("accepts matching one-sided debit and credit rows", () => {
    expect(areAccountingEntriesBalanced([
      { ledgerId: "party", debit: 113, credit: 0 },
      { ledgerId: "sales", debit: 0, credit: 100 },
      { ledgerId: "vat", debit: 0, credit: 13 },
    ])).toBe(true);
  });
});

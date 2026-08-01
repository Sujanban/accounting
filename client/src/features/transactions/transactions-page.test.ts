import { describe, expect, it } from "vitest";
import { voucherDate, voucherDebitTotal } from "./transactions-page";

describe("voucher list presentation", () => {
  it("presents the API's BS business date", () => {
    expect(voucherDate("2083-01-01")).toEqual({
      bs: "2083-01-01",
    });
  });

  it("calculates the voucher amount from debit entries", () => {
    expect(voucherDebitTotal([{ debit: 1250.5 }, { debit: 249.5 }, { debit: 0 }])).toBe(1500);
  });
});

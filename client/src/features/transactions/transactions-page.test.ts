import { describe, expect, it } from "vitest";
import { voucherDate, voucherDebitTotal } from "./transactions-page";

describe("voucher list presentation", () => {
  it("presents the stored AD date with its BS equivalent", () => {
    expect(voucherDate("2026-04-14T00:00:00.000Z")).toEqual({
      ad: "2026-04-14",
      bs: "2083-01-01",
    });
  });

  it("calculates the voucher amount from debit entries", () => {
    expect(voucherDebitTotal([{ debit: 1250.5 }, { debit: 249.5 }, { debit: 0 }])).toBe(1500);
  });
});

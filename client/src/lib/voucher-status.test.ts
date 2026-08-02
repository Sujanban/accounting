import { describe, expect, it } from "vitest";
import { formatVoucherStatus } from "./voucher-status";

describe("formatVoucherStatus", () => {
  it("presents the internal posted state using Tally-style terminology", () => {
    expect(formatVoucherStatus("POSTED")).toBe("Regular");
  });

  it("formats the remaining voucher workflow states", () => {
    expect(formatVoucherStatus("DRAFT")).toBe("Draft");
    expect(formatVoucherStatus("SUBMITTED")).toBe("Submitted");
    expect(formatVoucherStatus("APPROVED")).toBe("Approved");
    expect(formatVoucherStatus("REVERSED")).toBe("Reversed");
  });

  it("preserves an unknown server value for forward compatibility", () => {
    expect(formatVoucherStatus("PENDING_REVIEW")).toBe("PENDING_REVIEW");
  });
});

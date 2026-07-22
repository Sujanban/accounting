import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api-client", () => ({ apiClient: vi.fn() }));

import { apiClient } from "../../services/api-client";
import { accountingApi } from "./accounting-api";

const mockApiClient = vi.mocked(apiClient);

describe("accountingApi", () => {
  beforeEach(() => {
    mockApiClient.mockReset();
  });

  it("requests active account groups with an explicit active filter", () => {
    accountingApi.accountGroups(true);

    expect(mockApiClient).toHaveBeenCalledWith(
      "/accounting/account-groups?isActive=true",
      { signal: undefined },
    );
  });

  it("serializes a ledger create request without server-controlled fields", () => {
    const input = {
      name: "Petty Cash",
      groupId: "group-1",
      openingBalance: 5000,
      openingBalanceType: "DEBIT" as const,
      allowManualEntry: true,
      description: "Office cash",
    };

    accountingApi.createLedger(input);

    expect(mockApiClient).toHaveBeenCalledWith("/accounting/ledgers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("uses the dedicated restore endpoints", () => {
    accountingApi.restoreAccountGroup("group-1");
    accountingApi.restoreLedger("ledger-1");

    expect(mockApiClient).toHaveBeenNthCalledWith(1, "/accounting/account-groups/group-1/restore", { method: "PATCH" });
    expect(mockApiClient).toHaveBeenNthCalledWith(2, "/accounting/ledgers/ledger-1/restore", { method: "PATCH" });
  });

  it("updates voucher sequence configuration through its scoped endpoint", () => {
    accountingApi.updateVoucherSequence("sequence-1", {
      prefix: "JV-2083-",
      nextNumber: 8,
      padding: 6,
      resetEveryFiscalYear: true,
    });

    expect(mockApiClient).toHaveBeenCalledWith("/accounting/voucher-sequences/sequence-1", {
      method: "PATCH",
      body: JSON.stringify({ prefix: "JV-2083-", nextNumber: 8, padding: 6, resetEveryFiscalYear: true }),
    });
  });
});

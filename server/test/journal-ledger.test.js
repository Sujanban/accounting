const test = require("node:test");
const assert = require("node:assert/strict");

const { loadWithMocks } = require("./helpers/load-with-mocks");

test("createJournalEntry creates a balanced voucher and journal lines", async () => {
  const createdEntries = [];
  const insertedLines = [];

  const { module: journalService, restore } = loadWithMocks(
    "../../src/services/journalService",
    {
      "./fiscalYearGuardService": {
        assertFiscalYearWritable: async () => ({ isLocked: false })
      },
      "../models/VoucherSequence": {
        VoucherSequence: {
          findOneAndUpdate: async () => ({ currentNumber: 7 })
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            lean: async () => [{ _id: "ledger-a" }, { _id: "ledger-b" }]
          }),
          findOne: async () => ({ _id: "capital-ledger" })
        }
      },
      "../models/JournalEntry": {
        JournalEntry: {
          create: async (payload) => {
            createdEntries.push(payload);
            return { _id: "entry-1", voucherType: "JV", createdAt: new Date(), ...payload };
          },
          find: () => ({
            sort: () => ({
              lean: async () => []
            })
          })
        }
      },
      "../models/JournalLine": {
        JournalLine: {
          insertMany: async (payload) => {
            insertedLines.push(...payload);
            return payload.map((line, index) => ({ _id: `line-${index + 1}`, ...line }));
          },
          find: () => ({
            lean: async () => []
          })
        }
      }
    }
  );

  try {
    const result = await journalService.createJournalEntry({
      companyId: "company-1",
      fiscalYearId: "fy-1",
      date: new Date("2026-07-17T00:00:00Z"),
      narration: "Capital introduced",
      rows: [
        { ledgerId: "ledger-a", debit: 1000, credit: 0, remarks: "Cash" },
        { ledgerId: "ledger-b", debit: 0, credit: 1000, remarks: "Capital" }
      ]
    });

    assert.equal(createdEntries[0].voucherNumber, "JV-000007");
    assert.equal(insertedLines.length, 2);
    assert.equal(result.lines[0].journalEntryId, "entry-1");
  } finally {
    restore();
  }
});

test("createJournalEntry rejects unbalanced rows", async () => {
  const { module: journalService, restore } = loadWithMocks(
    "../../src/services/journalService",
    {
      "./fiscalYearGuardService": {
        assertFiscalYearWritable: async () => ({ isLocked: false })
      },
      "../models/VoucherSequence": {
        VoucherSequence: {
          findOneAndUpdate: async () => ({ currentNumber: 1 })
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            lean: async () => []
          })
        }
      },
      "../models/JournalEntry": {
        JournalEntry: {
          create: async () => {
            throw new Error("should not reach create");
          }
        }
      },
      "../models/JournalLine": {
        JournalLine: {
          insertMany: async () => []
        }
      }
    }
  );

  try {
    await assert.rejects(
      () =>
        journalService.createJournalEntry({
          companyId: "company-1",
          fiscalYearId: "fy-1",
          date: new Date(),
          rows: [
            { ledgerId: "ledger-a", debit: 100, credit: 0 },
            { ledgerId: "ledger-b", debit: 0, credit: 50 }
          ]
        }),
      (error) => error.statusCode === 400 && /balanced/.test(error.message)
    );
  } finally {
    restore();
  }
});

test("createLedger posts an opening balance journal when opening balance is present", async () => {
  const openingJournalCalls = [];

  const { module: ledgerService, restore } = loadWithMocks(
    "../../src/services/ledgerService",
    {
      "./fiscalYearGuardService": {
        assertFiscalYearWritable: async () => ({ isLocked: false })
      },
      "../models/AccountGroup": {
        AccountGroup: {
          find: () => ({
            sort: async () => []
          })
        }
      },
      "../models/Ledger": {
        Ledger: {
          create: async (payload) => ({
            _id: "ledger-new",
            createdAt: new Date("2026-07-17T00:00:00Z"),
            sourceType: "GENERAL",
            sourceId: null,
            ...payload
          }),
          findOne: async () => null,
          find: () => ({
            sort: () => ({
              lean: async () => []
            }),
            lean: async () => []
          })
        }
      },
      "../models/JournalLine": {
        JournalLine: {
          find: () => ({
            populate: () => ({
              sort: () => ({
                lean: async () => []
              })
            }),
            lean: async () => []
          })
        }
      },
      "./journalService": {
        createOpeningBalanceJournal: async (payload) => {
          openingJournalCalls.push(payload);
        }
      }
    }
  );

  try {
    const ledger = await ledgerService.createLedger("company-1", "fy-1", {
      name: "Office Expense",
      accountGroup: "Indirect Expenses",
      openingBalance: 200,
      openingBalanceType: "DEBIT"
    });

    assert.equal(ledger.id, "ledger-new");
    assert.equal(openingJournalCalls.length, 1);
    assert.equal(openingJournalCalls[0].amount, 200);
  } finally {
    restore();
  }
});

test("getTrialBalance combines opening balances and non-opening journal entries", async () => {
  const { module: ledgerService, restore } = loadWithMocks(
    "../../src/services/ledgerService",
    {
      "./fiscalYearGuardService": {
        assertFiscalYearWritable: async () => ({ isLocked: false })
      },
      "../models/AccountGroup": {
        AccountGroup: {
          find: () => ({
            sort: async () => []
          })
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            lean: async () => [
              {
                _id: "cash",
                name: "Cash in Hand",
                openingBalance: 100,
                openingBalanceType: "DEBIT",
                isActive: true
              },
              {
                _id: "capital",
                name: "Capital",
                openingBalance: 100,
                openingBalanceType: "CREDIT",
                isActive: true
              }
            ]
          })
        }
      },
      "../models/JournalLine": {
        JournalLine: {
          find: () => ({
            lean: async () => [
              { ledgerId: "cash", debit: 50, credit: 0 },
              { ledgerId: "capital", debit: 0, credit: 50 }
            ]
          })
        }
      },
      "../models/JournalEntry": {
        JournalEntry: {
          find: () => ({
            lean: async () => [{ _id: "entry-1", sourceType: "MANUAL" }]
          })
        }
      },
      "./journalService": {
        createOpeningBalanceJournal: async () => {}
      }
    }
  );

  try {
    const result = await ledgerService.getTrialBalance("company-1", "fy-1");

    assert.equal(result.isBalanced, true);
    assert.deepEqual(result.totals, { debit: 150, credit: 150 });
  } finally {
    restore();
  }
});

test("createJournalEntry rejects writes to locked fiscal years", async () => {
  const { module: journalService, restore } = loadWithMocks(
    "../../src/services/journalService",
    {
      "./fiscalYearGuardService": {
        assertFiscalYearWritable: async () => {
          const error = new Error("locked");
          error.statusCode = 403;
          error.errorCode = "FISCAL_YEAR_LOCKED";
          throw error;
        }
      },
      "../models/VoucherSequence": {
        VoucherSequence: {
          findOneAndUpdate: async () => ({ currentNumber: 1 })
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            lean: async () => [{ _id: "ledger-a" }, { _id: "ledger-b" }]
          })
        }
      },
      "../models/JournalEntry": {
        JournalEntry: {
          create: async () => {
            throw new Error("should not create");
          }
        }
      },
      "../models/JournalLine": {
        JournalLine: {
          insertMany: async () => []
        }
      }
    }
  );

  try {
    await assert.rejects(
      () =>
        journalService.createJournalEntry({
          companyId: "company-1",
          fiscalYearId: "fy-locked",
          date: new Date(),
          rows: [
            { ledgerId: "ledger-a", debit: 100, credit: 0 },
            { ledgerId: "ledger-b", debit: 0, credit: 100 }
          ]
        }),
      (error) => error.statusCode === 403 && error.errorCode === "FISCAL_YEAR_LOCKED"
    );
  } finally {
    restore();
  }
});

const ACCOUNT_GROUPS = Object.freeze({
  CURRENT_ASSETS: Object.freeze({
    systemCode: "CURRENT_ASSETS",
    category: "Assets",
    name: "Current Assets"
  }),
  FIXED_ASSETS: Object.freeze({
    systemCode: "FIXED_ASSETS",
    category: "Assets",
    name: "Fixed Assets"
  }),
  INVESTMENTS: Object.freeze({
    systemCode: "INVESTMENTS",
    category: "Assets",
    name: "Investments"
  }),
  CURRENT_LIABILITIES: Object.freeze({
    systemCode: "CURRENT_LIABILITIES",
    category: "Liabilities",
    name: "Current Liabilities"
  }),
  LONG_TERM_LIABILITIES: Object.freeze({
    systemCode: "LONG_TERM_LIABILITIES",
    category: "Liabilities",
    name: "Long-term Liabilities"
  }),
  CAPITAL_ACCOUNT: Object.freeze({
    systemCode: "CAPITAL_ACCOUNT",
    category: "Equity",
    name: "Capital Account"
  }),
  RETAINED_EARNINGS: Object.freeze({
    systemCode: "RETAINED_EARNINGS",
    category: "Equity",
    name: "Retained Earnings"
  }),
  DIRECT_INCOME: Object.freeze({
    systemCode: "DIRECT_INCOME",
    category: "Income",
    name: "Direct Income"
  }),
  INDIRECT_INCOME: Object.freeze({
    systemCode: "INDIRECT_INCOME",
    category: "Income",
    name: "Indirect Income"
  }),
  DIRECT_EXPENSES: Object.freeze({
    systemCode: "DIRECT_EXPENSES",
    category: "Expenses",
    name: "Direct Expenses"
  }),
  INDIRECT_EXPENSES: Object.freeze({
    systemCode: "INDIRECT_EXPENSES",
    category: "Expenses",
    name: "Indirect Expenses"
  })
});

const LEDGERS = Object.freeze({
  CASH: Object.freeze({
    systemCode: "CASH",
    name: "Cash in Hand",
    accountGroupCode: ACCOUNT_GROUPS.CURRENT_ASSETS.systemCode
  }),
  BANK: Object.freeze({
    systemCode: "BANK",
    name: "Bank Account",
    accountGroupCode: ACCOUNT_GROUPS.CURRENT_ASSETS.systemCode
  }),
  INVENTORY: Object.freeze({
    systemCode: "INVENTORY",
    name: "Inventory",
    accountGroupCode: ACCOUNT_GROUPS.CURRENT_ASSETS.systemCode
  }),
  ACCOUNTS_RECEIVABLE: Object.freeze({
    systemCode: "ACCOUNTS_RECEIVABLE",
    name: "Accounts Receivable",
    accountGroupCode: ACCOUNT_GROUPS.CURRENT_ASSETS.systemCode
  }),
  ACCOUNTS_PAYABLE: Object.freeze({
    systemCode: "ACCOUNTS_PAYABLE",
    name: "Accounts Payable",
    accountGroupCode: ACCOUNT_GROUPS.CURRENT_LIABILITIES.systemCode
  }),
  CAPITAL: Object.freeze({
    systemCode: "CAPITAL",
    name: "Capital",
    accountGroupCode: ACCOUNT_GROUPS.CAPITAL_ACCOUNT.systemCode
  }),
  SALES: Object.freeze({
    systemCode: "SALES",
    name: "Sales",
    accountGroupCode: ACCOUNT_GROUPS.DIRECT_INCOME.systemCode
  }),
  PURCHASE: Object.freeze({
    systemCode: "PURCHASE",
    name: "Purchase",
    accountGroupCode: ACCOUNT_GROUPS.DIRECT_EXPENSES.systemCode
  }),
  SALARY_EXPENSE: Object.freeze({
    systemCode: "SALARY_EXPENSE",
    name: "Salary Expense",
    accountGroupCode: ACCOUNT_GROUPS.INDIRECT_EXPENSES.systemCode
  }),
  RENT_EXPENSE: Object.freeze({
    systemCode: "RENT_EXPENSE",
    name: "Rent Expense",
    accountGroupCode: ACCOUNT_GROUPS.INDIRECT_EXPENSES.systemCode
  }),
  ELECTRICITY_EXPENSE: Object.freeze({
    systemCode: "ELECTRICITY_EXPENSE",
    name: "Electricity Expense",
    accountGroupCode: ACCOUNT_GROUPS.INDIRECT_EXPENSES.systemCode
  }),
  INTERNET_EXPENSE: Object.freeze({
    systemCode: "INTERNET_EXPENSE",
    name: "Internet Expense",
    accountGroupCode: ACCOUNT_GROUPS.INDIRECT_EXPENSES.systemCode
  }),
  MISCELLANEOUS_EXPENSE: Object.freeze({
    systemCode: "MISCELLANEOUS_EXPENSE",
    name: "Miscellaneous Expense",
    accountGroupCode: ACCOUNT_GROUPS.INDIRECT_EXPENSES.systemCode
  })
});

const VOUCHER_TYPES = Object.freeze({
  JOURNAL: "JV",
  SALES: "SV",
  PURCHASE: "PV",
  RECEIPT: "RV",
  PAYMENT: "PMV",
  CONTRA: "CV"
});

const DEFAULT_ACCOUNT_GROUPS = Object.freeze(Object.values(ACCOUNT_GROUPS));
const DEFAULT_LEDGERS = Object.freeze(Object.values(LEDGERS));
const DEFAULT_VOUCHER_SEQUENCES = Object.freeze(Object.values(VOUCHER_TYPES));

const ACCOUNT_GROUP_NAME_BY_CODE = Object.freeze(
  DEFAULT_ACCOUNT_GROUPS.reduce((accumulator, group) => {
    accumulator[group.systemCode] = group.name;
    return accumulator;
  }, {})
);

module.exports = {
  ACCOUNT_GROUPS,
  LEDGERS,
  VOUCHER_TYPES,
  DEFAULT_ACCOUNT_GROUPS,
  DEFAULT_LEDGERS,
  DEFAULT_VOUCHER_SEQUENCES,
  ACCOUNT_GROUP_NAME_BY_CODE
};

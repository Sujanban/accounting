# Phase 2 – Accounting Foundation (V1)

## Overview

The purpose of Phase 2 is to build the accounting engine that powers the entire application.

This phase does **NOT** focus on Sales, Purchases, or Inventory transactions. Instead, it establishes the accounting structure required before any business transaction can occur.

The design should follow industry-standard accounting practices inspired by software such as TallyPrime while providing a modern web experience.

---

# Objectives

At the end of this phase the system should support:

- Company-specific Chart of Accounts
- Fiscal Year Management
- Account Groups
- Ledger Accounts
- Opening Balances
- Customers
- Suppliers
- Products
- Manual Journal Entries
- General Ledger
- Trial Balance

Every resource must be isolated by `companyId`.

---

# Module 1 – Chart of Accounts

## Description

The Chart of Accounts (COA) is the backbone of the accounting system.

Every financial transaction will reference one or more ledger accounts.

The application should automatically create a default chart of accounts during company onboarding.

---

## Account Groups (Default)

### Assets

- Current Assets
- Fixed Assets
- Investments

### Liabilities

- Current Liabilities
- Long-term Liabilities

### Equity

- Capital Account
- Retained Earnings

### Income

- Direct Income
- Indirect Income

### Expenses

- Direct Expenses
- Indirect Expenses

---

## Default Ledgers

### Assets

- Cash in Hand
- Bank Account
- Inventory
- Accounts Receivable

### Liabilities

- Accounts Payable

### Equity

- Capital

### Income

- Sales

### Expenses

- Purchase
- Salary Expense
- Rent Expense
- Electricity Expense
- Internet Expense
- Miscellaneous Expense

---

# Ledger Model

Each ledger should contain

| Field | Type | Required |
|--------|------|----------|
| companyId | ObjectId | Yes |
| name | String | Yes |
| code | String | Optional |
| accountGroup | Enum | Yes |
| parentLedger | ObjectId | Optional |
| openingBalance | Number | Yes |
| openingBalanceType | Debit/Credit | Yes |
| description | String | Optional |
| isSystem | Boolean | Yes |
| isActive | Boolean | Yes |
| createdAt | Date | Yes |

---

# Ledger Operations

Allow users to

- View Ledgers
- Search
- Filter
- Create Ledger
- Edit Ledger
- Archive Ledger

Do NOT allow deleting a ledger if transactions exist.

---

# Module 2 – Fiscal Year

Support Nepali Fiscal Year.

Example

```
2082/83

Start
2082-04-01

End
2083-03-31
```

---

## Fiscal Year Fields

| Field | Type |
|--------|------|
| companyId | ObjectId |
| name | String |
| startDateBS | String |
| endDateBS | String |
| startDateAD | Date |
| endDateAD | Date |
| isActive | Boolean |
| isLocked | Boolean |

---

## Features

- View Fiscal Years
- Create Fiscal Year
- Switch Fiscal Year
- Lock Fiscal Year

Future

- Close Fiscal Year
- Carry Forward Balances

---

# Module 3 – Customers

Customers are specialized ledger accounts.

Each customer automatically creates a ledger under

```
Assets
    Accounts Receivable
```

---

## Fields

| Field | Required |
|--------|----------|
| Customer Name | Yes |
| Phone | Optional |
| Email | Optional |
| PAN Number | Optional |
| Address | Optional |
| Opening Balance | Optional |
| Opening Balance Type | Debit/Credit |

---

## Features

- Create
- Edit
- Archive
- View Outstanding Balance

---

# Module 4 – Suppliers

Suppliers are specialized ledger accounts.

Automatically create ledger under

```
Liabilities

Accounts Payable
```

---

## Fields

| Field | Required |
|--------|----------|
| Supplier Name | Yes |
| Phone | Optional |
| Email | Optional |
| PAN Number | Optional |
| Address | Optional |
| Opening Balance | Optional |
| Opening Balance Type | Debit/Credit |

---

# Module 5 – Product Master

Products will be used later in Sales and Purchase modules.

No stock movement yet.

---

## Fields

| Field | Required |
|--------|----------|
| Product Name | Yes |
| SKU | Optional |
| Category | Optional |
| Unit | Yes |
| Purchase Price | Optional |
| Selling Price | Optional |
| Opening Quantity | Optional |
| Opening Rate | Optional |
| Minimum Stock | Optional |
| Barcode | Optional |
| Description | Optional |
| Active | Yes |

---

## Units

Default

- Piece
- Box
- Packet
- Kg
- Gram
- Liter
- Meter
- Feet

Allow custom units.

---

# Module 6 – Opening Balances

Businesses already have balances before using the software.

Allow entering

- Cash
- Bank
- Inventory
- Customer Balance
- Supplier Balance
- Ledger Balance

Opening balances should automatically create Opening Journal Entries.

---

# Module 7 – Manual Journal Entry

This module should closely resemble Tally's Journal Voucher.

---

## Voucher Fields

| Field | Required |
|--------|----------|
| Voucher Number | Auto |
| Date | Yes |
| Fiscal Year | Yes |
| Narration | Optional |

---

## Journal Rows

Each row contains

| Field |
|------|
| Ledger |
| Debit |
| Credit |
| Remarks |

---

## Validation Rules

At least two rows.

Debit total must equal Credit total.

Cannot save unbalanced journal.

---

## Example

| Ledger | Debit | Credit |
|---------|-------|--------|
| Cash | 10000 | |
| Capital | |10000 |

---

# Module 8 – General Ledger

Every ledger automatically displays transaction history.

Example

```
Cash in Hand

Opening Balance

100000 Dr

Journal Voucher

+25000

Expense Voucher

-5000

Closing Balance

120000 Dr
```

---

## Features

- Filter by Date
- Filter by Fiscal Year
- Export PDF
- Export Excel

---

# Module 9 – Trial Balance

Generate automatically.

Columns

| Ledger | Debit | Credit |

Rules

- Opening Balance included
- Journal Entries included
- Running Balance calculated

Validation

```
Total Debit == Total Credit
```

If not balanced, indicate an accounting error.

---

# Module 10 – Voucher Numbering

Automatically generate numbers.

Example

```
JV-000001

JV-000002

JV-000003
```

Each company maintains its own numbering sequence.

---

# Module 11 – Dashboard (Accounting)

Display

- Active Fiscal Year
- Cash Balance
- Bank Balance
- Total Receivable
- Total Payable
- Number of Customers
- Number of Suppliers
- Number of Products
- Trial Balance Status

---

# Database Collections

```
account_groups

ledgers

customers

suppliers

products

journal_entries

journal_lines

fiscal_years

voucher_sequences
```

---

# Relationships

```
Company
│
├── Fiscal Years
│
├── Account Groups
│
├── Ledgers
│       │
│       ├── Customers
│       ├── Suppliers
│       └── Products
│
├── Journal Entries
│       │
│       └── Journal Lines
│
└── Voucher Sequences
```

---

# Business Rules

- Every ledger belongs to one company.
- Customers automatically create Accounts Receivable ledgers.
- Suppliers automatically create Accounts Payable ledgers.
- Opening balances must generate journal entries.
- Journal entries cannot be edited after posting (future enhancement may allow reversal vouchers).
- Deleting posted accounting data is prohibited; archive instead.
- Every journal entry must balance (Total Debit = Total Credit).
- Every record must include `companyId` and `fiscalYearId`.
- Journal vouchers should be immutable once posted.

---

# Future Modules (Not in Phase 2)

- Sales Voucher
- Purchase Voucher
- Payment Voucher
- Receipt Voucher
- Contra Voucher
- Inventory Stock Movement
- VAT Register
- Profit & Loss
- Balance Sheet
- Cash Book
- Bank Book
- Day Book
- Stock Ledger
- Cost Centers
- Payroll

---

# Definition of Done

Phase 2 is complete when:

- ✅ Default Chart of Accounts is generated during onboarding.
- ✅ Users can manage Ledgers.
- ✅ Nepali Fiscal Years can be created and switched.
- ✅ Customers and Suppliers automatically create corresponding ledger accounts.
- ✅ Products can be created.
- ✅ Opening Balances generate journal entries.
- ✅ Manual Journal Voucher supports balanced double-entry accounting.
- ✅ General Ledger displays all posted entries.
- ✅ Trial Balance is generated automatically and always balances.
- ✅ All data is scoped to `companyId` and `fiscalYearId`.
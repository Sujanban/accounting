# Phase 2 — Accounting Foundation

## Objective

Build the complete accounting configuration required before recording financial transactions.

After this phase, the ERP should have a configurable accounting structure similar to TallyPrime, ERPNext, and SAP Business One.

No business transactions are recorded in this phase.

---

# Modules

```
Accounting Foundation

├── Chart of Accounts
├── Account Groups
├── Ledgers
├── Voucher Numbering
├── Fiscal Lock Rules
└── Accounting Preferences
```

---

# Module 1 — Chart of Accounts

The Chart of Accounts is the heart of the accounting system.

It consists of:

- Account Groups
- Ledgers

Display as a hierarchical tree.

Example

```
Assets

    Current Assets

        Cash

        Bank

Liabilities

    Current Liabilities

        Accounts Payable
```

---

# Module 2 — Account Groups

## Default Groups

Assets

- Current Assets
- Fixed Assets
- Investments

Liabilities

- Current Liabilities
- Long-Term Liabilities

Equity

- Capital
- Retained Earnings

Income

- Direct Income
- Indirect Income

Expenses

- Direct Expenses
- Indirect Expenses

---

## Fields

- companyId
- systemCode
- name
- type
- parentId
- description
- isSystem
- isActive

---

## Rules

- Unlimited nesting
- System groups cannot be deleted
- Users may create custom groups
- Archive instead of delete

---

# Module 3 — Ledgers

Default System Ledgers

Assets

- Cash in Hand
- Bank Account
- Inventory
- Accounts Receivable

Liabilities

- Accounts Payable

Equity

- Capital

Income

- Sales

Expenses

- Purchase
- Salary Expense
- Rent Expense
- Electricity Expense
- Miscellaneous Expense

---

## Ledger Fields

- companyId
- groupId
- systemCode
- name
- openingBalance
- openingBalanceType
- description
- allowManualEntry
- isSystem
- isActive

---

## Rules

- Names must be unique within a company
- System ledgers cannot be deleted
- Archive instead of delete
- Business logic references systemCode

---

# Module 4 — Voucher Numbering

Maintain numbering for each voucher type.

Examples

```
JV

SV

PV

RV

CV

PMV
```

Example Number

```
SV-2082-000001
```

Fields

- companyId
- fiscalYearId
- voucherType
- prefix
- nextNumber
- padding
- resetEveryFiscalYear

---

# Module 5 — Fiscal Lock Rules

Allow companies to prevent changes to closed accounting periods.

Settings

- Lock Before Date
- Lock Closed Fiscal Year
- Allow Admin Override

Rules

Reject posting when transaction date is before the lock date.

---

# Module 6 — Accounting Preferences

Extend the existing company settings document.

Example

```json
{
  "accounting": {
    "voucherNumbering": "AUTO",
    "decimalPlaces": 2,
    "allowJournalEditing": false,
    "lockAfterClosing": true,
    "defaultVoucherView": "STANDARD"
  }
}
```

Future support

- Multi Currency
- Cost Centers
- Foreign Exchange
- Financial Year Lock

---

# Collections

accountGroups

ledgers

voucherSequences

Reuse

settings

fiscalYears

---

# APIs

## Account Groups

GET /account-groups

POST /account-groups

PATCH /account-groups/:id

DELETE /account-groups/:id

---

## Ledgers

GET /ledgers

POST /ledgers

PATCH /ledgers/:id

DELETE /ledgers/:id

---

## Chart of Accounts

GET /chart-of-accounts

Returns the complete hierarchy.

---

## Voucher Sequences

GET /voucher-sequences

PATCH /voucher-sequences/:id

---

# Folder Structure

```
modules/

accounting/

    chart-of-accounts/

    account-groups/

    ledgers/

    voucher-sequences/
```

---

# Validation

Account Groups

- Unique name per company
- Valid parent
- No circular hierarchy

Ledgers

- Unique name per company
- Valid group
- Valid opening balance
- Immutable systemCode

Voucher Sequences

- Unique voucher type per fiscal year
- Prefix validation
- Positive sequence numbers

---

# Permissions

Owner

- Full access

Admin

- CRUD

Accountant

- Create
- Update
- Read

Staff

- Read only

---

# Business Rules

- One Chart of Accounts per company
- Unlimited account groups
- Unlimited ledgers
- Company isolation required
- Fiscal year awareness required
- Opening balances editable until first posted transaction
- Voucher numbers unique within fiscal year
- System records are archived instead of deleted
- Business logic uses systemCode instead of display name

---

# Out of Scope

This phase does not include:

- Contacts
- Customers
- Suppliers
- Products
- Categories
- Units
- Warehouses
- Inventory
- Sales
- Purchases
- Payments
- Receipts
- Journal Entries
- Financial Reports

---

# Definition of Done

- ✅ Chart of Accounts implemented
- ✅ Hierarchical Account Groups implemented
- ✅ Default system groups generated
- ✅ Default system ledgers generated
- ✅ Custom groups supported
- ✅ Custom ledgers supported
- ✅ Voucher numbering engine completed
- ✅ Fiscal lock rules implemented
- ✅ Accounting preferences added
- ✅ Company isolation enforced
- ✅ Soft delete/archive implemented
- ✅ Audit metadata available
- ✅ Ready for Phase 3 — Business Masters
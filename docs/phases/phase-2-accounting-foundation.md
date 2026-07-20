# Phase 2 — Accounting Foundation

Version: 1.0

Status: Planned

Prerequisite:
- Phase 0 — Architecture Improvements
- Phase 1 — Foundation

---

# Objective

Build the accounting foundation of the ERP.

This phase creates the accounting structure required before any financial transactions can be recorded.

This phase DOES NOT include:

- Sales
- Purchase
- Inventory
- Customers
- Suppliers
- Reports

Those belong to later phases.

---

# Architecture Principles

The accounting module must follow these principles.

## 1. Configuration First

Accounting is configuration.

Transactions come later.

Users first configure:

- Chart of Accounts
- Ledgers
- Voucher Sequences
- Accounting Preferences

Only after this should business transactions be allowed.

---

## 2. Journal Driven

Never update balances directly.

Future vouchers must generate Journal Entries.

Example

Sales Invoice

↓

Journal Entry

↓

General Ledger

↓

Reports

---

## 3. Company Isolation

Every document belongs to exactly one company.

Every query must automatically filter by

companyId

Never accept companyId from client requests.

---

## 4. Fiscal Year Aware

Voucher numbering

Accounting settings

Future reports

must always be aware of the active Nepali Fiscal Year.

---

## 5. System Codes

Never reference records by name.

Wrong

Cash in Hand

Correct

CASH

System codes never change.

Display names may change.

---

# Module Structure

Accounting

├── Chart of Accounts
├── Account Groups
├── Ledgers
├── Voucher Sequences
├── Fiscal Lock
└── Accounting Preferences

---

# Module 1 — Chart of Accounts

Purpose

Display the accounting hierarchy.

The Chart of Accounts contains

- Account Groups
- Ledgers

The UI should use a tree structure.

Example

Assets
    Current Assets
        Cash
        Bank

Liabilities
    Current Liabilities
        Accounts Payable

Requirements

- Tree View
- Expand / Collapse
- Search
- Filter
- Archive
- Restore

No transactions are shown here.

---

# Module 2 — Account Groups

Purpose

Organize ledgers into a hierarchy.

Default System Groups

Assets

Current Assets

Fixed Assets

Investments

Liabilities

Current Liabilities

Long-Term Liabilities

Equity

Capital

Retained Earnings

Income

Direct Income

Indirect Income

Expenses

Direct Expenses

Indirect Expenses

Fields

- companyId
- systemCode
- name
- parentId
- type
- description
- isSystem
- isActive

Rules

- Unlimited nesting
- System groups cannot be deleted
- Users may create custom groups
- Archive instead of delete

---

# Module 3 — Ledgers

Purpose

Every accounting transaction posts to ledgers.

Default System Ledgers

Cash in Hand

Bank Account

Inventory

Accounts Receivable

Accounts Payable

Capital

Sales

Purchase

Salary Expense

Rent Expense

Electricity Expense

Misc Expense

Fields

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

Rules

Names

must be unique within company.

System ledgers

cannot be deleted.

If transactions exist

archive instead.

Business logic always uses

systemCode

instead of name.

---

# Module 4 — Voucher Sequences

Purpose

Generate unique voucher numbers.

Supported Types

JV

SV

PV

RV

CV

PMV

Format

SV-2082-000001

Configuration

- Prefix
- Padding
- Current Number
- Reset Every Fiscal Year

Rules

Unique

companyId

voucherType

fiscalYearId

---

# Module 5 — Fiscal Lock

Purpose

Prevent modification of closed accounting periods.

Settings

Lock Before Date

Allow Admin Override

Lock Closed Fiscal Year

Rule

Transactions earlier than the lock date are rejected.

---

# Module 6 — Accounting Preferences

Extend

settings.accounting

Example

decimalPlaces

voucherNumbering

lockAfterClosing

allowManualJournal

Future

Cost Centers

Foreign Currency

Financial Year Closing

---

# Default Initialization

When a company is created

CompanyInitializationService should automatically create

Default Account Groups

↓

Default Ledgers

↓

Voucher Sequences

↓

Accounting Settings

Never create these inside controllers.

---

# MongoDB Collections

accountGroups

ledgers

voucherSequences

Reuse

settings

fiscalYears

No additional collections.

---

# Required Indexes

Account Groups

companyId

systemCode

parentId

Ledgers

companyId

systemCode

groupId

name

Voucher Sequences

companyId

voucherType

fiscalYearId

---

# APIs

Chart of Accounts

GET /chart-of-accounts

Account Groups

GET /account-groups

POST /account-groups

PATCH /account-groups/:id

DELETE /account-groups/:id

Ledgers

GET /ledgers

POST /ledgers

PATCH /ledgers/:id

DELETE /ledgers/:id

Voucher Sequences

GET /voucher-sequences

PATCH /voucher-sequences/:id

---

# Validation

Account Groups

- Unique name
- Valid parent
- No circular hierarchy

Ledgers

- Unique name
- Valid group
- Immutable systemCode
- Valid opening balance

Voucher Sequences

- Unique voucher type per fiscal year
- Positive sequence

---

# Permissions

Owner

Full Access

Admin

Create

Update

Delete

Accountant

Create

Update

Read

Staff

Read Only

---

# Soft Delete

Never permanently delete

- Groups
- Ledgers

Archive instead.

---

# Audit Fields

Every document must contain

createdBy

updatedBy

createdAt

updatedAt

deletedAt

deletedBy

---

# Out of Scope

This phase must NOT implement

Customers

Suppliers

Products

Inventory

Sales

Purchase

Receipt

Payment

Journal Entries

Reports

These belong to future phases.

---

# Folder Structure

modules/

accounting/

    chart-of-accounts/

    account-groups/

    ledgers/

    voucher-sequences/

---

# Definition of Done

The phase is complete when:

✓ Chart of Accounts implemented

✓ Tree hierarchy implemented

✓ Default Account Groups generated

✓ Default Ledgers generated

✓ Custom Groups supported

✓ Custom Ledgers supported

✓ Voucher numbering implemented

✓ Fiscal Lock implemented

✓ Accounting preferences implemented

✓ Soft Delete implemented

✓ Audit metadata implemented

✓ Company isolation enforced

✓ Fiscal Year awareness implemented

✓ Business logic uses immutable systemCode

✓ Ready for Phase 3 — Business Masters

---

# Important Notes for Developers

- Never reference ledgers or groups by display name.
- Always use immutable `systemCode`.
- Keep accounting independent of customers, products, and inventory.
- Do not store running balances on ledgers; balances will be derived from journal entries in later phases.
- Do not generate financial reports in this phase.
- All accounting records are company-scoped.
- All destructive operations should archive records instead of deleting them.
- Build services so future modules (Sales, Purchase, Payroll, Inventory, POS) can reuse the accounting foundation without modification.
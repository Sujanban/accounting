# Phase 4 — Transaction Engine

Version: 1.0

Status: Implemented

## Frontend delivery

Status: Implemented

Implement paginated all-voucher and draft lists plus transaction detail, draft edit, post, and reverse flows using `/api/transactions`. Posted and reversed records remain read-only and destructive actions require confirmation.

Prerequisites

- ✅ Phase 0 — Architecture Improvements
- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Accounting Foundation
- ✅ Phase 3 — Business Masters

---

# Objective

Build the core transaction engine of the ERP.

This is the heart of the entire application.

Every financial module must use this engine.

Examples

Sales Invoice

Purchase Bill

Receipt

Payment

Contra

Journal

Expense

Inventory Adjustment

Stock Transfer

Future modules like Payroll, POS, Manufacturing and Fixed Assets will also use this engine.

---

# Philosophy

Do NOT build business logic inside voucher modules.

Voucher modules are only UI.

The Transaction Engine contains all business rules.

Example

Sales Invoice

↓

Transaction Engine

↓

Validation

↓

Inventory

↓

Journal Posting

↓

Completed

---

# Architecture

```

Voucher

↓

Transaction Builder

↓

Validation Engine

↓

Inventory Engine

↓

Accounting Engine

↓

Journal Engine

↓

Posting Engine

↓

Database Transaction

↓

Completed

```

---

# Modules

```

Transaction Engine

├── Transaction Builder
├── Validation Engine
├── Posting Engine
├── Journal Engine
├── Inventory Engine
├── Draft Manager
├── Approval Workflow
├── Transaction Reversal
├── Transaction Events
└── Audit Trail

```

---

# Module 1 — Transaction Builder

Purpose

Convert voucher input into a standardized transaction.

Every voucher produces the same structure.

Example

```ts
{
    transactionType: "SALE",
    transactionDate,
    fiscalYearId,
    companyId,
    referenceNo,
    narration,

    items: [],

    accountingEntries: [],

    inventoryEntries: []
}
```

Voucher modules should never directly update MongoDB.

---

# Module 2 — Validation Engine

Purpose

Validate every transaction before posting.

Validation Order

Company

↓

Fiscal Year

↓

Permission

↓

Business Rules

↓

Accounting Rules

↓

Inventory Rules

↓

Voucher Rules

↓

Completed

---

Validate

✓ Company exists

✓ Active fiscal year

✓ Voucher date

✓ Locked period

✓ Ledger exists

✓ Product exists

✓ Warehouse exists

✓ Tax exists

✓ Quantity > 0

✓ Amount > 0

✓ Debit = Credit

---

# Module 3 — Accounting Engine

Purpose

Generate accounting entries.

Never manually insert journals.

Example

Sales

```

Dr Accounts Receivable

Cr Sales

Cr VAT Payable

```

Payment

```

Dr Bank

Cr Accounts Receivable

```

Every accounting operation produces journal entries.

---

# Module 4 — Journal Engine

Purpose

Store double-entry accounting.

Collections

journals

journalLines

Structure

Journal

↓

Multiple Journal Lines

Example

```

Journal

↓

Cash

Dr 5000

↓

Sales

Cr 4425

↓

VAT

Cr 575

```

Rules

Debit must equal Credit.

Never allow imbalance.

---

# Module 5 — Inventory Engine

Purpose

Generate stock movement.

Do NOT store stock inside Products.

Collections

inventoryMovements

Movement Types

Purchase

Sale

Transfer

Adjustment

Opening Balance

Stock Count

Example

Sale

```

Product

↓

Warehouse

↓

Quantity

↓

Out

```

Stock is calculated from movements.

---

# Module 6 — Posting Engine

Purpose

Coordinate everything.

Flow

```

Validate

↓

Generate Journals

↓

Generate Inventory Movement

↓

Generate Voucher Number

↓

Save Everything

↓

Commit Transaction

```

Use MongoDB Session Transaction.

Either

Everything saves

OR

Nothing saves.

---

# Module 7 — Draft Manager

Transactions can exist as

Draft

Posted

Cancelled

Draft

Editable

Posted

Locked

Cancelled

Read Only

---

# Module 8 — Approval Workflow

Future Ready

Draft

↓

Submitted

↓

Approved

↓

Posted

↓

Completed

Initial implementation

Auto Approve

---

# Module 9 — Transaction Reversal

Never delete posted transactions.

Instead

Reverse them.

Example

```

Original

↓

Reversal Journal

↓

Status

Reversed

```

History remains.

---

# Module 10 — Events

Every successful transaction emits events.

Examples

TransactionPosted

InventoryUpdated

JournalCreated

VoucherCreated

Future

Notification

Analytics

Webhook

---

# Voucher Types

Supported

Journal

Receipt

Payment

Contra

Sales

Purchase

Expense

Opening Balance

Future

Sales Return

Purchase Return

Credit Note

Debit Note

Payroll

Asset Purchase

---

# MongoDB Collections

transactions

journals

journalLines

inventoryMovements

voucherNumbers

draftTransactions

---

# Folder Structure

```

modules/

transactions/

builder/

validation/

posting/

journal/

inventory/

draft/

approval/

events/

services/

repositories/

dto/

```

---

# APIs

POST /transactions/draft

PATCH /transactions/:id

POST /transactions/:id/post

POST /transactions/:id/reverse

GET /transactions

GET /transactions/:id

---

# Business Rules

Every transaction belongs to

company

Every transaction belongs to

fiscal year

Every posted transaction

creates journals

Inventory products

create stock movement

Service products

do not create stock movement

Debit must equal Credit

Posted transactions cannot be edited

Cancelled transactions cannot be posted

---

# MongoDB Transaction

Everything executes inside one session.

```

Start Session

↓

Validate

↓

Insert Journal

↓

Insert Journal Lines

↓

Insert Inventory

↓

Update Sequence

↓

Commit

```

Rollback on any error.

---

# Permissions

Owner

Everything

Admin

Everything

Accountant

Create

Update Draft

Post

Reverse

Sales

Create Sales

Read Sales

Inventory

Inventory Transactions

Staff

Read

---

# Validation

Fiscal Year Open

Company Exists

Permission

Voucher Number

Ledger Exists

Warehouse Exists

Product Exists

Balanced Journal

Positive Amount

Positive Quantity

Unique Voucher

---

# Performance

Indexes

companyId

transactionDate

voucherNumber

status

voucherType

journalId

warehouseId

productId

---

# Future Integration

Uses

Accounting Foundation

Business Masters

Provides Data To

Reports

Dashboard

Cash Flow

Balance Sheet

Trial Balance

Profit & Loss

Inventory Reports

---

# Out of Scope

Do NOT build

Sales UI

Purchase UI

Receipt UI

Payment UI

Reports

VAT Reports

Those belong to Phase 5 and Phase 6.

---

# Definition of Done

✓ Generic Transaction Engine implemented

✓ Validation Engine completed

✓ Journal Engine completed

✓ Inventory Engine completed

✓ Posting Engine completed

✓ Draft support completed

✓ Reversal support completed

✓ MongoDB transactions implemented

✓ Event system integrated

✓ Company isolation enforced

✓ Fiscal year validation implemented

✓ Ready for Phase 5

---

# Developer Notes

## Golden Rules

1. Never update balances directly.

Always generate Journal Entries.

---

2. Never store stock quantity on Product.

Always calculate from Inventory Movements.

---

3. Voucher modules must never contain accounting logic.

Only Transaction Engine contains business logic.

---

4. Every database operation during posting must use a MongoDB transaction session.

---

5. Never delete posted transactions.

Always reverse them.

---

6. Every transaction must be traceable through audit metadata.

---

7. Every future module (Sales, Purchase, Payroll, POS, Manufacturing, Fixed Assets) must call the Transaction Engine instead of implementing its own posting logic.

This engine becomes the single source of truth for all financial and inventory transactions.

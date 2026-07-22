# Phase 5 — Voucher Modules

Version: 1.0

Status: Planned

## Frontend delivery

Status: Planned

Replace voucher-create placeholders with typed, shared form flows for sales, purchase, receipt, payment, contra, journal, expense, returns, notes, and opening balance; each uses its dedicated create/post API and protects against duplicate submission.

Prerequisites

- ✅ Phase 0 — Architecture Improvements
- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Accounting Foundation
- ✅ Phase 3 — Business Masters
- ✅ Phase 4 — Transaction Engine

---

# Objective

Build the business-facing voucher modules that users interact with daily.

Unlike Phase 4, this phase **does not contain accounting logic**.

Every voucher is responsible only for:

- Collecting user input
- Validating form data
- Building a transaction document
- Sending it to the Transaction Engine
- Displaying the result

The Transaction Engine remains the only component allowed to create:

- Journal Entries
- Inventory Movements
- Voucher Numbers
- Financial Transactions

---

# Design Philosophy

Voucher Modules are UI + Business Documents.

Transaction Engine is Business Logic.

Never place accounting rules inside voucher modules.

Wrong

```
Sales Module

↓

Create Journal

↓

Update Stock

↓

Update Customer Balance
```

Correct

```
Sales Module

↓

Create Sales Document

↓

Transaction Engine

↓

Accounting

↓

Inventory

↓

Journal

↓

Completed
```

---

# Module Structure

```
Voucher Modules

├── Sales
├── Purchase
├── Receipt
├── Payment
├── Contra
├── Journal
├── Expense
├── Debit Note
├── Credit Note
├── Sales Return
├── Purchase Return
└── Opening Balance
```

---

# Voucher Lifecycle

```
Create

↓

Draft

↓

Validate

↓

Submit

↓

Transaction Engine

↓

Posted

↓

Locked
```

Posted vouchers are immutable.

Corrections should use reversal or amendment.

---

# Common Voucher Structure

Every voucher should contain

Header

- Voucher Number
- Voucher Date
- Fiscal Year
- Branch (future)
- Company
- Status
- Reference Number
- Narration

Body

- Items / Ledgers

Footer

- Total
- Tax
- Grand Total

Audit

- Created By
- Updated By
- Posted By
- Posted At

---

# Module 1 — Sales Voucher

Purpose

Record sale of goods or services.

Fields

Header

- Customer
- Invoice Date
- Due Date
- Price List
- Warehouse
- Payment Terms

Items

- Product
- Quantity
- Unit
- Unit Price
- Discount
- Tax
- Amount

Footer

- Subtotal
- Discount
- VAT
- Grand Total

Transaction Engine Should

✓ Reduce Inventory

✓ Generate Journal

✓ Generate Voucher Number

Future

Partial Payments

Installments

Delivery Notes

---

# Module 2 — Purchase Voucher

Purpose

Record purchases from suppliers.

Fields

Supplier

Purchase Date

Warehouse

Items

Tax

Discount

Narration

Transaction Engine

✓ Increase Inventory

✓ Generate Journal

---

# Module 3 — Receipt Voucher

Purpose

Receive money.

Sources

Customer Payment

Misc Income

Capital

Fields

Party

Payment Method

Ledger

Amount

Reference

Narration

Transaction Engine

Debit

Cash/Bank

Credit

Customer

---

# Module 4 — Payment Voucher

Purpose

Pay money.

Examples

Supplier

Salary

Rent

Utilities

Office Expense

Transaction Engine

Credit

Cash/Bank

Debit

Expense Ledger

---

# Module 5 — Contra Voucher

Purpose

Transfer funds.

Examples

Cash → Bank

Bank → Cash

Bank → Bank

Inventory unaffected.

---

# Module 6 — Journal Voucher

Purpose

Manual accounting adjustment.

Examples

Depreciation

Year End Entries

Accruals

Adjustments

Inventory unaffected.

---

# Module 7 — Expense Voucher

Purpose

Quick expense recording.

Examples

Fuel

Office Supplies

Internet

Electricity

Transaction Engine

Expense Ledger

↓

Cash/Bank

---

# Module 8 — Sales Return

Purpose

Reverse previous sale.

Transaction Engine

Increase Inventory

Reverse Journal

---

# Module 9 — Purchase Return

Purpose

Return purchased goods.

Transaction Engine

Decrease Inventory

Reverse Journal

---

# Module 10 — Debit Note

Purpose

Increase customer liability.

Used for

Additional Charges

Price Difference

Corrections

---

# Module 11 — Credit Note

Purpose

Reduce customer liability.

Used for

Discount

Refund

Returns

---

# Module 12 — Opening Balance

Purpose

Import opening balances.

Supports

Customers

Suppliers

Inventory

Cash

Bank

Capital

Runs once during implementation.

---

# Voucher Status

Draft

Submitted

Posted

Cancelled

Reversed

---

# Common Features

Every voucher supports

Draft Save

Preview

Print

Duplicate

Reverse

History

Attachments

Comments

Audit Timeline

---

# APIs

Sales

POST /sales

GET /sales

PATCH /sales/:id

POST /sales/:id/post

Purchase

POST /purchase

Receipt

POST /receipt

Payment

POST /payment

Journal

POST /journal

Contra

POST /contra

Expense

POST /expense

Returns

POST /sales-return

POST /purchase-return

Opening Balance

POST /opening-balance

---

# Folder Structure

```
modules/

vouchers/

sales/

purchase/

receipt/

payment/

contra/

journal/

expense/

credit-note/

debit-note/

sales-return/

purchase-return/

opening-balance/

shared/
```

Shared Contains

DTOs

Validation

Hooks

Components

Utilities

---

# Shared Components

Voucher Form

Voucher Table

Voucher Header

Voucher Footer

Item Grid

Tax Summary

Payment Summary

Approval Banner

Audit Timeline

Attachment Manager

---

# Business Rules

Voucher Number generated only during posting.

Drafts have no voucher number.

Posted vouchers cannot be edited.

Reversal creates new documents.

Deleting posted vouchers is prohibited.

Inventory updates only for inventory products.

Service products skip inventory.

Journal balance must always equal.

Voucher date must belong to active fiscal year.

Locked periods reject posting.

---

# UI Guidelines

Every voucher should have

Search

Filters

Date Range

Status Filter

Customer/Supplier Filter

Export

Print

Duplicate

Reverse

Audit History

Keyboard Shortcuts

Modern ERP layout similar to

ERPNext

TallyPrime

Odoo

Microsoft Dynamics

---

# Permissions

Owner

Everything

Admin

Everything

Accountant

Create

Edit Draft

Post

Reverse

Sales

Sales Voucher

Receipt Voucher

Inventory

Purchase

Stock

Staff

Read Only

---

# Validation

Customer exists

Supplier exists

Product exists

Warehouse exists

Ledger exists

Tax exists

Positive Quantity

Positive Amount

Balanced Journal

Open Fiscal Year

Company Match

Permission Check

---

# Events

VoucherCreated

VoucherPosted

VoucherCancelled

VoucherReversed

InventoryUpdated

JournalCreated

Future

Email Notification

Webhook

SMS

Analytics

---

# Out of Scope

Reports

Dashboard

Financial Statements

VAT Reports

Payroll

POS

Manufacturing

These belong to later phases.

---

# Definition of Done

✓ Sales Voucher completed

✓ Purchase Voucher completed

✓ Receipt Voucher completed

✓ Payment Voucher completed

✓ Contra Voucher completed

✓ Journal Voucher completed

✓ Expense Voucher completed

✓ Credit Note completed

✓ Debit Note completed

✓ Sales Return completed

✓ Purchase Return completed

✓ Opening Balance completed

✓ Draft workflow completed

✓ Posting workflow completed

✓ Reversal workflow completed

✓ Attachment support completed

✓ Audit timeline completed

✓ Ready for Phase 6 — Reports & Financial Statements

---

# Developer Guidelines

## 1. Voucher modules must never contain accounting logic.

Always call the Transaction Engine.

---

## 2. Keep voucher modules thin.

Responsibilities

- UI
- Validation
- Document Creation
- Transaction Engine Invocation

---

## 3. Never update inventory directly.

Inventory Engine manages stock.

---

## 4. Never update ledger balances directly.

Journal Engine derives balances.

---

## 5. Posted vouchers are immutable.

Use reversal or amendment instead of editing.

---

## 6. Shared voucher components should be reused across all voucher types to keep the codebase maintainable and provide a consistent user experience.

---

## Implementation Order

Build the modules in this order:

1. Opening Balance
2. Journal Voucher
3. Receipt Voucher
4. Payment Voucher
5. Contra Voucher
6. Purchase Voucher
7. Sales Voucher
8. Purchase Return
9. Sales Return
10. Debit Note
11. Credit Note

This sequence allows you to test the Transaction Engine with simpler vouchers before implementing inventory-intensive workflows like Sales and Purchase.

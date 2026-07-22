# Phase 6 — Reports & Financial Statements

Version: 1.0

Status: Planned

## Frontend delivery

Status: Planned

Implement read-only general-ledger, trial-balance, journal-register, and day-book routes with validated filters, totals, loading/empty/error states, and print-friendly layouts.

Prerequisites

- ✅ Phase 0 — Architecture Improvements
- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Accounting Foundation
- ✅ Phase 3 — Business Masters
- ✅ Phase 4 — Transaction Engine
- ✅ Phase 5 — Voucher Modules

---

# Objective

Transform accounting transactions into meaningful financial and operational reports.

This phase does NOT create any accounting transactions.

Instead, it reads data from

- Journals
- Inventory Movements
- Transactions
- Products
- Contacts

and generates reports.

Reports should always be generated dynamically.

Never permanently store calculated reports.

---

# Design Philosophy

Reports are READ ONLY.

Reports never modify data.

Reports should always be reproducible.

Example

Journal Entries

↓

Ledger

↓

Trial Balance

↓

Profit & Loss

↓

Balance Sheet

Every report should use the same underlying accounting data.

There should only be ONE source of truth.

---

# Report Architecture

```
Journal Entries
        │
        ▼
Report Engine
        │
        ├──────── Ledger Engine
        │
        ├──────── Inventory Engine
        │
        ├──────── Financial Engine
        │
        ├──────── Tax Engine
        │
        ▼
Report Builder
        │
        ▼
PDF / Excel / JSON
```

---

# Module Structure

```
Reports

├── Report Engine
├── Ledger Reports
├── Financial Reports
├── Inventory Reports
├── Tax Reports
├── Dashboard Reports
├── Export Service
├── Report Templates
└── Scheduled Reports
```

---

# Core Principle

Never calculate balances from Products.

Never calculate balances from Ledgers.

Always calculate from Journal Entries.

Inventory Reports always calculate from Inventory Movements.

---

# Module 1 — Report Engine

Purpose

Central service responsible for generating reports.

Every report follows

```
Filters

↓

Fetch Data

↓

Validate

↓

Aggregate

↓

Calculate

↓

Format

↓

Export
```

---

# Common Filters

Every report supports

Company

Fiscal Year

Date Range

Branch (future)

Warehouse

Ledger

Customer

Supplier

Product

Status

---

# Module 2 — General Ledger

Purpose

Display every transaction affecting a ledger.

Example

```
Cash

Opening Balance

Receipt

Payment

Sales

Purchase

Closing Balance
```

Features

Running Balance

Debit

Credit

Narration

Reference Number

Voucher Link

Opening Balance

Closing Balance

Filters

Ledger

Date

Voucher Type

---

# Module 3 — Trial Balance

Purpose

Verify

Total Debit = Total Credit

Columns

Ledger

Opening

Debit

Credit

Closing

Rules

Always balanced.

If not

System Error.

---

# Module 4 — Profit & Loss

Purpose

Calculate business profitability.

Income

↓

Expenses

↓

Net Profit

Support

Current Fiscal Year

Previous Fiscal Year

Date Range

Comparison

---

# Module 5 — Balance Sheet

Purpose

Display

Assets

Liabilities

Equity

Rules

Assets

=

Liabilities

+

Equity

Always.

---

# Module 6 — Cash Flow

Purpose

Track movement of cash.

Categories

Operating Activities

Investing Activities

Financing Activities

Future

Indirect Method

Direct Method

---

# Module 7 — Day Book

Purpose

Chronological list of transactions.

Columns

Voucher

Reference

Date

Amount

User

Narration

---

# Module 8 — Journal Register

Purpose

Display every journal entry.

Columns

Journal Number

Date

Debit

Credit

Status

Voucher

Reference

---

# Module 9 — Customer Statement

Purpose

Show customer history.

Opening Balance

Invoices

Receipts

Credit Notes

Closing Balance

Filters

Customer

Date

---

# Module 10 — Supplier Statement

Purpose

Supplier ledger.

Similar to customer statement.

---

# Module 11 — Inventory Reports

Stock Ledger

Stock Summary

Movement Report

Warehouse Report

Low Stock Report

Negative Stock Report

Slow Moving Stock

Fast Moving Stock

Inventory Aging

Rules

Inventory calculated from

Inventory Movements

Never Products.

---

# Module 12 — Sales Reports

Sales Summary

Sales by Customer

Sales by Product

Sales by Category

Sales by Warehouse

Sales by User

Monthly Sales

Yearly Sales

Top Customers

Top Products

---

# Module 13 — Purchase Reports

Purchase Summary

Purchase by Supplier

Purchase by Product

Purchase by Category

Purchase by Warehouse

Purchase Trend

Top Suppliers

---

# Module 14 — Expense Reports

Expense Summary

Expense by Ledger

Expense Trend

Monthly Expenses

Category Wise Expenses

---

# Module 15 — Dashboard Reports

Revenue

Expenses

Profit

Receivables

Payables

Cash

Bank

Inventory Value

Top Customers

Top Products

Recent Transactions

These reports should be optimized with caching.

---

# Export Service

Every report supports

PDF

Excel

CSV

Print

JSON API

Future

Email

Scheduled Reports

Cloud Backup

---

# Report Templates

Every report should have

Compact

Detailed

Landscape PDF

Portrait PDF

Excel

Print Friendly

---

# Folder Structure

```
modules/

reports/

engine/

financial/

ledger/

inventory/

sales/

purchase/

dashboard/

export/

templates/

services/

repositories/

dto/
```

---

# APIs

GET /reports/general-ledger

GET /reports/trial-balance

GET /reports/profit-loss

GET /reports/balance-sheet

GET /reports/cash-flow

GET /reports/day-book

GET /reports/journal-register

GET /reports/customer-statement

GET /reports/supplier-statement

GET /reports/stock-summary

GET /reports/stock-ledger

GET /reports/sales-summary

GET /reports/purchase-summary

GET /reports/dashboard

---

# Business Rules

Reports are read only.

Never modify data.

Balances always calculated.

Never stored.

Opening Balance

+

Debit

-

Credit

=

Closing Balance

Inventory calculated from movements.

Financial reports generated from journals.

Every report filtered by company.

Every report filtered by fiscal year.

---

# Performance Strategy

Implement

Aggregation Pipelines

Database Indexes

Caching

Lazy Loading

Pagination

Future

Materialized snapshots for very large datasets.

---

# Required Indexes

Journals

companyId

transactionDate

ledgerId

Inventory

companyId

productId

warehouseId

Transactions

companyId

voucherType

voucherDate

---

# Permissions

Owner

Everything

Admin

Everything

Accountant

All Reports

Sales

Sales Reports

Inventory Manager

Inventory Reports

Staff

Limited Reports

Auditor

Read Only

---

# UI Features

Search

Date Filters

Saved Filters

Bookmarks

Export

Print

Fullscreen

Column Selection

Grouping

Sorting

Pagination

Dark Mode

Responsive Tables

Charts

---

# Dashboard Widgets

Revenue

Profit

Cash

Bank

Receivables

Payables

Sales Trend

Purchase Trend

Inventory Value

Top Customers

Top Products

Recent Activities

---

# Future Integrations

BI Dashboard

Power BI

Metabase

Looker

Google Data Studio

REST API

Scheduled Email Reports

Webhook Notifications

---

# Out of Scope

BS Calendar Formatting

VAT Reports

IRD Reports

PAN Reports

Payroll Reports

POS Reports

Manufacturing Reports

These belong to later phases.

---

# Definition of Done

✓ Report Engine completed

✓ General Ledger completed

✓ Trial Balance completed

✓ Profit & Loss completed

✓ Balance Sheet completed

✓ Cash Flow completed

✓ Day Book completed

✓ Journal Register completed

✓ Customer Statement completed

✓ Supplier Statement completed

✓ Inventory Reports completed

✓ Sales Reports completed

✓ Purchase Reports completed

✓ Dashboard Reports completed

✓ PDF Export completed

✓ Excel Export completed

✓ CSV Export completed

✓ Report Templates completed

✓ Company isolation enforced

✓ Fiscal Year filtering completed

✓ Ready for Phase 7

---

# Developer Guidelines

## 1. Never store calculated balances.

Always calculate from Journal Entries and Inventory Movements.

---

## 2. Every report must be company-scoped.

Never expose another company's data.

---

## 3. Every report must respect the selected fiscal year.

Users should be able to compare current and previous fiscal years.

---

## 4. Keep the Report Engine generic.

New reports should reuse the same filtering, aggregation, and export infrastructure.

---

## 5. Separate calculation from presentation.

- Report Engine → Data retrieval and calculations
- Export Service → PDF, Excel, CSV generation
- UI → Tables, charts, filters, dashboards

---

## 6. Optimize for scale.

- Use MongoDB aggregation pipelines for summaries.
- Add indexes for all frequently filtered fields.
- Cache expensive dashboard queries.
- Paginate large reports.
- Design reports to handle millions of journal entries without architectural changes.

---

# Recommended Implementation Order

Build reports in this sequence:

1. Report Engine (shared infrastructure)
2. General Ledger
3. Trial Balance
4. Day Book
5. Journal Register
6. Customer Statement
7. Supplier Statement
8. Stock Ledger
9. Stock Summary
10. Sales Reports
11. Purchase Reports
12. Profit & Loss
13. Balance Sheet
14. Cash Flow
15. Dashboard
16. Export Service (PDF, Excel, CSV)
17. Scheduled Reports

Following this order ensures simpler reports validate the accounting engine before generating complex financial statements.

# Phase 8 — Enterprise Modules

Version: 1.0

Status: In progress

## Frontend delivery

Status: In progress

## Current implementation status

Phase 8 is in progress. The multi-branch and multi-warehouse foundation is delivered:

- Default branches, branch creation/update/archive, and branch-scoped warehouse creation are available through the enterprise API.
- `/company/branches` provides branch and warehouse management.
- Voucher creation persists a selected active branch and limits inventory warehouses to that branch.
- Operational reports expose a branch filter for journals, day book, stock, voucher, product-movement, and VAT-register reports.

The remaining branch work is delivered: financial statements and contact statements support the shared branch filter, and warehouse management supports create, edit, archive, and branch-scoped listing.

The initial Approval Workflow slice is delivered: companies can opt in through Accounting Preferences, submit draft transactions, and have an owner or administrator approve them before posting. It intentionally covers only the documented draft → submitted → approved → posted progression; configurable multi-step policies, rejections, delegation, and approval workflows for future enterprise modules are out of scope for this slice.

The initial Sales Orders slice is delivered: sales users can create, edit, confirm, cancel, and list branch-scoped, customer-linked planning documents. Orders do not yet create deliveries, invoices, inventory movements, or accounting entries.

The initial Purchase Orders slice is delivered: users can create, edit, confirm, cancel, and list branch-scoped, supplier-linked planning documents. Orders do not yet create goods receipts, purchase bills, inventory movements, or accounting entries.

The initial Fixed Assets and Depreciation slice is delivered: users can maintain a branch-scoped asset register and preview monthly straight-line or written-down-value depreciation schedules. The preview is read-only; asset disposal, persisted depreciation runs, and depreciation journal posting remain out of scope for this slice.

The initial CRM slice is delivered: sales users can create and list branch-scoped leads across a simple New → Qualified → Proposal → Won/Lost pipeline. Automation, activities, conversion, and integrations remain out of scope for this slice.

The initial POS slice is delivered as a counter-sales entry point to the existing Sales Voucher workflow. It preserves transaction-engine validation and avoids separate POS accounting logic; offline operation, scanners, printers, and terminal integrations remain out of scope for this slice.

The initial Payroll and Leave slice is delivered: employee records and pending leave requests are available. Payroll runs, tax/allowance calculations, leave-balance policies, approval actions, and journal posting remain out of scope for these foundations.

The initial Project Management and enterprise dashboard slice is delivered: projects and project tasks can be registered, and a read-only dashboard reports counts for leads, assets, draft orders, and active projects. Milestones, timesheets, project cost allocation, and richer dashboard analytics remain out of scope for this slice.

## Remaining implementation

- Approval policies: rejections, multi-step routing, delegation, and reuse by orders, payroll, and assets.
- Sales and purchase orders: delivery/goods receipt, invoice/bill conversion, and approvals.
- Fixed assets: edit/disposal, persisted depreciation runs, and depreciation journal posting.
- Payroll and leave: payroll runs, allowances, deductions, tax, leave balances, approval actions, and accounting integration.
- CRM: lead updates, activities, conversion, and automation.
- POS: cart/checkout, barcode scanning, receipts, offline operation, and terminal integrations.
- Projects: milestones, timesheets, budget/cost allocation, and project reporting.
- Enterprise reports and dashboard analytics for branches, assets, payroll, orders, CRM, and projects.

Implement company branch and warehouse routes, including warehouse filtering by branch and the selectors required by subsequent product and voucher forms.

Prerequisites

- ✅ Phase 0 — Architecture Improvements
- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Accounting Foundation
- ✅ Phase 3 — Business Masters
- ✅ Phase 4 — Transaction Engine
- ✅ Phase 5 — Voucher Modules
- ✅ Phase 6 — Reports & Financial Statements
- ✅ Phase 7 — Nepal Localization

---

# Objective

Expand the ERP beyond accounting into a complete business management platform.

At this stage, the accounting system is already production-ready.

This phase adds operational modules that integrate with the existing Transaction Engine instead of implementing their own accounting logic.

The accounting engine remains the single source of truth.

---

# Design Philosophy

Business Modules

↓

Transaction Engine

↓

Journal Engine

↓

Inventory Engine

↓

Reports

Every module must reuse the existing architecture.

Never duplicate accounting logic.

---

# Enterprise Modules

```

Enterprise

├── Multi Branch
├── Multi Warehouse
├── Fixed Assets
├── Asset Depreciation
├── Payroll
├── Leave Management
├── CRM
├── POS
├── Sales Order
├── Purchase Order
├── Approval Workflow
├── Manufacturing (Future)
├── Project Management
└── Task Management

```

---

# Module 1 — Multi Branch

Purpose

Support companies operating from multiple locations.

Examples

- Kathmandu Branch
- Pokhara Branch
- Biratnagar Branch
- Butwal Branch

Fields

- Branch Code
- Branch Name
- Address
- Phone
- Email
- Manager
- Status

Rules

Every transaction belongs to a branch.

Reports support branch filtering.

Voucher numbering may be branch-specific.

Future

Inter-Branch Transfer

Branch Profit & Loss

---

# Module 2 — Multi Warehouse

Purpose

Manage inventory across multiple warehouses.

Features

Warehouse Transfer

Warehouse Stock

Warehouse Valuation

Warehouse Reports

Warehouse Permissions

Rules

Products may exist in multiple warehouses.

Inventory calculated per warehouse.

---

# Module 3 — Fixed Assets

Purpose

Track long-term business assets.

Examples

Land

Building

Furniture

Computer

Vehicle

Machine

Office Equipment

Fields

- Asset Code
- Asset Category
- Purchase Date
- Purchase Value
- Salvage Value
- Useful Life
- Depreciation Method
- Branch
- Warehouse (optional)
- Status

Rules

Assets are never inventory.

Assets generate depreciation journals.

---

# Module 4 — Depreciation Engine

Purpose

Automatically calculate depreciation.

Methods

Straight Line

Written Down Value

Future

Units of Production

Schedule

Monthly

Quarterly

Yearly

Automatically post

Journal Entries

---

# Module 5 — Payroll

Purpose

Employee salary management.

Features

Employees

Salary Structure

Allowances

Deductions

Tax

Bonuses

Loans

Advance Salary

Salary Slip

Payroll Journal

Rules

Payroll posts through Transaction Engine.

---

# Module 6 — Leave Management

Leave Types

Annual Leave

Sick Leave

Casual Leave

Unpaid Leave

Features

Leave Balance

Approval

Holiday Calendar

Attendance Integration

Future

Biometric Integration

---

# Module 7 — CRM

Purpose

Manage customer relationships.

Modules

Lead

Opportunity

Customer Pipeline

Activities

Calls

Meetings

Follow Ups

Quotation

Conversion

Lead

↓

Customer

Rules

CRM should integrate with Sales.

---

# Module 8 — POS

Purpose

Retail billing.

Features

Barcode

Receipt Printing

Cash Drawer

Discount

Customer Lookup

Offline Queue

Payment Split

Cash

Card

Digital Wallet

Rules

POS creates Sales Voucher.

POS never creates journals directly.

---

# Module 9 — Sales Orders

Purpose

Sales planning.

Workflow

Quotation

↓

Sales Order

↓

Delivery

↓

Sales Invoice

↓

Receipt

Inventory reduced only after delivery/invoice.

---

# Module 10 — Purchase Orders

Workflow

Purchase Request

↓

Purchase Order

↓

Goods Receipt

↓

Purchase Bill

↓

Payment

Inventory updated after goods receipt.

---

# Module 11 — Approval Workflow

Purpose

Support approval-based businesses.

Workflow

Draft

↓

Submitted

↓

Approved

↓

Posted

↓

Completed

Rules

Approval policies configurable.

---

# Module 12 — Project Management

Features

Projects

Tasks

Milestones

Timesheets

Budget

Expenses

Reports

Future

Project Profitability

---

# Module 13 — Manufacturing (Future Ready)

Modules

Bill of Materials

Production Order

Work Center

Finished Goods

Raw Materials

Production Cost

Inventory integrated.

---

# Folder Structure

```

modules/

enterprise/

branches/

warehouses/

assets/

depreciation/

payroll/

leave/

crm/

pos/

sales-order/

purchase-order/

approval/

projects/

manufacturing/

```

---

# APIs

Branches

GET /branches

POST /branches

Warehouses

GET /warehouses

POST /warehouses

Assets

GET /assets

POST /assets

Payroll

GET /payroll

POST /payroll

CRM

GET /leads

POST /leads

POS

POST /pos/sale

Sales Orders

POST /sales-orders

Purchase Orders

POST /purchase-orders

Projects

GET /projects

POST /projects

---

# Permissions

Owner

Everything

Admin

Everything

Manager

Branch

Approval

Projects

HR

Payroll

Leave

Sales

CRM

POS

Purchase

Inventory Manager

Warehouse

Assets

Accountant

Financial Modules

Staff

Limited Access

---

# Business Rules

Branches belong to companies.

Warehouses belong to branches.

Assets cannot be sold through inventory.

Payroll posts journals automatically.

POS uses Sales Voucher.

Orders do not affect accounting.

Invoices affect accounting.

Manufacturing consumes inventory.

Projects may generate expenses.

---

# Reports

Branch Profit & Loss

Branch Balance Sheet

Warehouse Valuation

Asset Register

Depreciation Report

Payroll Report

Leave Report

CRM Pipeline

POS Sales

Sales Order Status

Purchase Order Status

Project Costing

---

# Dashboard Widgets

Branch Revenue

Warehouse Stock

Asset Value

Payroll Summary

Pending Approvals

CRM Pipeline

POS Sales

Projects

Top Salesperson

Top Branch

---

# Future Integrations

Biometric Attendance

Bank API

QR Payments

Barcode Scanner

Receipt Printer

Email Automation

SMS

WhatsApp

Calendar Sync

Google Workspace

Microsoft 365

---

# Performance

Branch Cache

Warehouse Cache

Payroll Queue

Depreciation Scheduler

POS Offline Cache

Background Jobs

---

# Out of Scope

Subscription Billing

Marketplace

Developer API

Public API

Webhooks

White Label

Mobile SDK

Analytics Platform

These belong to Phase 9.

---

# Definition of Done

✓ Multi Branch implemented

✓ Multi Warehouse implemented

✓ Fixed Assets implemented

✓ Depreciation Engine completed

✓ Payroll completed

✓ Leave Management completed

✓ CRM completed

✓ POS completed

✓ Sales Orders completed

✓ Purchase Orders completed

✓ Approval Workflow completed

✓ Project Management completed

✓ Enterprise Reports completed

✓ Dashboard Widgets completed

✓ Ready for Phase 9

---

# Developer Guidelines

## 1. Never bypass the Transaction Engine

Every financial event must pass through the Transaction Engine.

Examples

Payroll

↓

Transaction Engine

↓

Journal

Asset Purchase

↓

Transaction Engine

↓

Journal

POS Sale

↓

Transaction Engine

↓

Inventory

↓

Journal

---

## 2. Separate Documents from Transactions

Example

Sales Order

↓

Delivery Note

↓

Sales Invoice

↓

Transaction Engine

Sales Orders are business documents.

Invoices are accounting documents.

---

## 3. Multi-Branch Ready

Every entity should support

- companyId
- branchId

Future-proof the database even if only one branch is initially enabled.

---

## 4. Approval Workflow

Approval should be generic and reusable.

Any module should be able to define approval rules:

- Sales Orders
- Purchase Orders
- Payroll
- Expenses
- Fixed Assets

---

## 5. Scheduler Services

Introduce background schedulers for:

- Asset depreciation
- Payroll generation
- Project reminders
- Recurring transactions
- Scheduled reports

Use a queue system rather than cron logic inside business services.

---

## 6. Enterprise Reporting

Every enterprise module should integrate with the existing Reporting Engine.

Do not build separate reporting logic.

---

# Recommended Implementation Order

Implement in this sequence:

1. Multi Branch
2. Multi Warehouse
3. Approval Workflow
4. Sales Orders
5. Purchase Orders
6. Fixed Assets
7. Depreciation Engine
8. CRM
9. POS
10. Payroll
11. Leave Management
12. Project Management
13. Manufacturing foundation

---

# Enterprise Architecture

```
Business Modules
        │
        ▼
Business Documents
        │
        ▼
Approval Engine
        │
        ▼
Transaction Engine
        │
        ├── Journal Engine
        ├── Inventory Engine
        ├── Tax Engine
        └── Event Bus
                │
                ▼
Reporting Engine
                │
                ▼
Dashboard / Analytics / Exports
```

This architecture ensures every new enterprise feature plugs into the same core infrastructure instead of creating duplicate business logic.

---

# Long-Term Vision

After completing Phase 8, the application evolves from an accounting system into a full ERP capable of supporting:

- Accounting
- Inventory
- Sales
- Purchasing
- CRM
- POS
- Payroll
- Fixed Assets
- Multi-Branch Operations
- Project Management
- Enterprise Reporting

At this point, the only major remaining work is turning the ERP into a commercial SaaS platform through subscriptions, APIs, webhooks, monitoring, and marketplace capabilities in Phase 9.

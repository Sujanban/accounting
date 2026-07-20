# Phase 8 — Enterprise Modules

Version: 1.0

Status: Planned

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
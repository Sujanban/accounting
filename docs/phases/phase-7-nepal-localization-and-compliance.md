# Phase 7 — Nepal Localization & Compliance

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

---

# Objective

Transform the ERP into a Nepal-ready accounting system that complies with
Government of Nepal accounting practices, Inland Revenue Department (IRD)
requirements, and Nepali business workflows.

After this phase, the ERP should be usable by businesses operating in Nepal.

This phase focuses on:

- Nepal Fiscal Year
- Bikram Sambat (BS) Calendar
- PAN & VAT
- IRD Tax Invoice
- VAT Reports
- Fiscal Year Closing
- Localization
- Nepali Formatting

---

# Design Philosophy

Localization should never be mixed with the accounting engine.

Instead

```
Accounting Engine

↓

Localization Layer

↓

Nepal Rules

↓

Output
```

This allows future support for other countries.

---

# Module Structure

```
Localization

├── Nepal Calendar
├── Fiscal Year Manager
├── PAN Management
├── VAT Management
├── Tax Invoice
├── Fiscal Closing
├── Opening Balance Wizard
├── Nepal Reports
├── Localization Settings
└── Date Conversion Engine
```

---

# Module 1 — Bikram Sambat Calendar

Purpose

Support Nepali calendar throughout the ERP.

Requirements

Display

BS Date

Store

AD Date

Every transaction stores

AD Date

Every UI displays

BS Date

Future

Allow users to switch

BS

AD

or Both

---

Features

BS Date Picker

Today

Yesterday

Current Fiscal Year

Month Navigation

Date Validation

---

Rules

Database stores only AD.

UI converts to BS.

Never store BS dates in database.

---

# Module 2 — Nepali Fiscal Year

Purpose

Support Nepal Fiscal Year.

Examples

2081/82

2082/83

2083/84

Fields

Fiscal Year Name

Start AD

End AD

Start BS

End BS

Status

Current

Closed

Rules

Only one active fiscal year.

Transactions only allowed in active year.

Voucher numbering resets every fiscal year.

---

# Module 3 — PAN Management

Purpose

Store company PAN.

Fields

PAN Number

Registration Date

Registration Office

Validation Status

Rules

PAN required for company.

Customer PAN optional.

Supplier PAN optional.

Future

IRD verification API.

---

# Module 4 — VAT Management

Purpose

Support Nepal VAT.

Default

13%

Support

VAT Registered

VAT Exempt

Zero Rated

VAT Inclusive

VAT Exclusive

Rules

VAT automatically calculated.

Transaction Engine receives tax breakdown.

---

# Module 5 — Tax Invoice

Purpose

Generate Nepal compliant tax invoices.

Fields

Invoice Number

Tax Invoice Number

Customer PAN

Company PAN

VAT Amount

Taxable Amount

Total Amount

Rules

Unique numbering.

Fiscal year aware.

Printable.

Future

IRD QR Code

Digital Signature

---

# Module 6 — Fiscal Year Closing

Purpose

Close accounting year.

Flow

```
Check Errors

↓

Check Trial Balance

↓

Check Inventory

↓

Lock Fiscal Year

↓

Transfer Profit

↓

Generate Opening Entries

↓

Close
```

Rules

No posting after closing.

Admin override optional.

---

# Module 7 — Opening Balance Wizard

Purpose

Automatically prepare opening balances.

Supports

Cash

Bank

Customers

Suppliers

Inventory

Capital

Assets

Liabilities

Wizard Steps

Import

↓

Validate

↓

Preview

↓

Generate Opening Voucher

---

# Module 8 — VAT Reports

Reports

VAT Purchase Register

VAT Sales Register

VAT Summary

Monthly VAT

Quarterly VAT

Yearly VAT

Future

IRD Export Format

CSV

Excel

XML

---

# Module 9 — Purchase Register

Purpose

Government reporting.

Columns

Invoice

Supplier

PAN

VAT

Taxable Amount

Total

---

# Module 10 — Sales Register

Purpose

Government reporting.

Columns

Invoice

Customer

PAN

VAT

Taxable Amount

Total

---

# Module 11 — Localization Settings

Company Settings

Date Format

Number Format

Currency

Language

Calendar

Default Tax

Decimal Places

Default

Currency

NPR

---

# Module 12 — Date Conversion Engine

Purpose

Convert

BS ↔ AD

Functions

BS to AD

AD to BS

Today BS

Fiscal Year Finder

Month Name

Rules

Centralized.

Never duplicate conversion logic.

---

# Folder Structure

```
modules/

localization/

calendar/

fiscal-year/

vat/

pan/

tax-invoice/

reports/

settings/

services/

repositories/

dto/
```

---

# APIs

Fiscal Year

GET /localization/fiscal-years

POST /localization/fiscal-years

PAN

GET /localization/pan

PATCH /localization/pan

VAT

GET /localization/vat

PATCH /localization/vat

Reports

GET /reports/vat

GET /reports/purchase-register

GET /reports/sales-register

Fiscal Closing

POST /fiscal-years/:id/close

Opening Wizard

POST /opening-balance/import

POST /opening-balance/generate

---

# Business Rules

Database stores AD dates only.

UI displays BS.

Voucher numbering resets every fiscal year.

Only one fiscal year active.

Closed years reject transactions.

VAT calculated automatically.

Tax invoices immutable after posting.

Opening balances generated once.

Localization never changes accounting logic.

---

# Performance

Cache

Fiscal Year

BS Calendar

Localization Settings

Date Conversion

Indexes

Company

Fiscal Year

Invoice Number

Tax Invoice Number

PAN

---

# Permissions

Owner

Everything

Admin

Fiscal Closing

Localization

Accountant

VAT

Reports

Opening Balance

Staff

Read Only

---

# UI Features

BS Date Picker

Fiscal Year Selector

VAT Toggle

Print Tax Invoice

Fiscal Closing Wizard

Opening Balance Wizard

VAT Dashboard

Localization Settings

Nepali Month Names

Nepali Number Formatting

---

# Future Integrations

IRD API

QR Invoice

Digital Signature

eBilling

Electronic Tax Filing

Nepali OCR

Bank Integration

Government Verification

---

# Out of Scope

Payroll

POS

CRM

Assets

Manufacturing

Subscriptions

API Marketplace

Mobile App

These belong to later phases.

---

# Definition of Done

✓ BS Calendar implemented

✓ AD ↔ BS conversion completed

✓ Fiscal Year Manager completed

✓ PAN Management completed

✓ VAT Management completed

✓ Tax Invoice completed

✓ Purchase Register completed

✓ Sales Register completed

✓ VAT Reports completed

✓ Fiscal Closing completed

✓ Opening Balance Wizard completed

✓ Localization Settings completed

✓ Date Conversion Engine completed

✓ Company localization completed

✓ Ready for Phase 8

---

# Developer Guidelines

## 1. Store AD, Display BS

Always save Gregorian (AD) dates in MongoDB.

Convert to Bikram Sambat only for the UI.

---

## 2. Localization Layer

Keep Nepal-specific rules separate from the accounting engine.

Future countries should be added by implementing new localization modules, not by changing accounting logic.

---

## 3. Fiscal Year Integrity

Every voucher, report, and sequence must belong to a fiscal year.

Closing a fiscal year must prevent further posting while preserving historical data.

---

## 4. VAT Is Rule-Based

VAT should be calculated by a centralized Tax Service.

Voucher modules should never calculate tax themselves.

---

## 5. Tax Invoices

Tax invoice numbers must be:

- Unique
- Sequential
- Fiscal-year aware
- Immutable after posting

---

## 6. Opening Balance Wizard

Support importing opening balances from:

- Excel
- CSV
- Previous accounting systems

Validate before generating opening vouchers.

---

## 7. Recommended Libraries

- BS ↔ AD conversion library (well-tested and maintained)
- PDF generation library for IRD-compliant invoices
- QR code library for future eBilling support

Avoid implementing calendar conversion algorithms manually unless absolutely necessary.

---

# Recommended Implementation Order

Build Phase 7 in the following sequence:

1. Date Conversion Engine
2. BS Calendar & Date Picker
3. Fiscal Year Manager
4. Localization Settings
5. PAN Management
6. VAT Management
7. Tax Invoice Module
8. Purchase Register
9. Sales Register
10. VAT Reports
11. Opening Balance Wizard
12. Fiscal Year Closing
13. Performance Optimization & Caching

---

# Enterprise Recommendations

To make the ERP commercially competitive in Nepal:

- Support both BS and AD date display throughout the application.
- Make localization configurable so future expansion to India or other countries only requires a new localization package.
- Keep all IRD-specific logic inside the localization module.
- Design tax calculations using a strategy pattern so future tax rules can be added without modifying the Transaction Engine.
- Ensure all reports are exportable to PDF, Excel, and CSV with IRD-friendly layouts.
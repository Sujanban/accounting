# Phase 3 — Business Masters

Version: 1.0

Status: Complete

## Frontend delivery

Status: Complete

Implement `/masters/parties`, `/masters/products`, `/masters/categories`, `/masters/units`, `/masters/tax-rates`, and `/masters/payment-terms` with typed feature APIs, query hooks, create forms, contacts update/archive behavior, and list loading/empty/error states.

### Current implementation status

Implemented:

- Typed frontend API clients and TanStack Query hooks for contacts, products, categories, units, tax rates, payment terms, contact groups, warehouses, and price lists.
- List and dedicated create pages for `/masters/parties`, `/masters/products`, `/masters/categories`, `/masters/units`, `/masters/tax-rates`, `/masters/payment-terms`, `/masters/contact-groups`, `/masters/warehouses`, and `/masters/price-lists`.
- Contact create, detail, update, archive, restore, search, role/status filtering, and server-side pagination.
- Contact input validation, audit metadata, company isolation, and soft-delete behavior.
- Cloudinary-backed party attachment upload, metadata storage, listing, and preview for images and PDFs.
- Product barcode, reorder-level, and minimum-stock fields in the create workflow.

Completed in the final delivery:

- Edit/archive/restore workflows for every catalog master.
- Product detail/edit, product attachments, attachment deletion, and authenticated download delivery.
- Server-side pagination, search, status filtering, and frontend pagination controls for catalog lists.

Prerequisites

- Phase 0 — Architecture Improvements
- Phase 1 — Foundation
- Phase 2 — Accounting Foundation

---

# Objective

Build all reusable business master data required by the ERP.

Business Masters are reference data.

They are created once and reused across every business transaction.

Examples:

- Customers
- Suppliers
- Products
- Units
- Taxes

This phase still DOES NOT record accounting transactions.

No journals are created.

No inventory movement is recorded.

No voucher posting happens.

---

# Why This Phase Exists

Before a company can create:

- Sales Invoice
- Purchase Bill
- Payment
- Receipt

the ERP must know

Who?

(Customer/Supplier)

What?

(Product)

Where?

(Warehouse)

How?

(Unit)

Tax?

(VAT)

Price?

(Price List)

Without Business Masters, transactions cannot exist.

---

# Design Principles

## Single Source of Truth

Every master record exists only once.

Never duplicate information.

Example

Customer

↓

Sales

Purchase Return

Receipt

Ledger

Reports

All reference the same customer.

---

## Reusable

Every module should reuse Business Masters.

Never create module-specific customer tables.

Never create module-specific product tables.

---

## Company Isolation

Every master belongs to exactly one company.

Every query automatically filters by

companyId

---

## Soft Delete

Business masters should never be permanently deleted.

Archive instead.

---

## Audit Ready

Every document contains

createdBy

updatedBy

createdAt

updatedAt

deletedAt

deletedBy

---

# Module Structure

Business Masters

├── Contacts
├── Contact Groups
├── Product Categories
├── Products
├── Units
├── Warehouses
├── Tax Rates
├── Price Lists
├── Payment Terms
└── Attachments

---

# Module 1 — Contacts

Purpose

Maintain all business parties.

Instead of separate tables

Customer

Supplier

Vendor

Employee

Create one

Contact

with roles.

---

## Contact Roles

Customer

Supplier

Customer + Supplier

Employee

Vendor

Transporter

Other

Future roles may be added.

---

## Fields

- companyId
- contactCode
- name
- displayName
- roles[]
- panNumber
- vatNumber
- phone
- mobile
- email
- website
- billingAddress
- shippingAddress
- creditLimit
- paymentTermId
- ledgerId
- notes
- isActive

---

## Rules

Contact Code must be unique.

One contact may have multiple roles.

Example

ABC Traders

Roles

Customer

Supplier

---

Ledger should not be created manually.

Future transaction engine will automatically link receivable/payable ledgers.

---

# Module 2 — Contact Groups

Purpose

Organize contacts.

Examples

Retail Customers

Wholesale Customers

Dealers

Government

NGO

Corporate

---

Fields

- name
- description
- parentId

Support unlimited nesting.

---

# Module 3 — Product Categories

Purpose

Organize products.

Examples

Electronics

Stationery

Medicine

Hardware

Food

Office Supplies

Support hierarchy.

Example

Electronics

↓

Laptop

↓

Gaming Laptop

---

Fields

- companyId
- categoryCode
- name
- parentId
- description
- isActive

---

# Module 4 — Units

Purpose

Define units of measurement.

Default Units

Piece

Dozen

Box

Packet

Kg

Gram

Liter

Meter

Feet

Hour

Day

Month

---

Fields

- name
- symbol
- decimalAllowed
- isSystem

Future

Support Unit Conversion.

Example

1 Box

=

12 Pieces

---

# Module 5 — Products

Purpose

Maintain product catalog.

Products contain master data only.

Do NOT maintain stock here.

Stock belongs to Inventory Engine.

---

Fields

- companyId
- sku
- barcode
- name
- categoryId
- unitId
- purchasePrice
- sellingPrice
- taxId
- reorderLevel
- minimumStock
- description
- image
- isService
- isActive

---

Rules

SKU unique per company.

Barcode unique if present.

Product names should be unique within company.

Product may be

Inventory Item

Service

Digital Product

Future

Batch Tracking

Serial Numbers

Expiry Date

Variants

Attributes

---

# Module 6 — Warehouses

Purpose

Prepare inventory management.

Default

Main Warehouse

Future

Kathmandu Warehouse

Pokhara Warehouse

Biratnagar Warehouse

---

Fields

- warehouseCode
- name
- address
- description
- isDefault
- isActive

Rules

One default warehouse.

Unlimited warehouses.

---

# Module 7 — Tax Rates

Purpose

Store reusable tax configurations.

Examples

VAT 13%

VAT Exempt

Zero Rated

Future

TDS

Withholding Tax

---

Fields

- taxCode
- name
- percentage
- type
- effectiveDate
- isDefault
- isActive

Rules

Never modify historical tax rates.

Create new versions.

---

# Module 8 — Price Lists

Purpose

Support multiple pricing strategies.

Examples

Retail

Wholesale

Dealer

Distributor

VIP

Future

Customer-specific pricing.

---

Fields

- name
- description
- currency
- isDefault

---

# Module 9 — Payment Terms

Purpose

Define payment conditions.

Examples

Cash

7 Days

15 Days

30 Days

45 Days

60 Days

Advance Payment

---

Fields

- name
- dueDays
- description

---

# Module 10 — Attachments

Purpose

Store business documents.

Examples

Product Images

Company Registration

VAT Certificate

PAN Certificate

Customer Documents

Future

Cloudflare R2

AWS S3

Google Cloud Storage

Use StorageService abstraction.

---

# Search

Every module supports

Search

Pagination

Sorting

Filtering

Bulk Archive

Bulk Restore

---

# MongoDB Collections

contacts

contactGroups

categories

units

products

warehouses

taxRates

priceLists

paymentTerms

attachments

---

# Required Indexes

Contacts

companyId

contactCode

name

roles

Products

companyId

sku

barcode

categoryId

Warehouses

companyId

warehouseCode

Taxes

companyId

taxCode

Price Lists

companyId

name

---

# APIs

Contacts

GET /contacts

POST /contacts

PATCH /contacts/:id

DELETE /contacts/:id

Products

GET /products

POST /products

PATCH /products/:id

DELETE /products/:id

Categories

GET /categories

POST /categories

PATCH /categories/:id

DELETE /categories/:id

Units

GET /units

POST /units

Warehouses

GET /warehouses

POST /warehouses

Taxes

GET /tax-rates

POST /tax-rates

Payment Terms

GET /payment-terms

POST /payment-terms

Price Lists

GET /price-lists

POST /price-lists

---

# Validation

Contacts

Unique contact code

Valid PAN

Valid VAT

Valid email

Products

Unique SKU

Unique barcode

Valid category

Valid unit

Positive prices

Warehouses

Unique warehouse code

One default warehouse

Tax Rates

Percentage between 0–100

Price Lists

Unique name

---

# Permissions

Owner

Full Access

Admin

CRUD

Accountant

CRUD

Sales

Read

Create

Update

Inventory Manager

Products

Warehouses

Read

Update

Staff

Read Only

---

# Business Rules

Products do not maintain stock.

Stock belongs to Inventory Engine.

Contacts can have multiple roles.

One warehouse must always exist.

Taxes are versioned.

Products can be

Goods

Services

Digital

Every master belongs to one company.

All records support audit fields.

All records support soft delete.

---

# Out of Scope

This phase does NOT implement

Sales Invoice

Purchase Bill

Receipt Voucher

Payment Voucher

Journal Voucher

Inventory Transactions

Stock Movement

General Ledger

Reports

Those belong to later phases.

---

# Definition of Done

- [x] Contact management implemented, including archive and restore.

- [x] Contact groups implemented with list/create delivery.

- [x] Product categories, products, units, tax rates, and payment terms have list/create delivery.

- [x] Edit/archive/restore workflows completed for all catalog masters.

- [x] Warehouses and price lists implemented with list/create delivery.

- [x] Party attachment upload, metadata storage, listing, and preview implemented.

- [x] Product attachments, attachment deletion, and access-controlled download delivery implemented.

- [x] Contact search, server-side pagination, soft delete, audit metadata, and company isolation implemented.

- [x] Frontend pagination controls and all Phase 3 completion criteria implemented.

- [x] Ready for Phase 4 — Transaction Engine.

---

# Important Notes for Developers

- Use a single `Contact` entity with multiple roles instead of separate Customer and Supplier tables.
- Do not store inventory quantities in the Product collection. Inventory balances will be calculated and maintained by the Inventory/Transaction Engine in Phase 4.
- Link products to units, categories, tax rates, and price lists using IDs, not duplicated values.
- Design all master data to be reusable across Sales, Purchases, Inventory, POS, Payroll, and future modules.
- Never hard-delete business master records; archive them instead.
- Ensure all master data is company-scoped and future-ready for multi-branch support.

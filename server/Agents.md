# Nepal Accounting Software - Authentication & Onboarding Specification (V1)

## Overview

Design and implement the authentication and onboarding flow for a modern web-based accounting software targeted at the Nepali market.

The software is **multi-tenant**, meaning each company has its own isolated data.


Development phase
Phase 1
Authentication + Company + Onboarding
                │
                ▼
Phase 2
Accounting Foundation
(Accounts, Fiscal Year, Customers, Products, Journals)
                │
                ▼
Phase 3
Transactions
(Sales, Purchases, Expenses, Payments)
                │
                ▼
Phase 4
Reports
(P&L, Balance Sheet, Trial Balance, Ledgers)
                │
                ▼
Phase 5
Nepal Features
(BS Calendar, VAT, PAN, Tax Reports)
                │
                ▼
Phase 6
Enterprise Features
(Roles, Multi-branch, POS, AI, Integrations)

---

# Core Principles

- A user account is separate from a company.
- A user can own multiple companies in the future.
- A company can have multiple users in the future.
- Every business record (sales, purchases, inventory, expenses, etc.) belongs to exactly one company.
- Authentication should use JWT Access Tokens + Refresh Tokens.
- Passwords must be hashed using bcrypt.

---

# User Journey

## 1. Landing Page

Provide two actions:

- Sign In
- Create Account

---

# 2. User Registration

Required fields:

- Full Name
- Email Address
- Password
- Confirm Password

Validation:

- Email must be unique.
- Password minimum 8 characters.
- Password should contain uppercase, lowercase, number, and special character.
- Store password as a bcrypt hash.

Create only a **User** record.

Do NOT create a company during registration.

Example:

```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "emailVerified": false,
  "createdAt": "..."
}
```

After successful registration:

- Automatically sign the user in.
- Redirect to the onboarding flow.

---

# 3. Onboarding

If the authenticated user does not belong to any company, automatically redirect to onboarding.

Users should not access the dashboard until onboarding is completed.

---

# Step 1 – Create Company

Collect:

- Company Name
- PAN Number
- VAT Registered (Yes / No)

If VAT Registered:

- VAT Number

Optional:

- Phone Number
- Email
- Address
- Company Logo

Create:

```json
Company
{
  "_id": "...",
  "name": "ABC Traders",
  "panNumber": "...",
  "vatRegistered": true,
  "vatNumber": "...",
  "phone": "...",
  "email": "...",
  "address": "...",
  "logo": "...",
  "createdAt": "..."
}
```

---

# Step 2 – Nepal Fiscal Year

The software must support the Nepali fiscal year (Bikram Sambat).

Default example:

Fiscal Year:
2082/83

Start:
2082-04-01 (Shrawan 1)

End:
2083-03-31 (Ashadh End)

Allow selecting:

- Current Fiscal Year
- Previous Fiscal Years

Store internally:

```json
{
    "name": "2082/83",
    "startDateBS": "2082-04-01",
    "endDateBS": "2083-03-31"
}
```

The selected fiscal year becomes the company's active fiscal year.

Future feature:

- Close Fiscal Year
- Open New Fiscal Year
- Carry Forward Balances

---

# Step 3 – Business Type

Allow selecting one:

- Retail Shop
- Wholesale
- Service Business
- Manufacturing
- Pharmacy
- Restaurant
- Other

Business type will be used later to generate default Chart of Accounts and reports.

---

# Step 4 – Default Setup

Automatically create:

Default Chart of Accounts

Assets

- Cash
- Bank
- Inventory

Liabilities

- Accounts Payable

Income

- Sales

Expenses

- Rent
- Salary
- Utilities

Also create:

- Default Cash Account
- Default Inventory Account
- Default Sales Account

---

# Step 5 – Membership

Create a membership document.

Do NOT store companyId directly inside User.

Example:

```json
{
    "_id":"...",
    "userId":"...",
    "companyId":"...",
    "role":"OWNER"
}
```

Reason:

Future support for:

- Multiple companies
- Multiple users
- Invitations
- Permissions

---

# Step 6 – Redirect

After onboarding:

Redirect to Dashboard.

---

# Login

Login fields:

- Email
- Password

Flow:

Validate credentials

↓

Generate JWT Access Token

↓

Generate Refresh Token

↓

Redirect to Dashboard

---

# JWT

Access Token

Contains only:

```json
{
    "sub":"userId",
    "email":"..."
}
```

Never include:

- Company Name
- PAN
- VAT
- Permissions
- Role

Those should always come from the database.

---

# Refresh Token

Store refresh tokens in database.

Suggested expiry:

Access Token

15 minutes

Refresh Token

30 days

Flow:

Login

↓

Access Token

↓

Refresh Token

↓

Access expires

↓

/auth/refresh

↓

New Access Token

---

# Dashboard Access

Every request must:

1. Verify JWT.
2. Identify User.
3. Identify Active Company.
4. Verify Membership.
5. Continue.

Never return another company's data.

Example:

```
GET /sales

WHERE companyId = activeCompany
```

Company isolation is mandatory.

---

# Active Company

Store active company in the user's session or securely manage it on the client.

Future support:

```
Switch Company

ABC Traders

XYZ Suppliers

Cafe Nepal
```

Changing the active company changes all displayed data.

---

# Roles

V1

OWNER

STAFF

OWNER

Can:

- Manage company
- Create users (future)
- Sales
- Purchases
- Expenses
- Products
- Reports
- Settings

STAFF

Can:

- Sales
- Purchases
- Expenses

Cannot:

- Delete Company
- Manage Users
- Settings

Future roles:

- Accountant
- Manager
- Cashier
- Auditor
- Viewer

---

# Database Collections

```
users
companies
memberships
refresh_tokens
fiscal_years
accounts
customers
suppliers
products
sales
purchases
expenses
journal_entries
```

---

# Middleware Flow

```
Request

↓

Verify JWT

↓

Find User

↓

Find Membership

↓

Determine Active Company

↓

Authorize Role

↓

Continue
```

---

# Security Requirements

- Hash passwords with bcrypt.
- Use JWT Access + Refresh Tokens.
- Validate all input.
- Rate-limit login endpoint.
- Never expose password hashes.
- Protect all APIs with authentication middleware.
- Every query must include companyId filtering.
- Log authentication failures.

---

# Future Enhancements (Not V1)

- Email verification
- Password reset
- Two-factor authentication (2FA)
- Google Login
- Microsoft Login
- Company invitations
- Multi-company switcher
- Audit logs
- Session management
- Device management

---

# Expected User Flow

```
Landing Page
        │
        ▼
Create Account
        │
        ▼
Login
        │
        ▼
Create Company
        │
        ▼
Select Nepali Fiscal Year
        │
        ▼
Select Business Type
        │
        ▼
Generate Default Accounts
        │
        ▼
Create Membership
        │
        ▼
Dashboard
```

---

# Definition of Done

The feature is complete when:

- A new user can register.
- A new company can be created.
- Nepali fiscal year is configured during onboarding.
- Business type is selected.
- Default chart of accounts is generated.
- Membership is created.
- JWT authentication works correctly.
- Refresh token flow works.
- All company data is isolated by `companyId`.
- The user is redirected to the dashboard after successful onboarding.
# Phase 1 — Foundation (Authentication & Company Setup)

## Objective

Build the foundational infrastructure of the application.

At the end of this phase, a business owner should be able to:

- Create an account
- Sign in securely
- Complete the onboarding wizard
- Create their first company
- Configure the Nepali fiscal year
- Configure company settings
- Access an empty dashboard

> **Phase 1 does NOT include accounting, inventory, contacts, products, transactions, or reports.**

---

# Architecture

```
User
│
├── Authentication
│
├── Company
│
├── Membership
│
├── Fiscal Year
│
├── Company Settings
│
└── Dashboard
```

---

# User Flow

```
Landing Page
      │
      ▼
Register
      │
      ▼
Login
      │
      ▼
Check Onboarding Status
      │
      ├── Completed → Dashboard
      │
      └── Not Completed
              │
              ▼
      Onboarding Wizard
              │
              ├── Company Information
              ├── Fiscal Year
              ├── Company Settings
              └── Finish
              │
              ▼
          Dashboard
```

---

# Module 1 — Authentication

## Features

- Register
- Login
- Logout
- Refresh Access Token

---

## Register

### Route

```
POST /auth/register
```

### Fields

| Field | Required |
|--------|----------|
| Full Name | ✅ |
| Email | ✅ |
| Password | ✅ |
| Confirm Password | ✅ |

### Validation

- Email must be unique.
- Password must contain:
  - Minimum 8 characters
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character

Passwords must be hashed using bcrypt.

---

## Login

### Route

```
POST /auth/login
```

Generate

- Access Token (15 minutes)
- Refresh Token (30 days)

Store Refresh Token in database.

Send Refresh Token using an HTTP-only cookie.

---

## Refresh Token

```
POST /auth/refresh
```

Returns a new Access Token.

---

## Logout

```
POST /auth/logout
```

Actions

- Delete Refresh Token
- Clear Refresh Cookie

---

# Module 2 — Company

After the first login, users must create a company.

---

## Route

```
POST /companies
```

---

## Fields

| Field | Required |
|--------|----------|
| Company Name | ✅ |
| PAN Number | ✅ |
| VAT Registered | ✅ |
| VAT Number | Conditional |
| Phone | Optional |
| Email | Optional |
| Address | Optional |
| Logo | Optional |

---

## Example

```json
{
  "_id": "...",
  "name": "ABC Traders",
  "panNumber": "123456789",
  "vatRegistered": true,
  "vatNumber": "987654321",
  "phone": "",
  "email": "",
  "address": "",
  "logo": ""
}
```

---

# Module 3 — Membership

A user belongs to a company through a Membership.

Never store `companyId` inside the User document.

---

## Membership

```json
{
  "userId": "...",
  "companyId": "...",
  "role": "OWNER"
}
```

---

## Future Roles

- OWNER
- ADMIN
- ACCOUNTANT
- STAFF

---

# Module 4 — Fiscal Year

Support Nepali fiscal years.

Default example

```
2082/83
```

Store both BS and AD dates.

---

## Fields

| Field | Description |
|--------|-------------|
| Name | 2082/83 |
| BS Start Date | 2082-04-01 |
| BS End Date | 2083-03-31 |
| AD Start Date | 2025-07-17 |
| AD End Date | 2026-07-16 |
| Active | true |

---

## Business Rules

- One company can have many fiscal years.
- Only one fiscal year may be active.
- Every company must always have one active fiscal year.

---

# Module 5 — Company Settings

Instead of scattering configuration throughout the system, store company-wide settings in one document.

---

## Route

```
POST /settings
```

---

## Fields

```json
{
  "companyId": "...",
  "businessType": "RETAIL",
  "currency": "NPR",
  "currencySymbol": "Rs.",
  "language": "en",
  "dateFormat": "BS",
  "timezone": "Asia/Kathmandu",
  "decimalPlaces": 2,
  "allowNegativeStock": false
}
```

---

## Business Types

- Retail
- Wholesale
- Service
- Manufacturing
- Pharmacy
- Restaurant
- Other

---

## Default Values

| Setting | Value |
|----------|-------|
| Currency | NPR |
| Currency Symbol | Rs. |
| Language | English |
| Date Format | BS |
| Timezone | Asia/Kathmandu |
| Decimal Places | 2 |
| Negative Stock | Disabled |

---

# Module 6 — Onboarding

Users cannot access the dashboard until onboarding is complete.

---

## Steps

```
Company Information

↓

Fiscal Year

↓

Company Settings

↓

Finish
```

---

## Completion

Set

```json
{
  "onboardingCompleted": true
}
```

Store this flag on the **Company** document.

---

# Module 7 — Company Context Middleware

Every authenticated request must resolve:

```
JWT

↓

Authenticated User

↓

Membership

↓

Company

↓

Active Fiscal Year

↓

Company Settings
```

Attach the following to the request context:

- user
- company
- membership
- fiscalYear
- settings

Reject requests if:

- User is not authenticated.
- User is not a member of the company.
- Company does not exist.

---

# Module 8 — Dashboard

Display only:

- Company Name
- Business Type
- Active Fiscal Year
- Logged-in User
- Current Date

Placeholder cards:

- Sales
- Purchases
- Expenses
- Profit
- Cash

No accounting calculations are required.

---

# Database Collections

```
users

companies

memberships

refreshTokens

fiscalYears

settings
```

---

# Folder Structure

```
src/

foundation/
├── auth/
├── onboarding/
├── companies/
├── memberships/
├── fiscal-years/
├── settings/
└── dashboard/

shared/
├── middleware/
├── utils/
├── validators/
└── constants/

config/
database/
```

---

# Security

- bcrypt password hashing
- JWT Access Token
- Refresh Token
- HTTP-only Refresh Cookie
- Protected Routes
- Request Validation
- Rate Limiting
- CORS Configuration
- Helmet Security Headers

---

# Business Rules

- One user may belong to multiple companies.
- One company may have multiple users.
- Every company must have one active fiscal year.
- Every company has one settings document.
- Dashboard is inaccessible until onboarding is completed.
- Company context must be resolved before accessing protected resources.

---

# Definition of Done

- ✅ User registration works.
- ✅ Secure login/logout works.
- ✅ Refresh token authentication works.
- ✅ Company creation works.
- ✅ Membership is created automatically.
- ✅ Nepali fiscal year is initialized.
- ✅ Company settings are created.
- ✅ Onboarding wizard is completed successfully.
- ✅ Company context middleware is implemented.
- ✅ Dashboard is accessible only after onboarding.
- ✅ All protected APIs require authentication.
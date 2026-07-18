# End-user flow — current server implementation

This flow reflects the features currently available in the server. It describes what a person can do in the product today, including the rules that stop them from continuing.

## 1. Create an account

1. The visitor opens the registration screen.
2. They enter:
   - Full name (at least 2 characters)
   - Email address
   - Password
   - Confirm password
3. The password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.
4. The visitor submits the form.

Possible outcomes:

- If the email is already registered, the account is not created.
- If any field is invalid, the screen should show the relevant field error.
- On success, the account is created. The person must then sign in; registration itself does not sign them in or create a company.

## 2. Sign in and restore a session

1. The person enters their email and password on the sign-in screen.
2. On success, they receive a short-lived access session and a longer-lived refresh session stored in a secure cookie.
3. The app reads the session to determine whether the person belongs to a company.

Possible outcomes:

- Incorrect email or password: sign-in is rejected.
- Disabled account: sign-in is rejected.
- No company yet: send the person to company setup.
- A company exists: load that company as the active company.

When the access session expires, the app can silently refresh it using the refresh cookie. Refreshing rotates the refresh session: the old one can no longer be used. Signing out revokes the current refresh session and clears its cookie.

There is no email-verification, password-reset, or account-recovery journey in the current server.

## 3. Create the first company and fiscal year

This is required before the person can access accounting features.

1. The signed-in person opens **Company setup**.
2. They enter company details:
   - Company name (at least 2 characters)
   - PAN number
   - Whether the business is VAT registered
   - VAT number, if VAT registered
   - Optional phone, company email, address, and logo
3. They enter the active fiscal year:
   - Fiscal-year name, for example `2082/83`
   - Start and end dates in Bikram Sambat (BS)
   - Matching start and end dates in AD
4. They submit the form.

On success, the system automatically:

1. Creates the company.
2. Makes the creator its **OWNER**.
3. Creates and selects the initial fiscal year.
4. Creates the built-in accounting groups, ledgers, and voucher-number sequences listed below.
5. Returns an updated session with the company selected.

Important current limitation: a user can create only one initial company. There is no screen/API to add another company, invite people, or manage roles. The only active role that can be created is `OWNER`; memberships can also contain `STAFF`, but there is no user-facing membership management flow.

## 4. Finish company settings (completes onboarding)

After creating the company, the person must configure company settings. Until this step is completed, accounting pages are unavailable.

1. The person chooses a business type:
   - Retail
   - Wholesale
   - Service
   - Manufacturing
   - Pharmacy
   - Restaurant
   - Other
2. They can set or accept defaults for:
   - Currency — default: `NPR`
   - Currency symbol — default: `Rs.`
   - Language — default: English
   - Date format — BS (default) or AD
   - Time zone — default: `Asia/Kathmandu`
   - Decimal places — 0 to 6, default 2
   - Allow negative stock — default: No
3. They can also set initial accounting preferences:
   - Voucher numbering: automatic (default) or manual
   - Accounting decimal places: 0 to 6, default 2
   - Allow journal editing: default No
   - Lock after closing: default Yes
   - Voucher view: Standard (default) or Compact
4. They can set fiscal-lock preferences:
   - Lock entries before a chosen date
   - Lock closed fiscal years — default Yes
   - Allow administrator override — default No
5. They save the settings.

Saving settings marks onboarding as complete and unlocks the accounting options. Settings can only be created once. Later, the person can update the accounting and fiscal-lock preferences, but the server currently does not provide an endpoint to edit the general company details or the basic settings such as business type, currency, language, or date format.

## 5. What appears automatically in accounting

When the company is created, these built-in records are ready to view in the chart of accounts. They are system records, so they cannot be edited or deleted.

### Built-in account groups

- Assets: Current Assets, Fixed Assets, Investments
- Liabilities: Current Liabilities, Long-term Liabilities
- Equity: Capital Account, Retained Earnings
- Income: Direct Income, Indirect Income
- Expenses: Direct Expenses, Indirect Expenses

### Built-in ledgers

- Current Assets: Cash in Hand, Bank Account, Inventory, Accounts Receivable
- Current Liabilities: Accounts Payable
- Capital Account: Capital
- Direct Income: Sales
- Direct Expenses: Purchase
- Indirect Expenses: Salary Expense, Rent Expense, Electricity Expense, Internet Expense, Miscellaneous Expense

### Built-in voucher numbering

One number sequence is created for each voucher type:

- Journal voucher (`JV`)
- Sales voucher (`SV`)
- Purchase voucher (`PV`)
- Receipt voucher (`RV`)
- Payment voucher (`PMV`)
- Contra voucher (`CV`)

Each starts at number 1, uses six-digit padding, resets each fiscal year, and begins with a prefix like `JV-2082/83-`. The server creates and lets the user manage these sequences, but it does not yet provide a screen/API to create vouchers or transactions.

## 6. Day-to-day accounting setup options

After onboarding, the person works within the selected company and fiscal year. The app needs an active company and fiscal year for every accounting action. With the current single-company flow, these are selected automatically; the API also supports selecting an accessible company/fiscal year explicitly.

### View the chart of accounts

The person can open a nested chart showing active account groups, their child groups, and the active ledgers under each group for the selected fiscal year.

### Manage custom account groups

The person can:

1. View all account groups, or filter by active/inactive status.
2. Add a custom group with:
   - Name
   - Type: Assets, Liabilities, Equity, Income, or Expenses
   - Optional parent group
   - Optional description
3. Edit a custom group’s name, type, parent, or description.
4. Delete a custom group by archiving it (it becomes inactive rather than being permanently removed).

Rules the person will encounter:

- A parent must be an existing group in the same company.
- A group cannot be its own parent or create a circular hierarchy.
- Built-in system groups cannot be edited or archived.
- A custom group cannot be archived while it has active child groups or active ledgers.

### Manage custom ledgers

The person can:

1. View ledgers in the selected fiscal year.
2. Search ledgers by name.
3. Filter ledgers by account group or active/inactive status.
4. Add a custom ledger with:
   - Name
   - Active account group
   - Optional opening balance (default 0)
   - Opening balance type: Debit (default) or Credit
   - Optional description
   - Whether manual entries are allowed (default Yes)
5. Edit those same custom-ledger details, except the optional system code is only accepted when creating a ledger and cannot be changed later.
6. Delete a custom ledger by archiving it.

Rules the person will encounter:

- The selected group must be active and belong to the company.
- Built-in system ledgers cannot be edited or archived.
- Creating, editing, or archiving a ledger is blocked when the selected fiscal year is locked. The configured date-based fiscal lock is currently used only by future transaction-date checks, not by the available ledger actions.

### Manage voucher-number sequences

The person can view and edit the pre-created sequence for each voucher type in the selected fiscal year. For each sequence they can change:

- Prefix (minimum 2 characters)
- Next number (positive whole number)
- Number padding (positive whole number)
- Whether it resets every fiscal year

They cannot create another voucher type or delete a voucher sequence through the current server.

## 7. Current end-user boundaries

The following are not available yet, so they should not appear as usable product journeys:

- Dashboard endpoint or dashboard summary
- Creating additional fiscal years, switching fiscal years through a dedicated UI/API, or closing a fiscal year
- Creating sales, purchases, journal entries, receipts, payments, contra entries, or any other vouchers
- Inventory, products, contacts, invoices, payments, reports, or stock movement
- Adding team members, sending invitations, or changing member roles
- Editing company profile data after setup
- Editing general company settings after the first save

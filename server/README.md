# Accounting Software Backend

Express + Node.js + MongoDB + Mongoose backend for the accounting software onboarding flow:

`register -> create company -> dashboard`

Interactive API docs are available at:

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs/openapi.json`
- Postman collection: `postman/Accounting-Software-API.postman_collection.json`

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- Refresh token rotation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in `server/` and configure:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accounting?appName=Cluster0
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
```

3. Start the server:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Health check:

```bash
GET /health
```

## Important Env Notes

- If your MongoDB password contains special characters like `@`, encode them.
- Example: `@` becomes `%40`.
- The database name belongs before the query string:

Correct:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/accounting?appName=Cluster0
```

Incorrect:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0/accounting
```

## Auth Flow

1. Register a user.
2. User receives `accessToken` and `refreshToken`.
3. User creates the first company.
4. Backend creates owner membership and marks onboarding complete.
5. Client loads dashboard bootstrap.

Users who have not created a company can still use auth/session endpoints, but dashboard access is blocked until onboarding is complete.

## Data Model

### User

- `name`
- `email`
- `passwordHash`
- `isActive`
- `onboardingStatus`
- timestamps

### Company

- `name`
- `currency`
- `country`
- `fiscalYearStartMonth`
- `createdBy`
- timestamps

### Membership

- `userId`
- `companyId`
- `role`
- timestamps

### RefreshToken

- `userId`
- `tokenHash`
- `userAgent`
- `ip`
- `expiresAt`
- `revokedAt`
- timestamps

## API Base URL

```text
/api
```

## Response Format

Success:

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "A valid email is required."
    }
  ]
}
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Refresh and logout use `refreshToken` in the request body.

## Endpoints

### 1. Register

`POST /api/auth/register`

Request:

```json
{
  "name": "Sujan Ban",
  "email": "sujan@example.com",
  "phone": "+9779800000000",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    },
    "session": {
      "user": {
        "id": "user_id",
        "name": "Sujan Ban",
        "email": "sujan@example.com",
        "phone": "+9779800000000",
        "onboardingStatus": "registered",
        "isActive": true
      },
      "activeCompany": null,
      "memberships": []
    }
  }
}
```

### 2. Login

`POST /api/auth/login`

Request:

```json
{
  "email": "sujan@example.com",
  "password": "StrongPass123!"
}
```

### 3. Refresh Token

`POST /api/auth/refresh`

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### 4. Logout

`POST /api/auth/logout`

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### 5. Get Current Session

`GET /api/auth/me`

Returns the logged-in user, memberships, active company, and onboarding state.

### 6. Create First Company

`POST /api/companies`

Headers:

```http
Authorization: Bearer <access_token>
```

Request:

```json
{
  "name": "Acme Accounting Pvt Ltd",
  "currency": "USD",
  "country": "US",
  "fiscalYearStartMonth": 1
}
```

Response behavior:

- Creates company
- Creates `owner` membership
- Changes onboarding status to `completed`

### 7. Dashboard Bootstrap

`GET /api/dashboard/bootstrap`

Headers:

```http
Authorization: Bearer <access_token>
```

Rules:

- Requires authenticated user
- Requires completed onboarding

Returns:

- session payload
- placeholder dashboard summary counts

## Validation Rules

### Register

- `name` required, minimum 2 characters
- `email` must be valid
- `password` minimum 8 characters

### Login

- `email` required and valid
- `password` required

### Create Company

- `name` required, minimum 2 characters
- `currency` optional string
- `country` optional string
- `fiscalYearStartMonth` optional integer from 1 to 12

## Auth and Security Notes

- Passwords are hashed with `bcryptjs`.
- Refresh tokens are stored as SHA-256 hashes in MongoDB.
- Refresh token rotation is enabled.
- Logout revokes the submitted refresh token.
- Access tokens are validated on protected routes.

## Example Frontend Flow

1. Call `POST /api/auth/register`.
2. Store `accessToken` and `refreshToken`.
3. Call `POST /api/companies` with the access token.
4. Replace tokens when `POST /api/auth/refresh` is used.
5. Call `GET /api/dashboard/bootstrap`.

## Current Limitations

- No email verification yet
- No forgot-password/reset-password flow yet
- No invitation or multi-user management API yet
- No company switching API yet
- Dashboard summary is placeholder data for now

## Project Structure

```text
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    validators/
```

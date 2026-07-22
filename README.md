# Ledgerly

Ledgerly is deployed as one Node.js service: Express serves the React application and the `/api` endpoints from the same origin.

## Local development

1. Copy `.env.example` to `.env` and provide MongoDB and JWT values.
2. Run `npm install` once at the repository root.
3. Run `npm run dev`.

The Vite client starts on `http://localhost:3000` and proxies API calls to the Express server on the `PORT` configured in `.env` (default `5001`).

## Production deployment

Configure the variables from `.env.example` in the hosting provider, then use:

```bash
npm ci
npm run build
npm start
```

The service listens on `PORT` and serves the UI, SPA routes, `/api`, `/api/docs`, and `/health` from one origin. No browser-visible environment variables are required for the default deployment.

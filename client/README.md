# Accounting Software Client

## Environment

For local development, create `client/.env` from `.env.example`:

```env
VITE_API_BASE_URL=/api
```

The Vite development server proxies `/api` to `http://localhost:5001`. Keep the server configuration aligned:

```env
# server/.env
PORT=5001
CLIENT_ORIGIN=http://localhost:3000
```

For a deployed client, set `VITE_API_BASE_URL` to the public API base URL (for example, `https://api.example.com/api`) and set `CLIENT_ORIGIN` on the server to the deployed client origin. `VITE_*` variables are public browser configuration—never put secrets in them.

## Start

```bash
npm run dev
```

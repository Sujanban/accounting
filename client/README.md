# Accounting Software Client

## Environment

Environment configuration lives in the repository-root `.env`. The client always calls the same-origin `/api` path; Vite proxies that path to the local Express server in development.

## Start

```bash
npm run dev --workspace=accounting-software-client
```

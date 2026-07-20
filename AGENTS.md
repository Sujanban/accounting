# MERN Stack Engineering Standards

This file defines the default standards for a production-quality MERN application (MongoDB, Express, React, Node.js). Apply these rules to all features, fixes, refactors, tests, infrastructure changes, and documentation.

## Core Principles

- Build secure, maintainable, observable, and scalable software.
- Favor simple, well-tested solutions over unnecessary abstraction.
- Validate all untrusted input and enforce authorization on the server.
- Preserve backward compatibility for public APIs unless a documented migration/versioning plan exists.
- Keep modules cohesive, dependencies intentional, and changes small enough to review safely.
- Never commit secrets, production data, credentials, tokens, private keys, or local environment files.

## Recommended Repository Structure

```text
client/                         # React application
  src/
    app/                        # App bootstrap, routing, providers
    features/                   # Feature/domain modules
    components/                 # Shared presentational components
    hooks/                      # Reusable React hooks
    services/                   # API clients and external integrations
    lib/                        # Small shared utilities/configuration
    styles/                     # Global styles/tokens

server/                         # Node.js/Express API
  src/
    config/                     # Environment and infrastructure config
    routes/                     # URL definitions and middleware composition
    controllers/                # HTTP request/response adaptation
    services/                   # Business logic and workflows
    models/                     # Mongoose schemas and database access
    middleware/                 # Auth, validation, errors, rate limits
    validators/                 # Request validation schemas
    utils/                      # Narrow shared utilities
    jobs/                       # Background jobs/workers, if needed
  tests/

docs/                           # Architecture, API, operations documentation
```

Organize code by feature/domain as the application grows. Avoid a single global `utils` or `components` dumping ground.

## JavaScript and TypeScript

- Prefer TypeScript for new applications and new modules. Enable strict mode; do not use `any` to bypass type errors.
- If the codebase uses JavaScript, use JSDoc for non-obvious public functions and preserve consistent module conventions.
- Use descriptive names, small functions, early returns, and immutable data transformations where practical.
- Avoid hidden side effects, deeply nested callbacks, large files, and duplicated business rules.
- Keep formatting and linting automated through the repository's configured tools. Do not hand-format generated output.

## Backend: Node.js and Express

### Architecture

- Routes define endpoints and middleware order only.
- Controllers translate HTTP input/output only; keep them thin.
- Services contain business rules and orchestration.
- Models define persistence, schema constraints, indexes, and narrowly scoped data access.
- Middleware handles cross-cutting concerns such as authentication, authorization, validation, logging, errors, and rate limits.
- Keep external integrations behind explicit service/adaptor interfaces.

### API Design

- Use resource-oriented, predictable endpoints and correct HTTP methods/status codes.
- Version public APIs when making breaking changes (for example, `/api/v1`).
- Return a consistent response and error shape across the API.
- Use plural nouns for collection resources (`/users`) and stable identifiers for single resources (`/users/:userId`). Do not encode actions in URLs when an HTTP method or sub-resource expresses the intent.
- Keep request and response field names consistent, use ISO 8601 UTC timestamps, and document nullability, defaults, limits, and enum values.
- Use these status-code expectations consistently: `200` for reads/updates, `201` for creates, `202` for accepted async work, `204` for successful empty responses, `400` for malformed requests, `401` for unauthenticated requests, `403` for unauthorized requests, `404` for unavailable resources, `409` for conflicts, `422` for semantically invalid input, `429` for rate limits, and `5xx` only for server-side failures.
- Use a stable error contract, for example:

  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "One or more fields are invalid.",
      "details": [{ "field": "email", "message": "Enter a valid email address." }],
      "requestId": "..."
    }
  }
  ```

  Keep error `code` values machine-readable and stable. Return only safe messages and field errors; never expose internals.
- Validate route params, query strings, headers, and bodies before reaching controllers.
- Reject or ignore unknown writable fields to prevent mass assignment.
- Paginate collection endpoints; cap page sizes; whitelist sortable/filterable fields; use explicit response projections.
- Use cursor pagination for large or frequently changing collections. If using offset pagination, publish a maximum offset and a deterministic sort order.
- Use idempotency keys for retryable create/payment/order-like operations. Persist the key, request fingerprint, response, and expiration so the same key cannot cause a duplicate side effect.
- Support conditional requests (`ETag`/`If-Match`) or version fields for resources susceptible to conflicting edits.
- Make long-running operations asynchronous (`202 Accepted`) and provide a status resource or webhook/event notification rather than holding a request open.
- Set and document API limits: request payload size, upload size/type, pagination caps, rate-limit policy, and timeout behavior. Return `429` with `Retry-After` when appropriate.
- Define request/response contracts in OpenAPI or equivalent API documentation and update them with behavior changes.
- Treat OpenAPI as a contract: include examples, authentication schemes, all non-success responses, pagination, validation constraints, and deprecation notes. Generate or run contract tests where practical.
- Deprecate before removing public behavior. Announce replacement endpoints/fields, set a retirement date, and preserve compatibility during the published migration window.
- Use centralized async error handling. Never expose stacks, database errors, file paths, or internal implementation details to clients.
- Set body-size limits, request timeouts, and safe parsers for only the content types the application needs.

### Endpoint and Path Conventions

- Prefix application endpoints with a versioned base path: `/api/v1`.
- Use lowercase, kebab-case, plural resource nouns. Good: `/api/v1/blog-posts`; avoid: `/api/v1/BlogPosts`, `/api/v1/getBlogPosts`, or `/api/v1/blogPost`.
- Use path parameters only to identify a resource: `/api/v1/users/:userId`. Use query parameters only for optional filtering, sorting, pagination, field selection, and search.
- Use nested paths only for a clear parent-child relationship: `/api/v1/users/:userId/addresses`. Do not nest more than two levels; expose the child collection directly when nesting becomes deep.
- Do not put verbs in ordinary resource paths. Prefer `DELETE /api/v1/users/:userId` over `POST /api/v1/users/:userId/delete`.
- For an action that cannot be represented as a normal resource update, use a specific action endpoint: `POST /api/v1/auth/login`, `POST /api/v1/orders/:orderId/cancel`, or `POST /api/v1/files/:fileId/download-url`.
- Use one canonical identifier format for each resource (for example UUID or MongoDB ObjectId) and validate it before querying the database.

| Intent | HTTP method | Path example | Expected result |
| --- | --- | --- | --- |
| List resources | `GET` | `/api/v1/products?page=1&limit=20&sort=-createdAt&status=active` | `200 OK` with paginated collection |
| Read one resource | `GET` | `/api/v1/products/:productId` | `200 OK` or `404 Not Found` |
| Create resource | `POST` | `/api/v1/products` | `201 Created`; include `Location` header where useful |
| Replace complete resource | `PUT` | `/api/v1/products/:productId` | `200 OK`/`204 No Content`; require the complete representation |
| Update selected fields | `PATCH` | `/api/v1/products/:productId` | `200 OK`/`204 No Content`; validate an allowlisted set of fields |
| Delete resource | `DELETE` | `/api/v1/products/:productId` | `204 No Content` or an explicit archive result |
| Create child resource | `POST` | `/api/v1/products/:productId/reviews` | `201 Created` |

#### GET Requests

- `GET` requests are safe and must never change application state.
- Use query parameters for optional collection controls. Example:

  ```http
  GET /api/v1/products?category=books&minPrice=10&maxPrice=50&sort=-createdAt&page=1&limit=20 HTTP/1.1
  Accept: application/json
  Authorization: Bearer <access-token>
  ```

- Whitelist filter and sort keys. Reject invalid values and cap `limit`; do not pass raw query parameters to MongoDB.
- Use a documented, stable default ordering. For large or changing lists, prefer cursor pagination such as `?cursor=<opaque-cursor>&limit=20`.
- A paginated success response should include data and metadata, for example:

  ```json
  {
    "success": true,
    "data": [{ "id": "...", "name": "Example product" }],
    "meta": { "page": 1, "limit": 20, "total": 42, "hasNextPage": true },
    "requestId": "..."
  }
  ```

#### POST Requests

- Use `POST` to create a resource or invoke an explicitly named non-idempotent action.
- Send JSON requests with `Content-Type: application/json`; validate body shape, required fields, types, lengths, and allowed values.
- Do not accept server-controlled fields such as `id`, `createdAt`, `updatedAt`, `ownerId`, `role`, `status`, or authorization scope from the client unless an endpoint expressly allows them.
- For retryable operations that have side effects, require an `Idempotency-Key` header and return the original result when the same valid key is retried.
- Example create request and response:

  ```http
  POST /api/v1/products HTTP/1.1
  Content-Type: application/json
  Authorization: Bearer <access-token>
  Idempotency-Key: 9d9dc5b3-8c5f-4f07-9ef1-5afc38d7c038

  { "name": "Example product", "price": 29.99, "category": "books" }
  ```

  ```http
  HTTP/1.1 201 Created
  Location: /api/v1/products/64f0...
  Content-Type: application/json

  {
    "success": true,
    "data": { "id": "64f0...", "name": "Example product", "price": 29.99, "category": "books" },
    "requestId": "..."
  }
  ```

#### PATCH, PUT, and DELETE Requests

- Prefer `PATCH` for partial changes. Accept only fields the caller is authorized to modify and return validation errors per field.
- Use `PUT` only when the client sends a complete replacement representation. Do not use `PUT` as a generic partial-update method.
- Use `DELETE` for removal. If records must be retained, implement an archive/soft-delete policy internally and still make the external behavior explicit.
- Require confirmation mechanisms for destructive or high-impact actions when appropriate (for example, a version/ETag, a confirmation field, or a separate action endpoint).

### Pagination Standards

- Paginate every collection endpoint that can grow beyond a small, fixed, documented result set. Never return an unbounded collection.
- Use a maximum page size (normally 50–100 depending on response size) and a conservative default (normally 20–25). Validate `limit` as a positive integer and reject or clamp values above the maximum consistently.
- Always apply a deterministic sort order. Include a unique tie-breaker such as `_id` when the primary sort field is not unique, for example `createdAt DESC, _id DESC`.
- Use offset/page pagination for small, stable administrative lists where total-count display is important:

  ```http
  GET /api/v1/users?page=2&limit=20&sort=-createdAt
  ```

  ```json
  {
    "success": true,
    "data": [],
    "meta": {
      "page": 2,
      "limit": 20,
      "total": 145,
      "totalPages": 8,
      "hasPreviousPage": true,
      "hasNextPage": true
    },
    "requestId": "..."
  }
  ```

- Prefer cursor (keyset) pagination for large, high-write, infinite-scroll, or time-ordered collections. Cursors avoid slow large offsets and reduce duplicate/missing records when new data arrives:

  ```http
  GET /api/v1/events?limit=20&sort=-createdAt&cursor=eyJjcmVhdGVkQXQiOiIuLi4iLCJpZCI6Ii4uLiJ9
  ```

  ```json
  {
    "success": true,
    "data": [],
    "meta": {
      "limit": 20,
      "nextCursor": "opaque-cursor-or-null",
      "hasNextPage": true
    },
    "requestId": "..."
  }
  ```

- Make cursors opaque, signed or validated, and tied to the endpoint's sort/filter context. Do not expose raw database queries or trust a decoded cursor without validation.
- Do not run `countDocuments()` on every large-list request merely to return a total. Omit totals for cursor pagination, calculate them only when explicitly requested and affordable, or use an asynchronously maintained count where needed.
- Reset the client cursor/page whenever filters or sort order change. Do not mix data from different query states.
- Include only response fields needed by the list view; retrieve full details through a single-resource endpoint.

### API Performance Standards

- Establish performance budgets for critical endpoints (latency percentile, payload size, error rate, and database query count). Measure them with production-like data before and after significant changes.
- Start with efficient database access: filter early, use explicit projections, apply pagination, and fetch only needed documents/fields. Use `.lean()` for read-only Mongoose queries where document methods and middleware are not required.
- Create compound indexes that match real filter and sort patterns, with equality fields first and sort/range fields after them. Verify plans with `explain()` and monitor slow-query logs; remove unused indexes deliberately.
- Do not use regex, unbounded `$in`, `$lookup`-like expensive aggregation, `$where`, or broad collection scans on hot endpoints without a measured, indexed design.
- Avoid N+1 queries. Batch lookups, use carefully selected `populate` projections, or reshape API responses when multiple dependent reads are needed.
- Set database query time limits (`maxTimeMS` where applicable), API request timeouts, and outbound-call timeouts. Propagate cancellation/abort signals when the stack supports them.
- Cache only data that is safe to cache and has a clear invalidation policy. Use HTTP caching (`ETag`, `Cache-Control`) for public or user-safe GET responses, and use a shared cache for high-read, low-change data when authorization boundaries are preserved.
- Never cache private responses in shared caches unless the cache key, headers, tenant/user separation, encryption, and invalidation behavior are explicitly designed and tested.
- Use conditional GET requests (`ETag`/`If-None-Match`) to return `304 Not Modified` for unchanged cacheable resources.
- Compress eligible JSON/text responses and serve images/static assets through appropriate object storage/CDN paths. Do not compress already compressed binary formats unnecessarily.
- Keep response payloads small: use field projections, avoid duplicate nested data, avoid embedding large arrays, and offer explicit include/expand parameters only with strict allowlists and limits.
- Move exports, report generation, bulk processing, notifications, and other long-running work to asynchronous jobs. Return `202 Accepted` and expose job status rather than blocking API workers.
- Use connection pooling correctly and close connections gracefully on shutdown. Keep API processes stateless so horizontal scaling is safe.
- Protect dependencies with bounded retries, exponential backoff plus jitter, circuit breakers where appropriate, concurrency limits, and fallback behavior. Never retry non-idempotent writes unless an idempotency mechanism is in place.
- Rate-limit and quota expensive endpoints per IP, user, API key, and/or tenant as appropriate. Apply stricter limits to search, exports, authentication, and report endpoints.
- Load-test critical flows, track p50/p95/p99 latency, database timings, CPU/memory, event-loop lag, and payload size. Investigate regressions before increasing infrastructure capacity.

### Authentication and Authorization

- Authenticate every protected request and authorize every action against the authenticated identity and resource ownership/role.
- Apply least privilege and deny by default. Authentication alone is never sufficient authorization.
- Hash passwords using Argon2id or bcrypt with an appropriate work factor. Never store or log plaintext passwords.
- Use short-lived access tokens. Store refresh/session tokens securely, make them revocable, rotate them where applicable, and invalidate them on logout/password reset.
- For browser applications, prefer `HttpOnly`, `Secure`, appropriately scoped `SameSite` cookies for long-lived session/refresh credentials. Do not store long-lived tokens in `localStorage`.
- Verify token signature, expiry, issuer, audience, algorithm, and expected token type where relevant.
- Protect state-changing cookie-authenticated requests with a CSRF strategy.
- Use generic authentication error messages and rate limits to reduce account enumeration and credential-stuffing risk.

### Security

- Validate, normalize, and constrain all external input with allowlists, type checks, length limits, enums, and format validation.
- Never spread untrusted input into MongoDB filters or update objects. Build allowlisted query/update objects explicitly to prevent NoSQL injection and mass assignment.
- Use Helmet or equivalent security headers. Configure CORS with explicit origins; never use wildcard origins with credentials.
- Rate-limit authentication, password reset, upload, search, expensive report, and other abuse-prone endpoints.
- Enforce authorization for uploads and downloads; allowlist MIME types/extensions, limit file size/count, generate server-side names, scan content where required, and never execute uploaded files.
- Use parameterized APIs and safe libraries for all data stores and external commands. Never construct shell commands from request data.
- Redact secrets, passwords, tokens, cookies, authorization headers, and sensitive personal data from logs, traces, errors, and analytics.
- Keep production debug mode disabled. Return safe client messages and retain detailed diagnostics only in protected server logs.

### Injection and Input-Handling Defenses

- Treat all data crossing a trust boundary as untrusted: HTTP parameters/bodies/headers, cookies, uploaded files, webhooks, environment-derived user values, queue messages, and third-party API responses.
- Define a server-side validation schema for every endpoint's `params`, `query`, and `body`. Validate before controllers/services and return a consistent `400` or `422` error with safe, field-level messages.
- Use allowlists, not blocklists: define accepted fields, data types, enum values, formats, minimum/maximum lengths, numeric ranges, array sizes, and object nesting depth. Reject unknown fields on create/update endpoints unless extensibility is explicitly required.
- Normalize input before validation where appropriate: trim surrounding whitespace, normalize Unicode for identity fields, lowercase canonical emails, and parse dates/numbers with strict formats. Do not silently transform security-sensitive values such as passwords, tokens, signatures, or cryptographic material.
- Validate fields according to their meaning, not merely their type: use a maintained email validator, parse URLs with a URL parser plus policy checks, require UUID/ObjectId formats for IDs, and use explicit date/timezone rules.
- Enforce server-controlled fields. Clients must not submit or modify identifiers, ownership/tenant IDs, roles, permissions, account status, timestamps, audit fields, prices, balances, or workflow state unless a narrowly authorized endpoint permits it.
- Set global and per-route request-body limits; set maximum string length, array item count, pagination limit, filter count, and nesting depth. Reject oversized input early to reduce memory and denial-of-service risk.
- Use validation libraries/schema definitions consistently (for example Zod, Joi, Yup, express-validator, or JSON Schema). Keep schemas close to the API contract and reuse domain constraints where possible.
- Do not return raw rejected values in validation errors or logs, especially for passwords, tokens, addresses, payment details, and free-text content.
- Perform output encoding at the rendering context in the frontend. Input validation protects the API; it does not make user-provided data automatically safe for HTML, URLs, JavaScript, SQL, logs, or file paths.

  ```js
  // Example shape: only expected fields are accepted.
  const createUserSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(12).max(128)
  }).strict();
  ```

- Never construct SQL by concatenating or interpolating user input. If a service uses SQL now or later, use its parameterized-query/prepared-statement API for every value.

  ```js
  // Safe: the database driver binds the value as data, not SQL syntax.
  const result = await db.query(
    'SELECT id, email FROM users WHERE email = $1',
    [email]
  );

  // Unsafe — never do this.
  // await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  ```

- Parameterization cannot safely bind identifiers such as a column name or `ORDER BY` direction. For those, select only from a strict server-side allowlist; never accept arbitrary table names, columns, operators, or SQL fragments.
- Do not rely on escaping, blacklists, or client-side validation as SQL-injection protection. They are supplementary controls, not safe query construction.
- For MongoDB/Mongoose, validate primitive types before querying and construct filters explicitly. Reject operator-shaped objects and forbidden keys such as `$where`, `$expr`, `$regex` (unless intentionally constrained), and dotted paths from user input.

  ```js
  // Safe: allowlisted, typed filter fields.
  const filters = {};
  if (typeof req.query.status === 'string' && ALLOWED_STATUS.has(req.query.status)) {
    filters.status = req.query.status;
  }
  const users = await User.find(filters).select('name email status').lean();

  // Unsafe — a client can inject MongoDB operators or fields.
  // const users = await User.find(req.query);
  ```

- Do not enable or use MongoDB server-side JavaScript (`$where`, map-reduce JavaScript) with request-controlled input. Bound regex searches by length, escape literal search terms, and use indexed/text-search solutions where possible.
- Never pass user input to `eval`, `Function`, dynamic `require`/`import`, shell commands, process execution, template compilation, or deserialization of untrusted data. Prefer library APIs that take argument arrays; if process execution is unavoidable, use a fixed executable plus allowlisted arguments and never invoke a shell.
- Prevent XSS by rendering user content as text by default. Avoid `dangerouslySetInnerHTML`; when HTML is an explicit feature, sanitize it with a maintained allowlist on the server and enforce a Content Security Policy.
- Prevent path traversal by treating client file names and paths as labels, not filesystem paths. Generate server-side storage names; resolve against a fixed base directory and verify the resolved path remains inside it.
- Prevent SSRF: do not fetch arbitrary user-supplied URLs. If URL fetching is a feature, allowlist schemes/hosts, block loopback/private/link-local/reserved IP ranges after DNS resolution, restrict redirects, limit response size/time, and use egress controls.
- Use CSRF protections for cookie-authenticated state-changing requests. Use `SameSite` cookies as defense in depth, not as the only control.
- Use safe parsers for JSON, XML, CSV, archives, and serialized data. Disable dangerous XML external entities, enforce nesting/size limits, and scan/archive-check uploads where applicable.
- Keep database and service accounts least-privileged. Even a successful injection must not grant schema administration, broad data access, or operating-system access.

### Configuration and Secrets

- Keep configuration in environment variables and an approved secret manager; commit only `.env.example` with placeholders and descriptions.
- Validate environment variables on startup and fail fast for missing, malformed, or unsafe production configuration.
- Separate development, test, staging, and production configuration. Tests must never use production services or data.
- Rotate credentials after exposure and use least-privileged database/service accounts.

## Database: MongoDB and Mongoose

- Define schema types, validation, required fields, defaults, enums, and indexes intentionally.
- Add indexes based on measured query patterns; review index impact on writes, storage, and deployment time.
- Use unique indexes for real uniqueness requirements and handle duplicate-key errors predictably.
- Use explicit projections and mark sensitive fields with `select: false`; never return complete database documents by default.
- Use atomic updates for counters and concurrent changes. Use optimistic concurrency/versioning for contested records where appropriate.
- Use transactions for multi-document workflows that must be atomic. Design retry behavior for transient transaction failures.
- Avoid unbounded queries, unbounded array growth, N+1 query patterns, and embedding data that needs independent lifecycle/querying.
- Define retention, archival, backup, restore, and deletion requirements for user data. Prefer reversible/archive states where business or legal requirements require history.
- Never run destructive migrations or broad update/delete scripts without a reviewed backup, exact target scope, dry-run/verification plan, and rollback strategy.

## Frontend: React

- Use functional components and hooks. Keep components focused and compose reusable behavior through hooks and feature modules.
- Separate server state from local UI state. Centralize API calls in a service/client layer; do not scatter `fetch` calls across components.
- Use **TanStack Query** for all server state: API reads, mutations, caching, request deduplication, loading/error state, background refetching, and pagination. Do not duplicate API responses in Redux, Context, Zustand, or component state unless there is a clear, temporary UI-only reason.
- Keep query functions in the feature API/service layer and expose small feature hooks such as `useProducts`, `useProduct`, `useCreateProduct`, and `useUpdateProduct`. Components should not build URLs, manage cache keys, or call `fetch` directly.
- Define query keys centrally, hierarchically, and with all result-affecting inputs included. Example: `['products']`, `['products', 'list', filters]`, and `['products', 'detail', productId]`. Do not use unstable objects/functions or secrets in query keys.
- Use `useQuery` for reads, `useMutation` for writes, and `useInfiniteQuery` for cursor-based infinite lists. Prefer normal paginated `useQuery` for numbered-page interfaces.
- After a successful mutation, invalidate or precisely update affected query keys. Do not manually change multiple caches without a clear consistency strategy; refetch when correctness is uncertain.
- Use optimistic updates only for low-risk, reversible actions. Snapshot previous cache data, cancel in-flight reads, roll back on error, and reconcile with the authoritative server response on success.
- Configure retries deliberately. Do not automatically retry validation, authentication, authorization, conflict, or most `4xx` errors; use bounded retries/backoff for transient network and `5xx` failures only.
- Set `staleTime` based on data volatility and user expectations. Avoid globally treating all data as permanently fresh or refetching every query on every render/navigation.
- Handle `401` responses centrally: safely refresh/re-authenticate according to the session design, then retry only the original safe request once. Clear protected cached data when a session expires, user changes, or logout succeeds.
- Keep query error messages safe and user-focused. Log technical details only through the approved error-reporting path and never expose tokens, response bodies containing secrets, or internal stack traces.
- Use `enabled` to prevent queries until required IDs/authorization context exist, `select` to shape only needed data, and `AbortSignal` support in the query function to cancel obsolete requests.
- Persist query cache only when necessary and only for non-sensitive data with a short, intentional retention period. Never persist access tokens, refresh tokens, passwords, or private responses in browser storage.

  ```ts
  // Query keys and the API call stay outside the component.
  export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
    detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  };

  export function useProducts(filters: ProductFilters) {
    return useQuery({
      queryKey: productKeys.list(filters),
      queryFn: ({ signal }) => productsApi.list(filters, { signal }),
      staleTime: 30_000,
    });
  }

  export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: productsApi.create,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    });
  }
  ```

- Handle loading, empty, error, success, retry, cancellation, and expired-session states deliberately.
- Treat browser code as public. Only expose public build-time configuration; never put server secrets in frontend environment variables.
- Client-side validation and route guards improve UX but never replace backend validation or authorization.
- Do not render user-controlled HTML. Avoid `dangerouslySetInnerHTML`; when unavoidable, sanitize with a maintained allowlist.
- Prevent duplicate submissions with pending states and idempotent backend behavior. Confirm destructive actions and clearly communicate their consequences.
- Build accessible interfaces: semantic HTML, labels, keyboard navigation, focus management, visible validation errors, adequate contrast, and screen-reader-friendly status updates.
- Keep bundles lean: code-split routes/features, lazy-load non-critical modules, optimize assets, and measure performance before adding client dependencies.
- Use error boundaries for rendering failures and user-safe error reporting. Do not expose implementation details in the UI.

## Testing and Quality

- Add or update tests for every behavior change. Test success, validation failure, authorization failure, ownership boundaries, edge cases, and regressions.
- Use unit tests for pure logic, integration tests for routes/services/database behavior, and end-to-end tests for critical user journeys.
- Keep tests deterministic, isolated, and parallel-safe. Use fixtures/factories and dedicated test databases; never test against development or production data.
- Mock external services at boundaries, but exercise real integration behavior where it matters.
- Run configured formatting, linting, type checking, tests, and production builds before handoff.
- Treat test failures, lint warnings, type errors, and security alerts as work to resolve—not output to ignore.

## Performance and Scalability

- Measure before optimizing. Use profiling, logs, metrics, and production-like load tests to identify bottlenecks.
- Keep API instances stateless; store shared/session state in appropriate external services so instances can scale horizontally.
- Paginate, filter, and project database results; cache only where correctness, invalidation, and authorization are understood.
- Move slow, retryable, or non-interactive work to background jobs/queues. Make jobs idempotent and observable.
- Use timeouts, bounded retries with exponential backoff, circuit breaking where appropriate, and graceful degradation for external dependencies.
- Stream large data where possible. Set safe limits for exports, uploads, and expensive aggregations.

## Observability and Operations

- Use structured JSON logs in production. Every HTTP request log must include timestamp, level, service/environment, request or correlation ID, method, normalized route, status code, duration, and safe contextual fields.
- Accept a validated incoming correlation ID where appropriate; otherwise generate one at the API edge. Return it in the response (for example, `X-Request-ID`) and propagate it to logs, background jobs, outbound requests, and error reports.
- Log one completion event per request and emit error events with error code/category, stack trace (server-side only), request ID, and safe diagnostic context. Do not log every middleware step at `info` level.
- Use levels consistently: `debug` for local diagnosis, `info` for normal lifecycle/request completion, `warn` for recoverable or suspicious conditions, and `error` for failed requests or operations requiring attention. Do not use `console.log` in production code; use the configured logger.
- Redact `Authorization`, cookies, session IDs, access/refresh tokens, passwords, API keys, secret fields, payment data, and sensitive personal data before logs leave the process. Treat query strings and request bodies as sensitive by default.
- Never log raw request or response bodies by default. If temporary diagnostic logging is necessary, allowlist only essential fields, protect access, and remove it after diagnosis.
- Preserve enough context to investigate failures without storing sensitive data: actor ID (where permitted), tenant/account ID, resource type/ID, operation, dependency name, and request ID.
- Use log sampling for high-volume successful requests, never sample away security events, and make sampling rules visible in configuration/documentation.
- Define retention, access control, and deletion policies for logs. Restrict log access, encrypt logs in transit and at rest where supported, and account for privacy/compliance requirements.
- Capture unhandled exceptions and rejections, log them safely, stop accepting new traffic, finish or time out in-flight work, and exit so the process manager can restart the service. Do not continue in an unknown state.
- Provide health/readiness endpoints that do not disclose sensitive system details.
- Monitor errors, latency, throughput, resource saturation, database health, queue depth, and authentication anomalies.
- Track API metrics by route, method, status class, latency percentiles, request/response size, rate-limit decisions, and dependency failures. Avoid unbounded-cardinality labels such as raw user IDs or URLs.
- Define alert thresholds and runbooks for common failures. Test backups and restore procedures regularly.
- Deploy immutable builds through CI/CD. Use staged rollouts where possible and keep rollback procedures documented and executable.

## Dependencies and Supply Chain

- Add a dependency only when the benefit outweighs maintenance, license, security, and bundle/runtime cost.
- Use maintained packages, commit lockfiles, remove unused dependencies, and scan for known vulnerabilities.
- Pin or constrain versions according to the repository policy; update dependencies deliberately and test compatibility.
- Never execute install scripts, downloaded code, or generated commands from untrusted sources without review.

## Git, Reviews, and Documentation

- Do not overwrite, revert, or reformat unrelated user changes.
- Use small, focused commits with clear conventional-style messages when the project uses them.
- Pull requests should describe behavior, API/schema/configuration changes, security implications, tests run, operational impact, and rollback/migration steps.
- Update README, API docs, architecture records, and runbooks when behavior, setup, public contracts, or operations change.
- Keep comments focused on intent and constraints; let clear code describe mechanics.

## Definition of Done

A change is complete only when it meets acceptance criteria, is reviewed for security and authorization, validates external input, handles expected failures safely, preserves data integrity, includes proportionate tests, passes all relevant checks, and updates documentation/configuration/migration material as needed.

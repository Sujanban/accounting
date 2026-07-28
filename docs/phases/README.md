# ERP Implementation Phases

This directory is the canonical, version-controlled roadmap for the ERP implementation. Keep future phase updates here and reference the documents during planning, reviews, and release preparation. Each delivery phase includes its frontend route/API coverage and completion criteria; implement and verify one phase before starting the next.

## Implementation scope and API reference

Before implementing a phase, review the existing API collection in [`server/postman/Accounting-Software-API.postman_collection.json`](../../server/postman/Accounting-Software-API.postman_collection.json) as the primary API reference. It documents the available endpoints, request shapes, authentication expectations, and response examples that the frontend should use.

## Tally parity check

Before beginning each new phase item, verify against current official Tally documentation whether Tally supports the equivalent workflow. Record the source and the result in the implementation notes or pull request. Do not implement a feature solely for Tally parity when Tally does not support it; raise it as a separate product decision instead.

Keep backend API changes to the minimum necessary. Prefer the existing API contract and make an API change only when the phase requirement cannot be delivered otherwise. Do not use a phase as a reason to redesign or expand unrelated backend behavior.

Implement only the feature scope explicitly described in the relevant phase document. The phase documents are intentionally incremental: do not build a full or complex version of a feature ahead of the phase that calls for it. Record any genuinely required API gap or future enhancement in the relevant phase document for later work.

| Phase | Focus |
| --- | --- |
| [Phase 2](phase-2-accounting-foundation.md) | Accounting foundation |
| [Phase 3](phase-3-business-masters.md) | Business masters |
| [Phase 4](phase-4-transaction-engine.md) | Transaction engine |
| [Phase 5](phase-5-voucher-modules.md) | Voucher modules |
| [Phase 6](phase-6-reports-and-financial-statements.md) | Reports and financial statements |
| [Phase 7](phase-7-nepal-localization-and-compliance.md) | Nepal localization and compliance |
| [Phase 8](phase-8-enterprise-modules.md) | Enterprise modules |
| [Phase 9](phase-9-saas-platform-integrations-and-production-readiness.md) | SaaS platform, integrations, and production readiness |

The original working copies remain in place for now to avoid deleting user files. After this documentation set is committed and reviewed, use this directory as the maintained source of truth.

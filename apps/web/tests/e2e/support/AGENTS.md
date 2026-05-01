# AGENTS.md

## Scope

This file applies to `apps/web/tests/e2e/support/`.

## Instructions

- This folder is the central collection of E2E test shims.
- Keep Docker database lifecycle helpers, auth cookie helpers, seed data helpers, and future local provider fakes here.
- Document every shim in `README.md` when adding or changing it.
- Shims must stay test-only and must not be imported by production app code.
- Shims should preserve app-owned boundaries: ordinary Postgres for data, signed app sessions for auth, provider-neutral object keys for file references.

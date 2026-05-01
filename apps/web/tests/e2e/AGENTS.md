# AGENTS.md

## Scope

This file applies to `apps/web/tests/e2e/`.

## Instructions

- Keep E2E tests and test-only support under this folder. Do not create a repository-root `tests/` folder.
- Put all test shims in `support/` and document them in `support/README.md`.
- E2E tests should run against a disposable Docker Postgres database using the app migration baseline.
- Do not add production app routes, environment flags, or test-only backdoors to mock auth or data.
- Prefer signed app-session cookies and seeded app-owned Postgres rows over real Google OAuth.
- Avoid Supabase Storage, OpenAI, Web Push, or other external provider calls in baseline E2E tests unless a test explicitly owns that integration.

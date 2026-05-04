# E2E Support Shims

This folder is the central collection of test-only shims for Playwright E2E.

Current shims:

- `test-db.mjs`: starts a disposable Docker `postgres:16` container, applies the current app migration baseline, exposes a normal `POSTGRES_URL`, and removes the container after the run.
- `db.ts`: seeds, inspects, and cleans app-owned Postgres rows for tests, writes local object-storage fixtures, seeds the base avatar style precondition, and can seed a cron-ready pet whose hoomin timezone is currently at the 6am generation window.
- `auth.ts`: creates a signed `dear_hoomin_session` cookie that matches the app session format, avoiding real Google OAuth.

Local media capture:

- `npm run test:e2e:screenshots` saves screenshots for every test.
- `npm run test:e2e:video` saves videos for every test.
- `node scripts/run-e2e.mjs --screenshots-on-failure` saves screenshots only for failures.
- `node scripts/run-e2e.mjs --video-on-failure` keeps videos only for failures.
- Playwright writes media under `test-results/e2e/`, which is ignored by git.

Rules:

- Keep all E2E shims here, not in production app folders.
- Do not create test-only app routes or production environment flags for auth/data setup.
- Keep E2E data provider-neutral. Tests should run with only Docker Postgres unless a test explicitly targets an external provider integration.
- Avoid binary object flows in baseline E2E tests. Storage-specific tests should use the app storage boundary and a local adapter or explicit provider setup.
- Use separate browser contexts when a flow involves multiple signed-in hoomins, such as family invites.

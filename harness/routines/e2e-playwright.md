# Playwright E2E Verification

## Purpose

Run the web app's Docker-backed Playwright E2E flow to verify the first-thought experience against a disposable ordinary Postgres database.

## Preferred Workflow

From `apps/web`:

```sh
npm run test:e2e
```

This runner:

- Starts a disposable `postgres:16` Docker container.
- Applies the current baseline migration from `infra/supabase/migrations/`.
- Runs Next through Playwright's web server flow.
- Uses E2E-only shims from `apps/web/tests/e2e/support/`.
- Removes the Docker container after the run.

## Local Review Media

For a reviewable video of the full flow:

```sh
npm run test:e2e:video
```

For screenshots:

```sh
npm run test:e2e:screenshots
```

Generated media lives under `apps/web/test-results/e2e/` and is ignored by git.

## Rules

- Keep E2E tests under `apps/web/tests/e2e/`; do not add a top-level `tests/` folder.
- Keep test shims centralized in `apps/web/tests/e2e/support/` and documented there.
- Do not use real Google OAuth, Supabase Storage, OpenAI, Web Push, or shared databases for baseline E2E.
- The E2E database should remain ordinary Postgres. If the baseline migration stops working against Docker Postgres, treat that as a portability regression unless explicitly aligned.
- Check for leftover containers if a run is interrupted:

```sh
docker ps -a --filter name=dear-hoomin-e2e --format '{{.Names}}'
```

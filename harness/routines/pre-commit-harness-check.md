# Pre-Commit Harness Check

Before every commit, satisfy every rule below and fix violations before committing.

## Required Checks

- Product copy centralization and glossary: user-visible product copy must live in `apps/web/lib/product-copy/` and be exported through `apps/web/lib/product-copy/index.ts`. This includes visible labels, headings, helper text, button text, status messages, notification text, metadata text, social-share text, and product-content alt text. Static public assets that cannot import TypeScript must mirror the copy library. Check user-visible terminology against `harness/product/glossary.md`; for example, product copy should say "musing" for generated pet-voice entries and reserve "thought" for internal data-model context.
- Core product flow preservation: do not accidentally delete, bypass, or regress core product flows. Current core flows are Google sign-in and sign-out; family creation; invite-link creation, copying, and acceptance; family member display and owner removal; furbaby creation with reference photo; furbaby profile edit; reference photo replacement; avatar generation and selection; daily musing creation/generation; journal musing creation with uploaded photos; today's musings list; public share page, share image, and share card; native share/copy actions; timezone preference update; notification opt-in and preferences; install-to-home-screen prompt; admin daily generation trigger; admin push test; and admin base avatar style upload. If a core flow changes, the change must be intentional for the commit and the relevant harness feature/status or alignment list must be updated when the product contract changes.
- Platform dependency discipline: do not introduce or deepen dependencies on Vercel, Supabase, Google, OpenAI, Web Push, provider-specific storage, provider-specific auth, scheduled jobs, environment variables, deployment behavior, or managed-service APIs without documenting the decision in `harness/platform-dependencies.md` in the same change.
- Backend logging discipline: raw `console.*` calls are not allowed in backend code. Use `apps/web/lib/observability/logger.ts` for backend logging and run `npm run check:backend-logging` from `apps/web` when touching backend code.
- Base branch freshness: fetch `origin/main` and verify the work branch contains the latest `origin/main` before committing. If it does not, update from `origin/main`, resolve conflicts intentionally, and rerun the relevant checks. The default protected branch is `main`; treat requests for "master" as this repo's `main` unless the remote says otherwise.
- Business logic layering: keep product/business logic in app-owned shared layers such as `apps/web/lib/client-api/` and lower domain/provider boundaries. Web Server Actions, React components, and `/api/v1` route handlers should be thin adapters for parsing, auth/context, redirects, revalidation, and response formatting. Do not add durable product rules, authorization decisions, generation orchestration, database queries, or provider calls directly to transport/UI layers unless marked with `Cross-platform exception:` and explained close to the code.
- Cross-platform surface discipline: do not expose or deepen user-facing product functionality only through Next.js Server Actions, route handlers, browser APIs, web-only request objects, provider SDKs, deployment hooks, or platform-specific clients. Reusable product capabilities must live behind app-owned typed boundaries that a future mobile API can call. If a surface is intentionally web-only, mark the relevant file with `Cross-platform exception:` and explain why mobile parity is not required or what mobile replacement owns the behavior.
- Lightweight verification: ensure types, lints, and unit tests pass when those commands exist for the touched project area. Do not run Docker-backed or browser E2E as part of this pre-commit check; CI owns E2E unless the developer explicitly asks for local E2E or the change specifically requires targeted browser verification.

## Required AI Notes

Before committing, the AI must report concise notes for each required check:

- `Product copy centralization and glossary`: pass/fixed, with files checked or changed and terminology notes.
- `Core product flow preservation`: pass/fixed, with impacted flows or "no core flows changed".
- `Platform dependency discipline`: pass/fixed, with platform docs updated or "no platform dependency changes".
- `Backend logging discipline`: pass/fixed, with `npm run check:backend-logging` run when backend code was touched or "no backend code changed".
- `Base branch freshness`: pass/fixed, with the fetched base ref and comparison result.
- `Business logic layering`: pass/fixed, with shared capability/domain files checked or changed and any transport/UI exceptions noted.
- `Cross-platform surface discipline`: pass/fixed, with reusable boundaries checked or `Cross-platform exception:` markers added for intentional web-only surfaces.
- `Lightweight verification`: pass/fixed, with commands run or a note that no type, lint, or unit-test command exists for the touched area.

## Commit Message Trailer

After all checks pass, add this exact commit-message trailer:

`Harness-Check: all checks in harness/routines/pre-commit-harness-check.md are satisfied`

# Pre-Commit Harness Check

Before every commit, satisfy every rule below and fix violations before committing.

## Required Checks

- Product copy centralization: user-visible product copy must live in `apps/web/lib/product-copy/` and be exported through `apps/web/lib/product-copy/index.ts`. This includes visible labels, headings, helper text, button text, status messages, notification text, metadata text, social-share text, and product-content alt text. Static public assets that cannot import TypeScript must mirror the copy library.
- Core product flow preservation: do not accidentally delete, bypass, or regress core product flows. Current core flows are Google sign-in and sign-out; family creation; invite-link creation, copying, and acceptance; family member display and owner removal; furbaby creation with reference photo; furbaby profile edit; reference photo replacement; avatar generation and selection; daily musing creation/generation; journal thought creation with uploaded photos; today's musings list; public share page, share image, and share card; native share/copy actions; timezone preference update; notification opt-in and preferences; install-to-home-screen prompt; admin daily generation trigger; admin push test; and admin base avatar style upload. If a core flow changes, the change must be intentional for the commit and the relevant harness feature/status or alignment list must be updated when the product contract changes.
- Platform dependency discipline: do not introduce or deepen dependencies on Vercel, Supabase, Google, OpenAI, Web Push, provider-specific storage, provider-specific auth, scheduled jobs, environment variables, deployment behavior, or managed-service APIs without documenting the decision in `harness/platform-dependencies.md` in the same change.
- Lightweight verification: ensure types, lints, and unit tests pass when those commands exist for the touched project area. Do not run Docker-backed or browser E2E as part of this pre-commit check; CI owns E2E unless the developer explicitly asks for local E2E or the change specifically requires targeted browser verification.

## Required AI Notes

Before committing, the AI must report concise notes for each required check:

- `Product copy centralization`: pass/fixed, with files checked or changed.
- `Core product flow preservation`: pass/fixed, with impacted flows or "no core flows changed".
- `Platform dependency discipline`: pass/fixed, with platform docs updated or "no platform dependency changes".
- `Lightweight verification`: pass/fixed, with commands run or a note that no type, lint, or unit-test command exists for the touched area.

## Commit Message Trailer

After all checks pass, add this exact commit-message trailer:

`Harness-Check: all checks in harness/routines/pre-commit-harness-check.md are satisfied`

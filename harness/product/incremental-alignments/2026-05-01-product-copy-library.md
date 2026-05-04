# Product Copy Library Alignment

## Alignment

User-facing product copy belongs in `apps/web/lib/product-copy/` and must be exported through `apps/web/lib/product-copy/index.ts`.

Use the copy library for visible labels, headings, helper text, button text, status messages, notification text, metadata copy, social-share copy, and image alt text that describes product content.

## Reason

Centralizing product copy keeps vocabulary consistent and makes later i18n work a library replacement or adapter task instead of a route-by-route excavation.

The folder shape keeps the central source discoverable while allowing copy groups to split into modules later without changing application import paths.

## Boundaries

- Dynamic pet, family, date, and generated musing content remains product data.
- Internal error codes, route names, CSS class names, HTTP headers, env var names, and provider protocol strings are not product copy.
- Static public assets that cannot import TypeScript, such as `manifest.webmanifest`, `sw.js`, and `icon.svg`, should mirror the copy library and be reviewed when brand or notification copy changes.
- Do not introduce locale routing or translation tooling until there is a concrete i18n requirement.
- Folder-local rules live in `apps/web/lib/product-copy/AGENTS.md`.

## Harness Links

- Product vocabulary source: `harness/product/mission-and-alignments.md`.
- Feature tracking: `harness/features/product-copy-library/status.md`.
- Review routine: `harness/routines/ux-copy-review.md`.
- Harness connectivity routine: `harness/routines/harness-interconnectivity-check.md`.
- Pre-commit routine: `harness/routines/pre-commit-harness-check.md`.

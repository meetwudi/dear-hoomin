# Product Copy Library Status

## Status

In progress.

## Alignment

- `harness/product/incremental-alignments/2026-05-01-product-copy-library.md`
- `harness/product/mission-and-alignments.md`
- `harness/product/incremental-alignments/2026-05-01-dear-hoomin-mvp.md`

## Implemented

- `apps/web/lib/product-copy/index.ts` centralizes current app-facing headings, labels, helper text, button text, status text, share text, metadata text, and content alt text.
- `apps/web/lib/product-copy/AGENTS.md` marks the folder as the centralized product-copy source and defines local boundaries.
- Main app routes and shared UI components import product copy from the central library.
- UX copy review now includes a product-copy-library check.
- Harness interconnectivity has a dedicated routine.
- Pre-commit harness check includes product-copy centralization as a required rule.

## In Progress

- Keep public static asset copy mirrored with the product copy library when brand or notification defaults change.

## Not Implemented

- Locale routing.
- Translation file loading.
- Runtime locale negotiation.

## Open Questions

- None for the current central-copy-library slice.

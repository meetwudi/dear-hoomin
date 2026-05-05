# AGENTS.md

## Scope

This file applies to `apps/web/app/`.

## Instructions

- Use this folder for Next.js App Router routes, layouts, and page-level UI.
- Check `harness/product/mission-and-alignments.md` before adding product-facing copy.
- Put user-facing product copy in `apps/web/lib/product-copy/`; check `harness/product/incremental-alignments/2026-05-01-product-copy-library.md` for the source-of-truth boundary.
- Check `harness/product/incremental-alignments/2026-05-01-tech-stack.md` before adding app architecture.
- Check and update `harness/platform-dependencies.md` before adding or changing provider-specific routes, cron endpoints, auth providers, storage adapters, AI providers, or env vars.
- Keep App Router files as UI or transport adapters. Product capabilities should live behind typed app-owned boundaries that can be reused by future mobile API routes. Mark intentional web-only surfaces with `Cross-platform exception:` and the reason.
- Keep this file as a pointer; put durable product decisions in the harness.

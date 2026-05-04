# AGENTS.md

## Scope

This file applies to `apps/web/lib/product-copy/`.

## Instructions

- This folder is the centralized source for product-facing copy in the web app.
- Export all public copy through `index.ts` so routes, components, metadata, notifications, and share surfaces import from `apps/web/lib/product-copy`.
- Put visible labels, headings, helper text, button text, status messages, notification text, metadata text, social-share text, and product-content alt text here before using them in UI code.
- Keep copy grouped by product surface or workflow. Split into additional files only when a group becomes hard to scan, and re-export through `index.ts`.
- Do not put internal error codes, route paths, CSS class names, storage keys, provider protocol strings, or AI-generation prompt instructions here.
- Static public assets that cannot import TypeScript, such as `manifest.webmanifest`, `sw.js`, and `icon.svg`, must mirror the values here when product copy changes.
- Check `harness/product/incremental-alignments/2026-05-01-product-copy-library.md` before changing this folder's source-of-truth boundary.

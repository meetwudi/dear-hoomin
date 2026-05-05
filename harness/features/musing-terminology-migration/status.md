# Musing Terminology Migration Status

## Status

Open project. Product-facing language is already aligned on "musing"; remaining "thought" concepts are legacy internal persistence, route, type, and API names that should be removed deliberately.

## Alignment

Dear Hoomin should use "musing" for the generated pet-voice product concept everywhere a hoomin, client API consumer, or future mobile client sees the concept. "Thought" should remain only as a temporary legacy implementation name while removing it would require a database migration or compatibility break.

New public/client-facing work should not introduce new "thought" concepts. Use names such as `musing`, `dailyMusing`, `journalMusing`, `musingId`, `musingStatus`, and `musingImage` in new APIs, client libraries, copy, docs, and tests. If an implementation must bridge to a legacy table or column, keep that mapping inside storage/domain boundaries and avoid leaking it outward.

## Current Legacy Surface

- Database schema still uses `daily_thoughts` and related columns/indexes.
- Some app-owned routes, stores, and types still use `thought` naming because they map directly to the existing database shape.
- Public/client API work has started moving toward musing terminology, but some route and payload names still expose `thoughtId`.
- The public share implementation and generation internals still contain `public-thoughts`, `ThoughtImageGenerationRecord`, and similar names.

## Tasks

- Inventory every remaining `thought` symbol, route segment, filename, table, column, payload field, and test name.
- Define the compatibility plan for public/client API fields: introduce `musingId` while temporarily accepting or returning legacy `thoughtId` only where required.
- Rename shared client API concepts before adding streaming/status APIs, so the streaming contract starts with musing terminology.
- Rename UI/test-facing files and symbols that do not require database migration.
- Plan database migration from `daily_thoughts` to musing terminology, including indexes, foreign keys, uploaded file owner references, and deployment sequencing.
- Update harness rules once the migration has a committed boundary for where legacy `thought` may still appear.

## Open Questions

- Should the database migration rename durable tables/columns in one release, or should it add views/compatibility aliases first?
- How long should public/client APIs tolerate `thoughtId` aliases after introducing `musingId`?
- Should share URLs keep existing `/share/:token` behavior while only renaming internal/public API payload fields?

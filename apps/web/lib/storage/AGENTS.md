# AGENTS.md

## Scope

This file applies to `apps/web/lib/storage/`.

## Instructions

- Keep app code dependent on the storage boundary in this folder, not on provider adapters directly.
- Store provider-neutral object keys in Postgres. Do not store provider bucket names, cloud project ids, regions, or service-specific object URLs in product tables.
- Provider-specific implementation details belong in adapter files such as `supabase-storage.ts`.
- Local E2E storage belongs in `local-storage.ts` and must use provider-neutral object keys.
- When adding another storage provider, preserve the `uploadAppObject` and `downloadAppObject` contract first, then update `harness/platform-dependencies.md`.
- Tests and E2E may use a local adapter or avoid binary-object flows; they should not require Supabase Storage when a Docker Postgres database is enough for the scenario.

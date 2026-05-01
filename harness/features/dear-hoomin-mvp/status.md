# Dear Hoomin MVP Status

## Status

Scaffolded, MVP product features not implemented.

## Current Phase

Deployable web app baseline exists. Next step is the first real product slice.

## Alignment Sources

- `harness/product/mission-and-alignments.md`
- `harness/product/incremental-alignments/2026-05-01-dear-hoomin-mvp.md`
- `harness/product/incremental-alignments/2026-05-01-tech-stack.md`
- `harness/development-principles.md`

## Implemented

- Root repo stays clean; deployable web app lives in `apps/web`.
- Vercel Root Directory should be `apps/web`.
- Minimal Next.js App Router app exists.
- Dear Hoomin hello page exists at `/`.
- PWA manifest and icon exist.
- Local Supabase/Postgres, Google OAuth, and app session secrets are stored in ignored `apps/web/.env.local`.
- Checked-in env template exists at `apps/web/.env.example`.
- Google-only login is implemented with direct Google OAuth and an app-issued HTTP-only session cookie.
- Login persists durable app-owned hoomin identities and linked provider accounts in Postgres.
- Verification commands exist: `npm run typecheck`, `npm run build`, and `npm audit --audit-level=moderate`.
- Initial Supabase schema migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010001_initial_schema.sql`.
- App-owned auth tables migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010002_app_owned_auth.sql`.
- Supabase schema/RLS inspection should be generated from the database using `harness/routines/supabase-schema-inspection.md`.

## Not Implemented

- Family creation.
- Family invites by link and/or email.
- Multi-family membership.
- Pet creation.
- Pet reference photo upload.
- One daily thought per pet per local day.
- Family home page centered on today's selected pet thought.
- Thought text generation or mock generation.
- Cartoon-style thought image generation or mock generation.
- Real PWA installability verification on device.
- Local Supabase migration validation.
- Database authorization model update for app-owned auth instead of Supabase Auth.

## Open Questions

- What should define a pet's local day?
- Should email invites be real or mocked for the first build?
- What provider should be used for real text generation later?
- What provider should be used for real image generation later?
- What is the acceptable latency for first-view lazy generation?

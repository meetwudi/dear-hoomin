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
- Local development may use the shared database; migrations and app writes must preserve existing production data and avoid destructive local-only assumptions.
- Family creation and invite-link acceptance are implemented for app-owned hoomins.
- Pets can be added to a family with a reference photo upload.
- Daily thought image generation can be started on first pet upload or manually retried from the family page, with in-flight/succeeded/failed state stored in Postgres.
- Daily thought image generation is scheduled through Vercel Cron at `/api/cron/daily-generation`, protected by `CRON_SECRET`.
- Web Push subscription registration is implemented for installed PWAs with a temporary login-time test notification.
- Verification commands exist: `npm run typecheck`, `npm run build`, and `npm audit --audit-level=moderate`.
- Initial Supabase schema migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010001_initial_schema.sql`.
- App-owned auth tables migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010002_app_owned_auth.sql`.
- App-owned family identity migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010003_app_owned_family_identity.sql`.
- Daily thought generation-state migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010004_daily_thought_generation_state.sql`.
- Push subscription migration is drafted and applied to remote Supabase from `infra/supabase/migrations/202605010005_push_subscriptions.sql`.
- Supabase schema/RLS inspection should be generated from the database using `harness/routines/supabase-schema-inspection.md`.

## Not Implemented

- Family invites by email.
- One daily thought per pet per local day with timezone handling.
- Family home page centered on today's selected pet thought.
- Thought text generation or mock generation.
- Provider-independent background job runner beyond Vercel Cron.
- Real PWA installability verification on device.
- Local Supabase migration validation.
- Full database authorization model update for app-owned auth instead of Supabase Auth.

## Open Questions

- What should define a pet's local day?
- Should email invites be real or mocked for the first build?
- What provider should be used for real text generation later?
- What provider should be used for real image generation later?
- What is the acceptable latency for first-view lazy generation?

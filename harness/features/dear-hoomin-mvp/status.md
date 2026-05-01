# Dear Hoomin MVP Status

## Status

Core MVP slices are in progress and partially implemented.

## Current Phase

Deployable web app baseline exists. Current work is hardening product slices and replacing temporary diagnostics with durable workflows.

## Alignment Sources

- `harness/product/mission-and-alignments.md`
- `harness/product/incremental-alignments/2026-05-01-dear-hoomin-mvp.md`
- `harness/product/incremental-alignments/2026-05-01-ux-generation-notifications.md`
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
- Pets can be added to a family with a reference photo upload; the MVP UI currently limits the experience to one pet.
- The home page centers on the current pet's daily thought flow.
- Home shows the thought date and an unguessable public share link for the current thought.
- Public thought share pages can be viewed without sign-in and record view analytics.
- Public sharing includes an app-rendered share card image containing the thought picture and text for native iOS/browser sharing.
- Admin users can upload the system base avatar style image.
- Pet avatar candidates can be generated and selected before daily thought image generation.
- Daily thought text and image generation can be manually started, with in-flight/succeeded/failed state stored in Postgres.
- Daily thought image generation is scheduled through Vercel Cron at `/api/cron/daily-generation`, protected by `CRON_SECRET`.
- Web Push subscription registration is implemented; admin users can send a manual test notification from `/admin`.
- User settings expose all-notification and pet-thought-published notification preferences.
- Verification commands exist: `npm run typecheck`, `npm run build`, `npm run test:e2e`, and `npm audit --audit-level=moderate`.
- Current Supabase schema baseline is drafted in `infra/supabase/migrations/202605010001_initial_schema.sql`.
- The schema baseline starts from app-owned auth tables and no longer depends on Supabase Auth tables or `auth.uid()` RLS policies.
- Supabase schema/RLS inspection should be generated from the database using `harness/routines/supabase-schema-inspection.md`.

## Not Implemented

- Family invites by email.
- One daily thought per pet per local day with timezone handling.
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

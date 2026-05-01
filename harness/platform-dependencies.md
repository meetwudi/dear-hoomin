# Platform Dependencies

## Purpose

This document is the source of truth for provider-specific and platform-specific decisions in Dear Hoomin.

When adding, removing, or changing anything that ties the app to a hosted platform, external provider, managed service, deployment host, or provider-specific API, update this file in the same change.

The goal is not to avoid platforms. The goal is to make the work needed to run Dear Hoomin somewhere else explicit.

## Maintenance Rule

- Before adding a platform-dependent feature, check this document.
- If a code folder, config file, migration, or env var depends on a provider, add or update its entry here.
- Add a pointer from provider-specific folders/configs back to this document when practical.
- Prefer app-owned boundaries around providers so product data and workflows can move with bounded effort.
- Record portability work as concrete migration tasks, not vague concerns.

## Current Dependencies

### Vercel

Use:
- Production deployment for `apps/web`.
- Root Directory is expected to be `apps/web`.
- Vercel Cron invokes `/api/cron/daily-generation` once per day.

Provider-specific files:
- `apps/web/vercel.json`
- `apps/web/app/api/cron/daily-generation/route.ts`

Env vars:
- `CRON_SECRET`
- `CRON_DAILY_GENERATION_LIMIT`

Portability work:
- Replace `vercel.json` cron with another scheduler that sends `GET /api/cron/daily-generation`.
- Preserve the `Authorization: Bearer $CRON_SECRET` contract.

### Supabase Postgres

Use:
- Primary Postgres database for app-owned product data.
- SQL migrations live in `infra/supabase/migrations/`.
- Local development may use the shared database; migrations and app writes must preserve existing production data and avoid destructive local-only assumptions.

Provider-specific files:
- `infra/supabase/config.toml`
- `infra/supabase/migrations/`

Env vars:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Portability work:
- Move migrations to a generic Postgres migration runner.
- Replace Supabase connection strings with another Postgres host.
- Revisit remaining Supabase Auth-era RLS policies before relying on database-side authorization for app-owned auth.

### Supabase Storage

Use:
- Stores pet reference photos and generated thought images in the `app-files` bucket.
- App serves private files through `/files/[...path]` after checking family membership.

Provider-specific files:
- `apps/web/lib/storage/supabase-storage.ts`
- Storage bucket creation in `infra/supabase/migrations/202605010001_initial_schema.sql`

Env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Portability work:
- Replace `apps/web/lib/storage/supabase-storage.ts` with another object-storage adapter.
- Preserve storage path conventions: `{familyId}/pets/...` and `{familyId}/thoughts/...`.
- Preserve private file serving through app-level membership checks.

### Google OAuth

Use:
- First login provider.
- App owns auth/session and stores durable `hoomins` plus linked `auth_accounts`.
- Google access tokens are used only during callback to fetch profile data, then discarded.
- Refresh tokens are not requested or stored.

Provider-specific files:
- `apps/web/lib/auth/providers/google.ts`
- `apps/web/app/oauth/google/callback/route.ts`

Env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

Portability work:
- Add another provider by implementing the auth provider interface in `apps/web/lib/auth/providers/`.
- Keep sessions and product tables based on app-owned `hoominId`, not provider-specific ids.

### OpenAI

Use:
- Generates daily thought images from pet reference photos.
- Current output defaults to `256x256` PNG.

Provider-specific files:
- `apps/web/lib/pets/generation.ts`

Env vars:
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_SIZE`

Portability work:
- Isolate generation behind a provider interface before adding a second image provider.
- Preserve DB generation states: `not_started`, `in_progress`, `succeeded`, `failed`.

### Resend

Use:
- Planned email provider for future invite/email features.
- API key is configured, but email sending is not implemented yet.

Provider-specific files:
- None yet.

Env vars:
- `RESEND_API_KEY`

Portability work:
- When email sending is added, implement it behind an email provider adapter.
- Keep invite records provider-neutral in Postgres.

### Web Push / iOS PWA Notifications

Use:
- Browser Web Push for installed PWAs, including iOS Safari Home Screen apps.
- Stores push subscriptions in Postgres.
- Temporary login-time test notification is sent after subscription registration.

Provider-specific files:
- `apps/web/public/sw.js`
- `apps/web/app/components/push-notification-bootstrap.tsx`
- `apps/web/app/api/push/subscriptions/route.ts`
- `apps/web/lib/push/web-push.ts`
- `infra/supabase/migrations/202605010005_push_subscriptions.sql`

Env vars:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Portability work:
- Keep notification triggers app-owned; only the delivery protocol should be provider-specific.
- Remove the temporary login-time send when real notification triggers are implemented.
- Native iOS apps would need APNs instead of browser Web Push subscriptions.

## Platform-Neutral App-Owned Boundaries

These are intentional boundaries that reduce platform lock-in:

- App-owned auth session cookie signed by `AUTH_SESSION_SECRET`.
- App-owned durable identity tables: `hoomins`, `auth_accounts`.
- Runtime SQL centralized in `apps/web/lib/db/sql/`.
- Provider-specific auth code normalized through `apps/web/lib/auth/providers/`.
- Private media served through app routes rather than direct public bucket URLs.
- Browser push subscriptions stored by app-owned `hoominId`.

## Required Env Var Categories

Local and production environments need provider-specific secrets configured separately:

- App session: `AUTH_SESSION_SECRET`
- Database: `POSTGRES_*`
- Supabase storage: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_IMAGE_SIZE`
- Resend: `RESEND_API_KEY`
- Cron: `CRON_SECRET`, `CRON_DAILY_GENERATION_LIMIT`
- Web Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

# Platform Dependencies

## Purpose

This document is the source of truth for provider-specific and platform-specific decisions in Dear Hoomin.

When adding, removing, or changing anything that ties the app to a hosted platform, external provider, managed service, deployment host, or provider-specific API, update this file in the same change.

The goal is not to avoid platforms. The goal is to make the work needed to run Dear Hoomin somewhere else explicit.

Provider-specific dependencies must not leak into app-owned data by default. Product tables should store provider-neutral identifiers and state; provider-specific bucket names, schemas, URLs, regions, project ids, or auth helpers belong in adapters, infrastructure setup, or this register.

## Maintenance Rule

- Before adding a platform-dependent feature, check this document.
- If a code folder, config file, migration, or env var depends on a provider, add or update its entry here.
- Add a pointer from provider-specific folders/configs back to this document when practical.
- Prefer app-owned boundaries around providers so product data and workflows can move with bounded effort.
- Record portability work as concrete migration tasks, not vague concerns.

## Current Dependencies

## Data Portability Rule

- App-owned Postgres schema should run on ordinary Postgres unless an explicitly documented feature needs a provider-specific extension or schema.
- Binary objects should be referenced by app-owned object keys and metadata in Postgres.
- Object storage providers may map those keys to buckets, paths, prefixes, containers, or URLs internally, but those provider details should stay out of product tables.
- When removing or adding a provider dependency, update the adapter boundary and this register in the same change.

### Vercel

Use:
- Production deployment for `apps/web`.
- Root Directory is expected to be `apps/web`.
- Vercel Cron invokes `/api/cron/daily-generation` hourly.
- The hourly cron lets app code generate daily thoughts when each hoomin's stored timezone reaches 6am.

Provider-specific files:
- `apps/web/vercel.json`
- `apps/web/app/api/cron/daily-generation/route.ts`

Env vars:
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Portability work:
- Replace `vercel.json` cron with another scheduler that sends `GET /api/cron/daily-generation`.
- Preserve the `Authorization: Bearer $CRON_SECRET` contract.

### Supabase Postgres

Use:
- Primary Postgres database for app-owned product data.
- SQL migrations live in `infra/supabase/migrations/`.
- Local development may use the shared database; migrations and app writes must preserve existing production data and avoid destructive local-only assumptions.
- App-owned auth/session tables are defined directly in the current baseline migration; Supabase Auth is not used for product identity.
- Binary object references are stored as provider-neutral object keys in Postgres. Product tables must not store storage provider bucket names, cloud project ids, regions, or provider URLs.
- Hoomin timezone settings are stored on `public.hoomins.time_zone`, defaulting existing and new rows to `America/Los_Angeles`.
- Public thought share links use unguessable app-generated tokens stored in Postgres.
- Public thought view analytics are stored as app-owned rows in Postgres.

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
- Add database-side authorization separately if needed; current authorization is enforced in app code using app-owned session identity.

### Supabase Storage

Use:
- Stores pet reference photos, system avatar style assets, generated avatar candidates, and generated thought images in the `app-files` bucket.
- App serves private files through `/files/[...path]` after checking family membership.
- App code uses the storage boundary in `apps/web/lib/storage/`; product data stores provider-neutral object keys.
- The Supabase Storage bucket is platform setup, not part of the app-owned Postgres schema.

Provider-specific files:
- `apps/web/lib/storage/supabase-storage.ts`

Env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Portability work:
- Replace `apps/web/lib/storage/supabase-storage.ts` with another adapter that implements the `apps/web/lib/storage/` boundary.
- Preserve object key conventions: `{familyId}/pets/...`, `{familyId}/thoughts/...`, and `system/avatar-styles/...`.
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
- Generates pet avatar candidates, pet-perspective thought text, and daily thought images.
- Avatar candidates use a pet reference photo plus a system-owned base style image.
- Thought images use the selected avatar as the identity anchor.
- Current image model defaults to `gpt-image-2`.
- Current stored output defaults to `1024x1024` PNG.

Provider-specific files:
- `apps/web/lib/ai/`
- `apps/web/lib/pets/generation.ts`

Env vars:
- `OPENAI_API_KEY`

Portability work:
- Keep prompts and provider calls centralized under `apps/web/lib/ai/`.
- Isolate generation behind a provider interface before adding a second model provider.
- Preserve DB generation states: `not_started`, `in_progress`, `succeeded`, `failed`.
- OpenAI response metadata is used where supported for trace filtering; image-generation correlation is also recorded in structured app logs.

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
- Admin users can manually send a Web Push test notification from `/admin`.
- Settings expose all-notification and pet-thought-published preferences.
- Thought-published notifications are sent only to family members whose preferences allow them.

Provider-specific files:
- `apps/web/public/sw.js`
- `apps/web/app/admin/push-test.tsx`
- `apps/web/app/api/push/subscriptions/route.ts`
- `apps/web/lib/push/web-push.ts`
- `infra/supabase/migrations/202605010001_initial_schema.sql`

Env vars:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Portability work:
- Keep notification triggers app-owned; only the delivery protocol should be provider-specific.
- Native iOS apps would need APNs instead of browser Web Push subscriptions.

### Browser Native Sharing

Use:
- Public thought pages and the signed-in home page expose a native share action for generated thought cards.
- The share card is app-rendered at `/share/[token]/card` so the shared image contains both the generated picture and the thought text.
- iOS and other browsers decide which apps appear in the native share sheet, including Instagram availability.

Provider-specific files:
- `apps/web/app/components/share-thought-button.tsx`
- `apps/web/app/share/[token]/card/route.tsx`

Env vars:
- None.

Portability work:
- Keep the share-card image generation app-owned and independent of a social platform API.
- Native apps would replace the browser Web Share API with their platform share sheet integration.

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
- OpenAI: `OPENAI_API_KEY`
- Resend: `RESEND_API_KEY`
- Cron: `CRON_SECRET`
- Web Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

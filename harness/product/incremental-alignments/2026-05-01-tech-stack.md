# Tech Stack Alignment

## Decision

Use a common, mature web stack for the Dear Hoomin MVP:

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Postgres
- Supabase Storage
- App-owned authentication with Google OAuth for the first login provider
- Vercel deployment with Root Directory set to `apps/web`
- PWA web manifest and icons

## Tenet

Prefer common, mature, well-supported tools. Simplicity should come from using boring defaults, not from inventing infrastructure.

## Rendering

Use server-side rendering where it helps.

Dear Hoomin's signed-in home page, family state, selected pet, and today's musing are server-backed. Next.js App Router server components are a good default for those surfaces.

## Backend

Use Supabase for MVP database and blob storage needs:

- Postgres for families, memberships, pets, pet photos, daily musings, and invite records.
- Storage for blob data through an app-owned storage boundary.

Do not make user authentication dependent on Supabase Auth. The app should own the auth boundary and session model, starting with direct Google OAuth and an app-issued HTTP-only session cookie.

Auth provider code should stay modular: provider-specific OAuth details should normalize into app-owned profile/account data before persistence. This keeps adding another provider from reshaping sessions, app identity, or product tables.

Supabase may store user records, session metadata, provider account links, or provider tokens if the product needs them, but those tables should be ordinary application data that can move to another Postgres host. Avoid designs where product identity, authorization, or account portability depends on Supabase-specific Auth behavior.

Do not store provider refresh tokens until a concrete product feature needs ongoing provider API access beyond login.

Blob data includes:

- Pet reference photos.
- Generated cartoon musing images.
- Future base style or reference images.

Do not use Vercel Blob for MVP. Keeping blobs in Supabase avoids tying core product storage to the deploy host.

Postgres must remain provider-neutral. Store object keys and app-owned metadata in product tables, not Supabase bucket names, storage schema rows, public object URLs, or other provider-specific storage handles.

Storage provider details belong behind the app storage boundary. Swapping Supabase Storage for GCS, S3, or another object store should require replacing an adapter and migration tooling, not reshaping product tables.

## Daily Musing Generation

Start with lazy generation on request.

When a hoomin opens today's pet musing, the app checks whether a musing already exists for the selected pet and the hoomin's settings timezone local date. If not, it creates one then.

Scheduled generation runs hourly and uses app-side `Intl` timezone support to find hoomins whose local time is 6am, then generates each due pet for that local date.

Timezone-sensitive app code should resolve dates and hours through the user-context timezone interface, not by reading timezone settings and calculating local dates ad hoc in each feature.

Enforce one musing per pet per local day with a database uniqueness constraint.

Do not rely on Vercel background execution for long image generation jobs.

## Image Generation

Mock image generation first, but structure generation behind clear provider interfaces.

The code should allow replacing the mock with a real text or image generation provider later without reshaping product code.

Generated image outputs should be stored in Supabase Storage, with metadata stored in Postgres.

## Portability

Vercel is acceptable for MVP deployment, but Dear Hoomin should not be architected around Vercel-only primitives unless explicitly aligned.

Keep platform-specific dependencies isolated. Prefer designs that can migrate to another host with bounded effort.

Use Vercel as deployment infrastructure, not as the product architecture. The current Vercel app root is `apps/web`.

Use Supabase as database and storage infrastructure, not as the product identity architecture.

Use Supabase Storage as the current object storage provider, not as the product data model.

## Avoid For Now

- Separate backend service.
- Queue system.
- Heavy permission modeling.
- Full offline sync.
- Native app tooling.
- Large design system.
- Vercel-only storage or background job primitives.

## Open Questions

- What provider should be used for real text generation later?
- What provider should be used for real image generation later?
- What is the acceptable latency for first-view lazy generation?

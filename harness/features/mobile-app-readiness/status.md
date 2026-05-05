# Mobile App Readiness Status

## Status

Started. Mobile readiness now has a development principle, a pre-commit guardrail, a first shared client capability layer, and initial `/api/v1` route adapters for core product flows.

## Alignment

Dear Hoomin should stay mobile-friendly as a web product and should avoid trapping product capabilities in web-only implementation surfaces. A future native mobile client should be able to reuse the same app-owned product capability boundaries through API routes or another transport without rewriting business logic.

## Current Readiness Assessment

There is now an initial mobile-friendly API slice under `apps/web/app/api/v1/`. It is not a complete mobile backend yet, but core family, settings, pet, avatar, and musing mutation surfaces have started moving behind typed capabilities in `apps/web/lib/client-api/`.

`apps/web/lib/` contains useful app-owned server boundaries: auth/session helpers, family and pet stores, generation flows, storage, settings, permissions, push persistence, public thought access, and user-context timezone logic. `apps/web/lib/client-api/` now wraps the first set of those capabilities in typed, transport-independent functions used by both web Server Actions and `/api/v1` routes.

The weakest layer remains completeness and authentication shape. The web app still uses cookie-backed sessions, and the new `/api/v1` routes rely on the same session cookie. A native mobile client may need an explicit mobile session exchange or token strategy before these routes are sufficient outside a webview/browser context.

Known web/client-specific surfaces include native share/copy UI, install-to-home-screen behavior, Web Push subscription registration, route redirects, and browser upload controls. These can stay web-specific when they are marked as intentional or paired with a clear mobile-owned equivalent.

## API Readiness Inventory

- Read-only internal queries: partially API-ready. `/api/v1/families` and `/api/v1/families/:familyId` expose family, member, invite, and pet state; `/api/v1/settings` exposes settings and notification preferences.
- Mutations: initial API-ready slice exists. Family creation, invite creation/acceptance, pet creation, furbaby detail updates, avatar reference upload, avatar generation/selection, daily musing image generation, journal musing creation, thought image generation, settings update, and notification preference update are exposed through `/api/v1` routes and shared `client-api` capabilities.
- File and media uploads: partially API-ready. Pet creation, journal musing creation, and avatar reference photo upload use multipart route adapters backed by shared typed capabilities.
- Auth: not mobile-ready. Google OAuth and app session cookies work for the web app, but mobile auth/session exchange needs an explicit contract.
- Push notifications: web-specific today. Web Push subscription registration exists; native push would need a separate platform adapter and product-level notification preference reuse.
- Scheduled/admin operations: server-owned, not mobile-facing. These should remain protected backend/admin surfaces unless a product need appears.

## Shared Client API Boundary

`apps/web/lib/client-api/` is the single shared client-facing product API layer. It owns typed product operations that can be called by the web app today and by mobile HTTP adapters later. Capability functions receive an authenticated API context and typed inputs; they should not parse HTTP requests, read cookies, redirect, revalidate paths, or depend on React/browser state.

`apps/web/app/api/v1/` is the versioned HTTP adapter layer. Route handlers should authenticate, parse JSON or multipart input, call `apps/web/lib/client-api/`, and return JSON. They should not own product behavior separately from the web app.

The web app uses the same capability layer through Server Actions. Server Actions do not need to call `/api/v1` over HTTP; that would add unnecessary same-process network overhead. They may stay in place for web forms, progressive enhancement, redirects, and cache revalidation, but they must remain thin adapters over `apps/web/lib/client-api/` instead of owning product behavior directly.

Long-running product operations should expose platform-neutral state events from `apps/web/lib/client-api/` and adapt those events to client transports such as SSE, polling, or native streaming at the route/client layer. The event contract should use product terminology such as musing and musing status; legacy persistence names such as thought should stay behind domain/storage boundaries while the terminology migration remains open.

Folder-local guidance exists in:

- `apps/web/lib/client-api/AGENTS.md`
- `apps/web/app/api/v1/AGENTS.md`
- `apps/web/app/families/AGENTS.md`
- `apps/web/app/pets/AGENTS.md`

## Guardrail

New or changed user-facing functionality should answer this before merge: can the same product capability be invoked by a future mobile API without depending on a React component, browser API, `FormData`, redirect, revalidation, or Next-only Server Action? If not, move the capability behind a typed app-owned boundary or mark the web-only surface with `Cross-platform exception:`.

## Tasks

- Done: add cross-platform product surface rules to `harness/development-principles.md`.
- Done: add cross-platform surface discipline to the pre-commit harness check.
- Done: keep App Router guidance aligned with the new mobile-readiness rule.
- Done: define the first mobile API contract inventory for core product flows.
- Done: extract initial typed service functions for core family, settings, pet, avatar, and musing flows.
- Done: expose initial `/api/v1` route adapters over those shared capabilities.
- Started: journal musing creation can stream platform-neutral musing state events through an SSE route adapter while preserving a JSON fallback.
- Follow up by defining mobile auth/session exchange.
- Follow up by adding contract tests for `/api/v1` routes and shared capability inputs/outputs.
- Follow up by adding a polling status route for mobile clients that cannot or should not hold a stream open.
- Follow up by deciding whether mobile media uploads should keep multipart or move to signed object-upload handoff plus metadata registration.

## Open Questions

- Which mobile client should be assumed first: native iOS, native Android, React Native, or a thin API consumed by multiple clients?
- Should file uploads for mobile use the same multipart API as web uploads, or should mobile use signed object-upload handoff plus metadata registration?
- Which web-only experiences should remain intentional exceptions: PWA install prompt, browser-native share, and Web Push are likely candidates.

# Development Principles

## Alignment First

- Do not expand scope without explicit alignment.
- Ask clarifying questions when requirements are ambiguous.
- Prefer small, reversible steps.

## Error Handling

- Do not abuse `try`/`catch`.
- Use reasonable error boundaries where appropriate.
- Let errors surface when hiding them would reduce clarity.
- Do not build broad fallback chains for provider failures.
- Prefer a clear, loud failure at the app boundary with enough context to fix the provider request.
- Do not silently downgrade model or provider choices, including falling back from `gpt-image-2` to older image models.

## Configuration

- Do not abuse environment variables as general application config.
- Use env vars for secrets, credentials, deploy-specific URLs, host-provided values, and operational values that truly differ by environment.
- When creating or starting work in a new worktree, copy ignored env files from the main checkout, especially `apps/web/.env.local`, so local, database, and deployment workflows have the same configured secrets without committing them.
- Keep stable product/provider choices in code constants so changes are reviewed as code.
- Do not hide behavior changes behind undocumented env overrides.

## Provider Boundaries

- Keep product data provider-neutral. Durable tables should store app-owned identifiers, state, and provider-neutral references rather than managed-service implementation details.
- Do not store cloud provider bucket names, project ids, regions, service URLs, auth-subsystem ids, or provider-specific object ids in product tables unless there is an explicit alignment that those values are product data.
- Put provider-specific behavior behind app-owned boundaries before wiring it into product flows. Runtime code should depend on the boundary, not directly on the provider SDK or REST API.
- Database migrations should be runnable against ordinary Postgres unless a documented feature explicitly requires a provider-specific database extension or schema.
- If a provider dependency is temporary or adapter-only, record it as such in `harness/platform-dependencies.md` and keep portability work concrete.
- AI provider request lifecycle state belongs in the app-owned AI boundary. Create, success, and failure transitions for AI calls should be reflected in `public.ai_requests` through `apps/web/lib/ai/requests.ts`, not only in feature-specific rows or logs.

## Cross-Platform Product Surfaces

- Treat the web app as the first client, not the only client.
- Product capabilities should be available through app-owned, typed server/service boundaries that can be called by web routes today and by mobile API routes or another client transport later.
- Keep Next.js Server Actions, route handlers, redirects, `FormData` parsing, `revalidatePath`, cookies, browser APIs, and component state as transport or UI adapters. Do not let them become the only implementation of a reusable product capability.
- When adding or changing user-facing functionality, define the reusable capability in `apps/web/lib/` or another shared app-owned boundary first, then wire the web surface to that boundary.
- Shared capability inputs and outputs should be serializable, typed, and independent of web-only request objects unless the boundary is explicitly adapter-only.
- File and media flows should use app-owned upload/storage abstractions before provider or browser details reach product logic.
- If functionality is intentionally web-only, mark that boundary in the relevant file with `Cross-platform exception:` and explain why mobile parity is not required or what mobile replacement would own the behavior.
- Do not expose a product capability only through a platform-specific client, browser API, Next.js-only primitive, provider SDK, or deployment hook unless the exception is intentional and documented close to the code.

## Verification

- Use the narrowest verification that matches the change and risk.
- Use `harness/routines/pr-prep.md` when preparing or updating a PR.
- For ordinary pushes to `main`, relevant lightweight checks such as typecheck/build/schema review are enough when they cover the change.
- Docker-backed Playwright E2E is a targeted full-flow routine, not a required pre-push gate. Run it only when the change affects browser flows, E2E-owned behavior, or the developer explicitly asks for it.

## User Context

- Timezone-sensitive product logic must resolve time through a single app-owned user-context interface.
- Do not scatter direct settings reads, raw `Date` local-day calculations, or one-off `Intl` timezone logic through feature code.
- A hoomin's timezone defaults to `America/Los_Angeles` and should be validated before it affects dates or schedules.

## Design And Styling

- Follow explicit styling and design guidance from the developer.
- If guidance is missing, ask before establishing broad visual direction.
- Avoid excessive visible labels, duplicate headings, and helper text. Add visible explanatory copy only when it changes a hoomin's decision, prevents a likely mistake, or supplies an accessible name that cannot be provided invisibly.

## Documentation

- Keep alignment documents updated when durable decisions are made.
- Do not treat transient implementation notes as product alignment.
- Record platform-dependent decisions in `harness/platform-dependencies.md` when adding or changing providers, managed services, deployment behavior, scheduled jobs, storage, auth providers, or provider-specific env vars.
- Prefer provider adapters and app-owned boundaries when using platform services.

## Folder Structure

- Organize code and harness files by folder.
- Each project folder should have an `AGENTS.md` file that explains the folder's purpose and local instructions.
- Keep abstractions discoverable through folder boundaries.
- Do not create broad abstractions without explicit alignment.

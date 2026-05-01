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
- Keep stable product/provider choices in code constants so changes are reviewed as code.
- Do not hide behavior changes behind undocumented env overrides.

## Provider Boundaries

- Keep product data provider-neutral. Durable tables should store app-owned identifiers, state, and provider-neutral references rather than managed-service implementation details.
- Do not store cloud provider bucket names, project ids, regions, service URLs, auth-subsystem ids, or provider-specific object ids in product tables unless there is an explicit alignment that those values are product data.
- Put provider-specific behavior behind app-owned boundaries before wiring it into product flows. Runtime code should depend on the boundary, not directly on the provider SDK or REST API.
- Database migrations should be runnable against ordinary Postgres unless a documented feature explicitly requires a provider-specific database extension or schema.
- If a provider dependency is temporary or adapter-only, record it as such in `harness/platform-dependencies.md` and keep portability work concrete.

## Design And Styling

- Follow explicit styling and design guidance from the developer.
- If guidance is missing, ask before establishing broad visual direction.

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

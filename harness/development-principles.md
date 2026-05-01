# Development Principles

## Alignment First

- Do not expand scope without explicit alignment.
- Ask clarifying questions when requirements are ambiguous.
- Prefer small, reversible steps.

## Error Handling

- Do not abuse `try`/`catch`.
- Use reasonable error boundaries where appropriate.
- Let errors surface when hiding them would reduce clarity.

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

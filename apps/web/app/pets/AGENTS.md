# AGENTS.md

## Scope

This file applies to `apps/web/app/pets/`.

## Instructions

- Keep pet-related Server Actions as thin web adapters over `apps/web/lib/client-api/`.
- Server Actions should own `FormData` parsing, redirects, and web-only flow control. Shared pet, avatar, musing, generation, and upload capabilities belong in `apps/web/lib/client-api/` or lower app-owned libraries.
- Web Server Actions do not need to call `/api/v1` over HTTP. They must call the same `apps/web/lib/client-api/` capability functions that `/api/v1` calls so there is one product API contract and two thin transports.
- Do not add new product behavior here unless it is deliberately web-only and marked with `Cross-platform exception:`.

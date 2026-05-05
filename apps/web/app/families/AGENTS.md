# AGENTS.md

## Scope

This file applies to `apps/web/app/families/`.

## Instructions

- Keep pages and Server Actions as web adapters over shared product capabilities.
- Server Actions in this folder should parse `FormData`, call `apps/web/lib/client-api/` or another app-owned shared boundary, then handle redirects and revalidation.
- Web Server Actions do not need to call `/api/v1` over HTTP. They must call the same `apps/web/lib/client-api/` capability functions that `/api/v1` calls so there is one product API contract and two thin transports.
- Do not put reusable product logic directly in Server Actions. If a mobile client should eventually be able to do the same operation, move the behavior into `apps/web/lib/client-api/` first.
- UI-only behavior can stay here. Mark intentional web-only product behavior with `Cross-platform exception:` and the reason.

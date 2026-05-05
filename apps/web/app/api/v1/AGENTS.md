# AGENTS.md

## Scope

This file applies to `apps/web/app/api/v1/`.

## Instructions

- Use this folder for versioned client HTTP adapters intended to be reusable by mobile and non-Server-Action clients.
- Keep route handlers thin: authenticate, parse path/query/body data, call `apps/web/lib/client-api/`, and return JSON.
- The product API contract lives in `apps/web/lib/client-api/`. Do not make `/api/v1` the only owner of behavior that web Server Actions also need.
- Do not put product decisions, database queries, provider SDK calls, generation orchestration, or storage behavior directly in route handlers.
- Prefer JSON request bodies for ordinary operations. Use multipart `FormData` only for file/media upload operations.
- Keep response shapes stable and serializable. If a response shape changes in a way clients must coordinate around, update `harness/features/mobile-app-readiness/status.md`.
- Use `apps/web/lib/client-api/http.ts` helpers for API context, validation, and error responses unless a route has a documented reason to differ.

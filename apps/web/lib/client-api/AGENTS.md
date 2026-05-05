# AGENTS.md

## Scope

This file applies to `apps/web/lib/client-api/`.

## Instructions

- Use this folder for the single client-facing product API contract.
- Treat these functions as the shared boundary for all clients: web Server Actions, `/api/v1` HTTP routes, and future mobile clients should call the same capability functions instead of reimplementing product logic.
- Do not create a second product API in Server Actions or route handlers. Server Actions and HTTP routes are adapters over this folder, not competing APIs.
- Keep inputs and outputs typed, serializable, and independent of React components, Next.js redirects, cache revalidation, browser APIs, request objects, and route params.
- Keep authentication in the caller-provided API context. Capability functions should receive a resolved session/context, not read cookies or headers directly.
- Keep route-specific parsing in adapters. JSON parsing, multipart `FormData`, path params, redirects, and HTTP status mapping belong outside this folder.
- For media flows, accept `File` only at the capability boundary when upload bytes are genuinely part of the product operation; provider storage details still belong behind app-owned storage helpers.
- If a capability is intentionally web-only or transport-specific, do not put it here unless the exception is documented in the file with `Cross-platform exception:`.

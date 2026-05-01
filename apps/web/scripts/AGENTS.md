# AGENTS.md

## Scope

This file applies to `apps/web/scripts/`.

## Instructions

- Use this folder for local developer and verification runners for the web app.
- Keep test-only shims in `apps/web/tests/e2e/support/`; scripts may orchestrate those shims but should not become a second support layer.
- Do not put production runtime code in this folder.

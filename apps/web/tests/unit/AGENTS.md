# AGENTS.md

## Scope

This file applies to `apps/web/tests/unit/`.

## Instructions

- Keep unit tests and unit-only helpers under this folder.
- Put all unit test mocks, fakes, and mock reset helpers in `support/`.
- Each test file must make mocked modules explicit in setup before importing the subject under test.
- Prefer real app code and narrow boundary mocks. Do not mock validation, pure formatting, or product copy unless a test specifically owns that boundary.
- Production app code must not import from `tests/unit/`.

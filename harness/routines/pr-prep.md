# PR Prep

Use this routine when preparing or updating a pull request.

## Default Checks

- Read `harness/required-features.md`.
- Compare the PR's changed surfaces against the required feature golden log.
- If a required feature is touched, verify it still has a route, navigation entry when applicable, server/client action, persistence path, and at least narrow coverage or an explicit manual verification note.
- If a required feature is missing, degraded, or unverified, block PR prep and fix or call it out before pushing.
- Run static checks only by default.
- Use the narrowest static checks that match the change, such as typecheck, build, migration/schema review, lint, or formatting checks.
- Do not run E2E, browser, screenshot, visual inspection, or device checks by default.

## When To Run Heavier Checks

- Run E2E, browser, screenshot, visual inspection, or device checks only when the developer explicitly asks for them.
- Run them when the task itself is specifically to debug or verify those checks.
- If heavier checks seem useful but were not requested, mention them as optional instead of running them.

## PR Summary

- Include the required-feature check result.
- List the static checks that were run.
- Clearly say when E2E/browser checks were not run because the PR-prep routine keeps them opt-in.

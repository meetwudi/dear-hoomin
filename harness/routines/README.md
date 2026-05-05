# Routines

Routines are recurring checks or workflows requested by the developer.

## Active Routines

- Check gaps between alignment and code.
- Check the required feature golden log before preparing or updating a PR.
- Check code duplication so shared behavior stays DRY without adding premature abstractions.
- Check UX copy for duplicated, redundant, or unnecessary visible labels before polishing or shipping UI changes.
- Check UX styling so user-facing UI reuses theme tokens and shared primitives before adding one-off styles.
- Check harness interconnectivity after adding, moving, or materially changing harness documents.
- Check pre-commit harness rules and add the exact `Harness-Check` commit-message trailer before every commit.
- Prepare PRs with static checks only by default.
- Run Docker-backed Playwright E2E tests for full app-flow verification.
- Check Supabase schema and RLS discrepancies from the database, not from a hand-written duplicate.
- When starting a local dev server and the intended port is already in use, kill the existing local process on that port and restart the requested server on the intended port.

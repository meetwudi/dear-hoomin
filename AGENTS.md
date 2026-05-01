# AGENTS.md

## Scope

This file applies to the whole repository.

## Instructions

- Always pull the `main` branch when starting work on a new worktree.
- Always run the relevant lightweight verification before pushing to the `main` branch; Docker-backed Playwright E2E is optional/targeted and is never required as a blanket pre-push check.
- Treat this file as a map, not the full harness.
- Keep the repository root clean; add new project areas under organized top-level folders instead of adding loose root-level implementation folders.
- Start with `harness/README.md`.
- Use `harness/product/mission-and-alignments.md` for product direction.
- Use `harness/product/incremental-alignments/` for added product alignments.
- Use `harness/development-principles.md` for development principles.
- Use `harness/platform-dependencies.md` before adding or changing platform-dependent services, configs, provider APIs, env vars, scheduled jobs, storage, auth providers, or deployment behavior.
- Use `harness/features/` for feature status and multi-task feature context.
- Use `harness/routines/` for recurring workflows.
- Use `apps/` for deployable application surfaces.
- Use `infra/` for infrastructure and platform configuration.
- Check folder-local `AGENTS.md` files for nearby context.
- Always record new platform-dependent decisions in `harness/platform-dependencies.md` in the same change.

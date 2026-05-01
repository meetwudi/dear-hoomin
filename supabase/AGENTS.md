# AGENTS.md

## Scope

This file applies to `supabase/`.

## Instructions

- Use this folder for Supabase project configuration, migrations, and seed data.
- Treat SQL migrations as the source of truth for database schema, storage buckets, and RLS policies.
- Do not run schema changes from application startup code.
- Keep generated TypeScript database types reproducible from Supabase CLI.
- Check `harness/product/incremental-alignments/2026-05-01-tech-stack.md` before changing database architecture.

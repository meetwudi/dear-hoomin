# Supabase Schema Inspection

## Purpose

Produce a consolidated view of tables, constraints, indexes, storage buckets, and RLS policies from the live Supabase database or local Supabase database.

## Source Of Truth

The database itself after migrations are applied.

Do not maintain a hand-written consolidated schema document as a second source of truth.

## Preferred Workflow

Use Supabase CLI or direct Postgres catalog queries after migrations are applied.

Suggested commands once Supabase CLI is available:

```sh
supabase db dump --schema public,storage --local
supabase db dump --schema public,storage --linked
```

Use catalog queries for focused RLS review:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

## Output

For review, provide a generated summary from the database inspection output in the conversation or PR notes. Do not commit generated schema snapshots unless explicitly aligned.

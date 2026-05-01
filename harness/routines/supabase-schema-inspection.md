# Supabase Schema Discrepancy Check

## Purpose

Check for discrepancies between the repo migrations and the live or local Supabase database.

## Source Of Truth

Repo migrations are the intended schema source. The database is the applied state.

Do not maintain a hand-written consolidated schema document as a second source of truth. Generate inspection output only to compare intended vs applied state.

## Preferred Workflow

Use Supabase CLI or direct Postgres catalog queries after migrations are applied.

Useful commands once Supabase CLI is available:

```sh
supabase db dump --schema public,storage --local
supabase db dump --schema public,storage --linked
```

Use catalog queries for focused discrepancy checks:

```sql
-- RLS policies currently applied.
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

```sql
-- App tables currently applied.
select table_schema, table_name
from information_schema.tables
where table_schema in ('public', 'storage')
  and table_type = 'BASE TABLE'
order by table_schema, table_name;
```

## Output

For review, report:

- Missing expected tables, constraints, buckets, or policies.
- Unexpected tables, constraints, buckets, or policies.
- Migration files present in the repo but not applied.
- Database objects present without a matching migration.

Do not commit generated schema snapshots unless explicitly aligned.

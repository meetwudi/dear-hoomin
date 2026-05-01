# Supabase Schema

This is the consolidated reviewer-facing view of the initial schema. The executable source of truth is `migrations/202605010001_initial_schema.sql`.

## Storage

| Bucket | Public | Purpose |
| --- | --- | --- |
| `app-files` | No | Uploaded blobs for pet reference photos, pet style references, and thought images. |

Object paths should start with the family id:

```text
<family_id>/<file_kind>/<file_id-or-name>
```

Storage RLS checks the first path segment as `family_id`.

## Tables

| Table | Purpose | Key Constraints |
| --- | --- | --- |
| `hoomin_profiles` | One profile row per Supabase auth hoomin. | `id` references `auth.users`. |
| `families` | Family containers. | `created_by` references `auth.users`. |
| `family_memberships` | Hoomins in families. | Primary key `(family_id, hoomin_id)`, role is `owner` or `member`. |
| `family_invites` | Join links and optional email invites. | Unique `invite_token`. |
| `pets` | Pets inside a family. | `family_id` required. |
| `uploaded_files` | General blob metadata table. | Unique `(storage_bucket, storage_path)`, typed by `owner_type` and `file_kind`. |
| `daily_thoughts` | One thought per pet per local day. | Unique `(pet_id, local_date)`, optional `image_file_id`. |

## File Ownership

`uploaded_files` is intentionally general rather than pet-photo-specific.

| Column | Meaning |
| --- | --- |
| `family_id` | Family that can access the file. |
| `owner_type` | Logical owner such as `pet`, `daily_thought`, or `family`. |
| `owner_id` | Id of the logical owner. |
| `file_kind` | Purpose such as `pet_reference_photo`, `pet_style_reference`, or `thought_image`. |

## Daily Thought Generation

`daily_thoughts.generator_version` is the single generation identifier for MVP.

No separate generator kind is stored. If the implementation needs more detail later, encode it into the version string or add a new migration after alignment.

## Helper Functions

| Function | Purpose |
| --- | --- |
| `set_updated_at()` | Maintains `updated_at` timestamps. |
| `is_family_member(family_id)` | Checks if `auth.uid()` belongs to a family. |
| `pet_family_id(pet_id)` | Resolves a pet's family. |
| `storage_object_family_id(object_name)` | Parses the family id prefix from a storage object path and fails closed on malformed paths. |

## RLS Policies

| Table | Select | Insert | Update |
| --- | --- | --- | --- |
| `hoomin_profiles` | Own profile only. | Own profile only. | Own profile only. |
| `families` | Family members. | Authenticated hoomin when `created_by = auth.uid()`. | Family members. |
| `family_memberships` | Family members. | Creating hoomin can add their own owner membership only for a family they created. | None for MVP. |
| `family_invites` | Family members. | Family members when `created_by = auth.uid()`. | Family members. |
| `pets` | Family members. | Family members when `created_by = auth.uid()`. | Family members. |
| `uploaded_files` | Family members. | Family members when `uploaded_by = auth.uid()`. | None for MVP. |
| `daily_thoughts` | Family members of the pet's family. | Family members of the pet's family. | Family members of the pet's family. |
| `storage.objects` for `app-files` | Family members by storage path prefix. | Family members by storage path prefix. | None for MVP. |


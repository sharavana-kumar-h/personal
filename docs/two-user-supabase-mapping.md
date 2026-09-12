# Two-user Supabase setup

This procedure associates the two existing local Prisma users with Supabase Auth users. It does not delete, recreate, or move any application data. Do not use the public registration page for this initial mapping.

## 1. Create the Auth users

In Supabase Dashboard, open **Authentication > Users** and create exactly two users with the final email addresses. Use strong temporary passwords, require email confirmation according to the project policy, and record each generated UUID. The UUID is the user's **ID** field, not the email or the local Prisma `User.id`.

Before changing the database, record this reviewed mapping offline:

| Local email | Supabase Auth UUID | Local Prisma `User.id` |
| --- | --- | --- |
| `<user-a-email>` | `<user-a-auth-uuid>` | `<local-user-a-id>` |
| `<user-b-email>` | `<user-b-auth-uuid>` | `<local-user-b-id>` |

## 2. Inspect and back up the local rows

Run a database backup/export first. Then, using a trusted server-side Prisma connection or the Supabase SQL editor, inspect the rows:

```sql
select id, email, "supabaseAuthId"
from "User"
order by email;
```

Confirm there are exactly two rows, the emails match the reviewed mapping exactly, and the two local IDs are distinct. Do not match rows by display name or row order.

## 3. Apply the guarded mapping

Replace all four placeholders below after a second-person review. Run this as one transaction. The update is guarded by the exact local email and local ID, so an accidental email/UUID swap aborts rather than changing the other user's row. It changes only `supabaseAuthId`; all profiles, meals, foods, goals, body records, workouts, cardio, and conversations remain attached to their existing local `User.id`.

```sql
begin;

do $$
declare
  local_user_count integer;
  user_a_count integer;
  user_b_count integer;
  auth_a_count integer;
  auth_b_count integer;
begin
  select count(*) into local_user_count from "User";
  select count(*) into user_a_count
  from "User"
  where email = '<user-a-email>' and id = '<local-user-a-id>';

  select count(*) into user_b_count
  from "User"
  where email = '<user-b-email>' and id = '<local-user-b-id>';

  select count(*) into auth_a_count
  from auth.users
  where id = '<user-a-auth-uuid>'::uuid and lower(email) = lower('<user-a-email>');

  select count(*) into auth_b_count
  from auth.users
  where id = '<user-b-auth-uuid>'::uuid and lower(email) = lower('<user-b-email>');

  if local_user_count <> 2 or user_a_count <> 1 or user_b_count <> 1 then
    raise exception 'Expected exactly two local users and one exact row per mapping';
  end if;

  if auth_a_count <> 1 or auth_b_count <> 1 then
    raise exception 'Each Auth UUID must belong to the expected email';
  end if;

  if '<user-a-auth-uuid>' = '<user-b-auth-uuid>' then
    raise exception 'Auth UUIDs must be different';
  end if;
end $$;

update "User"
set "supabaseAuthId" = '<user-a-auth-uuid>', "updatedAt" = now()
where email = '<user-a-email>' and id = '<local-user-a-id>';

update "User"
set "supabaseAuthId" = '<user-b-auth-uuid>', "updatedAt" = now()
where email = '<user-b-email>' and id = '<local-user-b-id>';

commit;
```

If either Auth UUID is already assigned to a different local row, the unique constraint must stop the transaction. Do not work around that error; investigate the mapping.

## 4. Verify the mapping

Run this query and compare it with the reviewed table and Supabase Dashboard:

```sql
select id, email, "supabaseAuthId"
from "User"
where email in ('<user-a-email>', '<user-b-email>')
order by email;
```

Log in separately as each user and confirm the dashboard shows only that user's existing records. Test a direct URL containing the other user's body snapshot or conversation ID; it must return not found or unauthorized. Keep registration closed after the two accounts exist.

## Existing data invariant

Application records reference the local `User.id`, not the Supabase UUID. Updating only `User.supabaseAuthId` preserves every existing relationship. Never delete and recreate local users to perform this association.

## Future account changes

Do not edit `supabaseAuthId` as a routine account-switch mechanism. A future identity change must be an explicitly reviewed, backed-up migration with both the old and new Supabase UUIDs recorded and the unique constraint intact.
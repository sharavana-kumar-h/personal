# Live isolation testing

The live test is intentionally opt-in and must use a disposable PostgreSQL database. It never uses the production database by convention; provide a dedicated test database URL.

Create two Supabase Auth users in the test project, record their UUIDs, and create matching local Prisma rows through the guarded mapping procedure. Then run:

```bash
export INTEGRATION_DATABASE_URL='postgresql://<test-user>:<test-password>@<test-host>:5432/<test-database>?schema=public'
export INTEGRATION_USER_A_EMAIL='user-a@example.test'
export INTEGRATION_USER_A_AUTH_ID='<supabase-auth-uuid-a>'
export INTEGRATION_USER_B_EMAIL='user-b@example.test'
export INTEGRATION_USER_B_AUTH_ID='<supabase-auth-uuid-b>'
npx prisma migrate deploy
npx vitest run lib/__tests__/data-isolation.integration.test.ts
```

The test creates and removes only rows for the two configured test emails. It verifies both users' access to profiles, goals, body snapshots, meals, food entries, workout programs, workout days, planned exercises, workout sessions, workout sets, cardio, and coach conversations. It also verifies nested ownership, including a `WorkoutSet` through its owning `WorkoutSession`, and rejects a direct authenticated-user ID override.

The test database must be separate from production. The test suite does not create Supabase Auth users or issue browser sessions; those two steps remain an explicit test-environment setup operation. Exercise the deployed server actions and AI endpoint with both test accounts after the database test passes, including a request containing the other user's local ID. The server must derive identity from `supabase.auth.getUser()` and ignore that supplied ID.

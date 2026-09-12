# Prisma migration workflow

The initial migration is committed at `prisma/migrations/20260912122000_init`. It was generated from the current schema with `prisma migrate diff --from-empty`; the configured development PostgreSQL server was unavailable, so it has not yet been applied to a database.

## Development verification

Use a disposable development database only:

```bash
export DATABASE_URL='postgresql://<dev-user>:<dev-password>@<dev-host>:5432/<dev-database>?schema=public'
export DIRECT_URL="$DATABASE_URL"
npx prisma migrate dev
npx prisma migrate status
```

For a fresh development database, Prisma should apply `20260912122000_init`. Review the resulting schema and run the application tests. For future schema changes, use `npx prisma migrate dev --name <descriptive-name>` against development only, then review and commit the generated migration.

## Production application

After the migration has been reviewed and committed:

```bash
export DATABASE_URL='<Supabase pooled runtime connection string>'
export DIRECT_URL='<Supabase direct database connection string>'
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

Never run `prisma migrate dev` against Supabase production. If production already contains tables or data without a matching `_prisma_migrations` history, stop and compare the live schema with the committed migration. Back up first and use a reviewed baseline with `prisma migrate resolve --applied 20260912122000_init`; do not deploy the create-table migration blindly into a populated database.

# Private Fitness Hub

A private shared fitness, nutrition, workout-tracking, progress-monitoring, and AI coaching platform for two users.

## Architecture

- Next.js 16 App Router and TypeScript
- Vercel deployment target
- Supabase PostgreSQL with Prisma
- Supabase Auth with `@supabase/ssr` as the only authentication framework
- Server-side DeepSeek API integration
- Zod validation and Vitest tests

## Authentication and authorization

Supabase Auth owns sign-up, password verification, access-token refresh, and session cookies. Server Components, Server Actions, and middleware derive the authenticated Supabase user with `supabase.auth.getUser()`.

The local Prisma `User` row stores the unique `supabaseAuthId`. Every application query and mutation uses the local user ID derived from that trusted server-side mapping. Client-supplied user IDs are not accepted as an authorization input.

## Environment variables

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_API_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-flash"
DEEPSEEK_TIMEOUT_MS="20000"
```

`DEEPSEEK_API_KEY` is server-only. It must never use a `NEXT_PUBLIC_` name or appear in browser code. See [the two-user Supabase mapping procedure](docs/two-user-supabase-mapping.md) before connecting existing data.

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Use `prisma migrate dev` only against a disposable development database. For production, generate and review the migration locally, then apply the committed migration with `npx prisma migrate deploy` against the production `DATABASE_URL`/`DIRECT_URL` configuration.

Open http://localhost:3000.

## AI service

The AI layer uses the official DeepSeek Chat Completions API at `https://api.deepseek.com/chat/completions`. The current official API documentation lists `deepseek-flash` as a supported model and supports JSON output with `response_format: { "type": "json_object" }`.

AI-generated nutrition values and recommendations remain estimates. The database is always the source of truth.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```

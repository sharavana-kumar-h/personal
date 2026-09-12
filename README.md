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

`DEEPSEEK_API_KEY` is server-only. It must never use a `NEXT_PUBLIC_` name or appear in browser code.

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## AI service

The AI layer uses the official DeepSeek Chat Completions API at `https://api.deepseek.com/chat/completions`. The current documented Flash model is `deepseek-flash`; `DEEPSEEK_MODEL` can later be changed to `deepseek-v4-pro`. `deepseek-v4-flash` is intentionally not used because the current DeepSeek documentation identifies it as a legacy name for a retired model.

AI-generated nutrition values and recommendations remain estimates. The database is always the source of truth.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```

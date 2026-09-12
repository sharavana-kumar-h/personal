# Private Fitness Hub

This is the foundation for a private shared fitness, nutrition, workout-tracking, and progress-monitoring platform for two users.

## Tech stack

- Next.js 16
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Next.js server actions and API routes
- Zod validation
- bcryptjs for password hashing
- jose for JWT/session handling

## Current foundation includes

- App Router setup
- TypeScript configuration
- Tailwind styling foundation
- Prisma schema for users and sessions
- Secure session management
- Protected application routes
- Login and registration forms
- Server-side auth actions
- Two-user data isolation model
- Environment variable template
- Basic tests for validation
- Nutrition goals, dated meals, editable food entries, daily totals, and weekly averages
- Server-only xAI/Grok service with structured outputs and validated AI analysis

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local PostgreSQL database.

3. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

4. Update values in `.env.local`.

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

7. Start the app:
   ```bash
   npm run dev
   ```

8. Open http://localhost:3000

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npx vitest run
```

## Security notes

- Passwords are stored as hashes, not plaintext.
- Authenticated access is enforced on server-side routes and middleware.
- Every user-specific resource should be scoped to the authenticated user.
- AI API keys must remain server-side and never be exposed to the browser.

## AI service

The AI service uses the official xAI Responses API at `https://api.x.ai/v1/responses` with structured JSON Schema output where supported. Configure `XAI_API_KEY` in `.env.local`; the key is never included in browser code, prompts, logs, or stored application data.

AI-generated nutrition values are explicitly marked as estimates and must be reviewed before being saved as nutrition entries. See the official [xAI Generate Text](https://docs.x.ai/docs/guides/chat) and [Structured Outputs](https://docs.x.ai/docs/guides/structured-outputs) documentation for the API contract.

## Important roadmap note

Advanced nutrition AI, workout AI, charts, and progress dashboards remain outside the current scope. Nutrition values are entered or reviewed by the user; AI estimates are stored as editable, explicitly unverified entries.

# Security and Privacy Specification

## Database (Supabase Postgres + Prisma)
All tables in the `public` schema must have **Row Level Security (RLS) enabled**.
ApplyFlow uses Prisma with a direct Postgres connection (not Supabase PostgREST), so RLS blocks the Supabase API (`anon` / `authenticated` roles) while the app continues to work via the `postgres` role.
Migration: `prisma/migrations/20260917180000_enable_row_level_security`.

## Authentication
Use Supabase Auth with Google OAuth and cookie-based SSR sessions (`@supabase/ssr`).
Google client ID and secret stay in the Supabase dashboard, never in this repository.
Protect all application routes in middleware with `getClaims()`, then re-check identity in server code before loading user data.
Scope every query to the authenticated application `User` row linked by `authUserId`.

## Gmail
Request the minimum OAuth scopes required.
Store refresh/access credentials encrypted and never expose them to browser code or logs.

## Files
Resume and screenshot files are private.
Use signed, short-lived access URLs when the browser needs temporary access.

## AI privacy
Send only the minimum required data to the AI provider.
Do not include OAuth credentials or unrelated personal data in AI requests.

## Threats
Account takeover, token leakage, IDOR, malicious uploads, prompt injection from screenshots, accidental email sending, and provider outages must be explicitly tested.

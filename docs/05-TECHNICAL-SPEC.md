# Technical / Functional Specification

## Stack
- Next.js with TypeScript.
- React.
- Tailwind CSS and shadcn/ui.
- PostgreSQL.
- Prisma.
- Zod.
- Supabase Auth (Google sign-in) and a later Gmail API connection.
- S3-compatible private object storage.
- OpenAI-compatible structured AI integration.

## Code organization
Use feature/domain modules rather than large generic utility folders.
Server-only integration code must never be imported into client components.

## API rules
Validate every external input with Zod.
Return consistent success/error envelopes.
Never return secrets, provider tokens, or private storage credentials.

## Error handling
Use typed domain errors and stable error codes.
User-facing messages must explain what can be done next without exposing internal implementation details.

## Testing
Every domain service gets unit tests; API boundaries get integration tests; critical user journeys get Playwright coverage.

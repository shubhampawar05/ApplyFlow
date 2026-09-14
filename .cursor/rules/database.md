# Database rules
Use Prisma for all application database access.
Keep core searchable fields typed and use JSON only for intentionally flexible payloads.
Scope every query by authenticated user ownership.
Use migrations for schema changes.
Never store provider secrets in plaintext.

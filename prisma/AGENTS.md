# Prisma instructions

Keep the schema normalized around the core domain entities.
Use enums for stable application states.
Add indexes for ownership, status, and duplicate-detection queries.
Create migrations for every schema change.
Never commit real credentials, tokens, or production data.

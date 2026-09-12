# Next.js application instructions

Keep route handlers thin and delegate business logic to domain services.
Do not put database queries or AI orchestration directly in page components.
Use server-only imports for secrets and provider integrations.
Every route must authenticate and authorize resource ownership.
Follow `docs/07-API.md` for request and response contracts.

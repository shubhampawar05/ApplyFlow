# Architecture Specification

## Architecture style
Start as a modular Next.js monolith with clear domain boundaries.
Do not introduce microservices until scale or isolation requirements justify them.

## Runtime
Browser -> Next.js application -> domain services -> PostgreSQL / object storage / AI provider / Gmail API.

## Domain modules
- auth
- users
- resumes
- jobs
- applications
- ai
- integrations
- files

## Important boundary
AI produces structured suggestions; application services validate and persist them.
The AI layer must never directly send email or mutate application status without deterministic application logic.

## Async work
Long-running AI/file operations should use a job abstraction.
The initial implementation may use request/response for simple operations and introduce a queue when latency requires it.

## Deployment
Next.js on Vercel or equivalent, managed PostgreSQL, private object storage, and OAuth-enabled Gmail integration.

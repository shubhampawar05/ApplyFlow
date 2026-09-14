# ApplyFlow AI — Codex Project Instructions

## Mission
Build ApplyFlow AI as a production-quality personal job-application assistant.
The core flow is screenshot -> structured job -> resume match -> email -> human approval -> Gmail send.
Do not implement autonomous sending, mass applications, fabricated candidate claims, or unsafe automation.

## Repository map
- `docs/` is the source of truth for product, architecture, UX, API, AI, security, and delivery decisions.
- `src/` contains application code and must follow the nearest scoped instruction file.
- `prisma/` contains database schema and migrations.
- `.cursor/` contains editor/agent context and reusable implementation prompts.
- `tests/` contains unit, integration, and end-to-end tests.

## Agent workflow
1. Read this file and the relevant document under `docs/` before changing code.
2. Read `docs/15-PROGRESS.md` for what is done, in progress, and next.
3. Read the nearest `AGENTS.md` before editing files in a scoped directory.
4. Make the smallest coherent change that satisfies the task.
5. Run the checks defined by the relevant docs before declaring the task complete.
6. Update `docs/15-PROGRESS.md` (and `.cursor/rules/` when useful) when status or next steps change.
7. Never expose secrets, OAuth tokens, private files, or personal application data in logs.

## Engineering rules
- TypeScript strict mode.
- Server-side secrets only.
- Zod validation at API boundaries.
- Prisma for database access.
- AI outputs must use schemas and validation.
- Human approval is mandatory before email sending.
- Prefer deterministic application logic over unnecessary LLM decisions.
- Do not silently change product requirements; update docs first when a requirement changes.

## File comment convention
Implementation placeholder files created during scaffolding contain exactly five comment lines.
Those comments describe the file's purpose and the work Codex must implement.
After implementation, Codex may replace the placeholder comments with real code and appropriate documentation.

## Definition of done
A feature is complete only when implementation, validation, tests, relevant documentation, and error states are addressed.

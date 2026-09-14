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
4. Read the target file's header contract (see File header convention) before editing.
5. Make the smallest coherent change that satisfies the task.
6. Run the checks defined by the relevant docs before declaring the task complete.
7. Update `docs/15-PROGRESS.md` (and `.cursor/rules/` when useful) when status or next steps change.
8. Never expose secrets, OAuth tokens, private files, or personal application data in logs.

## Engineering rules
- TypeScript strict mode.
- Server-side secrets only.
- Zod validation at API boundaries.
- Prisma for database access.
- AI outputs must use schemas and validation.
- Human approval is mandatory before email sending.
- Prefer deterministic application logic over unnecessary LLM decisions.
- Do not silently change product requirements; update docs first when a requirement changes.

## File header convention
Every source file has a header contract so agents know what belongs in that file and what does not.

### Placeholder files (not yet implemented)
Use exactly five comment lines at the top of the file:

```
// Purpose: <what this file owns>
// Task: <what the agent should implement next>
// In scope: <what belongs here>
// Out of scope: <what must NOT be added here>
// Refs: <relevant docs/, AGENTS.md, and related files>
```

Optional sixth line when useful: `// Status: placeholder | in-progress | done`

### Implemented files
Keep a two-line header after implementation:

```
// Purpose: <unchanged from placeholder>
// Constraints: <hard rules — security, approval gates, layering, no client secrets>
```

Do not remove the header when replacing placeholder code. Do not duplicate full specs from `docs/` — link via `Refs` or `Constraints` instead.

If a placeholder file has no header, add the five-line contract before implementing.
If an agent needs behavior not described in the header or scoped `AGENTS.md`, update docs first or ask — do not invent requirements.

## Definition of done
A feature is complete only when implementation, validation, tests, relevant documentation, and error states are addressed.

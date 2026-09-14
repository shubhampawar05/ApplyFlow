---
name: applyflow-implement
description: Implement or extend ApplyFlow AI features following project conventions. Always apply for any code change in this repository — read file headers, generate missing headers, and follow AGENTS.md even when the user does not ask.
---

# ApplyFlow implement

Follow this skill on every implementation task in this repo, whether or not the user says "follow applyflow-implement".

## Before writing code

1. Read root `AGENTS.md` and the nearest scoped `AGENTS.md`.
2. Read `docs/15-PROGRESS.md` — only work on what is current or explicitly requested.
3. Read the target file's header contract (`Purpose`, `Task`/`Constraints`, `In scope`/`Out of scope`, `Refs`).
4. Read the relevant `docs/` spec (API, AI, security, design) linked from the header or feature.
5. **If the file has no header, add one before implementing** (see File headers below).

## File headers (auto-generate when missing)

### Placeholder / new file — add five lines first

```
// Purpose: <what this file owns>
// Task: <what the agent should implement next>
// In scope: <what belongs here>
// Out of scope: <what must NOT be added here>
// Refs: <relevant docs/, AGENTS.md, and related files>
```

Infer content from the user's request, nearest `AGENTS.md`, and related files in the same feature folder.

### After implementation — shrink to two lines

```
// Purpose: <same as placeholder>
// Constraints: <hard rules only — security, approval gates, layering, no client secrets>
```

Never delete the header when replacing placeholder code.

### Existing implemented file without header

Add the two-line `Purpose` + `Constraints` header before making other edits.

## While implementing

- Make the smallest coherent change that satisfies the task.
- Respect `In scope` / `Out of scope` in file headers — do not add unrelated logic.
- Place code in the correct layer: route → service → repository / adapter.
- Use Zod at API boundaries and for all AI outputs.
- Keep secrets server-side; never expose tokens or private data in logs.

## Definition of done

- [ ] File has the correct header (five-line placeholder or two-line implemented)
- [ ] Implementation matches the file header and relevant docs
- [ ] Input validation and error states handled
- [ ] Tests added or updated when behavior changes
- [ ] Placeholder header replaced with two-line `Purpose` + `Constraints` header when done
- [ ] `docs/15-PROGRESS.md` updated if feature status changed

## When blocked

- If requirements are missing or contradict the header, stop and ask or update docs first.
- Do not invent product behavior, autonomous sending, or fabricated candidate claims.

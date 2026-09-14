# ApplyFlow Cursor agent context

Agents working in this repo must always:

1. Follow the **applyflow-implement** skill: `skills/applyflow-implement/SKILL.md`
2. Follow the **file header contract** in root `AGENTS.md`
3. Apply the always-on rule: `rules/applyflow-core.mdc`

## File headers (agents generate these automatically)

**Placeholder / new file:**

```
// Purpose: ...
// Task: ...
// In scope: ...
// Out of scope: ...
// Refs: docs/..., nearest AGENTS.md
```

**After implementation:**

```
// Purpose: ... (same)
// Constraints: ... (hard rules only)
```

Users do not need to paste these — agents add them when missing.

## Scoped rules

| Rule | When it applies |
|------|-----------------|
| `applyflow-core.mdc` | Every session |
| `feature-services.mdc` | `src/features/**/*.service.ts` |
| `api-routes.mdc` | `src/app/api/**/*.ts` |
| `ai-adapters.mdc` | `src/features/**/*.adapter.ts` |

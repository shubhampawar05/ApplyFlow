# Progress and memory maintenance

ApplyFlow agents must keep project memory in the repository, not only in conversation.

## When to update
- Starting a new feature branch
- Completing or merging a feature
- User verifies something works (e.g. auth, upload)
- Scope or priority changes

## What to update
1. **`docs/15-PROGRESS.md`** — primary tracker (phases, status, merged PRs, next branch)
2. **`docs/`** — specs when requirements or architecture change
3. **`.cursor/rules/`** — short agent context (current phase, next branch, key decisions)
4. **`.cursor/prompts/`** — reusable prompts when implementation workflow changes
5. **`AGENTS.md`** — only for durable repo-wide agent rules

## Status legend
- ✅ Done
- 🟡 Partial
- 🔧 In progress
- ⬜ Not started

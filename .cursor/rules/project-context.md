# ApplyFlow AI project context
Read `AGENTS.md` before making changes.
Read the relevant document under `docs/` before implementing a feature.
Keep the MVP flow screenshot -> review -> send intact.
Never allow AI to bypass deterministic authorization or human approval.

## Project memory (keep updated)
When work status, decisions, or “what’s next” changes, update the repo — do not rely on chat memory alone.

| What to update | Where |
|----------------|--------|
| Done / in progress / left | `docs/15-PROGRESS.md` |
| Product or engineering decisions | Relevant `docs/*.md` |
| Agent workflow and conventions | `AGENTS.md`, scoped `AGENTS.md` files |
| Cursor-specific agent guidance | `.cursor/rules/` |
| Reusable implementation prompts | `.cursor/prompts/` |

After each merged feature branch: refresh `docs/15-PROGRESS.md` (status table, merged PRs, **Next up**).

**Current branch:** `feature/job-extraction` (vision AI extract + editable job review).
**On main:** auth, resume flow, job screenshot intake (PR #1–#5).
**Next after merge:** resume/job match score (Phase 2).

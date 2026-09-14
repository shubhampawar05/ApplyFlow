# ApplyFlow — Build Progress

Living tracker for what is shipped on `main`, what is in progress, and what is still ahead.
Update this file at the end of each merged feature branch.

**Last updated:** 2026-09-14 (`feature/job-screenshot-intake` in progress)

---

## Phase 0 — Foundation

| Item | Status |
|------|--------|
| Auth, database, storage, tests | ✅ Done |

**Phase 0:** ✅ Complete

---

## Phase 1 — Resume + job intake (current focus)

| Item | Status | Notes |
|------|--------|-------|
| Job intake domain | ✅ Done | PR #2 |
| Resume upload + parse + profile review | ✅ Done | PR #3, PR #4 |
| **Job screenshot upload (persisted)** | 🔧 In progress | `feature/job-screenshot-intake` |
| **Application draft created from screenshot** | 🔧 In progress | `Job` + `Application` DRAFT |
| Vision-based job extraction | ⬜ Left | `POST /api/jobs/extract` |
| Editable job review screen | ⬜ Left | After extraction |

**Recommended next branch:** `feature/job-screenshot-intake` (finish + merge)  
**Then:** `feature/job-extraction` (AI + editable review)

---

## Phase 2 — Match, email, Gmail send

| Item | Status |
|------|--------|
| Resume/job match score | ⬜ Left |
| Email generation (grounded) | ⬜ Left |
| Email preview + edit | ⬜ Left |
| Gmail OAuth (send scopes) | ⬜ Left |
| Send with explicit approval | ⬜ Left |

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #1 | `feature/auth-foundation` | Data + auth |
| #2 | `feature/job-intake-domain` | Job schemas, normalization |
| #3 | `feature/resume-foundation` | Resume upload + storage |
| #4 | `feature/resume-parsing` | Resume parse + profile review |

---

## Environment

| Variable | Status |
|----------|--------|
| `STORAGE_*` | ✅ Configured |
| `OPENAI_API_KEY` | ✅ Configured |
| Gmail OAuth env | Phase 2 only |

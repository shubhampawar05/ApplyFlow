# ApplyFlow — Build Progress

Living tracker for what is shipped on `main`, what is in progress, and what is still ahead.
Update this file at the end of each merged feature branch.

**Last updated:** 2026-09-14 (`feature/resume-parsing` in progress)

---

## Phase 0 — Foundation

| Item | Status | Notes |
|------|--------|-------|
| Repository + docs scaffold | ✅ Done | Merged on `main` |
| PostgreSQL + Prisma schema | ✅ Done | PR #1 |
| Supabase Auth + Google sign-in | ✅ Done | PR #1, verified locally |
| Supabase Storage bucket + S3 keys | ✅ Done | Private bucket configured |
| Vitest + unit test foundation | ✅ Done | |

**Phase 0:** ✅ Complete

---

## Phase 1 — Resume + job intake (current focus)

| Item | Status | Notes |
|------|--------|-------|
| Job intake domain | ✅ Done | PR #2 |
| Resume upload | ✅ Done | PR #3 — `POST /api/resumes`, Settings UI |
| **Resume parsing → profile** | 🔧 In progress | `feature/resume-parsing` |
| **Resume profile review screen** | 🔧 In progress | Editable profile on Settings |
| New Application screenshot UI | 🟡 Partial | Upload UI only; not persisted |
| Job screenshot upload (persisted) | ⬜ Left | Storage + `Job` row |
| Vision-based job extraction | ⬜ Left | `POST /api/jobs/extract` |
| Editable job review screen | ⬜ Left | After extraction |

**Recommended next branch:** `feature/resume-parsing` (finish + merge)  
**Then:** persisted job screenshot upload + extraction

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

---

## Environment

| Variable | Status |
|----------|--------|
| `STORAGE_*` | ✅ Configured |
| `OPENAI_API_KEY` | ✅ Required for resume parsing |
| Gmail OAuth env | Phase 2 only |

# ApplyFlow — Build Progress

Living tracker for what is shipped on `main`, what is in progress, and what is still ahead.
Update this file at the end of each merged feature branch.

**Last updated:** 2026-09-14 (`feature/resume-foundation` in progress)

---

## Phase 0 — Foundation

| Item | Status | Notes |
|------|--------|-------|
| Repository + docs scaffold | ✅ Done | Merged on `main` |
| PostgreSQL + Prisma schema | ✅ Done | `feature/data-foundation` → PR #1 |
| Domain models (User, Job, Application, Resume, …) | ✅ Done | Initial migration applied |
| Supabase Auth + Google sign-in | ✅ Done | `feature/auth-foundation` → PR #1 |
| Cookie sessions + route protection | ✅ Done | Middleware + `requireCurrentUser` |
| App user sync (`authUserId`) | ✅ Done | Upsert on OAuth callback |
| Design system shell (dashboard, nav) | ✅ Done | Basic UI in place |
| Vitest + unit test foundation | ✅ Done | Auth + job service tests |
| Auth setup guide | ✅ Done | `docs/14-AUTH-SETUP.md` |
| Supabase Storage bucket + S3 keys | ✅ Done | `applyflow-private`, env configured |

**Phase 0:** ✅ Complete

---

## Phase 1 — Resume + job intake (current focus)

| Item | Status | Notes |
|------|--------|-------|
| Job intake domain (Zod schemas, normalization) | ✅ Done | `feature/job-intake-domain` → PR #2 |
| Duplicate detection helpers | ✅ Done | `isLikelyDuplicate` in job service |
| New Application screenshot UI | 🟡 Partial | Upload UI only; not persisted |
| **Resume upload** | 🔧 In progress | `feature/resume-foundation` — `POST /api/resumes`, Settings UI |
| Resume parsing → profile | ⬜ Left | AI pipeline not wired |
| Resume profile review screen | ⬜ Left | After parsing |
| Job screenshot upload (persisted) | ⬜ Left | Storage + `Job` row |
| Vision-based job extraction | ⬜ Left | `POST /api/jobs/extract` |
| Editable job review screen | ⬜ Left | After extraction |

**Recommended next branch:** `feature/resume-foundation` (finish + merge)  
**Then:** resume parsing / profile review

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

## Phase 3 — Dashboard + tracking

| Item | Status |
|------|--------|
| Application list on dashboard | ⬜ Left |
| Application detail + timeline | ⬜ Left |
| Status transitions + events | ⬜ Left |
| Duplicate warning before send | ⬜ Left |

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #1 | `feature/auth-foundation` | Data + auth (includes data-foundation commits) |
| #2 | `feature/job-intake-domain` | Job schemas, normalization, tests |

---

## Environment still needed for upcoming work

| Variable | Needed for |
|----------|------------|
| `STORAGE_*` | ✅ Configured (resume upload) |
| `OPENAI_API_KEY` | Resume parsing + job extraction |
| Gmail OAuth env | Phase 2 send only (not login) |

---

## How this doc is maintained

- Updated when a feature branch merges to `main`
- **Next up** section always points at the single recommended branch
- Status legend: ✅ Done · 🟡 Partial · ⬜ Not started · 🔧 In progress

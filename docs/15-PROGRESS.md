# ApplyFlow — Build Progress

**Last updated:** 2026-09-14 (`feature/application-dashboard` in progress)

---

## Phase 1 — Resume + job intake

| Item | Status | Notes |
|------|--------|-------|
| Resume upload + parse + profile review | ✅ Done | PR #3, #4 |
| Job screenshot upload + draft application | ✅ Done | PR #5 |
| Vision-based job extraction | ✅ Done | PR #6, #7 |
| Editable job review screen | ✅ Done | Application detail page + `PATCH /api/jobs/:id` |

---

## Phase 2 — Match, email, send

| Item | Status | Notes |
|------|--------|-------|
| Resume/job match score | ✅ Done | PR #10 |
| Email generation + preview/edit | ✅ Done | PR #10 |
| Gmail OAuth + send | ✅ Done | connect/callback/status + `POST /api/applications/:id/send` |

---

## Phase 3 — Dashboard + tracking

| Item | Status | Notes |
|------|--------|-------|
| **Application dashboard list** | 🔧 In progress | `GET /api/applications`, dashboard cards |
| **Post-send status updates** | 🔧 In progress | `PATCH /api/applications/:id/status` |
| **Application timeline** | 🔧 In progress | Events on application detail page |
| Duplicate detection | ⬜ Not started | Warn before send |
| Analytics + polish | ⬜ Not started | Phase 3 follow-up |

**Next after dashboard:** duplicate detection before send

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #10 | `feature/phase-2-match-and-email` | Resume match + email generation/edit |
| #8 | `chore/cursor-agent-setup` | Cursor agent rules, skill, file headers |
| #7 | `fix/job-extraction-schema` | Vision extraction OpenAI schema fix |
| #6 | `feature/job-extraction` | Vision extraction + job review |
| #5 | `feature/job-screenshot-intake` | Screenshot → Job + Application DRAFT |
| #4 | `feature/resume-parsing` | Resume parse + profile review |
| #3 | `feature/resume-foundation` | Resume upload |
| #2 | `feature/job-intake-domain` | Job schemas |
| #1 | `feature/auth-foundation` | Auth + data |

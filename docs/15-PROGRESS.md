# ApplyFlow — Build Progress

**Last updated:** 2026-09-14 (`feature/resume-matching` in progress)

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
| **Resume/job match score** | 🔧 In progress | `POST /api/applications/:id/match`, match review UI |
| Email generation | ⬜ Not started | `POST /api/applications/:id/generate-email` |
| Email preview + editing | ⬜ Not started | `PATCH /api/applications/:id/email` |
| Gmail OAuth + send | ⬜ Not started | `POST /api/applications/:id/send` |

**Next after match:** grounded application email generation

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #8 | `chore/cursor-agent-setup` | Cursor agent rules, skill, file headers |
| #7 | `fix/job-extraction-schema` | Vision extraction OpenAI schema fix |
| #6 | `feature/job-extraction` | Vision extraction + job review |
| #5 | `feature/job-screenshot-intake` | Screenshot → Job + Application DRAFT |
| #4 | `feature/resume-parsing` | Resume parse + profile review |
| #3 | `feature/resume-foundation` | Resume upload |
| #2 | `feature/job-intake-domain` | Job schemas |
| #1 | `feature/auth-foundation` | Auth + data |

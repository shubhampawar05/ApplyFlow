# ApplyFlow — Build Progress

**Last updated:** 2026-09-14 (`feature/job-extraction` ready for test + PR)

---

## Phase 1 — Resume + job intake

| Item | Status | Notes |
|------|--------|-------|
| Resume upload + parse + profile review | ✅ Done | PR #3, #4 |
| Job screenshot upload + draft application | ✅ Done | PR #5 |
| **Vision-based job extraction** | 🟡 Ready to test | `POST /api/jobs/:id/extract`, gpt-4o vision |
| **Editable job review screen** | 🟡 Ready to test | Application detail page + `PATCH /api/jobs/:id` |

**Next after merge:** resume/job match score (Phase 2)

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #5 | `feature/job-screenshot-intake` | Screenshot → Job + Application DRAFT |
| #4 | `feature/resume-parsing` | Resume parse + profile review |
| #3 | `feature/resume-foundation` | Resume upload |
| #2 | `feature/job-intake-domain` | Job schemas |
| #1 | `feature/auth-foundation` | Auth + data |

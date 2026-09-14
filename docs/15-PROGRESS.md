# ApplyFlow — Build Progress

**Last updated:** 2026-09-14 (`feature/resume-attachment-on-send` ready for PR)

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
| Gmail OAuth + send | ✅ Done | PR #11 |
| Resume attachment on send | ✅ Done | Attach uploaded resume PDF/DOCX to Gmail send |

---

## Phase 3 — Dashboard + tracking

| Item | Status | Notes |
|------|--------|-------|
| Application dashboard list | ✅ Done | PR #12 — `GET /api/applications`, dashboard cards |
| Post-send status updates | ✅ Done | PR #12 — `PATCH /api/applications/:id/status` |
| Application timeline | ✅ Done | PR #12 — events on application detail page |
| Duplicate detection before send | ✅ Done | PR #13 — warning UI + `acknowledgeDuplicate` |
| Dashboard analytics + filters | ✅ Done | Summary stats + status filter chips on dashboard |

**Next:** UX polish (`docs/16-UX-IMPROVEMENT-PLAN.md`) then Phase 4 planning

---

## UX improvements (planned)

| Phase | Focus | Status |
|-------|-------|--------|
| UX-1 | AI processing indicators (spinners, banners) | ✅ Done (`feature/ux-flow-and-ai-indicators`) |
| UX-2 | Application flow stepper on detail page | ✅ Done (`feature/ux-flow-and-ai-indicators`) |
| UX-3 | Screenshot + resume previews (media API) | ✅ Done (`feature/ux-flow-and-ai-indicators`) |
| UX-4 | Dashboard card polish | ✅ Done (`feature/ux-flow-and-ai-indicators`) |
| UX-5 | Toasts, anchors, timeline icons | 📋 Planned |

See `docs/16-UX-IMPROVEMENT-PLAN.md` for full spec and **change log**.

---

## Merged PRs (main)

| PR | Branch | What it added |
|----|--------|----------------|
| #13 | `feature/duplicate-detection` | Duplicate warning before send |
| #12 | `feature/application-dashboard` | Dashboard list, status updates, timeline |
| #11 | `feature/gmail-send` | Gmail OAuth + send |
| #10 | `feature/phase-2-match-and-email` | Resume match + email generation/edit |
| #8 | `chore/cursor-agent-setup` | Cursor agent rules, skill, file headers |
| #7 | `fix/job-extraction-schema` | Vision extraction OpenAI schema fix |
| #6 | `feature/job-extraction` | Vision extraction + job review |
| #5 | `feature/job-screenshot-intake` | Screenshot → Job + Application DRAFT |
| #4 | `feature/resume-parsing` | Resume parse + profile review |
| #3 | `feature/resume-foundation` | Resume upload |
| #2 | `feature/job-intake-domain` | Job schemas |
| #1 | `feature/auth-foundation` | Auth + data |

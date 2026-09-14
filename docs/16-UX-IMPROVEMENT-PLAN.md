# ApplyFlow — UX Improvement Plan

**Created:** 2026-09-14  
**Status:** UX-1–UX-4 done on `feature/ux-flow-and-ai-indicators`; UX-5 planned  
**Owner:** Shubham + agent  
**Related:** `docs/10-DESIGN-SPEC.md`, `docs/11-USER-FLOWS.md`, `docs/15-PROGRESS.md`

---

## Why this doc exists

After completing the full application flow (screenshot → extract → review → match → email → send), the UI works but does not feel polished. Users cannot see what is happening during AI steps, cannot preview uploaded files, and the application detail page reads as one long scroll of sections instead of a guided journey.

This document is the **source of truth for UX work** — what to build, in what order, and a **change log** so we always know what changed and when.

---

## Current pain points (as of 2026-09-14)

| Area | Problem |
|------|---------|
| **AI feedback** | Buttons only change label text (`"Extracting…"`, `"Generating email…"`). No spinner, progress bar, or stage banner. User may think the app froze on slow OpenAI calls. |
| **Application detail** | One long page with 6+ sections stacked vertically. No stepper showing where you are in the flow. |
| **Screenshot** | Only filename shown (`Saved screenshot: job-post.png`). No image preview on detail page or after selecting file on upload. |
| **Resume** | Settings shows filename + size only. No PDF/DOCX preview or “this is the file we’ll attach” confirmation. |
| **New application** | Progress stepper exists on upload page but **disappears** on application detail — flow feels disconnected. |
| **Dashboard** | Application cards show title/company/status but no visual cue (screenshot thumb, match score badge prominence). |
| **Success states** | Saves show small `quiet-note` text. No toasts or clear “step complete, next: …” guidance. |
| **Send panel** | Resume attachment mentioned in text only — no file preview alongside email draft. |

---

## Design principles (from `10-DESIGN-SPEC.md`)

- Show AI progress by **meaningful stages**, not generic spinners only.
- Keep the path **fast, calm, and obvious**.
- Every AI output remains editable.
- Sending stays visually distinct with explicit confirmation.

---

## Implementation phases

### Phase UX-1 — AI processing indicators (high impact, low risk)

**Goal:** User always knows when AI is working and which step is running.

| Task | Details | Key files |
|------|---------|-----------|
| Shared `AiProcessingBanner` component | Pulsing indicator + stage label + optional elapsed time. `role="status"` + `aria-live="polite"`. | `src/components/ai-processing-banner.tsx` |
| Shared `Button` loading state | Spinner inline left of label when `loading={true}`. | `src/components/button.tsx` or extend `.button` in CSS |
| Wire into all AI actions | Extract, parse resume, match, generate email. | `job-extract-button.tsx`, `resume-parse-button.tsx`, `application-match-panel.tsx`, `application-email-panel.tsx` |
| Stage-specific copy | e.g. “Reading screenshot…”, “Comparing your resume to this role…”, “Drafting your email…” | Same panels |

**Acceptance:** Every AI button shows a visible non-text-only loading state; screen readers announce status.

---

### Phase UX-2 — Application flow stepper (high impact)

**Goal:** Application detail page shows where you are in the journey.

| Step | Label | Complete when |
|------|-------|---------------|
| 1 | Screenshot | Screenshot uploaded |
| 2 | Extract & review | Job fields saved |
| 3 | Match | Match analysis run |
| 4 | Email | Email draft saved (READY) |
| 5 | Send | Status = SENT |

| Task | Details | Key files |
|------|---------|-----------|
| `ApplicationFlowStepper` | Horizontal stepper (reuse `.progress` pattern from new-application page). Current step highlighted; completed steps checkmarked. | `src/app/applications/[id]/application-flow-stepper.tsx` |
| Compute step state server-side | Derive from application status, events, email presence, match event. | `application-detail/page.tsx` |
| “Next action” callout | Below stepper: “Next: Extract job details from your screenshot” with link/scroll to section. | Same page |
| Collapse completed sections (optional) | Accordion: completed steps collapsed, current step expanded. | Panel components |

**Acceptance:** User can tell at a glance which step they’re on and what to do next.

---

### Phase UX-3 — File previews (screenshot + resume)

**Goal:** User sees what they uploaded, not just a filename.

| Task | Details | Key files |
|------|---------|-----------|
| **API: private media proxy** | `GET /api/media/:type/:id` — auth-scoped, streams from Supabase Storage. Types: `job-screenshot`, `resume`. | `src/app/api/media/[type]/[id]/route.ts`, storage helper |
| Screenshot preview on application detail | Thumbnail + lightbox expand. | `application-screenshot-preview.tsx` |
| Client-side preview on upload | `URL.createObjectURL(file)` in new-application page before POST. | `new-application-page.tsx` |
| Resume preview in Settings | PDF: `<iframe>` or embed; DOCX: icon + filename + “will attach on send”. | `resume-preview.tsx`, `settings/page.tsx` |
| Send panel attachment preview | Small chip: PDF icon + filename next to send confirmation. | `application-send-panel.tsx` |

**Security:** Never expose storage keys publicly; all media behind auth + ownership check.

**Acceptance:** Screenshot visible on application page; resume preview in Settings; upload page shows image before continue.

---

### Phase UX-4 — Dashboard & list polish

| Task | Details |
|------|---------|
| Screenshot thumbnail on dashboard cards | Small 48×48 crop from job screenshot (via media API) |
| Match score badge | Prominent score pill when `matchScore` exists |
| Empty state illustration | Keep calm tone; add subtle visual hierarchy |
| Filter active state | Already done — verify mobile scroll |

---

### Phase UX-5 — Micro-interactions & feedback

| Task | Details |
|------|---------|
| Toast notifications | “Job details saved”, “Email draft saved”, “Sent successfully” |
| Section scroll anchors | Stepper clicks scroll to section |
| Error recovery hints | AI failures: “Try a clearer screenshot” with link to re-upload |
| Timeline icons | Visual icons per event type in `application-timeline.tsx` |

---

## Suggested build order

```
UX-1 (AI indicators)  →  UX-2 (stepper)  →  UX-3 (previews)  →  UX-4  →  UX-5
     ~1 PR                  ~1 PR               ~1–2 PRs
```

Start with **UX-1 + UX-2** together if possible — they fix the “something is happening” and “where am I” problems in one pass.

---

## Technical notes

- **No new dependencies required** for Phase UX-1/2 (CSS + small React components).
- Phase UX-3 needs a **media proxy route** — follow `docs/09-SECURITY.md` (auth-scoped, no public URLs).
- Reuse existing CSS tokens: `--accent`, `--accent-soft`, `.progress`, `.resume-card`, `.status-badge`.
- Client components stay thin; step state computed on server in `page.tsx`.

---

## Change log

Record every UX PR here so we have proof of what changed and when.

| Date | PR / branch | Phase | What changed |
|------|-------------|-------|--------------|
| 2026-09-14 | — | — | Plan created. Baseline: text-only loading labels, no file previews, no application stepper on detail page. |
| 2026-09-14 | `feature/ux-flow-and-ai-indicators` | UX-1, UX-2 | AI processing banners + button spinners on extract/parse/match/generate-email; 5-step flow stepper + next-action callout on application detail. |
| 2026-09-14 | `feature/ux-flow-and-ai-indicators` | UX-3 | Auth-scoped media API; screenshot preview on application detail + upload page; resume preview in Settings; attachment chip on send panel. |
| 2026-09-14 | `feature/ux-flow-and-ai-indicators` | UX-4 | Dashboard card thumbnails, prominent match score badges, improved empty state, mobile filter scroll. |
| | | | |
| | | | |

---

## Out of scope (for now)

- Full redesign / new color system
- Animations beyond subtle CSS transitions
- Browser extension or mobile share (Phase 4 product roadmap)
- AI email validation UI (separate feature track)

---

## How agents should use this doc

1. Read this before any UX work.
2. Pick the next unstarted phase/task.
3. After merging, add a row to **Change log** and update `docs/15-PROGRESS.md`.

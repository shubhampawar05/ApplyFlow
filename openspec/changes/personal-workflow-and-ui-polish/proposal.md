# Proposal

## Why

ApplyFlow is now a personal tool used regularly, and three things get in the way of daily use:
- The send flow can deliver the same email twice: after a double-click, or when Gmail succeeds but the database save fails and the user retries.
- Nothing reminds the user to follow up once an email has been sent.
- The UI is functional but hard to scan. The dashboard has no search or sort, the application page hides the screenshot while you review it, and the styling (Arial, uneven spacing) feels unfinished.

## What Changes

- **Safe single send**: claim an application for sending before calling Gmail, so two concurrent requests can never both reach Gmail. If the result of a send is unknown, the application is held in a visible "send outcome unknown" state that the user resolves explicitly, instead of offering a retry that would send again.
- **Follow-up reminders (in-app only)**: each sent application gets a follow-up date (7 days after sending by default). The user can change the date, clear it, or mark the follow-up done. The dashboard shows a "Follow-ups due" section. No follow-up emails are generated or sent automatically.
- **Dashboard search and sort**: search by company or title; sort by last updated, date created, or match score; a "Needs action" filter that combines unfinished drafts and due follow-ups. Filter state is kept in the URL.
- **Application page layout**: on wide screens, a two-column workspace with the job screenshot and key job facts in a sticky side rail, visible while reviewing, matching and writing the email. Mobile stays single-column.
- **Visual refresh**: a proper font, plus type-scale and spacing tokens, consistent card, button and form states, and visible focus rings. The existing calm green palette and plain-CSS approach stay.
- Docs: record that follow-up reminders start early (they were planned for Phase 4), and bring the progress doc up to date.

Guardrails:
- **Email sending**: tightened. Explicit confirmation is still required and duplicate sends become impossible. Follow-ups are reminders only and never send anything.
- **AI output**: unchanged. No new AI calls.
- **Auth**: unchanged. All new queries and endpoints stay scoped to the signed-in user, with ownership checks.
- **File access**: the side rail reuses the existing auth-scoped media route. No new public URLs.

## Capabilities

### New Capabilities
- `application-sending`: explicit, single-delivery sending of an application email, including how concurrent and unknown-outcome sends are handled.
- `follow-up-reminders`: follow-up dates on sent applications and how they appear and are resolved.
- `application-dashboard`: listing, searching, sorting and filtering the user's applications, including the "Needs action" and follow-up views.
- `application-workspace`: layout and navigation of a single application's detail page.
- `visual-design-system`: shared visual tokens and interaction states (type, spacing, focus, buttons, cards) used across the app.

### Modified Capabilities
- None. There are no existing specs.

## Impact

- **Database**: new `SENDING` application status, plus new `followUpAt` and `followUpCompletedAt` columns on `Application`. One Prisma migration, with no new tables, so row-level security is unchanged.
- **Code**:
  - Sending: `src/features/applications/application-send.service.ts` and `application.repository.ts`.
  - Status, flow and schemas: `application-status.service.ts`, `application-flow-state.ts` and `application.schemas.ts`.
  - Dashboard: `src/app/dashboard/*`.
  - Application page: `src/app/applications/[id]/*`.
  - Styling and layout: `src/app/globals.css`, `src/app/layout.tsx` and shared components in `src/components/`.
- **APIs**:
  - New `PATCH /api/applications/:id/follow-up` and `POST /api/applications/:id/send-outcome` (resolves an unknown send).
  - `GET /api/applications` gains `q` and `sort` query parameters.
  - `POST /api/applications/:id/send` returns new error codes (`SEND_IN_PROGRESS`, `SEND_OUTCOME_UNKNOWN`).
- **Dependencies**: a font loaded via `next/font`. No new npm packages.
- **Docs to update**:
  - `docs/07-API.md`: new endpoints and error codes.
  - `docs/06-DATABASE.md`: new status and columns.
  - `docs/12-ROADMAP.md`: follow-up reminders brought forward from Phase 4.
  - `docs/10-DESIGN-SPEC.md`: tokens and layout.
  - `docs/11-USER-FLOWS.md`: the unknown-send-outcome flow.
  - `docs/15-PROGRESS.md`: also add the missing PRs #16–#20.

## Out of scope

- Generating or sending follow-up emails, and notifications outside the app (email, push or calendar).
- AI claim validation, the "applied via link" path, rate limits, Gmail disconnect and data deletion. Each gets its own change.
- Dark mode, migrating to Tailwind/shadcn, or a full redesign.
- Public landing page and SEO.
- Pagination beyond a raised list limit.

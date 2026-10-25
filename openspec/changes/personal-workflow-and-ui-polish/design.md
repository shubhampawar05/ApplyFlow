# Design

## Context

Motivation and scope are in `proposal.md`, and behaviour is in `specs/`. Current state that shapes the approach:

- **Sending** (`applications` module, `application-send.service.ts`): reads the status, calls Gmail, then runs `recordSuccessfulEmailDelivery`, which updates `where: { id }` without re-checking the status. Nothing claims the application before the Gmail call.
- **Gmail errors** (`integrations` module, `gmail.adapter.ts` / `gmail.service.ts`):
  - Connection and token problems are raised before any send attempt.
  - Any non-OK HTTP response becomes `GMAIL_SEND_FAILED`.
  - Network errors and timeouts also become `GMAIL_SEND_FAILED`, so the caller can't tell "rejected" from "unknown".
- **Post-send UI bug**: `application-flow-state.ts` and `applications/[id]/page.tsx` check `status === "SENT"` in several places. Applications moved on to FOLLOW_UP, INTERVIEW and so on lose their tracking panel and are shown with the send step incomplete. This change fixes it because the new SENDING state and the follow-up controls depend on a correct "sent or later" check.
- **Dashboard**: `listApplicationsForUser` supports a status filter only, ordered by `updatedAt`, with a limit of 20. Filter chips are `<Link>`s that set `?status=`.
- **Styling**:
  - `globals.css` is a single file of one-line rules with a small set of colour tokens.
  - The font is Arial.
  - The tech spec names Tailwind/shadcn, but the app uses plain CSS.

## Goals / Non-Goals

**Goals:**
- Make double delivery impossible at the database level, not only through UI button-disabling.
- Keep the new logic in existing modules: sending, follow-ups and dashboard queries in `applications`, error classification in `integrations/gmail`.
- Reuse existing patterns: `ApplicationEvent` for history, the media route for images, URL search params for dashboard state.

**Non-Goals:**
- No background jobs or cron. "Due" is computed when the page is read.
- No move to Tailwind or a component library. The plain-CSS conflict with `docs/05-TECHNICAL-SPEC.md` is noted in the docs update, not resolved here.
- No new tables.

## Decisions

### 1. Claim the send with a conditional update and a SENDING status
- Add `SENDING` to the `ApplicationStatus` enum, plus `sendStartedAt DateTime?` and `sendOutcomeUnknown Boolean @default(false)` on `Application`.
- **Claim**: `prisma.application.updateMany({ where: { id, userId, status: "READY" }, data: { status: "SENDING", sendStartedAt: now, sendOutcomeUnknown: false } })`. A `count` of 0 means another request won the race. Re-read the status to return `SEND_IN_PROGRESS`, `ALREADY_SENT` or `NOT_READY`.
- **Success**: in one transaction, create the `EmailDelivery`, update `where { id, status: "SENDING" }` to SENT with the follow-up date, and add an event.
- **Definite failure**: `updateMany` back to READY `where status = SENDING`.
- **Unknown outcome**: set `sendOutcomeUnknown = true`. If even that write fails, the stale-claim rule below still catches it.
- **Stale claim**: a SENDING row with `sendStartedAt` older than 2 minutes is treated as unknown when read. This covers a serverless function killed mid-call. The app derives this when reading; no job is needed.

*Alternatives considered:*
- **Postgres advisory lock / `SELECT … FOR UPDATE` around the Gmail call**: holds a transaction open across a network call and still doesn't solve "Gmail succeeded, DB failed".
- **Idempotency key passed to Gmail**: the Gmail API has no idempotency key for `messages.send`.
- **Client-side disabling only**: doesn't protect against retries or a second tab.

### 2. Split Gmail errors into "rejected" and "unknown"
- In `gmail.adapter.ts`, a 4xx response (other than 429) becomes `GMAIL_SEND_REJECTED`, which is definite.
- 429, 5xx, network errors and timeouts become `GMAIL_SEND_UNKNOWN`.
- Errors before the HTTP call (missing connection, token refresh) stay definite.
- The send service maps:
  - definite errors → release to READY;
  - unknown errors → mark the outcome unknown;
  - a DB failure after a message id is returned → mark the outcome unknown.
- 429 is treated as unknown to stay safe. In practice Gmail does not send on 429, but marking it unknown only costs the user one click.

### 3. Resolve endpoint
- `POST /api/applications/:id/send-outcome`, body `{ sent: boolean }` (Zod: `z.object({ sent: z.boolean() }).strict()`).
- Allowed only when the status is SENDING and the outcome is unknown, including stale claims.
- `sent: true` → SENT, a follow-up date 7 days ahead, and a `SEND_CONFIRMED_MANUALLY` event. No `EmailDelivery` is created, because there's no provider id. The event metadata records that it was a manual confirmation, which keeps the "immutable delivery event" meaning honest.
- `sent: false` → READY, with a `SEND_MARKED_NOT_SENT` event.

### 4. Follow-up fields on Application
- Add `followUpAt DateTime?` and `followUpCompletedAt DateTime?` to `Application`.
- **Due** means: `followUpAt <= end of today`, `followUpCompletedAt` is null, and the status is SENT or FOLLOW_UP.
- `PATCH /api/applications/:id/follow-up` takes this Zod discriminated union:
  ```ts
  z.discriminatedUnion("action", [
    z.object({ action: z.literal("reschedule"), followUpAt: z.coerce.date() }),
    z.object({ action: z.literal("complete") }),
    z.object({ action: z.literal("clear") }),
  ])
  ```
  The service checks that `followUpAt` is today or later, comparing calendar dates in the user's browser time zone. The client sends a date-only string, and the server stores it as midnight UTC of that date.
- Each action writes an `ApplicationEvent` (`FOLLOW_UP_RESCHEDULED`, `FOLLOW_UP_COMPLETED`, `FOLLOW_UP_CLEARED`).
- Moving the status to FOLLOW_UP does not complete the reminder automatically. The status describes the job; the reminder is the user's to-do.

*Alternative:* a separate `FollowUp` table. Rejected because there's one reminder per application, and a table adds RLS, a migration and a join for no gain.

### 5. Dashboard query parameters
- Extend `applicationListQuerySchema` with:
  - `q: z.string().trim().max(100).optional()`
  - `sort: z.enum(["updated", "created", "match"]).catch("updated")`
  - `view: z.enum(["needs-action"]).optional()`
- Invalid values fall back to the defaults via `.catch`.
- Search uses `OR` on `job.company` and `job.title` with `contains` and `mode: "insensitive"`. The data is small, so no new index is needed.
- Match sort uses `orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }]`.
- The list limit goes from 20 to 50.
- "Follow-ups due" is a separate small query, run alongside the list query.
- Search is a GET `<form>` with a native search input, so it works without JavaScript. Sort is a `<select>` inside the same form. Status chips keep the other parameters when building their links.

### 6. Workspace layout
- `ApplicationFlowShell` gets a `rail` slot, filled by a new server component `ApplicationContextRail` that reuses `ApplicationScreenshotPreview` and `MatchScoreBadge`.
- CSS grid: `minmax(0, 1fr) 320px` at 1024px and wider, with the rail `position: sticky`. Below 1024px the rail renders as a `<details>` summary above the step.
- The full-size screenshot uses a native `<dialog>` (`showModal()`), which gives Escape handling and focus return without a new library.
- The screenshot is removed from the extract-review panel, since the rail shows it.

### 7. Visual system
- Load the **Inter** variable font with `next/font/google` in `layout.tsx` (`display: "swap"`), falling back to `system-ui`.
- Split `globals.css` into readable multi-line rules and add tokens:
  - type scale: `--text-xs` to `--text-2xl`;
  - spacing: `--space-1` to `--space-8`;
  - `--radius-sm/md/lg`, `--shadow-sm/md` and `--focus-ring`.
  This is still one file; the split into readable rules is for maintainability.
- Darken `--muted` if needed to reach 4.5:1 on `--canvas` and `--surface`. Currently `#6a6d67` on `#f7f7f5` is about 5.0:1, so it passes; check `#555953` usages too.
- Add `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }` globally.
- Add a `.button.send` variant for the send action.
- Add `@media (prefers-reduced-motion: reduce)` to turn off transitions.

### 8. Shared "sent or later" helper
Add `isSentOrLater(status)` in `application.schemas.ts`, built from `postSendStatuses`. Replace the `=== "SENT"` checks in `application-flow-state.ts` and `applications/[id]/page.tsx` with it. SENDING is not "sent".

## Risks / Trade-offs

- **[Risk] Stale-claim window**: a send whose Gmail call is still running after 2 minutes could be shown as unknown while it's in flight. → The window is well beyond Gmail's normal latency and the route's max duration. The user can only resolve it manually and nothing retries, so the worst case is a confusing banner, not a double send.
- **[Risk] Manual "It was sent" confirmation has no Gmail message id.** → The event metadata records that it was a manual confirmation, and the timeline wording says "Marked as sent by you".
- **[Trade-off] 429 treated as unknown** → slightly more manual resolutions in exchange for no chance of a duplicate.
- **[Risk] Adding an enum value in Postgres** (`ALTER TYPE … ADD VALUE`) can't run inside a transaction on older Postgres. → Supabase runs Postgres 15+, so this is fine, and Prisma generates it as a separate statement. Check the generated SQL before applying.
- **[Risk] Inter via `next/font/google` needs network access at build time.** → Vercel builds have it. If an offline build fails, switch to the `system-ui` stack.
- **[Trade-off] The `globals.css` reformat creates a large diff.** → Do it in its own commit before the visual changes, so reviews stay readable.

## Migration Plan

1. One Prisma migration: add the `SENDING` enum value; add `sendStartedAt`, `sendOutcomeUnknown`, `followUpAt` and `followUpCompletedAt` to `Application`. No new tables, so RLS is unchanged. No new secrets or OAuth scopes.
2. Backfill `followUpAt = sentAt + 7 days` (from `EmailDelivery`) for existing applications with status SENT or FOLLOW_UP, so current sends start reminding.
3. Deploy. Rollback: no SENDING rows can exist before deploy, and the new columns are nullable or defaulted, so rolling back the code is safe. If any SENDING rows exist at rollback, set them to READY by hand after checking Gmail.

## Open Questions

- Whether the 7-day default follow-up should become a user setting later. This doesn't affect the current specs or tasks.

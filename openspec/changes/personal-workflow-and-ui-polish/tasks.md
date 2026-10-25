# Tasks

## 1. Docs first (requirements change)

- [x] 1.1 Update `docs/12-ROADMAP.md` to say follow-up reminders (in-app only) are brought forward from Phase 4, and `docs/11-USER-FLOWS.md` with the unknown-send-outcome flow; verify both files mention SENDING and follow-ups
- [x] 1.2 Update `docs/06-DATABASE.md` with the `SENDING` status and the `sendStartedAt`, `sendOutcomeUnknown`, `followUpAt` and `followUpCompletedAt` columns; verify the field list matches design.md decisions 1 and 4

## 2. Data model

- [x] 2.1 Add the `SENDING` enum value and the four new `Application` columns to `prisma/schema.prisma`, run `npm run db:migrate` to create the migration, and verify the SQL adds no tables (so RLS is unchanged) and runs the enum change as its own statement
- [x] 2.2 Add the follow-up backfill (`followUpAt = EmailDelivery.sentAt + 7 days` for SENT/FOLLOW_UP rows) to the migration SQL; verify on a local DB that existing sent applications get a date
- [x] 2.3 Add `SENDING` to `applicationStatusSchema` and an `isSentOrLater` helper in `application.schemas.ts`; verify with unit tests that SENDING is not sent and that every post-send status is

## 3. Safe single send

- [x] 3.1 Split Gmail adapter errors into `GMAIL_SEND_REJECTED` (4xx except 429) and `GMAIL_SEND_UNKNOWN` (429, 5xx, network, timeout); verify with `tests/unit/gmail.adapter.test.ts` cases for 400, 429, 500 and a thrown fetch
- [x] 3.2 Add repository functions to claim a send (`updateMany` READY→SENDING), release it (SENDING→READY), mark the outcome unknown, and record success with a `status = SENDING` guard, setting `followUpAt` to 7 days ahead; verify with unit tests on a mocked Prisma that a claim count of 0 is reported as lost
- [x] 3.3 Rework `application-send.service.ts` to claim before Gmail, release on definite failure, and mark unknown on unknown failure or a DB error after Gmail success. Keep the `CONFIRMATION_REQUIRED` check first and return `SEND_IN_PROGRESS`, `SEND_OUTCOME_UNKNOWN` or `ALREADY_SENT` when the claim is lost. Verify in `tests/unit/application-send.service.test.ts` that:
  - two concurrent calls make one Gmail call;
  - no confirmation means no Gmail call;
  - a rejected send returns to READY;
  - an unknown error stays SENDING;
  - a DB failure after send is marked unknown.
- [x] 3.4 Treat a SENDING claim older than 2 minutes as unknown when the application is read; verify with a unit test using a fixed clock
- [x] 3.5 Add a `resolveSendOutcomeForUser` service and the `POST /api/applications/:id/send-outcome` route (Zod `{ sent: boolean }`, owner-scoped, `NOT_RESOLVABLE` otherwise, with events). Verify with tests for sent, not-sent, the wrong state, another user's application (`NOT_FOUND`) and an unauthenticated request.
- [x] 3.6 Document the new send error codes and the send-outcome endpoint in `docs/07-API.md`; verify the codes match the service

## 4. Follow-up reminders

- [x] 4.1 Add the follow-up service and `PATCH /api/applications/:id/follow-up` with the Zod discriminated union (reschedule, complete, clear), the today-or-later check, the sent-or-later check (`FOLLOW_UP_NOT_AVAILABLE`), owner scoping and events. Verify with unit tests covering each action, a past date, invalid input, a draft application and another user's application.
- [x] 4.2 Add an `isFollowUpDue` domain helper (excluding INTERVIEW, OFFER, REJECTED and CLOSED) and a `listDueFollowUpsForUser` repository query; verify with unit tests at the end-of-day boundary and for closed statuses
- [x] 4.3 Document the follow-up endpoint in `docs/07-API.md`; verify the request and response shapes match the schema

## 5. Fix "sent or later" handling

- [x] 5.1 Replace the `status === "SENT"` checks in `application-flow-state.ts` and `applications/[id]/page.tsx` with `isSentOrLater`; verify with `tests/unit/application-flow-state.test.ts` that an INTERVIEW application shows the send step complete and the tracking panel present

## 6. Dashboard search, sort, needs-action and follow-ups due

- [x] 6.1 Extend `applicationListQuerySchema` with `q`, `sort` and `view` (using `.catch` fallbacks) and `listApplicationsForUser` with insensitive search, the sort options (match nulls last), the needs-action filter and a limit of 50. Verify with schema unit tests for invalid values and a repository test that the `userId` scope is always applied.
- [x] 6.2 Pass the new parameters through `GET /api/applications` and document them in `docs/07-API.md`; verify with a route test for an invalid sort falling back to updated
- [ ] 6.3 Build the dashboard search form (GET, native search input, sort select) and make the status chips keep `q`/`sort`, adding a "Needs action" chip. Verify by running the app that reload and back keep the state, and that the no-match state offers to clear the search.
- [ ] 6.4 Add the "Follow-ups due" section (oldest first, days overdue, hidden when empty) and a "Check send" badge on unknown-outcome cards; verify in the running app with a seeded overdue application

## 7. Application workspace

- [ ] 7.1 Add a `rail` slot to `ApplicationFlowShell` and build `ApplicationContextRail`, showing the screenshot, company, title, recipient ("Not found" when empty), match, status and follow-up. Make it sticky at 1024px and wider and a `<details>` summary below that. Remove the duplicate screenshot from the extract-review panel. Verify in the running app at 1280px and 375px with no horizontal scroll.
- [ ] 7.2 Add the full-size screenshot `<dialog>` (opens from the thumbnail, closes on Escape, focus returns); verify by keyboard in the running app
- [ ] 7.3 Add the unknown-send-outcome banner, with "It was sent" and "It was not sent" calling the send-outcome endpoint, replacing the send button; verify in the running app with a seeded SENDING application
- [ ] 7.4 Add follow-up controls (date picker, mark done, clear) next to the status panel for sent-or-later applications; verify in the running app that each action updates the page and adds a timeline entry

## 8. Visual refresh

- [x] 8.1 Reformat `globals.css` into readable multi-line rules with no visual change, in its own commit; verify by comparing dashboard and application screenshots before and after
- [x] 8.2 Load Inter with `next/font/google` (`system-ui` fallback) in `layout.tsx` and add the type, spacing, radius, shadow and focus tokens; verify that pages render in Inter with no hard-coded hex colours added outside `:root`
- [ ] 8.3 Apply the tokens to the shell, cards, buttons, inputs and chips. Add global `:focus-visible` rings, a distinct `.button.send` variant, consistent disabled and loading states, and `prefers-reduced-motion` handling. Verify by tabbing through the dashboard and application page, and check muted-text contrast is at least 4.5:1.
- [x] 8.4 Update `docs/10-DESIGN-SPEC.md` with the tokens, the workspace layout, and a note that plain CSS is used instead of the Tailwind/shadcn named in `docs/05-TECHNICAL-SPEC.md`; verify both docs are consistent

## 9. Integration check

- [ ] 9.1 Walk through the full flow by hand in the running app: upload → extract → match → email → send (with a double-click on send) → follow-up shows 7 days ahead → reschedule → dashboard search and sort → needs-action; verify exactly one Gmail message in Sent
- [x] 9.2 Update `docs/15-PROGRESS.md` with this change and the missing PRs #16–#20; verify the "Last updated" date is current
- [x] 9.3 Run `npm run lint`, `npm run typecheck` and `npm test`; verify all pass

## Workflow follow-up

- Playwright coverage for the send journey is not in this change: the project has no Playwright config or test-auth harness yet, and Google sign-in can't be automated safely. Propose a separate change to add a test-only auth setup and e2e tests for explicit send and unknown-outcome resolution.
- Archive the change with `/opsx:archive` after review.

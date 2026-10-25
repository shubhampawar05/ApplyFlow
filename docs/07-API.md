# API Specification

## Routes
POST /api/resumes
POST /api/resumes/:id/parse
PATCH /api/resumes/:id/profile
POST /api/jobs/screenshot
POST /api/jobs/:id/extract
PATCH /api/jobs/:id
POST /api/applications/:id/match
POST /api/applications/:id/generate-email
PATCH /api/applications/:id/email
POST /api/applications/:id/send
POST /api/applications/:id/send-outcome
GET /api/applications
PATCH /api/applications/:id/status
PATCH /api/applications/:id/follow-up
GET /api/media/:type/:resourceId

## Response convention
Success responses return `{ data }`.
Errors return `{ error: { code, message, details? } }`.

## Validation
All request bodies, query parameters, route parameters, and uploaded metadata must be validated.

## Authorization
Every application/resource query must be scoped to the authenticated user.
Never trust a user-supplied resource ID without ownership verification.

## Private media
`GET /api/media/:type/:resourceId` streams auth-scoped files for in-app previews.
Supported types: `job-screenshot` (resource ID = job ID), `resume` (resource ID = resume ID).
Responses use `Cache-Control: private, no-store`.

## Send endpoint
The send endpoint must verify application readiness, recipient validity, selected resume, Gmail connection, and explicit send authorization before invoking Gmail.
The selected resume file is attached to the outgoing message as its original uploaded PDF or DOCX.

### Single send
Before calling Gmail, the endpoint atomically moves the application from READY to SENDING. Only the request that wins this claim calls Gmail.
- A definite Gmail rejection returns the application to READY.
- An unclear outcome (Gmail 429/5xx, network failure, or the delivery could not be saved after Gmail accepted it) keeps it in SENDING, flagged as unknown. Nothing retries automatically.
- A SENDING claim older than 2 minutes is treated as an unknown outcome.
- Once sending starts, the email draft can no longer be generated or edited (`EMAIL_LOCKED` from the email endpoints).

Send error codes:
| Code | HTTP | Meaning |
|------|------|---------|
| `CONFIRMATION_REQUIRED` | 400 | Body did not include `confirm: true`. Gmail is not called. |
| `NOT_FOUND` | 404 | No such application for this user. |
| `NOT_READY` | 400 | No saved draft yet. |
| `SEND_IN_PROGRESS` | 409 | Another request is sending this application right now. |
| `SEND_OUTCOME_UNKNOWN` | 409 | A previous send may or may not have gone out; resolve it with `/send-outcome`. |
| `ALREADY_SENT` | 409 | The application is SENT or later. |
| `DUPLICATE_WARNING` | 409 | Likely duplicate; resend with `acknowledgeDuplicate: true` after review. |
| `GMAIL_SEND_REJECTED` | 502 | Gmail definitely rejected the message; the application is READY again. |
| `GMAIL_SEND_FAILED` | 502 | Sending could not start; the application is READY again. |

### Send outcome
`POST /api/applications/:id/send-outcome` with body `{ "sent": true | false }` resolves an unknown send outcome. It never calls Gmail.
- `sent: true`: the application becomes SENT with a follow-up date 7 days ahead, and a `SEND_CONFIRMED_MANUALLY` event is recorded (no delivery record, because there is no Gmail message id).
- `sent: false`: the application returns to READY, and a `SEND_MARKED_NOT_SENT` event is recorded.
- Errors: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `NOT_RESOLVABLE` (409, the application is not in SENDING with an unknown outcome).

### Follow-up
`PATCH /api/applications/:id/follow-up` manages the in-app follow-up reminder of a sent application. It never drafts or sends email.
Body (one of):
- `{ "action": "reschedule", "followUpAt": "YYYY-MM-DD" }`: sets the date (today or later) and clears "done".
- `{ "action": "complete" }`: marks the follow-up done.
- `{ "action": "clear" }`: removes the follow-up date.

Response: `{ data: { application: { id, status, followUpAt, followUpCompletedAt, updatedAt } } }`.
Each action records an `ApplicationEvent` (`FOLLOW_UP_RESCHEDULED`, `FOLLOW_UP_COMPLETED`, `FOLLOW_UP_CLEARED`).
Errors: `VALIDATION_ERROR` (400), `INVALID_FOLLOW_UP_DATE` (400, date in the past), `NOT_FOUND` (404), `FOLLOW_UP_NOT_AVAILABLE` (409, not sent yet).
A follow-up is due when its date has passed, it is not done, and the status is SENT or FOLLOW_UP.

### Application list
`GET /api/applications` query parameters (all optional; invalid values fall back to defaults instead of erroring):
- `q`: search text matched case-insensitively against company and title. Trimmed and capped at 100 characters.
- `sort`: `updated` (default), `created`, or `match` (highest match score first, unscored last).
- `status`: one `ApplicationStatus` value.
- `view`: `needs-action` lists DRAFT, ANALYZED, READY and SENDING applications plus sent applications with a due follow-up.
- `limit`: 1–50, default 50.

Results are always scoped to the signed-in user.

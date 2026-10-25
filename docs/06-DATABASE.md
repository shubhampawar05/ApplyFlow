# Database Specification

## Core entities
User, Resume, ResumeProfile, Job, Application, GeneratedEmail, EmailDelivery, ApplicationEvent, OAuthConnection, AIRequest.

## Relationships
A user is linked to exactly one Supabase Auth user via `authUserId`.
A user owns resumes and jobs.
A job may have one active application in MVP.
An application references the resume used and may contain generated emails and delivery events.

## Constraints
Emails must be normalized before duplicate checks.
Application status changes must create events.
Provider message IDs must be unique when present.
OAuth secrets must never be stored in plaintext.

## Application send and follow-up fields
`ApplicationStatus` includes `SENDING`: a claim taken atomically (READY -> SENDING) before calling Gmail so only one request can send.
- `sendStartedAt`: when the current send claim was taken. A SENDING claim older than 2 minutes is treated as an unknown outcome.
- `sendOutcomeUnknown`: true when Gmail may or may not have sent the message; the user resolves it manually.
- `followUpAt`: date the user should follow up (defaults to 7 days after send).
- `followUpCompletedAt`: when the user marked the follow-up done.

## JSON fields
Use JSON only for provider/AI payloads whose structure is intentionally flexible.
Core queryable fields remain typed columns.

## Migrations
All schema changes use Prisma migrations.
Never edit production schema manually without a corresponding migration.

# Database Specification

## Core entities
User, Resume, ResumeProfile, Job, Application, GeneratedEmail, EmailDelivery, ApplicationEvent, OAuthConnection, AIRequest.

## Relationships
A user owns resumes and jobs.
A job may have one active application in MVP.
An application references the resume used and may contain generated emails and delivery events.

## Constraints
Emails must be normalized before duplicate checks.
Application status changes must create events.
Provider message IDs must be unique when present.
OAuth secrets must never be stored in plaintext.

## JSON fields
Use JSON only for provider/AI payloads whose structure is intentionally flexible.
Core queryable fields remain typed columns.

## Migrations
All schema changes use Prisma migrations.
Never edit production schema manually without a corresponding migration.

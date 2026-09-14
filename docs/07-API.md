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
GET /api/applications
PATCH /api/applications/:id/status

## Response convention
Success responses return `{ data }`.
Errors return `{ error: { code, message, details? } }`.

## Validation
All request bodies, query parameters, route parameters, and uploaded metadata must be validated.

## Authorization
Every application/resource query must be scoped to the authenticated user.
Never trust a user-supplied resource ID without ownership verification.

## Send endpoint
The send endpoint must verify application readiness, recipient validity, selected resume, Gmail connection, and explicit send authorization before invoking Gmail.

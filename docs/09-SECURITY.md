# Security and Privacy Specification

## Authentication
Use secure OAuth/session handling and server-side authorization checks.
Protect all application routes and scope data by authenticated user ID.

## Gmail
Request the minimum OAuth scopes required.
Store refresh/access credentials encrypted and never expose them to browser code or logs.

## Files
Resume and screenshot files are private.
Use signed, short-lived access URLs when the browser needs temporary access.

## AI privacy
Send only the minimum required data to the AI provider.
Do not include OAuth credentials or unrelated personal data in AI requests.

## Threats
Account takeover, token leakage, IDOR, malicious uploads, prompt injection from screenshots, accidental email sending, and provider outages must be explicitly tested.

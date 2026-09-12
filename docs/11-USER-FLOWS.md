# User Flow Specification

## First setup
Google login -> upload resume -> parse profile -> review profile -> connect Gmail -> dashboard.

## Application flow
Dashboard -> New Application -> upload/paste screenshot -> AI extraction -> Job Review -> Match -> Email Draft -> Email Review -> Send Confirmation -> Gmail Send -> Application Detail.

## Failure flow
If extraction fails, save the original upload and allow retry/manual entry.
If Gmail fails, keep the application READY and preserve the drafted email.
If validation fails, block sending and explain the correction required.

## Status flow
DRAFT -> ANALYZED -> READY -> SENT.
After SENT, user may move the application to FOLLOW_UP, INTERVIEW, REJECTED, OFFER, or CLOSED.

## Duplicate flow
Before sending, compare normalized company/title/email against recent applications and warn about likely duplicates.

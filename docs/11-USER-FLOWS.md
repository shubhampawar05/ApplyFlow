# User Flow Specification

## First setup
Google login -> upload resume -> parse profile -> review profile -> connect Gmail -> dashboard.

## Application flow
Dashboard -> New Application -> upload/paste screenshot -> AI extraction -> Job Review -> Match -> Email Draft -> Email Review -> Send Confirmation -> Gmail Send -> Application Detail.

## Failure flow
If extraction fails, save the original upload and allow retry/manual entry.
If Gmail definitely rejects the message, return the application to READY and preserve the drafted email.
If the send outcome is unknown (timeout, Gmail 5xx/429, or the delivery could not be saved), keep the application in SENDING, show a "check your Gmail Sent folder" banner, and let the user mark it as sent or not sent. Never retry automatically.
If validation fails, block sending and explain the correction required.

## Status flow
DRAFT -> ANALYZED -> READY -> SENDING -> SENT.
SENDING is a short-lived claim taken before calling Gmail so only one request can send; it returns to READY on a definite failure.
After SENT, user may move the application to FOLLOW_UP, INTERVIEW, REJECTED, OFFER, or CLOSED.

## Duplicate flow
Before sending, compare normalized company/title/email against recent applications and warn about likely duplicates.

## Follow-up flow
A successful send sets a follow-up date 7 days later.
The user can reschedule, clear, or mark the follow-up done from the application page.
Due follow-ups appear on the dashboard under "Follow-ups due" and in the "Needs action" filter.
Reminders are in-app only: no follow-up email is drafted or sent, and nothing is sent outside the app.
Applications moved to INTERVIEW, OFFER, REJECTED, or CLOSED stop showing as due.

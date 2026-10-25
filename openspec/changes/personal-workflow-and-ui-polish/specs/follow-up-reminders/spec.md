# Spec Delta

## Purpose

Reminds the user, inside ApplyFlow, when a sent application is due a follow-up, without ever drafting or sending a follow-up message automatically.

## ADDED Requirements

### Requirement: Default follow-up date on send
When an application becomes SENT, the system SHALL set its follow-up date to 7 days after the send time.

#### Scenario: Successful send sets a follow-up date
- **WHEN** an application is sent successfully on a given day
- **THEN** its follow-up date is 7 days later and it is not marked done

#### Scenario: Manually confirmed send sets a follow-up date
- **WHEN** the user resolves an unknown send outcome as sent
- **THEN** the follow-up date is 7 days after the time of that confirmation

### Requirement: User manages the follow-up
The owner of a sent application SHALL be able to change its follow-up date, clear it, or mark the follow-up done. Each change SHALL be recorded as a timeline event.

#### Scenario: Change the date
- **WHEN** the user sets a new follow-up date that is today or later
- **THEN** the application shows the new date and the timeline records the change

#### Scenario: Mark the follow-up done
- **WHEN** the user marks the follow-up done
- **THEN** the application records when it was done, no longer appears as due, and the timeline records it

#### Scenario: Clear the follow-up
- **WHEN** the user clears the follow-up date
- **THEN** the application has no follow-up date and never appears as due

#### Scenario: Invalid date
- **WHEN** the user submits a date in the past or a value that is not a date
- **THEN** the system rejects it with a validation error and leaves the follow-up unchanged

### Requirement: Follow-up only for sent applications
The system SHALL only allow follow-up changes for applications that have been sent (status SENT or later).

#### Scenario: Draft application
- **WHEN** the user tries to set a follow-up on an application in DRAFT, ANALYZED, READY or SENDING
- **THEN** the system rejects it with error code `FOLLOW_UP_NOT_AVAILABLE`

### Requirement: Closed applications stop reminding
The system SHALL NOT show an application as follow-up due when its status is INTERVIEW, OFFER, REJECTED or CLOSED.

#### Scenario: Rejected before the date
- **WHEN** an application with a future follow-up date is moved to REJECTED
- **THEN** it does not appear in follow-ups due, even after the date passes

### Requirement: Follow-ups are reminders only
The system SHALL NOT generate, draft or send any follow-up email, and SHALL NOT notify the user outside the app.

#### Scenario: Follow-up date passes
- **WHEN** an application's follow-up date passes
- **THEN** the only effect is that it appears as due in the app; no email is drafted or sent and no external notification is sent

### Requirement: Follow-up changes are owner-scoped
Follow-up changes SHALL succeed only for the signed-in owner of the application.

#### Scenario: Another user's application
- **WHEN** a signed-in user changes the follow-up of an application they do not own
- **THEN** the system responds `NOT_FOUND` and changes nothing

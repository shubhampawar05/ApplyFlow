# Spec Delta

## Purpose

Guarantees that an application email reaches Gmail only once, only after explicit user confirmation, and that an unclear send result is surfaced to the user instead of being retried silently.

## ADDED Requirements

### Requirement: Explicit confirmation before sending
The system SHALL NOT call Gmail for an application unless the send request carries an explicit confirmation from the user.

#### Scenario: Request without confirmation
- **WHEN** a send request arrives without the confirmation flag set to true
- **THEN** the system rejects it with error code `CONFIRMATION_REQUIRED`, makes no Gmail call, and leaves the application status unchanged

### Requirement: Single send claim
The system SHALL atomically move an application from READY to SENDING before calling Gmail, and SHALL call Gmail only if that move succeeded for this request.

#### Scenario: Two concurrent send requests
- **WHEN** two confirmed send requests for the same READY application arrive at the same time
- **THEN** exactly one request reaches Gmail, and the other is rejected with error code `SEND_IN_PROGRESS` without calling Gmail

#### Scenario: Send requested while already sending
- **WHEN** a confirmed send request arrives for an application in status SENDING
- **THEN** the system rejects it with error code `SEND_IN_PROGRESS` and makes no Gmail call

#### Scenario: Send requested after success
- **WHEN** a confirmed send request arrives for an application in status SENT or any later status
- **THEN** the system rejects it with error code `ALREADY_SENT` and makes no Gmail call

### Requirement: Successful send is recorded once
On a successful Gmail send, the system SHALL record exactly one delivery with the Gmail message id, move the application from SENDING to SENT, and record a status event.

#### Scenario: Gmail accepts the message
- **WHEN** Gmail returns a message id for a claimed send
- **THEN** one delivery record exists for that message id, the application status is SENT, and the timeline shows the send

### Requirement: Definite Gmail failure releases the claim
When Gmail definitely rejects the message, the system SHALL return the application to READY so the user can try again, with the draft unchanged.

#### Scenario: Gmail rejects the request
- **WHEN** Gmail returns an error showing the message was not sent (for example an expired connection or a rejected recipient)
- **THEN** the application returns to READY, no delivery is recorded, and the user sees an error with a next step

### Requirement: Unknown send outcome is held for the user
If the system cannot confirm whether Gmail sent the message, it SHALL keep the application in SENDING, flag the outcome as unknown, and SHALL NOT allow another send until the user resolves it.

#### Scenario: Gmail succeeds but saving fails
- **WHEN** Gmail returns a message id but recording the delivery fails
- **THEN** the application stays in SENDING with an unknown-outcome flag, the user is told to check their Gmail Sent folder, and any new send request is rejected with `SEND_OUTCOME_UNKNOWN`

#### Scenario: Gmail call times out
- **WHEN** the Gmail call fails in a way that does not prove the message was not sent
- **THEN** the application stays in SENDING with an unknown-outcome flag and no automatic retry happens

### Requirement: User resolves an unknown send outcome
The system SHALL let the owner of an application with an unknown outcome mark it as sent (moving it to SENT) or as not sent (moving it to READY), and SHALL record the choice as an event.

#### Scenario: User confirms it was sent
- **WHEN** the user marks an unknown-outcome application as sent
- **THEN** the application becomes SENT, a timeline event records a manual confirmation, and no Gmail call is made

#### Scenario: User confirms it was not sent
- **WHEN** the user marks an unknown-outcome application as not sent
- **THEN** the application returns to READY and can be sent again with a new explicit confirmation

#### Scenario: Resolving when the outcome is not unknown
- **WHEN** a resolve request arrives for an application that is not in SENDING with an unknown outcome
- **THEN** the system rejects it with error code `NOT_RESOLVABLE` and changes nothing

### Requirement: Send endpoints are owner-scoped
Send and resolve requests SHALL succeed only for the signed-in owner of the application.

#### Scenario: Another user's application
- **WHEN** a signed-in user sends or resolves an application they do not own
- **THEN** the system responds as if the application does not exist (`NOT_FOUND`), makes no Gmail call, and changes nothing

#### Scenario: Signed-out request
- **WHEN** an unauthenticated request reaches the send or resolve endpoint
- **THEN** the system rejects it as unauthorized and makes no Gmail call

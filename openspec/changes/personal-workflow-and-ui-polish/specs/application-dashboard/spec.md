# Spec Delta

## Purpose

Lets the user find any of their applications quickly and see at a glance which ones need their attention, including follow-ups that are due.

## ADDED Requirements

### Requirement: Search applications
The dashboard SHALL let the user search their applications by company or job title, case-insensitively, matching any part of the text.

#### Scenario: Search by company
- **WHEN** the user searches "acme" and has applications at "Acme Corp" and "Globex"
- **THEN** only the Acme Corp application is listed

#### Scenario: No matches
- **WHEN** the search matches none of the user's applications
- **THEN** the dashboard shows a "no matching applications" message with a way to clear the search, not the first-run empty state

#### Scenario: Over-long or unusual input
- **WHEN** the search text is longer than 100 characters or contains only whitespace
- **THEN** the system trims or ignores it instead of failing

### Requirement: Sort applications
The dashboard SHALL let the user sort by last updated (default), date created, or match score. Applications without a match score SHALL appear after scored ones.

#### Scenario: Sort by match score
- **WHEN** the user sorts by match score
- **THEN** applications are listed from highest to lowest score, with unscored applications last

#### Scenario: Unknown sort value
- **WHEN** the sort parameter is not one of the supported values
- **THEN** the dashboard falls back to last updated

### Requirement: Needs-action filter
The dashboard SHALL offer a "Needs action" filter listing applications in DRAFT, ANALYZED, READY or SENDING, plus sent applications whose follow-up is due.

#### Scenario: Mixed applications
- **WHEN** the user has a READY application, a SENT application with a due follow-up, and a SENT application with a future follow-up
- **THEN** "Needs action" lists the first two and not the third

### Requirement: Follow-ups due section
The dashboard SHALL show a "Follow-ups due" section listing sent applications whose follow-up date is today or earlier and not done, oldest first. The section SHALL be hidden when none are due.

#### Scenario: One overdue follow-up
- **WHEN** an application's follow-up date was 3 days ago and is not done
- **THEN** it appears in "Follow-ups due" showing that it is 3 days overdue

#### Scenario: Nothing due
- **WHEN** no follow-ups are due
- **THEN** the "Follow-ups due" section is not shown

### Requirement: Filters live in the URL
Search, sort and filter choices SHALL be reflected in the page URL so that reloading or going back keeps them. Invalid values SHALL be ignored, not cause an error.

#### Scenario: Reload keeps state
- **WHEN** the user searches, sorts by match score, filters by Sent, and reloads
- **THEN** the same search, sort and filter are applied

#### Scenario: Tampered status value
- **WHEN** the URL contains a status value that does not exist
- **THEN** the dashboard shows all statuses instead of an error

### Requirement: Dashboard shows only the user's applications
Every dashboard list, count and search result SHALL include only the signed-in user's applications.

#### Scenario: Search across users
- **WHEN** another user has an application at "Acme Corp" and the signed-in user searches "acme"
- **THEN** the other user's application never appears in results or counts

### Requirement: Unknown send outcome is visible
Applications with an unknown send outcome SHALL be marked on the dashboard and included in "Needs action".

#### Scenario: Unresolved send
- **WHEN** an application is in SENDING with an unknown outcome
- **THEN** its card shows a "Check send" badge and it is listed under "Needs action"

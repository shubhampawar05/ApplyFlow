# Spec Delta

## Purpose

Defines how a single application's page is laid out so the user can always see the job they are working on while reviewing, matching, writing and sending.

## ADDED Requirements

### Requirement: Job context rail on wide screens
On screens at least 1024px wide, the application page SHALL show a side rail beside the current step. The rail SHALL contain the job screenshot (when one exists), company, title, recipient email, match score, status and follow-up date.

#### Scenario: Reviewing extracted fields
- **WHEN** the user is on the extract-and-review step on a wide screen
- **THEN** the screenshot is visible in the side rail next to the review form, without scrolling away from the form

#### Scenario: Job with no screenshot
- **WHEN** the application has no screenshot
- **THEN** the rail shows the job facts without an image placeholder that looks broken

#### Scenario: Unknown fields
- **WHEN** a job fact such as the recipient email is empty
- **THEN** the rail shows it as "Not found" instead of leaving it out or guessing

### Requirement: Single-column on narrow screens
Below 1024px, the page SHALL use a single column with the job facts in a collapsible summary above the current step.

#### Scenario: Phone width
- **WHEN** the page is viewed at 375px wide
- **THEN** there is no horizontal scrolling, and the job summary can be expanded and collapsed

### Requirement: Screenshot can be enlarged
The user SHALL be able to open the screenshot at full size from the rail and close it with the keyboard.

#### Scenario: Open and close the screenshot
- **WHEN** the user activates the screenshot thumbnail and then presses Escape
- **THEN** the full-size view opens, then closes, and focus returns to the thumbnail

### Requirement: Screenshot access stays private
The rail SHALL load the screenshot only through the existing owner-scoped media access. It SHALL NOT expose a public or long-lived link.

#### Scenario: Another user's screenshot link
- **WHEN** a signed-in user requests the screenshot of an application they do not own
- **THEN** the request is refused and no image data is returned

### Requirement: Send outcome banner
When an application has an unknown send outcome, the page SHALL show a prominent banner explaining the situation, with "It was sent" and "It was not sent" actions, in place of the normal send button.

#### Scenario: Unknown outcome
- **WHEN** the user opens an application in SENDING with an unknown outcome
- **THEN** the banner and both resolve actions are shown, and no send button is available

### Requirement: Follow-up controls on sent applications
Sent applications SHALL show their follow-up date on the page with controls to change it, clear it, or mark it done.

#### Scenario: Sent application
- **WHEN** the user opens a SENT application with a follow-up date
- **THEN** the date and the three follow-up controls are visible next to the status controls

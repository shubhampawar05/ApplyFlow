# PRD — Product Requirements Document

## Product promise
Turn a job screenshot into a personalized, reviewable, ready-to-send application with minimal user effort.

## MVP
- Google authentication.
- Resume upload and structured resume profile.
- Job screenshot upload.
- Vision-based job extraction.
- Editable job review.
- Resume/job match score.
- Grounded application email generation.
- Email preview and editing.
- Gmail OAuth and send.
- Application record and status history.
- Dashboard with recent applications.

## Safety requirement
The system must never send an email without an explicit user action.

## Job extraction fields
Company, title, location, employment type, experience, skills, description, salary, application email, application URL, source, deadline, confidence.

## Acceptance criteria
- A valid screenshot can create a job draft.
- Extracted fields are editable.
- Missing information is clearly marked instead of invented.
- Email claims are grounded in the selected resume/profile.
- Send requires explicit confirmation.
- A successful send creates an immutable delivery event.

## Non-goals
No mass applications, browser automation, LinkedIn automation, Instagram scraping, CAPTCHA solving, or autonomous sending in MVP.

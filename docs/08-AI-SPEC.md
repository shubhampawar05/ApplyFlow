# AI Architecture and Guardrails

## Pipeline
Screenshot -> job extraction -> validation -> resume match -> email generation -> email validation -> user review.

## AI responsibilities
AI interprets unstructured content, extracts structured fields, compares requirements, and drafts language.
Deterministic code owns authorization, persistence, state transitions, recipient validation, and sending.

## Grounding
Candidate claims must come only from the selected structured resume/profile.
Unknown job fields must remain null/unknown rather than being guessed.

## Structured outputs
Every AI operation has a Zod-compatible output contract.
Malformed output is rejected and retried or surfaced for manual correction.

## Evaluation
Maintain fixtures for clear screenshots, blurry screenshots, missing emails, ambiguous roles, multiple jobs, and misleading text.
Measure extraction accuracy, unsupported claims, and invalid recipient detection.

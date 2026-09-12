# Test Plan

## Unit
Test parsers, normalizers, match scoring, state transitions, authorization, and email validation.

## Integration
Test database repositories, AI adapters with mocked providers, object storage adapters, and Gmail adapter behavior.

## End-to-end
Cover login, resume setup, screenshot upload, extraction review, email review, explicit send, and application tracking.

## AI evaluation
Maintain fixed fixtures and expected structured fields.
Track extraction accuracy, hallucinated candidate claims, invalid emails, and failure recovery.

## Release gate
Lint, typecheck, unit tests, integration tests, and critical E2E tests must pass before release.

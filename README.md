# ApplyFlow AI

ApplyFlow AI turns a job-posting screenshot into a personalized, reviewable, ready-to-send application.

## Core workflow

Screenshot -> AI extraction -> user review -> resume matching -> email generation -> user approval -> Gmail send -> application tracking.

## First implementation target

Build only the vertical slice needed to prove the workflow end to end:
authentication, resume upload, screenshot extraction, job review, email generation, Gmail approval/send, and application persistence.

## Codex

Start by reading `AGENTS.md`, then `docs/README.md`, then the documents linked from the current task.
Use `/init` in Codex if you want Codex to regenerate its standard repository instruction scaffold; keep this repository's product rules as the source of truth.

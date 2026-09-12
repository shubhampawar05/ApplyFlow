# ApplyFlow AI Architecture

The canonical architecture is documented in `docs/04-ARCHITECTURE.md`.
The root file exists as a quick navigation point for Codex and human contributors.
The application starts as a modular monolith and separates domain logic from providers.
AI produces validated suggestions; deterministic services own state, authorization, and sending.

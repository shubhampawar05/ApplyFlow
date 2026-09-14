# Shared library instructions
Keep shared utilities framework-agnostic where practical.
Do not put feature-specific business rules into generic helpers.
Supabase Auth browser/server/middleware clients live in `src/lib/supabase`.
Private file uploads use `src/lib/storage` (S3-compatible Supabase Storage).
Use strict types and explicit error behavior.
Prefer small deterministic functions that are easy to test.

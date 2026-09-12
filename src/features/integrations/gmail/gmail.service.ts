// Purpose: isolate Gmail OAuth and email-delivery operations.
// Codex task: implement secure token handling and approved email sending.
// Verify explicit application send authorization before calling Gmail.
// Never expose OAuth credentials or provider tokens to the client.
// Map provider failures into stable domain errors.

// Purpose: normalize API error payloads into user-facing toast and inline messages.
// Constraints: pure helper only; no HTTP or React dependencies.

export type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
  };
};

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return fallback;
  }

  const error = (payload as ApiErrorPayload).error;
  if (error?.message) {
    return error.message;
  }

  if (error?.code) {
    return error.code.replaceAll("_", " ").toLowerCase();
  }

  return fallback;
}

// Purpose: build authenticated private media URLs for same-origin browser previews.
// Constraints: paths only; access control enforced by /api/media route handlers.
import type { MediaType } from "@/features/media/media.schemas";

export function mediaUrl(type: MediaType, resourceId: string) {
  return `/api/media/${type}/${resourceId}`;
}

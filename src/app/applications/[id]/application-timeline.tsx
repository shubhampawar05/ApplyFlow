// Purpose: chronological list of an application's events on the detail page.
// Constraints: presentational only; events are already owner-scoped.
type TimelineEvent = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: Date;
};

function formatEventLabel(event: TimelineEvent) {
  switch (event.type) {
    case "APPLICATION_CREATED":
      return "Application created";
    case "STATUS_CHANGED":
      return `Status changed to ${event.toStatus?.replaceAll("_", " ") ?? "updated"}`;
    case "JOB_REVIEW_SAVED":
      return "Job details reviewed and saved";
    case "MATCH_COMPLETED":
      return "Resume match completed";
    case "MATCH_SKIPPED":
      return "Resume match skipped";
    case "EMAIL_GENERATED":
      return "Email draft generated";
    case "EMAIL_SENT":
      return "Application email sent";
    case "SEND_CONFIRMED_MANUALLY":
      return "Marked as sent by you";
    case "SEND_MARKED_NOT_SENT":
      return "Marked as not sent by you";
    case "FOLLOW_UP_RESCHEDULED":
      return "Follow-up date changed";
    case "FOLLOW_UP_COMPLETED":
      return "Follow-up done";
    case "FOLLOW_UP_CLEARED":
      return "Follow-up cleared";
    default:
      return event.type.replaceAll("_", " ").toLowerCase();
  }
}

function timelineIcon(eventType: string) {
  switch (eventType) {
    case "APPLICATION_CREATED":
      return "+";
    case "STATUS_CHANGED":
      return "↻";
    case "JOB_REVIEW_SAVED":
      return "✓";
    case "MATCH_COMPLETED":
      return "◎";
    case "MATCH_SKIPPED":
      return "→";
    case "EMAIL_GENERATED":
      return "✎";
    case "EMAIL_SENT":
    case "SEND_CONFIRMED_MANUALLY":
      return "↑";
    case "SEND_MARKED_NOT_SENT":
      return "↺";
    case "FOLLOW_UP_RESCHEDULED":
    case "FOLLOW_UP_COMPLETED":
    case "FOLLOW_UP_CLEARED":
      return "⏲";
    default:
      return "•";
  }
}

export function ApplicationTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="settings-section">
      <p className="section-label">Timeline</p>
      <ol className="application-timeline">
        {events.map((event) => (
          <li key={event.id}>
            <div className="timeline-item-main">
              <span aria-hidden="true" className="timeline-icon">{timelineIcon(event.type)}</span>
              <strong>{formatEventLabel(event)}</strong>
            </div>
            <span>{event.createdAt.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

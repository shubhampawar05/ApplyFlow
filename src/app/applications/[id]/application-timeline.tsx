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
    case "MATCH_COMPLETED":
      return "Resume match completed";
    case "EMAIL_GENERATED":
      return "Email draft generated";
    case "EMAIL_SENT":
      return "Application email sent";
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
    case "MATCH_COMPLETED":
      return "◎";
    case "EMAIL_GENERATED":
      return "✎";
    case "EMAIL_SENT":
      return "↑";
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

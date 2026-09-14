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
            <strong>{formatEventLabel(event)}</strong>
            <span>{event.createdAt.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

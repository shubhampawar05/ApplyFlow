// Purpose: dashboard section listing sent applications whose follow-up date has passed.
// Constraints: presentational only; reminders link to the application, nothing is drafted or sent.
import Link from "next/link";

type FollowUpDueItem = {
  id: string;
  followUpAt: Date | null;
  job: { company: string | null; title: string | null };
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysOverdue(followUpAt: Date, now: Date = new Date()) {
  return Math.max(0, Math.floor((now.getTime() - followUpAt.getTime()) / DAY_MS));
}

function overdueLabel(days: number) {
  if (days === 0) return "Due today";
  if (days === 1) return "1 day overdue";
  return `${days} days overdue`;
}

export function FollowUpsDue({ items, now }: { items: FollowUpDueItem[]; now: Date }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="follow-ups-due" className="follow-ups-due">
      <div className="follow-ups-due-head">
        <p className="section-label" id="follow-ups-due">
          Follow-ups due
        </p>
        <span className="follow-ups-due-count">{items.length}</span>
      </div>
      <ul className="follow-ups-due-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link className="follow-up-row" href={`/applications/${item.id}#section-tracking`}>
              <span className="follow-up-row-title">
                <strong>{item.job.title ?? "Untitled role"}</strong>
                <span>{item.job.company ?? "Company not found"}</span>
              </span>
              <span className="follow-up-row-due">
                {item.followUpAt ? overdueLabel(daysOverdue(item.followUpAt, now)) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type DashboardSummary = {
  total: number;
  inProgress: number;
  sent: number;
  outcomes: number;
};

export function DashboardSummary({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="dashboard-summary">
      <div className="summary-card">
        <span className="summary-label">Total</span>
        <strong>{summary.total}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">In progress</span>
        <strong>{summary.inProgress}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">Sent / follow-up</span>
        <strong>{summary.sent}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">Interviews / offers</span>
        <strong>{summary.outcomes}</strong>
      </div>
    </div>
  );
}

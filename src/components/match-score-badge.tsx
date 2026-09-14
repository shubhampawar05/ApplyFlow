// Purpose: prominent match score pill for dashboard and application summaries.
// Constraints: presentational only; score must already be validated server-side.
function scoreTone(score: number) {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <span className={`match-score-badge match-score-${scoreTone(score)}`} title="Resume match score">
      {score}
      <span className="match-score-suffix">/100</span>
    </span>
  );
}

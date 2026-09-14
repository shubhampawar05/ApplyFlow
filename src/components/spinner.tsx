// Purpose: inline loading spinner for buttons and AI status banners.
// Constraints: presentational only; no business logic or data fetching.
export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span aria-hidden="true" className="spinner" title={label} />;
}

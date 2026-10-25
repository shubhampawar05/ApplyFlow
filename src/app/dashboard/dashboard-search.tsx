"use client";

// Purpose: dashboard search box and sort control, kept in the URL via a GET form.
// Constraints: works without JavaScript (submit button); no data fetching here.
import { useRef } from "react";
import type { DashboardQuery } from "./dashboard-query";

const sortOptions = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Date created" },
  { value: "match", label: "Match score" },
] as const;

export function DashboardSearch({ query }: { query: DashboardQuery }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action="/dashboard" className="dashboard-search" method="get" ref={formRef} role="search">
      <label className="dashboard-search-field">
        <span className="sr-only">Search by company or title</span>
        <input
          autoComplete="off"
          defaultValue={query.q ?? ""}
          maxLength={100}
          name="q"
          placeholder="Search company or title"
          type="search"
        />
      </label>
      <label className="dashboard-sort-field">
        <span className="dashboard-sort-label">Sort</span>
        <select
          defaultValue={query.sort}
          name="sort"
          onChange={() => formRef.current?.requestSubmit()}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {query.status ? <input name="status" type="hidden" value={query.status} /> : null}
      {query.view ? <input name="view" type="hidden" value={query.view} /> : null}
      <button className="button secondary" type="submit">
        Search
      </button>
    </form>
  );
}

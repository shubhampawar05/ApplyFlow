# Design and UI Specification

## Design goal
Make the path from screenshot to application feel fast, calm, and obvious.
The primary CTA is always New Application.

## Main screens
Dashboard, Applications, New Application, Job Review, Match Review, Email Review, Resume, Settings, Integrations.

## Visual language
Minimal professional SaaS interface with strong hierarchy, restrained color use, clear status badges, and accessible contrast.

## Interaction principles
Show AI progress by meaningful stages.
Every AI-generated field remains editable.
Destructive actions require confirmation.
Sending email is visually distinct and requires explicit confirmation.

## Responsive behavior
Desktop is the primary workspace; mobile must support screenshot upload, review, and approval.

## Styling approach
Styles are plain CSS classes in `src/app/globals.css`, built on shared tokens in `:root`. Tailwind is loaded (`@import "tailwindcss"`) but used only for occasional utilities such as `sr-only`; shadcn/ui is not used. This replaces the "Tailwind CSS and shadcn/ui" line in `docs/05-TECHNICAL-SPEC.md` as the current practice.

## Tokens
- Font: Inter via `next/font` (`--font-inter`), falling back to `system-ui`.
- Type scale: `--text-xs` (12), `--text-sm` (13), `--text-base` (15), `--text-lg` (18), `--text-xl` (22), `--text-2xl` (page titles).
- Spacing: `--space-1` to `--space-8` (4–48px).
- Radius: `--radius-sm/md/lg`; shadows: `--shadow-sm/md`.
- Colour: `--canvas`, `--surface`, `--ink`, `--muted`, `--line`, `--line-strong` (form borders, at least 3:1), `--accent*`, `--attention*` (things that need the user), `--send`/`--send-dark` (the send action only), `--focus-ring`.
- New colours go into `:root` as tokens; components do not add hard-coded hex values.

## Accessibility
- Every interactive element shows a 2px `:focus-visible` ring in `--focus-ring`.
- Body text meets 4.5:1 contrast; form borders and other component boundaries meet 3:1.
- Transitions and animations are minimised under `prefers-reduced-motion: reduce`.
- Disabled buttons look disabled, have no hover effect, and show their reason next to them.

## Application workspace
- At 1024px and wider, the application page is two columns: the current step on the left and a sticky job summary rail on the right (screenshot, company, role, recipient, match, status, follow-up). Unknown facts read "Not found".
- Below 1024px the rail becomes a collapsible "Job summary" above the step.
- The screenshot opens full size in a native dialog that closes with Escape and returns focus to the thumbnail.
- When a send outcome is unknown, a banner with "It was sent" and "It was not sent" replaces the send button.

## Dashboard
- Search (company or title), sort (last updated, date created, match score), status chips and a "Needs action" chip. All state lives in the URL.
- A "Follow-ups due" section appears above the list only when something is due.

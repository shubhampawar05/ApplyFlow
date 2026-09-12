import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/applications/new", label: "New application" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children, activePath }: { children: ReactNode; activePath: string }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard"><span className="brand-mark">↗</span>ApplyFlow</Link>
        <nav className="nav" aria-label="Primary navigation">
          {navigation.map((item) => <Link className={`nav-link ${item.href === activePath ? "active" : ""}`} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <p className="sidebar-foot">Your application stays in your hands. Nothing is sent without your approval.</p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

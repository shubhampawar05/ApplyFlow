"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/features/auth/actions";
import { ToastProvider } from "./toast-provider";

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/applications/new", label: "New application" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  activePath,
  userLabel,
}: {
  children: ReactNode;
  activePath: string;
  userLabel?: string;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">↗</span>ApplyFlow
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link className={`nav-link ${item.href === activePath ? "active" : ""}`} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          {userLabel ? <p className="sidebar-user">{userLabel}</p> : null}
          <form action={signOut}>
            <button className="sign-out" type="submit">
              Sign out
            </button>
          </form>
          <p>Your application stays in your hands. Nothing is sent without your approval.</p>
        </div>
      </aside>
      <main className="main">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}

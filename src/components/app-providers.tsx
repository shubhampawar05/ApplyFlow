"use client";

// Purpose: mount client-only providers once at the app root.
// Constraints: no secrets; keep provider tree minimal.
import type { ReactNode } from "react";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

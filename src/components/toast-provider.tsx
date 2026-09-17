// Purpose: lightweight app-wide toast notifications for success and API error feedback.
// Constraints: client-only UI state; no secrets or API calls.
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ToastVariant = "success" | "error";

type ToastState = {
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((nextMessage: string, variant: ToastVariant = "success") => {
    setToast({ message: nextMessage, variant });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), variantDurationMs(toast.variant));
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div aria-live={toast.variant === "error" ? "assertive" : "polite"} className="toast-viewport" role="status">
          <div className={`toast toast-${toast.variant}`}>{toast.message}</div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

function variantDurationMs(variant: ToastVariant) {
  return variant === "error" ? 6000 : 4000;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

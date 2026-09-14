// Purpose: lightweight app-wide toast notifications for save and success feedback.
// Constraints: client-only UI state; no secrets or API calls.
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <div aria-live="polite" className="toast-viewport" role="status">
          <div className="toast">{message}</div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

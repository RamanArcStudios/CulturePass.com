"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";

import { subscribe } from "@/firebase/error-emitter";

// ---------------------------------------------------------------------------
// Inline toast (no external dependency required)
// ---------------------------------------------------------------------------

interface ToastMessage {
  id: number;
  text: string;
}

let nextToastId = 0;

/**
 * Production-only component that subscribes to the Firebase error emitter
 * and shows a toast notification for permission errors.
 *
 * In development builds this component renders nothing and performs no
 * subscriptions -- the `<FirebaseErrorListener>` handles errors there
 * by throwing to the nearest error boundary instead.
 */
export function FirebaseErrorToaster(): ReactNode {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const unsubscribe = subscribe((error) => {
      const id = nextToastId++;
      setToasts((prev) => [
        ...prev,
        { id, text: error.message || "A permission error occurred." },
      ]);

      // Auto-dismiss after 6 seconds.
      const timer = setTimeout(() => dismiss(id), 6000);
      timersRef.current.set(id, timer);
    });

    return () => {
      unsubscribe();
      // Clean up all pending timers.
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [dismiss]);

  if (process.env.NODE_ENV !== "production") return null;
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "24rem",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          style={{
            background: "#1f2937",
            color: "#f9fafb",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
        >
          <span style={{ flex: 1 }}>{toast.text}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

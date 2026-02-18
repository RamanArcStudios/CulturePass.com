"use client";

import { useEffect, useState } from "react";

import { subscribe } from "@/firebase/error-emitter";

/**
 * Development-only component that subscribes to the Firebase error emitter
 * and re-throws permission errors so they are caught by the nearest React
 * error boundary.
 *
 * In production builds this component renders nothing and performs no
 * subscriptions.
 */
export function FirebaseErrorListener() {
  const [caughtError, setCaughtError] = useState<Error | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const unsubscribe = subscribe((error) => {
      console.error("[FirebaseErrorListener]", error);
      setCaughtError(error);
    });

    return unsubscribe;
  }, []);

  // Re-throw during render so React catches it in an error boundary.
  if (process.env.NODE_ENV === "development" && caughtError) {
    throw caughtError;
  }

  return null;
}

"use client";

import { useEffect, useState, type ReactNode } from "react";

import { initializeFirebase } from "./index";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClientFirebaseProviderProps {
  children: ReactNode;
  /** Optional fallback UI shown while Firebase is initialising. */
  fallback?: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Client-side Firebase initialiser.
 *
 * Calls `initializeFirebase()` inside a `useEffect` and only renders its
 * children once the Firebase app is ready. This prevents child components
 * from attempting to use Firebase before it has been initialised.
 */
export function ClientFirebaseProvider({
  children,
  fallback = null,
}: ClientFirebaseProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeFirebase();
    setReady(true);
  }, []);

  if (!ready) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

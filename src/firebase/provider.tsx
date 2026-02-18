"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FirebaseApp } from "firebase/app";

import { initializeFirebase } from "./index";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FirebaseContextValue {
  app: FirebaseApp | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({ app: null });

/**
 * Consume the Firebase application instance from the nearest
 * `<FirebaseProvider>`.
 */
export function useFirebase(): FirebaseContextValue {
  return useContext(FirebaseContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface FirebaseProviderProps {
  children: ReactNode;
}

/**
 * Initialises the Firebase app on mount and provides it to the component tree
 * via React context.
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [app, setApp] = useState<FirebaseApp | null>(null);

  useEffect(() => {
    const firebaseApp = initializeFirebase();
    setApp(firebaseApp);
  }, []);

  return (
    <FirebaseContext.Provider value={{ app }}>
      {children}
    </FirebaseContext.Provider>
  );
}

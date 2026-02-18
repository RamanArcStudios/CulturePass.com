import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

import { firebaseConfig } from "./config";

// ---------------------------------------------------------------------------
// Singleton references
// ---------------------------------------------------------------------------

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Lazily initialise the Firebase app.
 *
 * If a Firebase app has already been initialised (e.g. by another entry-point)
 * the existing instance is reused.
 */
export function initializeFirebase(): FirebaseApp {
  if (app) return app;

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}

// ---------------------------------------------------------------------------
// SDK accessors
// ---------------------------------------------------------------------------

/**
 * Returns the core Firebase SDKs used throughout the application.
 *
 * Calling this function also ensures Firebase has been initialised.
 */
export function getSdks(): { db: Firestore } {
  const firebaseApp = initializeFirebase();

  if (!db) {
    db = getFirestore(firebaseApp);
  }

  return { db };
}

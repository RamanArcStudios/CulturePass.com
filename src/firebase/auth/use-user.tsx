"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { initializeFirebase, getSdks } from "@/firebase/index";
import type { UserProfile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseUserResult {
  /** The currently authenticated Firebase user, or `null`. */
  user: User | null;
  /** The user's Firestore profile document, or `null`. */
  userProfile: UserProfile | null;
  /** `true` while the auth state or profile is still loading. */
  loading: boolean;
  /** The most recent error, if any. */
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to Firebase Auth state changes and, when a user is
 * authenticated, also subscribe to their Firestore profile document
 * at `users/{uid}`.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // -----------------------------------------------------------------------
  // Auth state listener
  // -----------------------------------------------------------------------
  useEffect(() => {
    const app = initializeFirebase();
    const auth = getAuth(app);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setError(null);

        if (!firebaseUser) {
          // Signed out -- clear profile immediately.
          setUserProfile(null);
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribeAuth();
  }, []);

  // -----------------------------------------------------------------------
  // Firestore profile listener (depends on user)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const { db } = getSdks();
    const profileRef = doc(db, "users", user.uid);

    const unsubscribeProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribeProfile();
  }, [user]);

  return { user, userProfile, loading, error };
}

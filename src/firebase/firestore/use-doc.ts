"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  type FirestoreError,
} from "firebase/firestore";

import { getSdks } from "@/firebase/index";
import { emit } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { WithId } from "@/lib/types";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseDocResult<T> {
  data: WithId<T> | null;
  loading: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to a single Firestore document in real time.
 *
 * @typeParam T - The shape of the document (without the `id` field).
 * @param collectionName - The Firestore collection path.
 * @param docId          - The document ID. Pass `undefined` to skip the
 *                         subscription (e.g. while waiting for a value).
 */
export function useDoc<T>(
  collectionName: string,
  docId: string | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { db } = getSdks();
    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...(snapshot.data() as T) });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);

        if (err.code === "permission-denied") {
          const permissionError = new FirestorePermissionError(
            err.message,
            err.code,
          );
          emit(permissionError);
        }
      },
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

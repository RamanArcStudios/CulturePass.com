"use client";

import { useEffect, useState } from "react";
import {
  onSnapshot,
  type Query,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore";

import { emit } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { WithId } from "@/lib/types";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseCollectionResult<T> {
  data: WithId<T>[];
  loading: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to a Firestore collection (or query) in real time.
 *
 * @typeParam T - The shape of each document (without the `id` field).
 * @param queryRef - A Firestore `Query` reference to subscribe to.
 */
export function useCollection<T extends DocumentData>(
  queryRef: Query<T> | null,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!queryRef) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const docs: WithId<T>[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as T),
        }));
        setData(docs);
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
    // We intentionally depend on the serialised query path so the listener
    // re-subscribes when the query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryRef]);

  return { data, loading, error };
}

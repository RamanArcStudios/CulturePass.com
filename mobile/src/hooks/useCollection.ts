/**
 * useCollection – Generic Firestore collection listener for React Native.
 */
import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  type Query,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { WithId } from "../lib/types";

interface UseCollectionResult<T> {
  data: WithId<T>[];
  loading: boolean;
  error: string | null;
}

export function useCollection<T>(
  collectionPath: string,
  queryFn?: (ref: ReturnType<typeof collection>) => Query<DocumentData>,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const colRef = collection(db, collectionPath);
    const q = queryFn ? queryFn(colRef) : query(colRef);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WithId<T>[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [collectionPath]);

  return { data, loading, error };
}

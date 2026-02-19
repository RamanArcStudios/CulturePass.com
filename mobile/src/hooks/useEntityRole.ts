/**
 * useEntityRole – Subscribe to a user's role within a specific entity.
 *
 * Real-time listener on entity_roles/{entityId}_{uid} document.
 */
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { EntityRole } from "../lib/types";
import { useAuth } from "../context/AuthContext";

interface UseEntityRoleResult {
  role: EntityRole | null;
  loading: boolean;
}

export function useEntityRole(entityId: string | null): UseEntityRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<EntityRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId || !user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const roleDocRef = doc(db, "entity_roles", `${entityId}_${user.uid}`);

    const unsub = onSnapshot(
      roleDocRef,
      (snap) => {
        if (snap.exists()) {
          setRole(snap.data().role as EntityRole);
        } else {
          setRole(null);
        }
        setLoading(false);
      },
      () => {
        setRole(null);
        setLoading(false);
      },
    );

    return unsub;
  }, [entityId, user]);

  return { role, loading };
}

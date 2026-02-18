/**
 * CulturePass – Immutable Audit Logging System
 *
 * Every sensitive action is logged to the `audit_logs` collection.
 * Logs are append-only — no updates, no deletes.
 *
 * Mandatory logging for:
 *   - Role changes
 *   - Refunds
 *   - Entity approvals / rejections / suspensions
 *   - Ticket price changes
 *   - User bans
 *   - Financial overrides
 *   - Ownership transfers
 */

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { AuditAction } from "./types";
import type { EntityType } from "./entity-config";

// ---------------------------------------------------------------------------
// Core Logging Function
// ---------------------------------------------------------------------------

export async function writeAuditLog(
  db: Firestore,
  params: {
    action: AuditAction;
    performedBy: string;
    performedByEmail: string;
    targetEntityId: string;
    targetEntityType: EntityType | "user" | "platform";
    details: Record<string, unknown>;
  },
): Promise<void> {
  const logRef = doc(collection(db, "audit_logs"));
  await setDoc(logRef, {
    ...params,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Convenience Wrappers
// ---------------------------------------------------------------------------

export async function logRoleChange(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  targetUserId: string,
  previousRole: string,
  newRole: string,
  entityId?: string,
  entityType?: EntityType,
): Promise<void> {
  await writeAuditLog(db, {
    action: "role_change",
    performedBy,
    performedByEmail,
    targetEntityId: targetUserId,
    targetEntityType: entityType ?? "user",
    details: {
      previousRole,
      newRole,
      entityId: entityId ?? null,
    },
  });
}

export async function logEntityApproval(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  entityId: string,
  entityType: EntityType,
  status: "approved" | "rejected" | "suspended",
  reason?: string,
): Promise<void> {
  await writeAuditLog(db, {
    action:
      status === "approved"
        ? "entity_approval"
        : status === "rejected"
          ? "entity_rejection"
          : "entity_suspension",
    performedBy,
    performedByEmail,
    targetEntityId: entityId,
    targetEntityType: entityType,
    details: { status, reason: reason ?? null },
  });
}

export async function logRefund(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  orderId: string,
  amount: number,
  reason: string,
): Promise<void> {
  await writeAuditLog(db, {
    action: "refund_issued",
    performedBy,
    performedByEmail,
    targetEntityId: orderId,
    targetEntityType: "event",
    details: { amount, reason },
  });
}

export async function logTicketPriceChange(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  eventId: string,
  ticketTypeId: string,
  previousPrice: number,
  newPrice: number,
): Promise<void> {
  await writeAuditLog(db, {
    action: "ticket_price_change",
    performedBy,
    performedByEmail,
    targetEntityId: eventId,
    targetEntityType: "event",
    details: { ticketTypeId, previousPrice, newPrice },
  });
}

export async function logUserBan(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  targetUserId: string,
  banned: boolean,
  reason: string,
): Promise<void> {
  await writeAuditLog(db, {
    action: banned ? "user_banned" : "user_unbanned",
    performedBy,
    performedByEmail,
    targetEntityId: targetUserId,
    targetEntityType: "user",
    details: { banned, reason },
  });
}

export async function logOwnershipTransfer(
  db: Firestore,
  performedBy: string,
  performedByEmail: string,
  entityId: string,
  entityType: EntityType,
  previousOwnerId: string,
  newOwnerId: string,
): Promise<void> {
  await writeAuditLog(db, {
    action: "ownership_transfer",
    performedBy,
    performedByEmail,
    targetEntityId: entityId,
    targetEntityType: entityType,
    details: { previousOwnerId, newOwnerId },
  });
}

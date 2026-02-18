"use server";

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { initializeFirebase, getSdks } from "@/firebase";
import Stripe from "stripe";
import type {
  PlatformRole,
  EntityRole,
  EntityStatus,
} from "@/lib/types";
import { ENTITY_PREFIXES, type EntityType } from "@/lib/entity-config";
import {
  isProtectedSuperAdmin,
  isSuperAdmin,
  canApproveEntities,
  canBanUsers,
  canCreateEvent,
  canManageTeamMembers,
  canSellTickets,
  getTicketSaleBlockers,
  getInitialEntityState,
  getApprovedEntityState,
  getRejectedEntityState,
  getSuspendedEntityState,
  hasEntityPermission,
  canChangeEntityRole,
} from "@/lib/permissions";
import {
  logRoleChange,
  logEntityApproval,
  logUserBan,
  logOwnershipTransfer,
} from "@/lib/audit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDb() {
  initializeFirebase();
  const { db } = getSdks();
  return db;
}

/** Fetch a user's platform role from Firestore */
async function getUserPlatformRole(uid: string): Promise<PlatformRole> {
  const db = getDb();
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return "user";
  return (userDoc.data().role_global as PlatformRole) ?? "user";
}

/** Fetch a user's role within a specific entity from entity_roles collection */
async function getUserEntityRole(
  entityId: string,
  uid: string,
): Promise<EntityRole | null> {
  const db = getDb();
  const roleDoc = await getDoc(doc(db, "entity_roles", `${entityId}_${uid}`));
  if (!roleDoc.exists()) return null;
  return roleDoc.data().role as EntityRole;
}

/** Fetch entity status (for any entity collection) */
async function getEntityStatus(
  collectionName: string,
  entityId: string,
): Promise<EntityStatus | null> {
  const db = getDb();
  const entityDoc = await getDoc(doc(db, collectionName, entityId));
  if (!entityDoc.exists()) return null;
  return (entityDoc.data().status as EntityStatus) ?? null;
}

/**
 * Generates a unique CulturePass ID for a given entity type.
 *
 * The ID is composed of the entity prefix (e.g. "CP-E-") followed by a random
 * 6-character alphanumeric string. Uniqueness is verified against the `cpids`
 * collection in Firestore.
 */
async function generateUniqueCPID(entityType: EntityType): Promise<string> {
  const db = getDb();
  const prefix = ENTITY_PREFIXES[entityType];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let cpid: string;
  let exists = true;

  do {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    cpid = `${prefix}${suffix}`;

    const cpidDoc = await getDoc(doc(db, "cpids", cpid));
    exists = cpidDoc.exists();
  } while (exists);

  return cpid;
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Handle a sponsorship enquiry form submission.
 */
export async function handleSponsorshipRequest(
  prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const company = formData.get("company") as string | null;
    const message = formData.get("message") as string | null;
    const phone = formData.get("phone") as string | null;

    if (!name || !email || !message) {
      return { success: false, error: "Name, email, and message are required." };
    }

    const requestRef = doc(collection(db, "sponsorshipRequests"));
    await setDoc(requestRef, {
      name,
      email,
      company: company ?? "",
      phone: phone ?? "",
      message,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("handleSponsorshipRequest error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit sponsorship request.",
    };
  }
}

/**
 * Create a new event within an organisation.
 *
 * Permission: entity must be approved + user must have owner/admin/event_manager role.
 *
 * The event is stored in two locations:
 * 1. The organisation's subcollection: `organisations/{orgId}/events/{eventId}`
 * 2. A top-level public collection: `events/{eventId}`
 *
 * A CPID is also registered in the `cpids` collection.
 */
export async function createEvent(
  orgId: string,
  createdBy: string,
  values: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const db = getDb();

    // Permission check: entity role + entity status
    const [entityRole, entityStatus, platformRole] = await Promise.all([
      getUserEntityRole(orgId, createdBy),
      getEntityStatus("organisations", orgId),
      getUserPlatformRole(createdBy),
    ]);

    if (!isSuperAdmin(platformRole)) {
      if (!entityRole || !entityStatus) {
        return { success: false, error: "You do not have permission to create events for this entity." };
      }
      if (!canCreateEvent(entityRole, entityStatus)) {
        if (entityStatus !== "approved") {
          return { success: false, error: "Entity must be approved before events can be created." };
        }
        return { success: false, error: "You do not have permission to create events." };
      }
    }

    const cpid = await generateUniqueCPID("event");

    const orgEventRef = doc(collection(db, "organisations", orgId, "events"));
    const eventId = orgEventRef.id;
    const publicEventRef = doc(db, "events", eventId);
    const cpidRef = doc(db, "cpids", cpid);

    const eventData = {
      ...values,
      organisationId: orgId,
      createdBy,
      cpid,
      status: (values.status as string) ?? "draft",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(orgEventRef, eventData);
    batch.set(publicEventRef, eventData);
    batch.set(cpidRef, {
      entityType: "event",
      entityId: eventId,
      organisationId: orgId,
      createdAt: serverTimestamp(),
    });
    await batch.commit();

    return { success: true, eventId };
  } catch (error) {
    console.error("createEvent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event.",
    };
  }
}

/**
 * Update an existing event in both the organisation subcollection and the
 * public events collection. Ticket types are replaced entirely if provided.
 *
 * Permission: owner/admin/event_manager on the entity, or superadmin.
 */
export async function updateEvent(
  orgId: string,
  eventId: string,
  values: Record<string, unknown>,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Permission check
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(orgId, userId),
      getUserPlatformRole(userId),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin", "event_manager"])
    ) {
      return { success: false, error: "You do not have permission to update this event." };
    }

    const orgEventRef = doc(db, "organisations", orgId, "events", eventId);
    const publicEventRef = doc(db, "events", eventId);

    const updateData = {
      ...values,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.update(orgEventRef, updateData);
    batch.update(publicEventRef, updateData);

    // Replace ticket types if provided
    if (values.ticketTypes && Array.isArray(values.ticketTypes)) {
      const ticketTypes = values.ticketTypes as Record<string, unknown>[];

      // Delete existing ticket types from the organisation event subcollection
      const existingTicketsSnap = await getDocs(
        collection(db, "organisations", orgId, "events", eventId, "ticketTypes"),
      );
      existingTicketsSnap.forEach((ticketDoc) => {
        batch.delete(ticketDoc.ref);
      });

      // Write new ticket types
      for (const ticket of ticketTypes) {
        const ticketRef = doc(
          collection(db, "organisations", orgId, "events", eventId, "ticketTypes"),
        );
        batch.set(ticketRef, {
          ...ticket,
          eventId,
          createdAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("updateEvent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event.",
    };
  }
}

/**
 * Delete an event from both locations, its ticket types, and its CPID.
 *
 * Permission: owner/admin on the entity, or superadmin.
 */
export async function deleteEvent(
  orgId: string,
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Permission check
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(orgId, userId),
      getUserPlatformRole(userId),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin"])
    ) {
      return { success: false, error: "You do not have permission to delete this event." };
    }

    const batch = writeBatch(db);

    // Delete ticket types subcollection
    const ticketTypesSnap = await getDocs(
      collection(db, "organisations", orgId, "events", eventId, "ticketTypes"),
    );
    ticketTypesSnap.forEach((ticketDoc) => {
      batch.delete(ticketDoc.ref);
    });

    // Delete from organisation subcollection
    batch.delete(doc(db, "organisations", orgId, "events", eventId));

    // Delete from public events collection
    batch.delete(doc(db, "events", eventId));

    // Delete CPID entry
    const cpidQuery = query(
      collection(db, "cpids"),
      where("entityType", "==", "event"),
      where("entityId", "==", eventId),
    );
    const cpidSnap = await getDocs(cpidQuery);
    cpidSnap.forEach((cpidDoc) => {
      batch.delete(cpidDoc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("deleteEvent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event.",
    };
  }
}

/**
 * Create a community post within an organisation.
 */
export async function createPost(
  orgId: string,
  authorId: string,
  values: { content: string; authorName: string },
): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const db = getDb();

    const postRef = doc(collection(db, "organisations", orgId, "posts"));
    await setDoc(postRef, {
      content: values.content,
      authorId,
      authorName: values.authorName,
      organisationId: orgId,
      likesCount: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, postId: postRef.id };
  } catch (error) {
    console.error("createPost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post.",
    };
  }
}

/**
 * Toggle a like on a community post using a Firestore transaction to prevent
 * race conditions.
 */
export async function toggleLikePost(
  orgId: string,
  postId: string,
  userId: string,
): Promise<{ success: boolean; error?: string; liked?: boolean }> {
  try {
    const db = getDb();
    const postRef = doc(db, "organisations", orgId, "posts", postId);

    const liked = await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw new Error("Post not found.");
      }

      const likedBy: string[] = postDoc.data().likedBy ?? [];
      const isCurrentlyLiked = likedBy.includes(userId);

      if (isCurrentlyLiked) {
        transaction.update(postRef, {
          likedBy: arrayRemove(userId),
          likesCount: increment(-1),
        });
        return false;
      } else {
        transaction.update(postRef, {
          likedBy: arrayUnion(userId),
          likesCount: increment(1),
        });
        return true;
      }
    });

    return { success: true, liked };
  } catch (error) {
    console.error("toggleLikePost error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle like.",
    };
  }
}

/**
 * Create a Stripe PaymentIntent for a given amount in AUD.
 */
export async function createPaymentIntent(
  amount: number,
): Promise<{ success: boolean; error?: string; clientSecret?: string }> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "aud",
      automatic_payment_methods: { enabled: true },
    });

    return { success: true, clientSecret: paymentIntent.client_secret ?? undefined };
  } catch (error) {
    console.error("createPaymentIntent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent.",
    };
  }
}

/**
 * Create an order with a Firestore transaction to prevent overselling ticket
 * types. Each ticket type's `soldCount` is incremented and checked against
 * `maxQuantity`.
 */
export async function createOrder(
  orderData: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    const db = getDb();

    const orderId = await runTransaction(db, async (transaction) => {
      const items = orderData.items as Array<{
        ticketTypeId: string;
        eventId: string;
        orgId: string;
        quantity: number;
      }>;

      if (!items || items.length === 0) {
        throw new Error("Order must contain at least one item.");
      }

      // Read all ticket type documents first (required by transaction rules)
      const ticketRefs = items.map((item) =>
        doc(
          db,
          "organisations",
          item.orgId,
          "events",
          item.eventId,
          "ticketTypes",
          item.ticketTypeId,
        ),
      );

      const ticketSnaps = await Promise.all(
        ticketRefs.map((ref) => transaction.get(ref)),
      );

      // Validate availability for each ticket type
      for (let i = 0; i < items.length; i++) {
        const snap = ticketSnaps[i];
        const item = items[i];

        if (!snap.exists()) {
          throw new Error(`Ticket type ${item.ticketTypeId} not found.`);
        }

        const data = snap.data();
        const soldCount = (data.soldCount as number) ?? 0;
        const maxQuantity = data.maxQuantity as number | undefined;

        if (maxQuantity !== undefined && soldCount + item.quantity > maxQuantity) {
          throw new Error(
            `Ticket type "${data.name ?? item.ticketTypeId}" is sold out or has insufficient availability.`,
          );
        }
      }

      // Increment sold counts
      for (let i = 0; i < items.length; i++) {
        transaction.update(ticketRefs[i], {
          soldCount: increment(items[i].quantity),
        });
      }

      // Create the order document
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        ...orderData,
        status: "confirmed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return orderRef.id;
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("createOrder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order.",
    };
  }
}

/**
 * Join a community/organisation. Adds a member document to the organisation
 * and updates the user's memberships array.
 */
export async function joinCommunityAction(
  orgId: string,
  user: { uid: string; name: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const batch = writeBatch(db);

    // Add member document to the organisation
    const memberRef = doc(db, "organisations", orgId, "members", user.uid);
    batch.set(memberRef, {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: "member",
      joinedAt: serverTimestamp(),
    });

    // Update user's memberships
    const userRef = doc(db, "users", user.uid);
    batch.update(userRef, {
      memberships: arrayUnion(orgId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("joinCommunityAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join community.",
    };
  }
}

/**
 * Create a new user document in Firestore when a user signs up. Also
 * registers a CPID for the user.
 */
export async function createNewUserDocument(
  userData: { uid: string; name: string; email: string; photoUrl?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const cpid = await generateUniqueCPID("user");

    const batch = writeBatch(db);

    const userRef = doc(db, "users", userData.uid);
    batch.set(userRef, {
      displayName: userData.name,
      email: userData.email,
      photoURL: userData.photoUrl ?? "",
      role_global: "user" as PlatformRole,
      cpid,
      memberships: [],
      savedItems: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const cpidRef = doc(db, "cpids", cpid);
    batch.set(cpidRef, {
      entityType: "user",
      entityId: userData.uid,
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("createNewUserDocument error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user document.",
    };
  }
}

/**
 * Create a new organisation with approval workflow.
 *
 * Initial state: status=pending, visibility=hidden, eventsEnabled=false
 * Also adds the creating user as owner in entity_roles, registers a CPID,
 * and updates the user's memberships.
 */
export async function createOrganisation(
  values: Record<string, unknown>,
  user: { uid: string; name: string; email: string },
): Promise<{ success: boolean; error?: string; organisationId?: string }> {
  try {
    const db = getDb();
    const cpid = await generateUniqueCPID("organisation");

    const orgRef = doc(collection(db, "organisations"));
    const organisationId = orgRef.id;
    const memberRef = doc(db, "organisations", organisationId, "members", user.uid);
    const cpidRef = doc(db, "cpids", cpid);
    const userRef = doc(db, "users", user.uid);
    // Entity role document: composite key entityId_userId
    const entityRoleRef = doc(db, "entity_roles", `${organisationId}_${user.uid}`);

    const initialState = getInitialEntityState();

    const batch = writeBatch(db);

    batch.set(orgRef, {
      ...values,
      cpid,
      createdBy: user.uid,
      ...initialState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(memberRef, {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: "owner",
      joinedAt: serverTimestamp(),
    });

    // Register entity role for the owner
    batch.set(entityRoleRef, {
      entityId: organisationId,
      entityType: "organisation",
      userId: user.uid,
      role: "owner",
      assignedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(cpidRef, {
      entityType: "organisation",
      entityId: organisationId,
      createdAt: serverTimestamp(),
    });

    batch.update(userRef, {
      memberships: arrayUnion(organisationId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true, organisationId };
  } catch (error) {
    console.error("createOrganisation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create organisation.",
    };
  }
}

/**
 * Update an existing organisation's details.
 *
 * Permission: owner/admin/content_editor on the entity, or superadmin.
 */
export async function updateOrganisation(
  orgId: string,
  values: Record<string, unknown>,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Permission check
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(orgId, userId),
      getUserPlatformRole(userId),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin", "content_editor"])
    ) {
      return { success: false, error: "You do not have permission to update this organisation." };
    }

    const orgRef = doc(db, "organisations", orgId);

    // Strip sensitive fields that only owner/admin can change
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, visibility: _visibility, eventsEnabled: _eventsEnabled, ...safeValues } = values as Record<string, unknown> & {
      status?: string;
      visibility?: string;
      eventsEnabled?: boolean;
    };

    await updateDoc(orgRef, {
      ...safeValues,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateOrganisation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update organisation.",
    };
  }
}

/**
 * Create a new artist profile with a CPID and entity role assignment.
 * Initial status: pending (approval workflow applies).
 */
export async function createArtist(
  values: Record<string, unknown>,
  user: { uid: string; name: string; email: string },
): Promise<{ success: boolean; error?: string; artistId?: string }> {
  try {
    const db = getDb();
    const cpid = await generateUniqueCPID("artist");

    const artistRef = doc(collection(db, "artists"));
    const artistId = artistRef.id;
    const cpidRef = doc(db, "cpids", cpid);
    const entityRoleRef = doc(db, "entity_roles", `${artistId}_${user.uid}`);

    const initialState = getInitialEntityState();

    const batch = writeBatch(db);

    batch.set(artistRef, {
      ...values,
      cpid,
      ownerId: user.uid,
      ownerName: user.name,
      ownerEmail: user.email,
      ...initialState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(cpidRef, {
      entityType: "artist",
      entityId: artistId,
      createdAt: serverTimestamp(),
    });

    // Register entity role for the owner
    batch.set(entityRoleRef, {
      entityId: artistId,
      entityType: "artist",
      userId: user.uid,
      role: "owner",
      assignedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true, artistId };
  } catch (error) {
    console.error("createArtist error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create artist.",
    };
  }
}

/**
 * Update an artist profile.
 *
 * Permission: owner/admin/content_editor on the entity, or superadmin.
 */
export async function updateArtist(
  artistId: string,
  values: Record<string, unknown>,
  user: { uid: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const artistRef = doc(db, "artists", artistId);

    const artistDoc = await getDoc(artistRef);
    if (!artistDoc.exists()) {
      return { success: false, error: "Artist not found." };
    }

    // Permission check: entity role or ownership or superadmin
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(artistId, user.uid),
      getUserPlatformRole(user.uid),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      artistDoc.data().ownerId !== user.uid &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin", "content_editor"])
    ) {
      return { success: false, error: "You do not have permission to update this artist." };
    }

    await updateDoc(artistRef, {
      ...values,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateArtist error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update artist.",
    };
  }
}

/**
 * Delete an artist profile and its CPID.
 *
 * Permission: owner on the entity, or superadmin. (With SuperAdmin review for owner delete.)
 */
export async function deleteArtist(
  artistId: string,
  user: { uid: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const artistRef = doc(db, "artists", artistId);

    const artistDoc = await getDoc(artistRef);
    if (!artistDoc.exists()) {
      return { success: false, error: "Artist not found." };
    }

    // Permission check: only owner or superadmin can delete
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(artistId, user.uid),
      getUserPlatformRole(user.uid),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      artistDoc.data().ownerId !== user.uid &&
      entityRole !== "owner"
    ) {
      return { success: false, error: "You do not have permission to delete this artist." };
    }

    const batch = writeBatch(db);

    batch.delete(artistRef);

    // Delete CPID entry
    const cpidQuery = query(
      collection(db, "cpids"),
      where("entityType", "==", "artist"),
      where("entityId", "==", artistId),
    );
    const cpidSnap = await getDocs(cpidQuery);
    cpidSnap.forEach((cpidDoc) => {
      batch.delete(cpidDoc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("deleteArtist error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete artist.",
    };
  }
}

/**
 * Create a new business listing with a CPID and entity role assignment.
 * Initial status: pending (approval workflow applies).
 */
export async function createBusiness(
  values: Record<string, unknown>,
  user: { uid: string; name: string; email: string },
): Promise<{ success: boolean; error?: string; businessId?: string }> {
  try {
    const db = getDb();
    const cpid = await generateUniqueCPID("business");

    const businessRef = doc(collection(db, "businesses"));
    const businessId = businessRef.id;
    const cpidRef = doc(db, "cpids", cpid);
    const entityRoleRef = doc(db, "entity_roles", `${businessId}_${user.uid}`);

    const initialState = getInitialEntityState();

    const batch = writeBatch(db);

    batch.set(businessRef, {
      ...values,
      cpid,
      ownerId: user.uid,
      ownerName: user.name,
      ownerEmail: user.email,
      ...initialState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(cpidRef, {
      entityType: "business",
      entityId: businessId,
      createdAt: serverTimestamp(),
    });

    // Register entity role for the owner
    batch.set(entityRoleRef, {
      entityId: businessId,
      entityType: "business",
      userId: user.uid,
      role: "owner",
      assignedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true, businessId };
  } catch (error) {
    console.error("createBusiness error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create business.",
    };
  }
}

/**
 * Update a business listing.
 *
 * Permission: owner/admin/content_editor on the entity, or superadmin.
 */
export async function updateBusiness(
  businessId: string,
  values: Record<string, unknown>,
  user: { uid: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const businessRef = doc(db, "businesses", businessId);

    const businessDoc = await getDoc(businessRef);
    if (!businessDoc.exists()) {
      return { success: false, error: "Business not found." };
    }

    // Permission check: entity role, ownership, or superadmin
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(businessId, user.uid),
      getUserPlatformRole(user.uid),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      businessDoc.data().ownerId !== user.uid &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin", "content_editor"])
    ) {
      return { success: false, error: "You do not have permission to update this business." };
    }

    await updateDoc(businessRef, {
      ...values,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateBusiness error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update business.",
    };
  }
}

/**
 * Delete a business listing and its CPID.
 *
 * Permission: owner on the entity, or superadmin.
 */
export async function deleteBusiness(
  businessId: string,
  user: { uid: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const businessRef = doc(db, "businesses", businessId);

    const businessDoc = await getDoc(businessRef);
    if (!businessDoc.exists()) {
      return { success: false, error: "Business not found." };
    }

    // Permission check: only owner or superadmin can delete
    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(businessId, user.uid),
      getUserPlatformRole(user.uid),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      businessDoc.data().ownerId !== user.uid &&
      entityRole !== "owner"
    ) {
      return { success: false, error: "You do not have permission to delete this business." };
    }

    const batch = writeBatch(db);

    batch.delete(businessRef);

    // Delete CPID entry
    const cpidQuery = query(
      collection(db, "cpids"),
      where("entityType", "==", "business"),
      where("entityId", "==", businessId),
    );
    const cpidSnap = await getDocs(cpidQuery);
    cpidSnap.forEach((cpidDoc) => {
      batch.delete(cpidDoc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("deleteBusiness error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete business.",
    };
  }
}

/**
 * SuperAdmin action: update the status of any entity using the approval
 * workflow. Applies proper state transitions and audit logging.
 *
 * Permission: superadmin only.
 */
export async function updateEntityStatus(
  collectionName: string,
  docId: string,
  newStatus: EntityStatus,
  adminUser: { uid: string; email: string },
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Permission check: superadmin only
    const platformRole = await getUserPlatformRole(adminUser.uid);
    if (!canApproveEntities(platformRole)) {
      return { success: false, error: "Only SuperAdmins can approve, reject, or suspend entities." };
    }

    const entityRef = doc(db, collectionName, docId);
    const entityDoc = await getDoc(entityRef);

    if (!entityDoc.exists()) {
      return { success: false, error: "Entity not found." };
    }

    const previousStatus = entityDoc.data().status as EntityStatus;

    // Apply state transition based on new status
    let stateUpdate: Record<string, unknown>;
    switch (newStatus) {
      case "approved":
        stateUpdate = getApprovedEntityState();
        break;
      case "rejected":
        stateUpdate = { ...getRejectedEntityState(), rejectionReason: reason ?? "" };
        break;
      case "suspended":
        stateUpdate = { ...getSuspendedEntityState(), suspensionReason: reason ?? "" };
        break;
      default:
        stateUpdate = { status: newStatus };
    }

    await updateDoc(entityRef, {
      ...stateUpdate,
      previousStatus,
      updatedAt: serverTimestamp(),
    });

    // Audit log
    const entityType = collectionName === "organisations"
      ? "organisation"
      : collectionName === "businesses"
        ? "business"
        : collectionName === "artists"
          ? "artist"
          : (collectionName.replace(/s$/, "") as EntityType);

    await logEntityApproval(
      db,
      adminUser.uid,
      adminUser.email,
      docId,
      entityType,
      newStatus as "approved" | "rejected" | "suspended",
      reason,
    );

    return { success: true };
  } catch (error) {
    console.error("updateEntityStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update entity status.",
    };
  }
}

/**
 * SuperAdmin action: update a user's platform-level role.
 * Primary super admin accounts cannot have their roles changed.
 *
 * Permission: superadmin only. Audit logged.
 */
export async function updateUserRole(
  userId: string,
  newRole: PlatformRole,
  adminUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isProtectedSuperAdmin(userId)) {
      return { success: false, error: "Cannot modify the role of a primary administrator." };
    }

    // Permission check: superadmin only
    const platformRole = await getUserPlatformRole(adminUser.uid);
    if (!isSuperAdmin(platformRole)) {
      return { success: false, error: "Only SuperAdmins can change platform roles." };
    }

    const db = getDb();
    const userRef = doc(db, "users", userId);

    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: "User not found." };
    }

    const previousRole = userDoc.data().role_global as string;

    await updateDoc(userRef, {
      role_global: newRole,
      updatedAt: serverTimestamp(),
    });

    // Audit log
    await logRoleChange(db, adminUser.uid, adminUser.email, userId, previousRole, newRole);

    return { success: true };
  } catch (error) {
    console.error("updateUserRole error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role.",
    };
  }
}

/**
 * Allow a user to update their own profile.
 */
export async function updateMyProfile(
  userId: string,
  values: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const userRef = doc(db, "users", userId);

    // Prevent users from changing their own role
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role: _role, ...safeValues } = values;

    await updateDoc(userRef, {
      ...safeValues,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateMyProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}

/**
 * Admin action: create a new perk.
 */
export async function createPerk(
  values: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; perkId?: string }> {
  try {
    const db = getDb();

    const perkRef = doc(collection(db, "perks"));
    await setDoc(perkRef, {
      ...values,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, perkId: perkRef.id };
  } catch (error) {
    console.error("createPerk error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create perk.",
    };
  }
}

/**
 * Admin action: update an existing perk.
 */
export async function updatePerk(
  perkId: string,
  values: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const perkRef = doc(db, "perks", perkId);

    await updateDoc(perkRef, {
      ...values,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updatePerk error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update perk.",
    };
  }
}

/**
 * Admin action: delete a perk.
 */
export async function deletePerk(
  perkId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, "perks", perkId));

    return { success: true };
  } catch (error) {
    console.error("deletePerk error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete perk.",
    };
  }
}

/**
 * Admin action: set a single event as the featured event. All other events
 * are un-featured first, then the specified event is marked as featured.
 */
export async function setFeaturedEvent(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Find all currently featured events and un-feature them
    const featuredQuery = query(
      collection(db, "events"),
      where("isFeatured", "==", true),
    );
    const featuredSnap = await getDocs(featuredQuery);

    const batch = writeBatch(db);

    featuredSnap.forEach((eventDoc) => {
      batch.update(eventDoc.ref, {
        isFeatured: false,
        updatedAt: serverTimestamp(),
      });
    });

    // Feature the selected event
    const eventRef = doc(db, "events", eventId);
    batch.update(eventRef, {
      isFeatured: true,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("setFeaturedEvent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set featured event.",
    };
  }
}

/**
 * Admin action: set the featured artists. Clears the `isFeatured` flag on
 * all artists, then sets it on the selected ones.
 */
export async function setFeaturedArtists(
  artistIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Un-feature all currently featured artists
    const featuredQuery = query(
      collection(db, "artists"),
      where("isFeatured", "==", true),
    );
    const featuredSnap = await getDocs(featuredQuery);

    const batch = writeBatch(db);

    featuredSnap.forEach((artistDoc) => {
      batch.update(artistDoc.ref, {
        isFeatured: false,
        updatedAt: serverTimestamp(),
      });
    });

    // Feature the selected artists
    for (const artistId of artistIds) {
      const artistRef = doc(db, "artists", artistId);
      batch.update(artistRef, {
        isFeatured: true,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("setFeaturedArtists error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set featured artists.",
    };
  }
}

/**
 * Save an item (event, artist, or business) to the user's saved items.
 */
export async function saveItem(
  userId: string,
  entityId: string,
  entityType: "events" | "artists" | "businesses",
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      [`savedItems.${entityType}`]: arrayUnion(entityId),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("saveItem error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save item.",
    };
  }
}

/**
 * Remove a saved item from the user's saved items.
 */
export async function unsaveItem(
  userId: string,
  entityId: string,
  entityType: "events" | "artists" | "businesses",
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      [`savedItems.${entityType}`]: arrayRemove(entityId),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("unsaveItem error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsave item.",
    };
  }
}

/**
 * Admin action: update a user's profile and role. This allows administrators
 * to edit user details that users themselves cannot change.
 *
 * Permission: superadmin only. Role changes on protected admins are blocked.
 */
export async function updateUserProfileByAdmin(
  userId: string,
  values: Record<string, unknown>,
  adminUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Permission check
    const platformRole = await getUserPlatformRole(adminUser.uid);
    if (!isSuperAdmin(platformRole)) {
      return { success: false, error: "Only SuperAdmins can update user profiles." };
    }

    if (isProtectedSuperAdmin(userId) && values.role_global !== undefined) {
      return { success: false, error: "Cannot modify the role of a primary administrator." };
    }

    const db = getDb();
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      ...values,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateUserProfileByAdmin error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user profile.",
    };
  }
}

// ---------------------------------------------------------------------------
// 🔐 Entity Role Management Actions
// ---------------------------------------------------------------------------

/**
 * Assign or update a user's role within an entity.
 *
 * Permission: owner/admin on the entity, or superadmin.
 * Only owners can assign/remove the "owner" role.
 * Audit logged.
 */
export async function assignEntityRole(
  entityId: string,
  entityType: EntityType,
  targetUserId: string,
  newRole: EntityRole,
  actorUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const [actorPlatformRole, actorEntityRole] = await Promise.all([
      getUserPlatformRole(actorUser.uid),
      getUserEntityRole(entityId, actorUser.uid),
    ]);

    // Check permission to manage team members
    if (
      !isSuperAdmin(actorPlatformRole) &&
      (!actorEntityRole || !canManageTeamMembers(actorEntityRole))
    ) {
      return { success: false, error: "You do not have permission to manage team members." };
    }

    // Check role transition validity
    const currentRole = await getUserEntityRole(entityId, targetUserId);

    if (
      !isSuperAdmin(actorPlatformRole) &&
      actorEntityRole &&
      !canChangeEntityRole(
        actorPlatformRole,
        actorEntityRole,
        currentRole ?? "member",
        newRole,
      )
    ) {
      return { success: false, error: "You cannot assign this role." };
    }

    // Only one owner per entity — if assigning owner, demote existing owner to admin
    if (newRole === "owner" && currentRole !== "owner") {
      const existingOwnerQuery = query(
        collection(db, "entity_roles"),
        where("entityId", "==", entityId),
        where("role", "==", "owner"),
      );
      const existingOwnerSnap = await getDocs(existingOwnerQuery);

      const batch = writeBatch(db);

      existingOwnerSnap.forEach((ownerDoc) => {
        batch.update(ownerDoc.ref, {
          role: "admin",
          updatedAt: serverTimestamp(),
        });
      });

      // Set new owner
      const roleRef = doc(db, "entity_roles", `${entityId}_${targetUserId}`);
      batch.set(roleRef, {
        entityId,
        entityType,
        userId: targetUserId,
        role: newRole,
        assignedBy: actorUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
    } else {
      const roleRef = doc(db, "entity_roles", `${entityId}_${targetUserId}`);
      await setDoc(roleRef, {
        entityId,
        entityType,
        userId: targetUserId,
        role: newRole,
        assignedBy: actorUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // Audit log
    await logRoleChange(
      db,
      actorUser.uid,
      actorUser.email,
      targetUserId,
      currentRole ?? "none",
      newRole,
      entityId,
      entityType,
    );

    return { success: true };
  } catch (error) {
    console.error("assignEntityRole error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign entity role.",
    };
  }
}

/**
 * Remove a user's role from an entity.
 *
 * Permission: owner/admin on the entity, or superadmin.
 * Owners cannot be removed (must transfer ownership first).
 */
export async function removeEntityRole(
  entityId: string,
  targetUserId: string,
  actorUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const [actorPlatformRole, actorEntityRole, targetRole] = await Promise.all([
      getUserPlatformRole(actorUser.uid),
      getUserEntityRole(entityId, actorUser.uid),
      getUserEntityRole(entityId, targetUserId),
    ]);

    if (
      !isSuperAdmin(actorPlatformRole) &&
      (!actorEntityRole || !canManageTeamMembers(actorEntityRole))
    ) {
      return { success: false, error: "You do not have permission to remove team members." };
    }

    if (targetRole === "owner") {
      return { success: false, error: "Cannot remove the owner. Transfer ownership first." };
    }

    const roleRef = doc(db, "entity_roles", `${entityId}_${targetUserId}`);
    await deleteDoc(roleRef);

    // Audit log
    await logRoleChange(
      db,
      actorUser.uid,
      actorUser.email,
      targetUserId,
      targetRole ?? "none",
      "removed",
      entityId,
    );

    return { success: true };
  } catch (error) {
    console.error("removeEntityRole error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove entity role.",
    };
  }
}

/**
 * Transfer ownership of an entity to another user.
 *
 * Permission: current owner only, or superadmin.
 * Previous owner is demoted to admin. Audit logged.
 */
export async function transferEntityOwnership(
  entityId: string,
  entityType: EntityType,
  newOwnerId: string,
  actorUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const [actorPlatformRole, actorEntityRole] = await Promise.all([
      getUserPlatformRole(actorUser.uid),
      getUserEntityRole(entityId, actorUser.uid),
    ]);

    if (!isSuperAdmin(actorPlatformRole) && actorEntityRole !== "owner") {
      return { success: false, error: "Only the current owner can transfer ownership." };
    }

    const batch = writeBatch(db);

    // Demote current owner to admin
    const currentOwnerRoleRef = doc(db, "entity_roles", `${entityId}_${actorUser.uid}`);
    batch.update(currentOwnerRoleRef, {
      role: "admin",
      updatedAt: serverTimestamp(),
    });

    // Set new owner
    const newOwnerRoleRef = doc(db, "entity_roles", `${entityId}_${newOwnerId}`);
    batch.set(newOwnerRoleRef, {
      entityId,
      entityType,
      userId: newOwnerId,
      role: "owner",
      assignedBy: actorUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update createdBy on the entity itself
    const collectionName =
      entityType === "organisation" ? "organisations" :
      entityType === "business" ? "businesses" :
      entityType === "artist" ? "artists" :
      entityType === "venue" ? "venues" : entityType;

    const entityRef = doc(db, collectionName, entityId);
    batch.update(entityRef, {
      ownerId: newOwnerId,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Audit log
    await logOwnershipTransfer(
      db,
      actorUser.uid,
      actorUser.email,
      entityId,
      entityType,
      actorUser.uid,
      newOwnerId,
    );

    return { success: true };
  } catch (error) {
    console.error("transferEntityOwnership error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to transfer ownership.",
    };
  }
}

// ---------------------------------------------------------------------------
// 🚫 User Ban / Unban
// ---------------------------------------------------------------------------

/**
 * Ban a user from the platform.
 *
 * Permission: superadmin only. Audit logged.
 * Protected super admin accounts cannot be banned.
 */
export async function banUser(
  targetUserId: string,
  reason: string,
  adminUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isProtectedSuperAdmin(targetUserId)) {
      return { success: false, error: "Cannot ban a primary administrator." };
    }

    const platformRole = await getUserPlatformRole(adminUser.uid);
    if (!canBanUsers(platformRole)) {
      return { success: false, error: "Only SuperAdmins can ban users." };
    }

    const db = getDb();
    const userRef = doc(db, "users", targetUserId);

    await updateDoc(userRef, {
      isBanned: true,
      bannedReason: reason,
      bannedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Audit log
    await logUserBan(db, adminUser.uid, adminUser.email, targetUserId, true, reason);

    return { success: true };
  } catch (error) {
    console.error("banUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban user.",
    };
  }
}

/**
 * Unban a user from the platform.
 *
 * Permission: superadmin only. Audit logged.
 */
export async function unbanUser(
  targetUserId: string,
  reason: string,
  adminUser: { uid: string; email: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const platformRole = await getUserPlatformRole(adminUser.uid);
    if (!canBanUsers(platformRole)) {
      return { success: false, error: "Only SuperAdmins can unban users." };
    }

    const db = getDb();
    const userRef = doc(db, "users", targetUserId);

    await updateDoc(userRef, {
      isBanned: false,
      bannedReason: "",
      updatedAt: serverTimestamp(),
    });

    // Audit log
    await logUserBan(db, adminUser.uid, adminUser.email, targetUserId, false, reason);

    return { success: true };
  } catch (error) {
    console.error("unbanUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban user.",
    };
  }
}

// ---------------------------------------------------------------------------
// 💰 Revenue Safety - Payment Setup
// ---------------------------------------------------------------------------

/**
 * Update the payment setup for an entity (Stripe Connect, payout account, etc.).
 *
 * Permission: owner/admin on the entity, or superadmin.
 */
export async function updatePaymentSetup(
  entityId: string,
  entityType: "organisation" | "business",
  values: {
    stripeConnectAccountId?: string;
    stripeAccountVerified?: boolean;
    payoutAccountConnected?: boolean;
    refundPolicySet?: boolean;
  },
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    const [entityRole, platformRole] = await Promise.all([
      getUserEntityRole(entityId, userId),
      getUserPlatformRole(userId),
    ]);

    if (
      !isSuperAdmin(platformRole) &&
      !hasEntityPermission(platformRole, entityRole, ["owner", "admin"])
    ) {
      return { success: false, error: "You do not have permission to update payment setup." };
    }

    const paymentRef = doc(db, "payment_setup", entityId);

    // Determine if ticket sales can be enabled
    const existing = await getDoc(paymentRef);
    const existingData = existing.exists() ? existing.data() : {};

    const merged = {
      stripeConnectAccountId: values.stripeConnectAccountId ?? existingData.stripeConnectAccountId ?? "",
      stripeAccountVerified: values.stripeAccountVerified ?? existingData.stripeAccountVerified ?? false,
      payoutAccountConnected: values.payoutAccountConnected ?? existingData.payoutAccountConnected ?? false,
      refundPolicySet: values.refundPolicySet ?? existingData.refundPolicySet ?? false,
    };

    const entityStatus = await getEntityStatus(
      entityType === "organisation" ? "organisations" : "businesses",
      entityId,
    );

    const ticketSalesEnabled = canSellTickets({
      entityApproved: entityStatus === "approved",
      stripeConnected: !!merged.stripeConnectAccountId && merged.stripeAccountVerified,
      payoutVerified: merged.payoutAccountConnected,
      refundPolicySet: merged.refundPolicySet,
    });

    await setDoc(paymentRef, {
      entityId,
      entityType,
      ...merged,
      ticketSalesEnabled,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("updatePaymentSetup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payment setup.",
    };
  }
}

/**
 * Check if an entity can sell tickets (all revenue safety requirements met).
 */
export async function checkTicketSaleEligibility(
  entityId: string,
  entityType: "organisation" | "business",
): Promise<{ success: boolean; eligible: boolean; blockers: string[] }> {
  try {
    const db = getDb();

    const paymentDoc = await getDoc(doc(db, "payment_setup", entityId));
    const entityStatus = await getEntityStatus(
      entityType === "organisation" ? "organisations" : "businesses",
      entityId,
    );

    const data = paymentDoc.exists() ? paymentDoc.data() : {};

    const requirements = {
      entityApproved: entityStatus === "approved",
      stripeConnected: !!data.stripeConnectAccountId && data.stripeAccountVerified === true,
      payoutVerified: data.payoutAccountConnected === true,
      refundPolicySet: data.refundPolicySet === true,
    };

    const eligible = canSellTickets(requirements);
    const blockers = getTicketSaleBlockers(requirements);

    return { success: true, eligible, blockers };
  } catch (error) {
    console.error("checkTicketSaleEligibility error:", error);
    return { success: false, eligible: false, blockers: ["Failed to check eligibility."] };
  }
}

// ---------------------------------------------------------------------------
// 📋 Audit Log Retrieval (SuperAdmin only)
// ---------------------------------------------------------------------------

/**
 * Fetch audit logs with optional filters.
 *
 * Permission: superadmin only.
 */
export async function getAuditLogs(
  adminUid: string,
  filters?: {
    targetEntityId?: string;
    action?: string;
    limit?: number;
  },
): Promise<{ success: boolean; error?: string; logs?: Record<string, unknown>[] }> {
  try {
    const platformRole = await getUserPlatformRole(adminUid);
    if (!isSuperAdmin(platformRole)) {
      return { success: false, error: "Only SuperAdmins can access audit logs." };
    }

    const db = getDb();
    const q = collection(db, "audit_logs");
    const constraints: ReturnType<typeof where>[] = [];

    if (filters?.targetEntityId) {
      constraints.push(where("targetEntityId", "==", filters.targetEntityId));
    }
    if (filters?.action) {
      constraints.push(where("action", "==", filters.action));
    }

    const snap = await getDocs(
      constraints.length > 0
        ? query(q, ...constraints)
        : query(q),
    );

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return { success: true, logs };
  } catch (error) {
    console.error("getAuditLogs error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch audit logs.",
    };
  }
}

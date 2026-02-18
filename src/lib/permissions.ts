/**
 * CulturePass – Centralized Permission Control Logic
 *
 * Three-layer permission system:
 *   1. Platform Level (Global)   – user, moderator, superadmin
 *   2. Entity Level (Per Entity) – owner, admin, event_manager, finance_manager, content_editor, member
 *   3. Event Level (Per Event)   – derived from entity-level roles
 *
 * Every action must pass through these helpers. No shortcuts.
 */

import type { PlatformRole, EntityRole, EntityStatus } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** UIDs of primary super admins – their roles can NEVER be modified */
export const SUPER_ADMIN_UIDS = [
  "jQUz8YHqLxOUYgIiMxr6vZC3vT72",
  "6SlcJXbFb2TJjfRknugGnNPfvOA2",
] as const;

// ---------------------------------------------------------------------------
// 1️⃣  Platform-Level Permission Checks
// ---------------------------------------------------------------------------

export function isSuperAdmin(role: PlatformRole): boolean {
  return role === "superadmin";
}

export function isModerator(role: PlatformRole): boolean {
  return role === "moderator" || role === "superadmin";
}

export function isPlatformUser(role: PlatformRole): boolean {
  return role === "user";
}

/** Check if a UID belongs to a hardcoded super admin (immutable) */
export function isProtectedSuperAdmin(uid: string): boolean {
  return (SUPER_ADMIN_UIDS as readonly string[]).includes(uid);
}

// ---------------------------------------------------------------------------
// Platform-Level Action Permissions
// ---------------------------------------------------------------------------

/** SuperAdmin-only: approve/reject/suspend entities */
export function canApproveEntities(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: access financial dashboards */
export function canAccessPlatformFinancials(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: manage platform fees & global settings */
export function canManagePlatformSettings(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: ban users */
export function canBanUsers(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: issue refunds at platform level */
export function canIssueRefunds(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: manage sponsor placements */
export function canManageSponsors(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** SuperAdmin-only: access audit logs */
export function canAccessAuditLogs(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

/** Moderator+: flag content, suspend comments, report entities */
export function canModerateContent(role: PlatformRole): boolean {
  return isModerator(role);
}

/** Moderator+: review reported events */
export function canReviewReports(role: PlatformRole): boolean {
  return isModerator(role);
}

// ---------------------------------------------------------------------------
// 2️⃣  Entity-Level Permission Checks
// ---------------------------------------------------------------------------

/** Roles that can create events within an entity */
const EVENT_CREATOR_ROLES: EntityRole[] = ["owner", "admin", "event_manager"];

/** Roles that can edit entity profile details */
const ENTITY_EDITOR_ROLES: EntityRole[] = ["owner", "admin", "content_editor"];

/** Roles that can manage team members */
const TEAM_MANAGER_ROLES: EntityRole[] = ["owner", "admin"];

/** Roles that can access the entity's financial dashboard */
const FINANCE_ACCESS_ROLES: EntityRole[] = ["owner", "admin", "finance_manager"];

/** Roles that can create perks */
const PERK_CREATOR_ROLES: EntityRole[] = ["owner", "admin", "event_manager"];

/** Roles that can add sponsors */
const SPONSOR_MANAGER_ROLES: EntityRole[] = ["owner", "admin"];

// ---- Entity Creation / Editing ----

export function canCreateEvent(
  entityRole: EntityRole,
  entityStatus: EntityStatus,
): boolean {
  return (
    entityStatus === "approved" &&
    EVENT_CREATOR_ROLES.includes(entityRole)
  );
}

export function canEditEntity(entityRole: EntityRole): boolean {
  return ENTITY_EDITOR_ROLES.includes(entityRole);
}

export function canEditEntityCoreDetails(entityRole: EntityRole): boolean {
  return TEAM_MANAGER_ROLES.includes(entityRole);
}

// ---- Team Management ----

export function canManageTeamMembers(entityRole: EntityRole): boolean {
  return TEAM_MANAGER_ROLES.includes(entityRole);
}

export function canAssignRoles(entityRole: EntityRole): boolean {
  return TEAM_MANAGER_ROLES.includes(entityRole);
}

export function canTransferOwnership(entityRole: EntityRole): boolean {
  return entityRole === "owner";
}

export function canDeleteEntity(entityRole: EntityRole): boolean {
  return entityRole === "owner";
}

// ---- Financial Access ----

export function canAccessFinancialDashboard(entityRole: EntityRole): boolean {
  return FINANCE_ACCESS_ROLES.includes(entityRole);
}

export function canViewRevenue(entityRole: EntityRole): boolean {
  return FINANCE_ACCESS_ROLES.includes(entityRole);
}

export function canProcessRefund(entityRole: EntityRole): boolean {
  return entityRole === "finance_manager" || entityRole === "owner" || entityRole === "admin";
}

export function canAccessPayoutReports(entityRole: EntityRole): boolean {
  return FINANCE_ACCESS_ROLES.includes(entityRole);
}

// ---- Event Management (within entity context) ----

export function canEditEvent(entityRole: EntityRole): boolean {
  return EVENT_CREATOR_ROLES.includes(entityRole);
}

export function canManageTickets(entityRole: EntityRole): boolean {
  return EVENT_CREATOR_ROLES.includes(entityRole);
}

export function canCheckInAttendees(entityRole: EntityRole): boolean {
  return EVENT_CREATOR_ROLES.includes(entityRole);
}

export function canDownloadAttendeeList(entityRole: EntityRole): boolean {
  return EVENT_CREATOR_ROLES.includes(entityRole);
}

// ---- Content Editing ----

export function canEditDescription(entityRole: EntityRole): boolean {
  return ENTITY_EDITOR_ROLES.includes(entityRole);
}

export function canUpdateImages(entityRole: EntityRole): boolean {
  return ENTITY_EDITOR_ROLES.includes(entityRole);
}

export function canPostAnnouncements(entityRole: EntityRole): boolean {
  return ENTITY_EDITOR_ROLES.includes(entityRole);
}

// ---- Perks ----

export function canCreatePerk(entityRole: EntityRole): boolean {
  return PERK_CREATOR_ROLES.includes(entityRole);
}

export function canManageSponsorsForEntity(entityRole: EntityRole): boolean {
  return SPONSOR_MANAGER_ROLES.includes(entityRole);
}

// ---------------------------------------------------------------------------
// 3️⃣  Revenue Safety Checks
// ---------------------------------------------------------------------------

export interface TicketSaleRequirements {
  entityApproved: boolean;
  stripeConnected: boolean;
  payoutVerified: boolean;
  refundPolicySet: boolean;
}

/** All conditions must be true before an event can sell tickets */
export function canSellTickets(requirements: TicketSaleRequirements): boolean {
  return (
    requirements.entityApproved &&
    requirements.stripeConnected &&
    requirements.payoutVerified &&
    requirements.refundPolicySet
  );
}

export function getTicketSaleBlockers(
  requirements: TicketSaleRequirements,
): string[] {
  const blockers: string[] = [];
  if (!requirements.entityApproved) blockers.push("Entity must be approved");
  if (!requirements.stripeConnected) blockers.push("Stripe Connect must be connected");
  if (!requirements.payoutVerified) blockers.push("Payout account must be verified");
  if (!requirements.refundPolicySet) blockers.push("Refund policy must be set");
  return blockers;
}

// ---------------------------------------------------------------------------
// 4️⃣  Approval Workflow Logic
// ---------------------------------------------------------------------------

/** Initial state for newly created entities */
export function getInitialEntityState(): {
  status: EntityStatus;
  visibility: "hidden";
  eventsEnabled: false;
} {
  return {
    status: "pending",
    visibility: "hidden",
    eventsEnabled: false,
  };
}

/** State transitions when an entity is approved */
export function getApprovedEntityState(): {
  status: "approved";
  visibility: "public";
  eventsEnabled: true;
} {
  return {
    status: "approved",
    visibility: "public",
    eventsEnabled: true,
  };
}

/** State transitions when an entity is rejected */
export function getRejectedEntityState(): {
  status: "rejected";
  visibility: "hidden";
  eventsEnabled: false;
} {
  return {
    status: "rejected",
    visibility: "hidden",
    eventsEnabled: false,
  };
}

/** State transitions when an entity is suspended */
export function getSuspendedEntityState(): {
  status: "suspended";
  visibility: "hidden";
  eventsEnabled: false;
} {
  return {
    status: "suspended",
    visibility: "hidden",
    eventsEnabled: false,
  };
}

// ---------------------------------------------------------------------------
// 5️⃣  Composite Permission Check Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a user has access to perform an action on an entity, considering
 * both their platform role (superadmin override) and entity-level role.
 */
export function hasEntityPermission(
  platformRole: PlatformRole,
  entityRole: EntityRole | null,
  requiredEntityRoles: EntityRole[],
): boolean {
  // SuperAdmin can override everything
  if (isSuperAdmin(platformRole)) return true;
  // Must have a role in the entity
  if (!entityRole) return false;
  return requiredEntityRoles.includes(entityRole);
}

/**
 * Validate that the given role transition is legal.
 * Owners cannot be demoted by admins; only owners or superadmins can change
 * owner-level access.
 */
export function canChangeEntityRole(
  actorPlatformRole: PlatformRole,
  actorEntityRole: EntityRole,
  targetCurrentRole: EntityRole,
  targetNewRole: EntityRole,
): boolean {
  // SuperAdmin can change any role
  if (isSuperAdmin(actorPlatformRole)) return true;

  // Only owner can assign/remove other owners
  if (targetNewRole === "owner" || targetCurrentRole === "owner") {
    return actorEntityRole === "owner";
  }

  // Admin can manage non-owner roles
  if (actorEntityRole === "admin" || actorEntityRole === "owner") {
    return true;
  }

  return false;
}

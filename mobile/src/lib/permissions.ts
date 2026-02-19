/**
 * CulturePass – Permission Checks for Mobile
 *
 * Same logic as web (src/lib/permissions.ts), adapted for React Native.
 */

import type { PlatformRole, EntityRole, EntityStatus } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPER_ADMIN_UIDS = [
  "jQUz8YHqLxOUYgIiMxr6vZC3vT72",
  "6SlcJXbFb2TJjfRknugGnNPfvOA2",
] as const;

// ---------------------------------------------------------------------------
// Platform-Level Checks
// ---------------------------------------------------------------------------

export function isSuperAdmin(role: PlatformRole): boolean {
  return role === "superadmin";
}

export function isModerator(role: PlatformRole): boolean {
  return role === "moderator" || role === "superadmin";
}

export function isProtectedSuperAdmin(uid: string): boolean {
  return (SUPER_ADMIN_UIDS as readonly string[]).includes(uid);
}

export function canApproveEntities(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

export function canBanUsers(role: PlatformRole): boolean {
  return isSuperAdmin(role);
}

export function canModerateContent(role: PlatformRole): boolean {
  return isModerator(role);
}

// ---------------------------------------------------------------------------
// Entity-Level Checks
// ---------------------------------------------------------------------------

const EVENT_CREATOR_ROLES: EntityRole[] = ["owner", "admin", "event_manager"];
const ENTITY_EDITOR_ROLES: EntityRole[] = ["owner", "admin", "content_editor"];
const TEAM_MANAGER_ROLES: EntityRole[] = ["owner", "admin"];
const FINANCE_ACCESS_ROLES: EntityRole[] = ["owner", "admin", "finance_manager"];
const PERK_CREATOR_ROLES: EntityRole[] = ["owner", "admin", "event_manager"];

export function canCreateEvent(
  entityRole: EntityRole,
  entityStatus: EntityStatus,
): boolean {
  return entityStatus === "approved" && EVENT_CREATOR_ROLES.includes(entityRole);
}

export function canEditEntity(entityRole: EntityRole): boolean {
  return ENTITY_EDITOR_ROLES.includes(entityRole);
}

export function canManageTeamMembers(entityRole: EntityRole): boolean {
  return TEAM_MANAGER_ROLES.includes(entityRole);
}

export function canAccessFinancialDashboard(entityRole: EntityRole): boolean {
  return FINANCE_ACCESS_ROLES.includes(entityRole);
}

export function canCreatePerk(entityRole: EntityRole): boolean {
  return PERK_CREATOR_ROLES.includes(entityRole);
}

export function canTransferOwnership(entityRole: EntityRole): boolean {
  return entityRole === "owner";
}

export function canDeleteEntity(entityRole: EntityRole): boolean {
  return entityRole === "owner";
}

export function hasEntityPermission(
  platformRole: PlatformRole,
  entityRole: EntityRole | null,
  requiredRoles: EntityRole[],
): boolean {
  if (isSuperAdmin(platformRole)) return true;
  if (!entityRole) return false;
  return requiredRoles.includes(entityRole);
}

// ---------------------------------------------------------------------------
// Revenue Safety
// ---------------------------------------------------------------------------

export interface TicketSaleRequirements {
  entityApproved: boolean;
  stripeConnected: boolean;
  payoutVerified: boolean;
  refundPolicySet: boolean;
}

export function canSellTickets(requirements: TicketSaleRequirements): boolean {
  return (
    requirements.entityApproved &&
    requirements.stripeConnected &&
    requirements.payoutVerified &&
    requirements.refundPolicySet
  );
}

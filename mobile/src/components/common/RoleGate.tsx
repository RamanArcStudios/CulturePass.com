/**
 * RoleGate – Conditionally render children based on user roles.
 *
 * Supports both platform-level and entity-level role checks.
 * SuperAdmins always pass through.
 */
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useEntityRole } from "../../hooks/useEntityRole";
import { isSuperAdmin, hasEntityPermission } from "../../lib/permissions";
import type { PlatformRole, EntityRole } from "../../lib/types";

interface PlatformRoleGateProps {
  /** Minimum platform roles that can see this content */
  allowedRoles: PlatformRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Gate content behind platform-level roles.
 *
 * <PlatformRoleGate allowedRoles={["superadmin"]}>
 *   <AdminPanel />
 * </PlatformRoleGate>
 */
export function PlatformRoleGate({
  allowedRoles,
  children,
  fallback = null,
}: PlatformRoleGateProps) {
  const { platformRole } = useAuth();

  if (isSuperAdmin(platformRole) || allowedRoles.includes(platformRole)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface EntityRoleGateProps {
  /** The entity to check roles for */
  entityId: string;
  /** Entity roles that can see this content */
  allowedRoles: EntityRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Gate content behind entity-level roles.
 *
 * <EntityRoleGate entityId={orgId} allowedRoles={["owner", "admin"]}>
 *   <TeamManagementPanel />
 * </EntityRoleGate>
 */
export function EntityRoleGate({
  entityId,
  allowedRoles,
  children,
  fallback = null,
}: EntityRoleGateProps) {
  const { platformRole } = useAuth();
  const { role, loading } = useEntityRole(entityId);

  if (loading) return null;

  if (hasEntityPermission(platformRole, role, allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * RoleBadge – Shows a user's role within an entity.
 *
 * Color-coded per role for instant recognition.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EntityRole, PlatformRole } from "../../lib/types";
import { colors } from "../../theme/colors";
import { borderRadius, fontSize, spacing } from "../../theme/spacing";

// ---------------------------------------------------------------------------
// Entity Role Config
// ---------------------------------------------------------------------------

const ENTITY_ROLE_CONFIG: Record<
  EntityRole,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  owner: { label: "Owner", color: colors.roleOwner, icon: "shield-checkmark" },
  admin: { label: "Admin", color: colors.roleAdmin, icon: "shield" },
  event_manager: { label: "Event Manager", color: colors.roleEventManager, icon: "calendar" },
  finance_manager: { label: "Finance", color: colors.roleFinanceManager, icon: "card" },
  content_editor: { label: "Editor", color: colors.roleContentEditor, icon: "create" },
  member: { label: "Member", color: colors.roleMember, icon: "person" },
};

const PLATFORM_ROLE_CONFIG: Record<
  PlatformRole,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  superadmin: { label: "SuperAdmin", color: colors.roleOwner, icon: "star" },
  moderator: { label: "Moderator", color: colors.roleAdmin, icon: "shield-half" },
  user: { label: "User", color: colors.roleMember, icon: "person" },
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function EntityRoleBadge({ role }: { role: EntityRole }) {
  const config = ENTITY_ROLE_CONFIG[role];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + "15" }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export function PlatformRoleBadge({ role }: { role: PlatformRole }) {
  const config = PLATFORM_ROLE_CONFIG[role];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + "15" }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});

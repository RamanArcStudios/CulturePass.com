/**
 * StatusBadge – Visual badge showing entity approval status.
 *
 * Used on Organisation, Business, and Artist cards/detail screens.
 * Shows: Approved (green checkmark), Pending (yellow clock),
 *        Rejected (red X), Suspended (grey pause).
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EntityStatus } from "../../lib/types";
import { colors } from "../../theme/colors";
import { borderRadius, fontSize, spacing } from "../../theme/spacing";

interface StatusBadgeProps {
  status: EntityStatus;
  /** "sm" for card chips, "md" for detail headers, "lg" for profile banners */
  size?: "sm" | "md" | "lg";
  /** Show label text next to the icon */
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  EntityStatus,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
  }
> = {
  approved: {
    label: "Approved",
    icon: "checkmark-circle",
    color: colors.badgeApproved,
    bgColor: colors.badgeApprovedBg,
  },
  pending: {
    label: "Pending",
    icon: "time",
    color: colors.badgePending,
    bgColor: colors.badgePendingBg,
  },
  rejected: {
    label: "Rejected",
    icon: "close-circle",
    color: colors.badgeRejected,
    bgColor: colors.badgeRejectedBg,
  },
  suspended: {
    label: "Suspended",
    icon: "pause-circle",
    color: colors.badgeSuspended,
    bgColor: colors.badgeSuspendedBg,
  },
};

const ICON_SIZES = { sm: 14, md: 18, lg: 22 } as const;
const FONT_SIZES = { sm: fontSize.xs, md: fontSize.sm, lg: fontSize.base } as const;
const PADDINGS = {
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  lg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
} as const;

export function StatusBadge({
  status,
  size = "md",
  showLabel = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, PADDINGS[size]]}>
      <Ionicons name={config.icon} size={ICON_SIZES[size]} color={config.color} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: config.color, fontSize: FONT_SIZES[size] },
          ]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
}

/**
 * ApprovedBadge – Shorthand for showing just the approved checkmark.
 *
 * Use this inline next to entity names:
 *   <Text>Melbourne Tamil Sangam <ApprovedBadge /></Text>
 */
export function ApprovedBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <View style={[styles.inlineBadge]}>
      <Ionicons
        name="checkmark-circle"
        size={ICON_SIZES[size]}
        color={colors.badgeApproved}
      />
    </View>
  );
}

/**
 * ApprovedBadgeWithLabel – Full approved badge with "Verified" text.
 *
 * Used on entity detail/profile headers.
 */
export function ApprovedBadgeWithLabel({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.badgeApprovedBg },
        PADDINGS[size],
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={ICON_SIZES[size]}
        color={colors.badgeApproved}
      />
      <Text
        style={[
          styles.label,
          { color: colors.badgeApproved, fontSize: FONT_SIZES[size] },
        ]}
      >
        Verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.full,
    gap: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: "600",
  },
  inlineBadge: {
    marginLeft: 4,
  },
});

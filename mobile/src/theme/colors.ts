/**
 * CulturePass Design System – Color Palette
 */
export const colors = {
  // Primary brand
  primary: "#6C63FF",
  primaryLight: "#8B85FF",
  primaryDark: "#4A42DB",

  // Secondary
  secondary: "#FF6B6B",
  secondaryLight: "#FF8E8E",

  // Status colors
  approved: "#10B981",
  approvedLight: "#D1FAE5",
  approvedDark: "#047857",
  pending: "#F59E0B",
  pendingLight: "#FEF3C7",
  pendingDark: "#D97706",
  rejected: "#EF4444",
  rejectedLight: "#FEE2E2",
  rejectedDark: "#DC2626",
  suspended: "#6B7280",
  suspendedLight: "#F3F4F6",

  // Badge colors
  badgeApproved: "#10B981",
  badgeApprovedBg: "#ECFDF5",
  badgePending: "#F59E0B",
  badgePendingBg: "#FFFBEB",
  badgeRejected: "#EF4444",
  badgeRejectedBg: "#FEF2F2",
  badgeSuspended: "#6B7280",
  badgeSuspendedBg: "#F9FAFB",

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  divider: "#E2E8F0",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Roles
  roleOwner: "#7C3AED",
  roleAdmin: "#2563EB",
  roleEventManager: "#059669",
  roleFinanceManager: "#D97706",
  roleContentEditor: "#EC4899",
  roleMember: "#6B7280",
} as const;

export type ColorKey = keyof typeof colors;

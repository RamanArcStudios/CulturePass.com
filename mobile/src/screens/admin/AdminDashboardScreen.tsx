/**
 * AdminDashboardScreen -- Platform admin dashboard.
 *
 * Gated behind PlatformRoleGate for superadmin and moderator roles.
 * Shows pending approval counts for organisations, artists, and businesses,
 * plus links to audit logs and user management.
 */
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { query, where } from "firebase/firestore";
import { PlatformRoleGate } from "../../components/common/RoleGate";
import { useCollection } from "../../hooks/useCollection";
import { LoadingScreen } from "../../components/common/LoadingScreen";
import type { Organisation, Artist, Business } from "../../lib/types";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

// ---------------------------------------------------------------------------
// Access Denied Fallback
// ---------------------------------------------------------------------------
function AccessDenied() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.deniedContainer}>
        <Ionicons name="lock-closed" size={56} color={colors.textMuted} />
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedMessage}>
          You do not have permission to view the admin dashboard. This area is
          restricted to platform moderators and administrators.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Content
// ---------------------------------------------------------------------------
function DashboardContent() {
  const { data: pendingOrgs, loading: loadingOrgs } =
    useCollection<Organisation>("organisations", (colRef) =>
      query(colRef, where("status", "==", "pending")),
    );

  const { data: pendingArtists, loading: loadingArtists } =
    useCollection<Artist>("artists", (colRef) =>
      query(colRef, where("status", "==", "pending")),
    );

  const { data: pendingBusinesses, loading: loadingBusinesses } =
    useCollection<Business>("businesses", (colRef) =>
      query(colRef, where("status", "==", "pending")),
    );

  const isLoading = loadingOrgs || loadingArtists || loadingBusinesses;

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  const totalPending =
    pendingOrgs.length + pendingArtists.length + pendingBusinesses.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Header ---- */}
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Admin Dashboard</Text>
          <Text style={styles.screenSubtitle}>Platform management overview</Text>
        </View>

        {/* ---- Pending Approvals Section ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {totalPending > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalPending}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardsRow}>
          <PendingCard
            icon="people"
            label="Organisations"
            count={pendingOrgs.length}
            color={colors.primary}
          />
          <PendingCard
            icon="musical-notes"
            label="Artists"
            count={pendingArtists.length}
            color={colors.secondary}
          />
          <PendingCard
            icon="storefront"
            label="Businesses"
            count={pendingBusinesses.length}
            color={colors.pendingDark}
          />
        </View>

        {/* ---- Recent Audit Logs Section ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Audit Logs</Text>
        </View>

        <View style={styles.placeholderCard}>
          <Ionicons name="document-text-outline" size={24} color={colors.textMuted} />
          <View style={styles.placeholderTextGroup}>
            <Text style={styles.placeholderTitle}>Audit Log</Text>
            <Text style={styles.placeholderSubtitle}>
              View recent moderation actions and system events
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </View>

        {/* ---- User Management Section ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>User Management</Text>
        </View>

        <TouchableOpacity style={styles.placeholderCard} activeOpacity={0.7}>
          <Ionicons name="people-circle-outline" size={24} color={colors.primary} />
          <View style={styles.placeholderTextGroup}>
            <Text style={styles.placeholderTitle}>Manage Users</Text>
            <Text style={styles.placeholderSubtitle}>
              View, ban, or update user roles and permissions
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PendingCard – Compact card showing a pending count for an entity type.
// ---------------------------------------------------------------------------
interface PendingCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  color: string;
}

function PendingCard({ icon, label, count, color }: PendingCardProps) {
  return (
    <TouchableOpacity style={styles.pendingCard} activeOpacity={0.7}>
      <View style={[styles.pendingIconCircle, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.pendingCount}>{count}</Text>
      <Text style={styles.pendingLabel}>{label}</Text>
      {count > 0 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main export with role gate
// ---------------------------------------------------------------------------
export default function AdminDashboardScreen() {
  return (
    <PlatformRoleGate
      allowedRoles={["superadmin", "moderator"]}
      fallback={<AccessDenied />}
    >
      <DashboardContent />
    </PlatformRoleGate>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["5xl"],
  },

  // Header
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing["2xl"],
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalBadge: {
    backgroundColor: colors.pending,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  totalBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // Pending cards row
  cardsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pendingCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  pendingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingCount: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  pendingLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  pendingBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.pending,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  pendingBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },

  // Placeholder cards (audit logs, user management)
  placeholderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  placeholderTextGroup: {
    flex: 1,
    gap: 2,
  },
  placeholderTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  placeholderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Access Denied
  deniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["3xl"],
    gap: spacing.md,
  },
  deniedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  deniedMessage: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

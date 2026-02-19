/**
 * ProfileScreen -- Displays the authenticated user's profile.
 *
 * Shows name, email, photo, CPID, platform role badge, saved items count,
 * and a sign-out button.
 */
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { PlatformRoleBadge } from "../../components/badges/RoleBadge";
import { colors } from "../../theme/colors";
import { spacing, borderRadius, fontSize, fontWeight } from "../../theme/spacing";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { user, profile, platformRole, loading } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Saved items count ----
  const savedItemsCount = profile
    ? (profile.savedItems?.events?.length ?? 0) +
      (profile.savedItems?.artists?.length ?? 0) +
      (profile.savedItems?.businesses?.length ?? 0)
    : 0;

  // ---- Initials fallback when no photo ----
  const initials = (profile?.name ?? user?.displayName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasPhoto = !!(profile?.photoUrl && profile.photoUrl.length > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ---- Header / Avatar ---- */}
        <View style={styles.header}>
          {hasPhoto ? (
            <Image source={{ uri: profile!.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <Text style={styles.name}>
            {profile?.name ?? user?.displayName ?? "CulturePass User"}
          </Text>

          <Text style={styles.email}>{profile?.email ?? user?.email}</Text>

          {/* Role badge */}
          <View style={styles.badgeRow}>
            <PlatformRoleBadge role={platformRole} />
          </View>
        </View>

        {/* ---- Info Card ---- */}
        <View style={styles.card}>
          <InfoRow
            icon="finger-print-outline"
            label="CPID"
            value={profile?.cpid ?? "--"}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="mail-outline"
            label="Email"
            value={profile?.email ?? user?.email ?? "--"}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="bookmark-outline"
            label="Saved Items"
            value={String(savedItemsCount)}
          />
        </View>

        {/* ---- Sign Out ---- */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.rejected}
            style={styles.signOutIcon}
          />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// InfoRow helper
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.textMuted}
          style={styles.infoIcon}
        />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing["3xl"],
    paddingVertical: spacing["3xl"],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  name: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  email: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badgeRow: {
    marginTop: spacing.md,
  },

  // Info card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing["2xl"],
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "right",
  },

  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rejectedLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
  },
  signOutIcon: {
    marginRight: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.rejected,
  },
});

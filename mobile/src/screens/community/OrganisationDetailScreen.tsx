/**
 * OrganisationDetailScreen – Full detail view of an Organisation/Community.
 *
 * Shows: banner, logo, name + approved badge, description, team roles,
 * events list, and role-gated management actions.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Organisation, WithId } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";
import { useEntityRole } from "../../hooks/useEntityRole";
import { ApprovedBadgeWithLabel, StatusBadge } from "../../components/badges";
import { EntityRoleBadge } from "../../components/badges";
import { EntityRoleGate } from "../../components/common/RoleGate";
import { LoadingScreen } from "../../components/common/LoadingScreen";
import { colors } from "../../theme/colors";
import { spacing, fontSize, fontWeight, borderRadius } from "../../theme/spacing";

interface Props {
  route: { params: { orgId: string } };
}

export default function OrganisationDetailScreen({ route }: Props) {
  const { orgId } = route.params;
  const { user } = useAuth();
  const { role } = useEntityRole(orgId);
  const [org, setOrg] = useState<WithId<Organisation> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "organisations", orgId), (snap) => {
      if (snap.exists()) {
        setOrg({ id: snap.id, ...snap.data() } as WithId<Organisation>);
      }
      setLoading(false);
    });
    return unsub;
  }, [orgId]);

  if (loading) return <LoadingScreen />;
  if (!org) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Organisation not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Banner */}
        {org.bannerUrl ? (
          <Image source={{ uri: org.bannerUrl }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.primaryLight }]} />
        )}

        <View style={styles.content}>
          {/* Logo + Name + Badge */}
          <View style={styles.header}>
            {org.logoUrl ? (
              <Image source={{ uri: org.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Ionicons name="people" size={28} color={colors.white} />
              </View>
            )}
            <View style={styles.headerText}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{org.name}</Text>
                {org.status === "approved" && <ApprovedBadgeWithLabel size="sm" />}
              </View>
              <Text style={styles.location}>
                {org.city}, {org.state}
              </Text>
              {role && <EntityRoleBadge role={role} />}
            </View>
          </View>

          {/* Status (if not approved) */}
          {org.status !== "approved" && (
            <View style={styles.statusRow}>
              <StatusBadge status={org.status} size="md" />
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{org.description}</Text>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {org.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{org.email}</Text>
              </View>
            )}
            {org.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{org.phone}</Text>
              </View>
            )}
            {org.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{org.website}</Text>
              </View>
            )}
          </View>

          {/* Role-Gated Actions */}
          <EntityRoleGate
            entityId={orgId}
            allowedRoles={["owner", "admin", "event_manager"]}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Management</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.actionText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </EntityRoleGate>

          <EntityRoleGate entityId={orgId} allowedRoles={["owner", "admin"]}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Manage Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Edit Organisation</Text>
            </TouchableOpacity>
          </EntityRoleGate>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: -40,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    borderColor: colors.white,
  },
  logoPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    paddingTop: 44,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  name: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statusRow: {
    marginTop: -spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing["4xl"],
  },
});

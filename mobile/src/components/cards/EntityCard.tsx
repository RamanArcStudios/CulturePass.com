/**
 * EntityCard – Reusable card for Organisation, Business, Artist.
 *
 * Shows: image, name, approved badge (if approved), location, status chip.
 */
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApprovedBadge, StatusBadge } from "../badges";
import type { EntityStatus } from "../../lib/types";
import { colors } from "../../theme/colors";
import { borderRadius, fontSize, spacing, fontWeight } from "../../theme/spacing";

interface EntityCardProps {
  name: string;
  imageUrl: string;
  status: EntityStatus;
  subtitle?: string;
  location?: string;
  entityType: "organisation" | "business" | "artist";
  onPress?: () => void;
}

const ENTITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  organisation: "people",
  business: "storefront",
  artist: "musical-notes",
};

export function EntityCard({
  name,
  imageUrl,
  status,
  subtitle,
  location,
  entityType,
  onPress,
}: EntityCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Entity Image */}
      <Image
        source={
          imageUrl
            ? { uri: imageUrl }
            : require("../../../assets/placeholder.png")
        }
        style={styles.image}
        defaultSource={require("../../../assets/placeholder.png")}
      />

      <View style={styles.content}>
        {/* Name + Approved Badge */}
        <View style={styles.nameRow}>
          <Ionicons
            name={ENTITY_ICONS[entityType]}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {status === "approved" && <ApprovedBadge size="sm" />}
        </View>

        {/* Subtitle */}
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {/* Bottom row: Location + Status */}
        <View style={styles.bottomRow}>
          {location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}
          <StatusBadge status={status} size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: colors.borderLight,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 24,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

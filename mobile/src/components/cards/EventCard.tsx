/**
 * EventCard – Card for displaying events in lists.
 */
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { borderRadius, fontSize, spacing, fontWeight } from "../../theme/spacing";

interface EventCardProps {
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  orgName: string;
  orgApproved?: boolean;
  onPress?: () => void;
}

export function EventCard({
  title,
  imageUrl,
  date,
  location,
  orgName,
  orgApproved,
  onPress,
}: EventCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.meta}>{date}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.meta}>{location}</Text>
        </View>

        <View style={styles.orgRow}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.orgName}>{orgName}</Text>
          {orgApproved && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.badgeApproved}
            />
          )}
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
    height: 140,
    backgroundColor: colors.borderLight,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  orgName: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

/**
 * HomeScreen -- Main landing screen for CulturePass.
 *
 * Shows a welcome header, featured events carousel,
 * community section link, and trending artists section.
 */
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ---------------------------------------------------------------------------
// Mock featured events (placeholder data)
// ---------------------------------------------------------------------------
const FEATURED_EVENTS = [
  {
    id: "1",
    title: "Melbourne Tamil Music Festival",
    location: "Federation Square, Melbourne",
    imageColor: colors.primary,
  },
  {
    id: "2",
    title: "Sydney Cultural Dance Night",
    location: "Darling Harbour, Sydney",
    imageColor: colors.secondary,
  },
  {
    id: "3",
    title: "Brisbane Art & Heritage Expo",
    location: "South Bank, Brisbane",
    imageColor: colors.primaryDark,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const { profile } = useAuth();

  const firstName = profile?.name?.split(" ")[0] ?? "Explorer";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Welcome Header ---- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* ---- Discover Section ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discover</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          decelerationRate="fast"
          snapToInterval={FEATURED_CARD_WIDTH + spacing.md}
        >
          {FEATURED_EVENTS.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.featuredCard}
              activeOpacity={0.85}
            >
              {/* Image placeholder */}
              <View
                style={[
                  styles.featuredImage,
                  { backgroundColor: event.imageColor },
                ]}
              >
                <Ionicons name="image-outline" size={36} color={colors.white} />
              </View>

              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                <View style={styles.featuredLocationRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={colors.primary}
                  />
                  <Text style={styles.featuredLocation} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ---- Communities Section ---- */}
        <TouchableOpacity style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Communities</Text>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAll}>Browse</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.placeholderCard}>
          <Ionicons name="people" size={28} color={colors.primary} />
          <View style={styles.placeholderTextGroup}>
            <Text style={styles.placeholderTitle}>
              Find your community
            </Text>
            <Text style={styles.placeholderSubtitle}>
              Explore cultural organisations near you
            </Text>
          </View>
        </View>

        {/* ---- Trending Artists Section ---- */}
        <TouchableOpacity style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Artists</Text>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAll}>View All</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.placeholderCard}>
          <Ionicons name="musical-notes" size={28} color={colors.secondary} />
          <View style={styles.placeholderTextGroup}>
            <Text style={styles.placeholderTitle}>
              Discover talented artists
            </Text>
            <Text style={styles.placeholderSubtitle}>
              Music, dance, visual arts and more
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: spacing["4xl"],
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },
  userName: {
    fontSize: fontSize["2xl"],
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing["2xl"],
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  // Featured carousel
  featuredList: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  featuredImage: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featuredTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  featuredLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  // Placeholder cards
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
});

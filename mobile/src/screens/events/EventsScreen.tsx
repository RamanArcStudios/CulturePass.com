/**
 * EventsScreen -- Lists all culture events from Firestore.
 *
 * Uses useCollection<CultureEvent> with pull-to-refresh support,
 * EventCard for rendering, and EmptyState / LoadingScreen fallbacks.
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { EventCard } from "../../components/cards/EventCard";
import { LoadingScreen } from "../../components/common/LoadingScreen";
import { EmptyState } from "../../components/common/EmptyState";
import type { CultureEvent, WithId } from "../../lib/types";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

export default function EventsScreen() {
  const { data: events, loading, error } = useCollection<CultureEvent>("events");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    // useCollection is a real-time listener so data is always fresh.
    // The pull gesture gives visual feedback.
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading && !refreshing) {
    return <LoadingScreen message="Loading events..." />;
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const formatDate = (date: Date | any): string => {
    if (!date) return "";
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderEvent = ({ item }: { item: WithId<CultureEvent> }) => (
    <EventCard
      title={item.title}
      imageUrl={item.imageUrl}
      date={formatDate(item.startDate)}
      location={`${item.location}${item.city ? `, ${item.city}` : ""}`}
      orgName={item.orgName}
    />
  );

  const keyExtractor = (item: WithId<CultureEvent>) => item.id;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Events</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlatList
        data={events}
        keyExtractor={keyExtractor}
        renderItem={renderEvent}
        contentContainerStyle={[
          styles.listContent,
          events.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No Events Yet"
            message="There are no upcoming events at the moment. Check back soon for exciting cultural experiences!"
          />
        }
      />
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
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.rejected,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
  },
  emptyListContent: {
    flex: 1,
  },
});

/**
 * ArtistsScreen -- Lists all artists from Firestore.
 *
 * Uses useCollection<Artist> to subscribe to the "artists" collection.
 * Renders an EntityCard per artist with genre subtitle,
 * profile image, and approved status badges.
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
import { EntityCard } from "../../components/cards";
import { LoadingScreen } from "../../components/common/LoadingScreen";
import { EmptyState } from "../../components/common/EmptyState";
import type { Artist, WithId } from "../../lib/types";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

export default function ArtistsScreen() {
  const { data: artists, loading, error } = useCollection<Artist>("artists");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading && !refreshing) {
    return <LoadingScreen message="Loading artists..." />;
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderArtist = ({ item }: { item: WithId<Artist> }) => (
    <EntityCard
      name={item.name}
      imageUrl={item.profileImageUrl}
      status={item.status}
      subtitle={
        item.genre && item.genre.length > 0
          ? item.genre.join(", ")
          : undefined
      }
      entityType="artist"
    />
  );

  const keyExtractor = (item: WithId<Artist>) => item.id;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Artists</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlatList
        data={artists}
        keyExtractor={keyExtractor}
        renderItem={renderArtist}
        contentContainerStyle={[
          styles.listContent,
          artists.length === 0 && styles.emptyListContent,
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
            icon="musical-notes-outline"
            title="No Artists Yet"
            message="Artists will appear here once they join the CulturePass platform. Stay tuned!"
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

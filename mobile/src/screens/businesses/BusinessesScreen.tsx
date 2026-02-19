/**
 * BusinessesScreen -- Lists all businesses from Firestore.
 *
 * Uses useCollection<Business> to subscribe to the "businesses" collection.
 * Renders an EntityCard per business with category subtitle,
 * city + state as location, and status badges.
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
import type { Business, WithId } from "../../lib/types";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

export default function BusinessesScreen() {
  const { data: businesses, loading, error } = useCollection<Business>("businesses");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading && !refreshing) {
    return <LoadingScreen message="Loading businesses..." />;
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderBusiness = ({ item }: { item: WithId<Business> }) => (
    <EntityCard
      name={item.name}
      imageUrl={item.logoUrl}
      status={item.status}
      subtitle={
        item.categories && item.categories.length > 0
          ? item.categories.join(", ")
          : undefined
      }
      location={
        item.city && item.state
          ? `${item.city}, ${item.state}`
          : item.city || item.state || undefined
      }
      entityType="business"
    />
  );

  const keyExtractor = (item: WithId<Business>) => item.id;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Businesses</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlatList
        data={businesses}
        keyExtractor={keyExtractor}
        renderItem={renderBusiness}
        contentContainerStyle={[
          styles.listContent,
          businesses.length === 0 && styles.emptyListContent,
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
            icon="storefront-outline"
            title="No Businesses Yet"
            message="Cultural businesses will appear here once they register on CulturePass. Check back soon!"
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

/**
 * CommunityScreen -- Lists approved public organisations.
 *
 * Queries Firestore for organisations with status === "approved"
 * and visibility === "public". Shows EntityCard for each org with
 * the approved badge.
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "../../hooks/useCollection";
import { EntityCard } from "../../components/cards";
import { LoadingScreen } from "../../components/common/LoadingScreen";
import { EmptyState } from "../../components/common/EmptyState";
import type { Organisation, WithId } from "../../lib/types";
import { colors } from "../../theme/colors";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/spacing";

export default function CommunityScreen() {
  const { data: organisations, loading, error } = useCollection<Organisation>(
    "organisations",
    (colRef) =>
      query(
        colRef,
        where("status", "==", "approved"),
        where("visibility", "==", "public"),
      ),
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading && !refreshing) {
    return <LoadingScreen message="Loading communities..." />;
  }

  // ---------------------------------------------------------------------------
  // Filter by local search text
  // ---------------------------------------------------------------------------
  const filtered = searchText.trim()
    ? organisations.filter((org) =>
        org.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : organisations;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderOrg = ({ item }: { item: WithId<Organisation> }) => (
    <EntityCard
      name={item.name}
      imageUrl={item.logoUrl}
      status={item.status}
      subtitle={item.description}
      location={
        item.city && item.state ? `${item.city}, ${item.state}` : item.city || item.state
      }
      entityType="organisation"
    />
  );

  const keyExtractor = (item: WithId<Organisation>) => item.id;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Communities</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderOrg}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.emptyListContent,
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
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search communities..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Communities Found"
            message={
              searchText.trim()
                ? "No communities match your search. Try a different keyword."
                : "There are no public communities yet. Check back soon!"
            }
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
  },
  emptyListContent: {
    flex: 1,
  },
});

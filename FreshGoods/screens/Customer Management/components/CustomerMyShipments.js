/**
 * CustomerMyShipments.js
 * Shipments this customer is associated with (named as the shipment's
 * customer, and/or granted tracking access) — distinct from
 * CustomerViewGoods, which is an unfiltered browse-all-active-deliveries
 * list. Backed by GET /api/customer/my-shipments.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import api from '../../services/api';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  getStatusColor,
  getStatusBgColor,
} from '../../theme';
import ThemedCard from '../../components/ThemedCard';
import { SlideInView, FadeInView } from '../../components/AnimatedComponents';

const ShipmentCard = ({ item, onPress, index }) => {
  const statusColor = getStatusColor(item.status);
  const statusBg = getStatusBgColor(item.status);

  return (
    <SlideInView delay={index * 60}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8}>
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName} numberOfLines={1}>📦 {item.itemName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.vendorText}>{item.vendorId?.name || 'Vendor'}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.trackingText}>
              {item.trackingAllowed ? '📍 Tracking available' : '🔒 Tracking not granted yet'}
            </Text>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    </SlideInView>
  );
};

const CustomerMyShipments = ({ onTrack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await api.get('/api/customer/my-shipments');
      setShipments(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching my shipments:', err);
      setError('Failed to load your shipments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShipments();
  };

  const handlePress = (item) => {
    if (!item.trackingAllowed) {
      // Still navigate — CustomerTrackingScreen re-verifies with the
      // server and shows the "tracking not available" state itself,
      // rather than duplicating that decision here.
    }
    onTrack?.(item);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your shipments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ShipmentCard item={item} index={index} onPress={handlePress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <FadeInView style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No shipments yet</Text>
            <Text style={styles.emptySubtext}>
              {error || "Shipments a vendor associates with you will show up here."}
            </Text>
          </FadeInView>
        }
      />
    </View>
  );
};

export default CustomerMyShipments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.muted,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    ...typography.captionMedium,
  },
  vendorText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  footerRow: {
    marginTop: spacing.sm,
  },
  trackingText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

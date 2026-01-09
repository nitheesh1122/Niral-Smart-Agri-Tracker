/**
 * CustomerDashboard - Real customer home screen with dashboard data
 * Shows stats, nearby deliveries, and quick actions
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import ThemedCard from '../../components/ThemedCard';
import ThemedButton from '../../components/ThemedButton';

const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DeliveryCard = ({ item, onTrack }) => (
  <ThemedCard variant="elevated" style={styles.deliveryCard}>
    <View style={styles.deliveryHeader}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
        <Text style={styles.statusText}>Active</Text>
      </View>
    </View>
    <Text style={styles.vendorName}>🏪 {item.vendorId?.name || 'Vendor'}</Text>
    <Text style={styles.driverName}>🚚 {item.driver?.name || 'Driver'}</Text>
    <View style={styles.deliveryFooter}>
      <Text style={styles.routeText}>
        📍 {item.routes?.slice(0, 2).join(' → ') || 'Route unavailable'}
      </Text>
      <TouchableOpacity style={styles.trackButton} onPress={() => onTrack(item)}>
        <Text style={styles.trackButtonText}>Track →</Text>
      </TouchableOpacity>
    </View>
  </ThemedCard>
);

const CustomerDashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    customer: { name: 'Customer' },
    stats: { totalVendors: 0, activeDeliveries: 0, nearbyDeliveries: 0 },
    nearbyExports: [],
  });

  const fetchDashboard = useCallback(async () => {
    try {
      const customerId = await AsyncStorage.getItem('userId');
      if (!customerId) {
        setError('User not logged in');
        return;
      }

      const response = await axios.get(
        `http://${IPADD}:5000/api/customer/dashboard/${customerId}`
      );
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const handleTrack = (item) => {
    // Navigate to tracking screen (to be implemented)
    console.log('Track item:', item._id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <ThemedButton title="Retry" onPress={fetchDashboard} variant="outline" />
      </View>
    );
  }

  const { customer, stats, nearbyExports } = dashboardData;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{customer.name} 👋</Text>
        <Text style={styles.locationText}>
          📍 {customer.district}, {customer.state}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="🏪"
          value={stats.totalVendors}
          label="Vendors"
          color={colors.primary}
        />
        <StatCard
          icon="🚚"
          value={stats.activeDeliveries}
          label="Active"
          color={colors.success}
        />
        <StatCard
          icon="📍"
          value={stats.nearbyDeliveries}
          label="Nearby"
          color={colors.secondary}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('viewGoods')}
          >
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>Browse Goods</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('chat')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby Deliveries */}
      <View style={styles.deliveriesSection}>
        <Text style={styles.sectionTitle}>🚚 Deliveries Near You</Text>
        {nearbyExports.length > 0 ? (
          nearbyExports.map((item) => (
            <DeliveryCard key={item._id} item={item} onTrack={handleTrack} />
          ))
        ) : (
          <ThemedCard variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No active deliveries in your area</Text>
            <Text style={styles.emptySubtext}>Check back later for updates</Text>
          </ThemedCard>
        )}
      </View>
    </ScrollView>
  );
};

export default CustomerDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.dark,
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  welcomeSection: {
    padding: spacing.lg,
    backgroundColor: colors.background.dark,
    paddingTop: spacing.xl,
  },
  welcomeText: {
    ...typography.body,
    color: colors.text.muted,
  },
  userName: {
    ...typography.h2,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginTop: -spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    marginHorizontal: spacing.xs,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.dark,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  actionsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadows.small,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    color: colors.text.dark,
    fontWeight: '600',
  },
  deliveriesSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  deliveryCard: {
    marginBottom: spacing.md,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemName: {
    ...typography.h3,
    color: colors.text.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
  },
  vendorName: {
    ...typography.bodySmall,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  driverName: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  routeText: {
    ...typography.caption,
    color: colors.text.muted,
    flex: 1,
  },
  trackButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  trackButtonText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.dark,
    fontWeight: '500',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});

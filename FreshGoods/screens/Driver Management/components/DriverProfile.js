/**
 * DriverProfile - Enhanced profile screen with work history and stats
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const DriverProfile = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driver, setDriver] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [recentExports, setRecentExports] = useState([]);

  const fetchDriverData = useCallback(async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) return;

      // Fetch driver profile
      const profileRes = await axios.get(`http://${IPADD}:5000/api/driver/profile/${driverId}`);
      setDriver(profileRes.data);

      // Fetch exports for stats
      const exportsRes = await axios.get(`http://${IPADD}:5000/api/driver/export/driver/${driverId}`);
      const exports = exportsRes.data || [];

      // Calculate stats
      setStats({
        total: exports.length,
        completed: exports.filter(e => e.status === 'Completed').length,
        inProgress: exports.filter(e => e.status === 'Started').length,
        pending: exports.filter(e => e.status === 'Pending' && e.driverResponse === 'accepted').length,
      });

      // Recent exports (last 5 completed)
      setRecentExports(
        exports
          .filter(e => e.status === 'Completed')
          .slice(0, 5)
      );

    } catch (err) {
      console.error('Error fetching driver data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDriverData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver?.name?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
        <Text style={styles.name}>{driver?.name || 'Driver'}</Text>
        <Text style={styles.email}>{driver?.email}</Text>
        <Text style={styles.phone}>📞 {driver?.mobileNo}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#d4edda' }]}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff3cd' }]}>
          <Text style={styles.statValue}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f8d7da' }]}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Driver Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>🚚 Driver Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>License No:</Text>
          <Text style={styles.infoValue}>{driver?.licenseNo || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>State:</Text>
          <Text style={styles.infoValue}>{driver?.state || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>District:</Text>
          <Text style={styles.infoValue}>{driver?.district || 'N/A'}</Text>
        </View>
      </View>

      {/* Recent Deliveries */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>📋 Recent Deliveries</Text>
        {recentExports.length === 0 ? (
          <Text style={styles.emptyText}>No completed deliveries yet</Text>
        ) : (
          recentExports.map((exp, index) => (
            <View key={exp._id || index} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <Text style={styles.deliveryItem}>📦 {exp.itemName}</Text>
                <Text style={styles.completedBadge}>✓ Done</Text>
              </View>
              <Text style={styles.deliveryDate}>
                {new Date(exp.endDate).toLocaleDateString()}
              </Text>
              <Text style={styles.deliveryVendor}>
                Vendor: {exp.vendorId?.name || 'N/A'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default DriverProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.muted,
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    ...shadows.small,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    ...typography.h2,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  phone: {
    ...typography.body,
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text.dark,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.muted,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.dark,
    fontWeight: '600',
  },
  recentSection: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  deliveryCard: {
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryItem: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.dark,
  },
  completedBadge: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
  },
  deliveryDate: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  deliveryVendor: {
    ...typography.caption,
    color: colors.text.muted,
  },
});

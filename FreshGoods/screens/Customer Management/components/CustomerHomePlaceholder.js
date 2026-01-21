/**
 * CustomerDashboard.js (formerly CustomerHomePlaceholder.js)
 * Premium customer dashboard with animations and real-time data
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { IPADD } from '../../ipadd';
import {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
  shadows,
  getStatusColor,
  getStatusBgColor,
} from '../../theme';
import ThemedCard from '../../components/ThemedCard';
import {
  SlideInView,
  FadeInView,
  AnimatedCounter,
  AnimatedPressable,
  PulseView,
} from '../../components/AnimatedComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const StatCard = ({ icon, value, label, color, gradient, delay = 0 }) => (
  <SlideInView delay={delay} style={[styles.statCard, { borderLeftColor: color }]}>
    <LinearGradient
      colors={gradient || [color + '15', color + '05']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <AnimatedCounter
        value={value}
        duration={1500}
        style={[styles.statValue, { color: color }]}
      />
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </SlideInView>
);

// ═══════════════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════
const QuickActionButton = ({ icon, label, color, onPress, delay = 0 }) => (
  <SlideInView delay={delay}>
    <AnimatedPressable onPress={onPress} style={styles.actionButton}>
      <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </AnimatedPressable>
  </SlideInView>
);

// ═══════════════════════════════════════════════════════════════════
// DELIVERY CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const DeliveryCard = ({ item, onTrack, delay = 0 }) => {
  const statusColor = getStatusColor(item.status);
  const statusBg = getStatusBgColor(item.status);

  return (
    <SlideInView delay={delay}>
      <ThemedCard variant="elevated" style={styles.deliveryCard}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status || 'Active'}
          </Text>
        </View>

        {/* Product Info */}
        <View style={styles.deliveryHeader}>
          <View style={styles.productIcon}>
            <Text style={styles.productEmoji}>📦</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.itemName || 'Goods Shipment'}
            </Text>
            <Text style={styles.vendorName}>
              🏪 {item.vendorId?.name || 'Vendor'}
            </Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.startLocation?.name || item.routes?.[0] || 'Origin'}
            </Text>
          </View>
          <View style={styles.routeLine}>
            <View style={styles.routeLineDashed} />
          </View>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: colors.error }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.endLocation?.name || item.routes?.[item.routes?.length - 1] || 'Destination'}
            </Text>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverContainer}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverIcon}>🚚</Text>
            <Text style={styles.driverName}>{item.driver?.name || 'Driver assigned'}</Text>
          </View>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => onTrack(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trackButtonGradient}
            >
              <Text style={styles.trackButtonText}>Track →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ThemedCard>
    </SlideInView>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const CustomerDashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    customer: { name: 'Customer' },
    stats: { totalVendors: 0, activeDeliveries: 0, nearbyDeliveries: 0 },
    nearbyExports: [],
  });

  const scrollY = useRef(new Animated.Value(0)).current;

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
      // Use mock data for demo if API fails
      setDashboardData({
        customer: { name: 'Customer', district: 'Unknown', state: 'TN' },
        stats: { totalVendors: 5, activeDeliveries: 2, nearbyDeliveries: 3 },
        nearbyExports: [],
      });
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
    // Navigate to tracking screen
    console.log('Track item:', item._id);
    onNavigate?.('tracking', { exportId: item._id, exportData: item });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PulseView>
          <View style={styles.loadingIcon}>
            <Text style={styles.loadingEmoji}>🌱</Text>
          </View>
        </PulseView>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const { customer, stats, nearbyExports } = dashboardData;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Welcome Section */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <LinearGradient
            colors={gradients.forest}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeSection}
          >
            <FadeInView duration={500}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{customer.name} 👋</Text>
              <View style={styles.locationBadge}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>
                  {customer.district || 'Location'}, {customer.state || 'TN'}
                </Text>
              </View>
            </FadeInView>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="🏪"
            value={stats.totalVendors || 0}
            label="Vendors"
            color={colors.primary}
            delay={0}
          />
          <StatCard
            icon="🚚"
            value={stats.activeDeliveries || 0}
            label="Active"
            color={colors.tertiary}
            delay={100}
          />
          <StatCard
            icon="📍"
            value={stats.nearbyDeliveries || 0}
            label="Nearby"
            color={colors.accent}
            delay={200}
          />
        </View>

        {/* Quick Actions */}
        <FadeInView delay={300} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionButton
              icon="🛒"
              label="Browse Goods"
              color={colors.primary}
              onPress={() => onNavigate?.('viewGoods')}
              delay={0}
            />
            <QuickActionButton
              icon="💬"
              label="Chat"
              color={colors.accent}
              onPress={() => onNavigate?.('chat')}
              delay={50}
            />
            <QuickActionButton
              icon="👤"
              label="Profile"
              color={colors.tertiary}
              onPress={() => onNavigate?.('profile')}
              delay={100}
            />
            <QuickActionButton
              icon="📦"
              label="Orders"
              color={colors.secondary}
              onPress={() => onNavigate?.('viewGoods')}
              delay={150}
            />
          </View>
        </FadeInView>

        {/* Active Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚚 Deliveries Near You</Text>
            {nearbyExports.length > 0 && (
              <TouchableOpacity onPress={() => onNavigate?.('viewGoods')}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {nearbyExports.length > 0 ? (
            nearbyExports.slice(0, 3).map((item, index) => (
              <DeliveryCard
                key={item._id || index}
                item={item}
                onTrack={handleTrack}
                delay={index * 100}
              />
            ))
          ) : (
            <FadeInView delay={400}>
              <ThemedCard variant="outlined" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for updates on deliveries in your area
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => onNavigate?.('viewGoods')}
                >
                  <Text style={styles.browseButtonText}>Browse Available Goods</Text>
                </TouchableOpacity>
              </ThemedCard>
            </FadeInView>
          )}
        </View>

        {/* Tips Card */}
        <FadeInView delay={500} style={styles.section}>
          <ThemedCard variant="gradient" style={styles.tipsCard}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsTitle}>Pro Tip</Text>
            <Text style={styles.tipsText}>
              Enable notifications to get real-time updates about your deliveries!
            </Text>
          </ThemedCard>
        </FadeInView>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingEmoji: {
    fontSize: 40,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.muted,
  },
  welcomeSection: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    ...typography.h1,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.light,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: -spacing.xl - spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...shadows.md,
  },
  statGradient: {
    backgroundColor: colors.background.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.stat,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xxs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  seeAllLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 3) / 4,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  deliveryCard: {
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  productEmoji: {
    fontSize: 22,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.h4,
    color: colors.text.primary,
  },
  vendorName: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: 2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  routeText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  routeLine: {
    width: 40,
    alignItems: 'center',
  },
  routeLineDashed: {
    width: 30,
    height: 2,
    backgroundColor: colors.border.medium,
    borderRadius: 1,
  },
  driverContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  driverName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  trackButton: {
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  trackButtonGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  trackButtonText: {
    ...typography.buttonSmall,
    color: colors.text.light,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  browseButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.round,
  },
  browseButtonText: {
    ...typography.buttonSmall,
    color: colors.primary,
  },
  tipsCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  tipsIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...typography.h4,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default CustomerDashboard;

/**
 * DriverHomePlaceholder.js
 * Premium driver dashboard with ongoing export and quick actions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
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
} from '../../theme';
import ThemedCard from '../../components/ThemedCard';
import ThemedButton from '../../components/ThemedButton';
import {
  SlideInView,
  FadeInView,
  PulseView,
  AnimatedProgressBar,
} from '../../components/AnimatedComponents';

import DriverExportHealth from './placeholdersubcomponents/DriverExportHealth';
import DriverRouteMap from './placeholdersubcomponents/DriverRouteMap';

// ═══════════════════════════════════════════════════════════════════
// INFO CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════
const InfoChip = ({ icon, label, value }) => (
  <View style={styles.infoChip}>
    <Text style={styles.infoChipIcon}>{icon}</Text>
    <View>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value}</Text>
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════
const QuickAction = ({ icon, label, color, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.quickAction, disabled && styles.quickActionDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
      <Text style={styles.quickActionEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const DriverHomePlaceholder = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);
  const [ongoingExport, setOngoingExport] = useState(null);
  const [driverName, setDriverName] = useState('Driver');
  const [screen, setScreen] = useState('home'); // 'home' | 'health' | 'route'

  const fetchStartedExport = async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      if (name) setDriverName(name);
      if (!driverId) return;

      const res = await axios.get(
        `http://${IPADD}:5000/api/driver/export/driver/${driverId}`
      );
      const started = res.data.find((exp) => exp.status === 'Started');
      setOngoingExport(started || null);
    } catch (err) {
      console.error('Error fetching ongoing export:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStartedExport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStartedExport();
  };

  const handleEndTrip = async () => {
    if (!ongoingExport) return;

    Alert.alert(
      '🏁 Complete Delivery',
      'Are you sure you want to mark this delivery as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            setEndingTrip(true);
            try {
              await axios.put(
                `http://${IPADD}:5000/api/driver/export/complete/${ongoingExport._id}`
              );
              Alert.alert('Success! 🎉', 'Delivery completed successfully!');
              setOngoingExport(null);
            } catch (err) {
              console.error('Failed to end trip:', err);
              Alert.alert('Error', 'Failed to complete delivery');
            } finally {
              setEndingTrip(false);
            }
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getProgress = () => {
    // Simulate progress based on dates
    if (!ongoingExport) return 0;
    const start = new Date(ongoingExport.startDate).getTime();
    const end = new Date(ongoingExport.endDate).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 10), 90);
  };

  // Sub-screens
  if (screen === 'health' && ongoingExport) {
    return (
      <DriverExportHealth
        exportId={ongoingExport._id}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'route' && ongoingExport) {
    return (
      <DriverRouteMap
        exportId={ongoingExport._id}
        onBack={() => setScreen('home')}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PulseView>
          <View style={styles.loadingIcon}>
            <Text style={styles.loadingEmoji}>🚚</Text>
          </View>
        </PulseView>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // No ongoing export
  if (!ongoingExport) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <FadeInView>
          <LinearGradient
            colors={gradients.forest}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.welcomeName}>{driverName} 👋</Text>
          </LinearGradient>
        </FadeInView>

        <SlideInView delay={100}>
          <ThemedCard variant="elevated" style={styles.noTripCard}>
            <Text style={styles.noTripIcon}>📭</Text>
            <Text style={styles.noTripTitle}>No Active Trips</Text>
            <Text style={styles.noTripSubtext}>
              You don't have any ongoing deliveries. Check your assigned exports
              or refresh to see new assignments.
            </Text>
            <ThemedButton
              title="Refresh"
              variant="gradient"
              icon="🔄"
              onPress={onRefresh}
              loading={refreshing}
              style={{ marginTop: spacing.lg }}
            />
          </ThemedCard>
        </SlideInView>
      </ScrollView>
    );
  }

  // Ongoing export dashboard
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <FadeInView>
        <LinearGradient
          colors={gradients.forest}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerLabel}>CURRENT TRIP</Text>
          <Text style={styles.headerTitle}>{ongoingExport.itemName}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Delivery Progress</Text>
              <Text style={styles.progressPercent}>
                {Math.round(getProgress())}%
              </Text>
            </View>
            <AnimatedProgressBar
              progress={getProgress()}
              color="#fff"
              backgroundColor="rgba(255,255,255,0.3)"
              height={6}
            />
          </View>
        </LinearGradient>
      </FadeInView>

      {/* Trip Info Card */}
      <SlideInView delay={100}>
        <ThemedCard variant="elevated" style={styles.tripCard}>
          <View style={styles.tripInfoGrid}>
            <InfoChip
              icon="📅"
              label="Start Date"
              value={new Date(ongoingExport.startDate).toLocaleDateString()}
            />
            <InfoChip
              icon="🏁"
              label="End Date"
              value={new Date(ongoingExport.endDate).toLocaleDateString()}
            />
            <InfoChip
              icon="📊"
              label="Quantity"
              value={`${ongoingExport.quantity} units`}
            />
            <InfoChip
              icon="📍"
              label="Status"
              value={ongoingExport.status}
            />
          </View>
        </ThemedCard>
      </SlideInView>

      {/* Quick Actions */}
      <SlideInView delay={200}>
        <ThemedCard variant="elevated" style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="🍎"
              label="Monitor Health"
              color={colors.error}
              onPress={() => setScreen('health')}
            />
            <QuickAction
              icon="🗺️"
              label="View Route"
              color={colors.accent}
              onPress={() => setScreen('route')}
            />
            <QuickAction
              icon="📞"
              label="Contact Vendor"
              color={colors.tertiary}
              onPress={() => Alert.alert('Contact', 'Calling vendor...')}
            />
            <QuickAction
              icon="⚠️"
              label="Report Issue"
              color={colors.warning}
              onPress={() => Alert.alert('Report', 'Issue reporting coming soon')}
            />
          </View>
        </ThemedCard>
      </SlideInView>

      {/* Complete Trip Button */}
      <FadeInView delay={300} style={styles.endTripContainer}>
        <ThemedButton
          title={endingTrip ? 'Completing...' : '🏁 Complete Delivery'}
          variant="danger"
          size="large"
          fullWidth
          onPress={handleEndTrip}
          loading={endingTrip}
        />
        <Text style={styles.endTripHint}>
          Only mark as complete when delivery is finished
        </Text>
      </FadeInView>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    backgroundColor: colors.primaryLight + '20',
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
  emptyContainer: {
    flexGrow: 1,
    padding: spacing.md,
  },
  welcomeCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  welcomeName: {
    ...typography.h1,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  noTripCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noTripIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  noTripTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  noTripSubtext: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerLabel: {
    ...typography.overline,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.light,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressPercent: {
    ...typography.bodySmallMedium,
    color: colors.text.light,
  },
  tripCard: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.xl,
  },
  tripInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoChip: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoChipIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoChipLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  infoChipValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  actionsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 20,
  },
  quickActionLabel: {
    ...typography.bodySmallMedium,
    color: colors.text.primary,
    flex: 1,
  },
  endTripContainer: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  endTripHint: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default DriverHomePlaceholder;

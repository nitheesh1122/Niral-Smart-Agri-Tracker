/**
 * VendorHomePlaceHolder.js
 * Premium vendor dashboard with analytics and export management
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { IPADD } from '../../ipadd';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  PulseView,
} from '../../components/AnimatedComponents';
import MonitorHealthView from './vendorHomeComponents/monitorHealthView';
import ExportLocationView from './vendorHomeComponents/exportLocationView';

// ═══════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const StatCard = ({ icon, value, label, color, delay = 0 }) => (
  <SlideInView delay={delay} style={styles.statCard}>
    <View style={[styles.statIconBg, { backgroundColor: color + '15' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
    </View>
    <AnimatedCounter
      value={value}
      duration={1200}
      style={[styles.statValue, { color }]}
    />
    <Text style={styles.statLabel}>{label}</Text>
  </SlideInView>
);

// ═══════════════════════════════════════════════════════════════════
// EXPORT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const ExportCard = ({ item, onPress, onMonitor, onViewLocation, isExpanded }) => {
  const statusColor = getStatusColor(item.status);
  const statusBg = getStatusBgColor(item.status);

  return (
    <ThemedCard
      variant="elevated"
      style={styles.exportCard}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.exportHeader}>
        <View style={styles.exportTitleSection}>
          <Text style={styles.exportTitle}>📦 {item.itemName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Info */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Driver</Text>
          <Text style={styles.summaryValue}>{item.driver?.name || 'N/A'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vehicle</Text>
          <Text style={styles.summaryValue}>{item.vehicle?.vehicleNumber || 'N/A'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Qty</Text>
          <Text style={styles.summaryValue}>{item.quantity}</Text>
        </View>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <FadeInView style={styles.expandedSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📅 Start</Text>
              <Text style={styles.detailValue}>
                {new Date(item.startDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>🏁 End</Text>
              <Text style={styles.detailValue}>
                {new Date(item.endDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>💰 Cost</Text>
              <Text style={styles.detailValue}>₹{item.costPrice}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>💵 Sale</Text>
              <Text style={styles.detailValue}>₹{item.salePrice}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeSection}>
            <Text style={styles.routeTitle}>🛣️ Route</Text>
            <View style={styles.routeList}>
              {item.routes?.map((route, idx) => (
                <View key={idx} style={styles.routeItem}>
                  <View style={styles.routeDot} />
                  <Text style={styles.routeText}>{route}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={onMonitor}
            >
              <Text style={styles.actionBtnIcon}>📊</Text>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                Monitor Health
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]}
              onPress={onViewLocation}
            >
              <Text style={styles.actionBtnIcon}>📍</Text>
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>
                View Location
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      )}

      {/* Expand Indicator */}
      <View style={styles.expandIndicator}>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </View>
    </ThemedCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const VendorHomePlaceHolder = () => {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeView, setActiveView] = useState('main');
  const [selectedExport, setSelectedExport] = useState(null);
  const [vendorName, setVendorName] = useState('Vendor');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    revenue: 0,
  });

  const fetchExports = useCallback(async () => {
    try {
      const vendorId = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      if (name) setVendorName(name);

      const res = await axios.get(
        `http://${IPADD}:5000/api/vendor/export/passedstatus/${vendorId}`
      );
      const exportData = res.data || [];
      setExports(exportData);

      // Calculate stats
      setStats({
        total: exportData.length,
        active: exportData.filter((e) => e.status === 'Started').length,
        completed: exportData.filter((e) => e.status === 'Completed').length,
        revenue: exportData.reduce((sum, e) => sum + (e.salePrice || 0), 0),
      });
    } catch (error) {
      console.error('Failed to fetch export data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExports();
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleMonitorHealth = (exp) => {
    setSelectedExport(exp);
    setActiveView('monitor');
  };

  const handleViewLocation = (exp) => {
    setSelectedExport(exp);
    setActiveView('location');
  };

  const handleBack = () => {
    setSelectedExport(null);
    setActiveView('main');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Sub-views
  if (activeView === 'monitor' && selectedExport) {
    return <MonitorHealthView selectedExport={selectedExport} onBack={handleBack} />;
  }
  if (activeView === 'location' && selectedExport) {
    return <ExportLocationView selectedExport={selectedExport} onBack={handleBack} />;
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PulseView>
          <View style={styles.loadingIcon}>
            <Text style={styles.loadingEmoji}>🏪</Text>
          </View>
        </PulseView>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Welcome Header */}
        <FadeInView>
          <LinearGradient
            colors={gradients.forest}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.welcomeName}>{vendorName} 👋</Text>
            <Text style={styles.headerSubtext}>Here's your business overview</Text>
          </LinearGradient>
        </FadeInView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="📦"
            value={stats.total}
            label="Total Exports"
            color={colors.primary}
            delay={0}
          />
          <StatCard
            icon="🚚"
            value={stats.active}
            label="Active"
            color={colors.tertiary}
            delay={100}
          />
          <StatCard
            icon="✅"
            value={stats.completed}
            label="Completed"
            color={colors.success}
            delay={200}
          />
          <StatCard
            icon="💰"
            value={stats.revenue}
            label="Revenue"
            color={colors.accent}
            delay={300}
          />
        </View>

        {/* Exports List */}
        <View style={styles.exportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Active Exports</Text>
            <Text style={styles.exportCount}>{exports.length} total</Text>
          </View>

          {exports.length === 0 ? (
            <FadeInView>
              <ThemedCard variant="outlined" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Exports</Text>
                <Text style={styles.emptySubtext}>
                  Create a new export to get started
                </Text>
              </ThemedCard>
            </FadeInView>
          ) : (
            exports.map((item, index) => (
              <SlideInView key={item._id} delay={index * 80}>
                <ExportCard
                  item={item}
                  isExpanded={expandedIndex === index}
                  onPress={() => toggleExpand(index)}
                  onMonitor={() => handleMonitorHealth(item)}
                  onViewLocation={() => handleViewLocation(item)}
                />
              </SlideInView>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
  headerSubtext: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.sm,
    marginTop: -spacing.xl,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    ...typography.stat,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xxs,
  },
  exportsSection: {
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
  exportCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  exportCard: {
    marginBottom: spacing.md,
  },
  exportHeader: {
    marginBottom: spacing.md,
  },
  exportTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportTitle: {
    ...typography.h4,
    color: colors.primary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  summaryValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: 2,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  detailItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: 2,
  },
  routeSection: {
    marginBottom: spacing.md,
  },
  routeTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  routeList: {
    paddingLeft: spacing.sm,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  routeText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  actionBtnIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  actionBtnText: {
    ...typography.buttonSmall,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  expandIcon: {
    color: colors.text.muted,
    fontSize: 12,
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
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default VendorHomePlaceHolder;
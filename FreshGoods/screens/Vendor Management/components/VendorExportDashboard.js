/**
 * VendorExportDashboard.js
 * Enhanced export management dashboard with filter tabs and status updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import ThemedButton from '../../components/ThemedButton';
import {
    SlideInView,
    FadeInView,
    AnimatedCounter,
} from '../../components/AnimatedComponents';

// ═══════════════════════════════════════════════════════════════════
// FILTER TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════
const FilterTab = ({ label, isActive, onPress, count, color }) => (
    <TouchableOpacity
        style={[
            styles.filterTab,
            isActive && { backgroundColor: color, borderColor: color },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
            {label}
        </Text>
        <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                {count}
            </Text>
        </View>
    </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════
// EXPORT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const ExportCard = ({ item, onStart, onComplete, index }) => {
    const statusColor = getStatusColor(item.status);
    const statusBg = getStatusBgColor(item.status);
    const canStart = item.status === 'Assigned' && item.driverResponse === 'accepted';
    const canComplete = item.status === 'Started';

    return (
        <SlideInView delay={index * 80}>
            <ThemedCard variant="elevated" style={styles.exportCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                        <Text style={styles.cardTitle}>📦 {item.itemName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Driver</Text>
                        <Text style={styles.infoValue}>{item.driver?.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Vehicle</Text>
                        <Text style={styles.infoValue}>{item.vehicle?.vehicleNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Quantity</Text>
                        <Text style={styles.infoValue}>{item.quantity}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>End Date</Text>
                        <Text style={styles.infoValue}>
                            {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Route Preview */}
                {item.routes && item.routes.length > 0 && (
                    <View style={styles.routePreview}>
                        <Text style={styles.routeIcon}>🛣️</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                            {item.routes[0]} → {item.routes[item.routes.length - 1]}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                    {canStart && (
                        <ThemedButton
                            title="Start Delivery"
                            variant="success"
                            size="small"
                            icon="🚀"
                            onPress={() => onStart(item)}
                            style={styles.actionBtn}
                        />
                    )}
                    {canComplete && (
                        <ThemedButton
                            title="Mark Complete"
                            variant="primary"
                            size="small"
                            icon="✅"
                            onPress={() => onComplete(item)}
                            style={styles.actionBtn}
                        />
                    )}
                    {!canStart && !canComplete && (
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusInfoText}>
                                {item.status === 'Pending'
                                    ? 'Waiting for driver acceptance'
                                    : item.status === 'Completed'
                                        ? 'Delivery completed'
                                        : 'No action available'}
                            </Text>
                        </View>
                    )}
                </View>
            </ThemedCard>
        </SlideInView>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const VendorExportDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exports, setExports] = useState([]);
    const [filteredExports, setFilteredExports] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        assigned: 0,
        started: 0,
        completed: 0,
    });

    const fetchExports = useCallback(async () => {
        try {
            const vendorId = await AsyncStorage.getItem('userId');
            if (!vendorId) return;

            const response = await axios.get(
                `http://${IPADD}:5000/api/vendor/exports/${vendorId}`
            );
            const data = response.data || [];
            setExports(data);
            setFilteredExports(data);

            // Calculate stats
            setStats({
                total: data.length,
                pending: data.filter((e) => e.status === 'Pending').length,
                assigned: data.filter((e) => e.status === 'Assigned').length,
                started: data.filter((e) => e.status === 'Started').length,
                completed: data.filter((e) => e.status === 'Completed').length,
            });
        } catch (err) {
            console.error('Error fetching exports:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchExports();
    }, [fetchExports]);

    // Apply filter
    useEffect(() => {
        if (activeFilter === 'all') {
            setFilteredExports(exports);
        } else {
            setFilteredExports(
                exports.filter((e) => e.status?.toLowerCase() === activeFilter)
            );
        }
    }, [activeFilter, exports]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchExports();
    };

    const handleStart = async (item) => {
        Alert.alert(
            'Start Delivery',
            `Are you sure you want to start delivery for "${item.itemName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    onPress: async () => {
                        try {
                            await axios.put(
                                `http://${IPADD}:5000/api/vendor/export/start/${item._id}`
                            );
                            Alert.alert('Success', 'Delivery started!');
                            fetchExports();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to start delivery');
                        }
                    },
                },
            ]
        );
    };

    const handleComplete = async (item) => {
        Alert.alert(
            'Complete Delivery',
            `Mark "${item.itemName}" as completed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    onPress: async () => {
                        try {
                            await axios.put(
                                `http://${IPADD}:5000/api/vendor/export/complete/${item._id}`
                            );
                            Alert.alert('Success', 'Delivery completed!');
                            fetchExports();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to complete delivery');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading exports...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <FadeInView>
                <LinearGradient
                    colors={gradients.forest}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Export Dashboard</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <AnimatedCounter
                                value={stats.total}
                                duration={1000}
                                style={styles.statValue}
                            />
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statItem}>
                            <AnimatedCounter
                                value={stats.started}
                                duration={1000}
                                style={styles.statValue}
                            />
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statItem}>
                            <AnimatedCounter
                                value={stats.completed}
                                duration={1000}
                                style={styles.statValue}
                            />
                            <Text style={styles.statLabel}>Done</Text>
                        </View>
                    </View>
                </LinearGradient>
            </FadeInView>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { key: 'all', label: 'All', count: stats.total, color: colors.primary },
                        { key: 'pending', label: 'Pending', count: stats.pending, color: colors.warning },
                        { key: 'assigned', label: 'Assigned', count: stats.assigned, color: colors.info },
                        { key: 'started', label: 'In Transit', count: stats.started, color: colors.tertiary },
                        { key: 'completed', label: 'Completed', count: stats.completed, color: colors.success },
                    ]}
                    renderItem={({ item }) => (
                        <FilterTab
                            label={item.label}
                            count={item.count}
                            color={item.color}
                            isActive={activeFilter === item.key}
                            onPress={() => setActiveFilter(item.key)}
                        />
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Export List */}
            <FlatList
                data={filteredExports}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <ExportCard
                        item={item}
                        index={index}
                        onStart={handleStart}
                        onComplete={handleComplete}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <FadeInView style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Exports Found</Text>
                        <Text style={styles.emptySubtext}>
                            {activeFilter !== 'all'
                                ? 'Try selecting a different filter'
                                : 'Create a new export to get started'}
                        </Text>
                    </FadeInView>
                }
            />
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
    loadingText: {
        ...typography.body,
        color: colors.text.muted,
        marginTop: spacing.md,
    },
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text.light,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...typography.h1,
        color: colors.text.light,
    },
    statLabel: {
        ...typography.caption,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: spacing.xxs,
    },
    filterContainer: {
        marginTop: -spacing.md,
        marginBottom: spacing.sm,
    },
    filterList: {
        paddingHorizontal: spacing.md,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.round,
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.border.light,
        ...shadows.sm,
    },
    filterTabText: {
        ...typography.bodySmall,
        color: colors.text.secondary,
    },
    filterTabTextActive: {
        color: colors.text.light,
        fontWeight: '600',
    },
    filterBadge: {
        marginLeft: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.round,
        backgroundColor: colors.border.light,
    },
    filterBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    filterBadgeText: {
        ...typography.caption,
        color: colors.text.muted,
    },
    filterBadgeTextActive: {
        color: colors.text.light,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xxl,
    },
    exportCard: {
        marginBottom: spacing.md,
    },
    cardHeader: {
        marginBottom: spacing.md,
    },
    cardTitleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
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
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
    },
    infoItem: {
        width: '50%',
        paddingVertical: spacing.xs,
    },
    infoLabel: {
        ...typography.caption,
        color: colors.text.muted,
    },
    infoValue: {
        ...typography.bodyMedium,
        color: colors.text.primary,
        marginTop: 2,
    },
    routePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    routeIcon: {
        fontSize: 14,
        marginRight: spacing.sm,
    },
    routeText: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        flex: 1,
    },
    cardActions: {
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        paddingTop: spacing.md,
    },
    actionBtn: {
        flex: 1,
    },
    statusInfo: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    statusInfoText: {
        ...typography.bodySmall,
        color: colors.text.muted,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyIcon: {
        fontSize: 56,
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
    },
});

export default VendorExportDashboard;

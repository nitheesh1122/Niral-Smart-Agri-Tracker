/**
 * VendorExportDashboard - Shows all exports with status and workflow controls
 * Vendor can see driver response, start exports, and complete them
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const STATUS_TABS = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'started', label: 'In Progress', icon: '🚚' },
    { key: 'completed', label: 'Completed', icon: '🎉' },
];

const VendorExportDashboard = () => {
    const [exports, setExports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        started: 0,
        completed: 0,
    });

    const fetchExports = useCallback(async () => {
        try {
            const vendorId = await AsyncStorage.getItem('userId');
            if (!vendorId) return;

            const res = await axios.get(`http://${IPADD}:5000/api/vendor/exports/${vendorId}`);
            const data = res.data || [];
            setExports(data);

            // Calculate stats
            setStats({
                total: data.length,
                pending: data.filter(e => e.driverResponse === 'pending').length,
                accepted: data.filter(e => e.driverResponse === 'accepted' && e.status === 'Pending').length,
                started: data.filter(e => e.status === 'Started').length,
                completed: data.filter(e => e.status === 'Completed').length,
            });
        } catch (err) {
            console.error('Failed to fetch exports:', err);
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

    const handleStartExport = async (exportId) => {
        Alert.alert('Start Export', 'Are you sure you want to start this export?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Start',
                onPress: async () => {
                    setActionLoading(exportId);
                    try {
                        await axios.put(`http://${IPADD}:5000/api/vendor/export/start/${exportId}`);
                        Alert.alert('Success', 'Export started!');
                        fetchExports();
                    } catch (err) {
                        Alert.alert('Error', err.response?.data?.error || 'Failed to start export');
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const handleCompleteExport = async (exportId) => {
        Alert.alert('Complete Export', 'Mark this export as completed?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Complete',
                onPress: async () => {
                    setActionLoading(exportId);
                    try {
                        await axios.put(`http://${IPADD}:5000/api/vendor/export/complete/${exportId}`);
                        Alert.alert('Success! 🎉', 'Export completed!');
                        fetchExports();
                    } catch (err) {
                        Alert.alert('Error', err.response?.data?.error || 'Failed to complete export');
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const getDriverResponseBadge = (item) => {
        if (item.driverResponse === 'rejected') {
            return { text: '❌ Rejected', color: colors.error };
        }
        if (item.driverResponse === 'accepted') {
            return { text: '✅ Driver Accepted', color: colors.success };
        }
        return { text: '⏳ Awaiting Driver', color: colors.warning };
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Started': return { text: '🚚 In Progress', color: colors.primary };
            case 'Completed': return { text: '🎉 Completed', color: '#6c757d' };
            default: return { text: '📋 Pending', color: colors.warning };
        }
    };

    const filteredExports = exports.filter((exp) => {
        if (activeTab === 'pending') return exp.driverResponse === 'pending';
        if (activeTab === 'accepted') return exp.driverResponse === 'accepted' && exp.status === 'Pending';
        if (activeTab === 'started') return exp.status === 'Started';
        if (activeTab === 'completed') return exp.status === 'Completed';
        return true;
    });

    const renderExportCard = ({ item }) => {
        const driverBadge = getDriverResponseBadge(item);
        const statusBadge = getStatusBadge(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.itemName}>📦 {item.itemName}</Text>
                    <View style={[styles.badge, { backgroundColor: statusBadge.color + '20' }]}>
                        <Text style={[styles.badgeText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.infoText}>🚚 Driver: {item.driver?.name || 'Unassigned'}</Text>
                    <Text style={styles.infoText}>📅 Date: {new Date(item.startDate).toLocaleDateString()}</Text>
                    <Text style={styles.infoText}>📦 Qty: {item.quantity}</Text>

                    {/* Driver Response */}
                    <View style={[styles.responseBadge, { backgroundColor: driverBadge.color + '15' }]}>
                        <Text style={[styles.responseText, { color: driverBadge.color }]}>{driverBadge.text}</Text>
                    </View>

                    {/* Rejection Reason */}
                    {item.driverResponse === 'rejected' && item.rejectionReason && (
                        <Text style={styles.rejectionReason}>Reason: {item.rejectionReason}</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                    {actionLoading === item._id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <>
                            {/* Start Button - only if driver accepted and status is Pending */}
                            {item.driverResponse === 'accepted' && item.status === 'Pending' && (
                                <TouchableOpacity
                                    style={styles.startButton}
                                    onPress={() => handleStartExport(item._id)}
                                >
                                    <Text style={styles.buttonText}>▶ Start Export</Text>
                                </TouchableOpacity>
                            )}

                            {/* Complete Button - only if status is Started */}
                            {item.status === 'Started' && (
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleCompleteExport(item._id)}
                                >
                                    <Text style={styles.buttonText}>✓ Complete</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
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
            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fff3cd' }]}>
                    <Text style={styles.statValue}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#d4edda' }]}>
                    <Text style={styles.statValue}>{stats.started}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#cce5ff' }]}>
                    <Text style={styles.statValue}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Done</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    data={STATUS_TABS}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === item.key && styles.tabActive]}
                            onPress={() => setActiveTab(item.key)}
                        >
                            <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                                {item.icon} {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Export List */}
            <FlatList
                data={filteredExports}
                keyExtractor={(item) => item._id}
                renderItem={renderExportCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No exports found</Text>
                    </View>
                }
            />
        </View>
    );
};

export default VendorExportDashboard;

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
        marginTop: spacing.md,
        color: colors.text.muted,
    },
    statsRow: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    tabsContainer: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    tab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#f0f0f0',
        borderRadius: borderRadius.round,
        marginRight: spacing.sm,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.text.dark,
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.small,
    },
    cardHeader: {
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
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
    },
    badgeText: {
        ...typography.caption,
        fontWeight: 'bold',
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: spacing.sm,
    },
    infoText: {
        ...typography.bodySmall,
        color: colors.text.dark,
        marginBottom: spacing.xs,
    },
    responseBadge: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    responseText: {
        ...typography.bodySmall,
        fontWeight: '600',
        textAlign: 'center',
    },
    rejectionReason: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    cardActions: {
        marginTop: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    startButton: {
        flex: 1,
        backgroundColor: colors.success,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    completeButton: {
        flex: 1,
        backgroundColor: '#6c5ce7',
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        ...typography.body,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.text.muted,
    },
});

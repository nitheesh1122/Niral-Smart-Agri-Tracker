/**
 * NotificationCenter.js
 * View all notifications in one place
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../ipadd';
import {
    colors,
    gradients,
    spacing,
    borderRadius,
    typography,
    shadows,
} from '../theme';
import ThemedCard from './ThemedCard';
import { SlideInView, FadeInView } from './AnimatedComponents';

// Demo notifications (will be replaced with API)
const DEMO_NOTIFICATIONS = [
    {
        _id: '1',
        type: 'delivery',
        title: 'Delivery Started',
        message: 'Your shipment #1234 is now in transit',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
    },
    {
        _id: '2',
        type: 'message',
        title: 'New Message',
        message: 'Vendor ABC sent you a message',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
    },
    {
        _id: '3',
        type: 'alert',
        title: 'Temperature Alert',
        message: 'Goods temperature exceeded threshold',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
    },
    {
        _id: '4',
        type: 'success',
        title: 'Delivery Completed',
        message: 'Shipment #1230 has been delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
    },
];

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════════
const NotificationItem = ({ item, onPress, index }) => {
    const getIcon = () => {
        switch (item.type) {
            case 'delivery':
                return '🚚';
            case 'message':
                return '💬';
            case 'alert':
                return '⚠️';
            case 'success':
                return '✅';
            default:
                return '🔔';
        }
    };

    const getIconBgColor = () => {
        switch (item.type) {
            case 'delivery':
                return colors.primaryLight + '20';
            case 'message':
                return colors.accent + '20';
            case 'alert':
                return colors.warning + '20';
            case 'success':
                return colors.success + '20';
            default:
                return colors.border.light;
        }
    };

    const formatTime = (ts) => {
        const date = new Date(ts);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <SlideInView delay={index * 60}>
            <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
                <ThemedCard
                    variant={item.read ? 'default' : 'elevated'}
                    style={[styles.notificationCard, !item.read && styles.unreadCard]}
                >
                    <View style={styles.notificationContent}>
                        <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
                            <Text style={styles.icon}>{getIcon()}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                                    {item.title}
                                </Text>
                                {!item.read && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.message} numberOfLines={2}>
                                {item.message}
                            </Text>
                            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
                        </View>
                    </View>
                </ThemedCard>
            </TouchableOpacity>
        </SlideInView>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const NotificationCenter = ({ onBack }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            // TODO: Replace with actual API call
            // const userId = await AsyncStorage.getItem('userId');
            // const res = await axios.get(`http://${IPADD}:5000/api/notifications/${userId}`);
            // setNotifications(res.data);

            // For now, use demo data
            await new Promise((r) => setTimeout(r, 500));
            setNotifications(DEMO_NOTIFICATIONS);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = (item) => {
        // Mark as read and navigate based on type
        setNotifications((prev) =>
            prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
        );
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={gradients.forest}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} style={styles.markReadButton}>
                        <Text style={styles.markReadText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <NotificationItem
                        item={item}
                        index={index}
                        onPress={handleNotificationPress}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <FadeInView style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔔</Text>
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtext}>
                            You're all caught up!
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    backIcon: {
        fontSize: 20,
        color: colors.text.light,
        fontWeight: 'bold',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text.light,
    },
    badge: {
        marginLeft: spacing.sm,
        backgroundColor: colors.error,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.round,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        ...typography.captionMedium,
        color: colors.text.light,
    },
    markReadButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    markReadText: {
        ...typography.bodySmall,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    listContent: {
        padding: spacing.md,
    },
    notificationCard: {
        marginBottom: spacing.sm,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    notificationContent: {
        flexDirection: 'row',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    icon: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        ...typography.bodyMedium,
        color: colors.text.primary,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginLeft: spacing.sm,
    },
    message: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        marginTop: 2,
    },
    timestamp: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: spacing.xs,
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
    },
});

export default NotificationCenter;

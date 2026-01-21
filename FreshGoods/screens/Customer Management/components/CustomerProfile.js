/**
 * CustomerProfile.js
 * Full profile management screen with stats, settings, and account info
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Switch,
    Animated,
    KeyboardAvoidingView,
    Platform,
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
import { SlideInView, FadeInView, AnimatedCounter } from '../../components/AnimatedComponents';

// ═══════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const StatCard = ({ icon, value, label, color, delay = 0 }) => (
    <SlideInView delay={delay} style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
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
// INFO ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════
const InfoRow = ({ label, value, icon, onEdit }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <Text style={styles.infoIcon}>{icon}</Text>
            <View>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not set'}</Text>
            </View>
        </View>
        {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ═══════════════════════════════════════════════════════════════════
// SETTINGS ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════
const SettingsRow = ({ label, icon, value, onToggle, type = 'switch' }) => (
    <View style={styles.settingsRow}>
        <View style={styles.settingsLeft}>
            <Text style={styles.settingsIcon}>{icon}</Text>
            <Text style={styles.settingsLabel}>{label}</Text>
        </View>
        {type === 'switch' ? (
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border.light, true: colors.primaryLight }}
                thumbColor={value ? colors.primary : colors.background.card}
            />
        ) : (
            <TouchableOpacity onPress={onToggle}>
                <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const CustomerProfile = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeDeliveries: 0,
        vendors: 0,
    });
    const [settings, setSettings] = useState({
        notifications: true,
        emailUpdates: true,
        locationSharing: false,
    });
    const [editData, setEditData] = useState({
        name: '',
        email: '',
        mobileNo: '',
        address: '',
    });

    const scrollY = useRef(new Animated.Value(0)).current;

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        try {
            const customerId = await AsyncStorage.getItem('userId');
            if (!customerId) return;

            const [profileRes, dashboardRes] = await Promise.all([
                axios.get(`http://${IPADD}:5000/api/users/${customerId}`).catch(() => null),
                axios.get(`http://${IPADD}:5000/api/customer/dashboard/${customerId}`).catch(() => null),
            ]);

            if (profileRes?.data) {
                setCustomer(profileRes.data);
                setEditData({
                    name: profileRes.data.name || '',
                    email: profileRes.data.email || '',
                    mobileNo: profileRes.data.mobileNo || '',
                    address: profileRes.data.address || '',
                });
            }

            if (dashboardRes?.data?.stats) {
                setStats({
                    totalOrders: dashboardRes.data.stats.totalOrders || 0,
                    activeDeliveries: dashboardRes.data.stats.activeDeliveries || 0,
                    vendors: dashboardRes.data.stats.totalVendors || 0,
                });
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const customerId = await AsyncStorage.getItem('userId');
            await axios.put(`http://${IPADD}:5000/api/users/${customerId}`, editData);
            setCustomer({ ...customer, ...editData });
            setEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (err) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [200, 120],
        extrapolate: 'clamp',
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Profile Header */}
                <Animated.View style={{ height: headerHeight }}>
                    <LinearGradient
                        colors={gradients.forest}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(customer?.name)}
                                </Text>
                            </View>
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedIcon}>✓</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>{customer?.name || 'Customer'}</Text>
                        <Text style={styles.userLocation}>
                            📍 {customer?.district}, {customer?.state}
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <StatCard
                        icon="📦"
                        value={stats.totalOrders}
                        label="Orders"
                        color={colors.primary}
                        delay={0}
                    />
                    <StatCard
                        icon="🚚"
                        value={stats.activeDeliveries}
                        label="Active"
                        color={colors.tertiary}
                        delay={100}
                    />
                    <StatCard
                        icon="🏪"
                        value={stats.vendors}
                        label="Vendors"
                        color={colors.accent}
                        delay={200}
                    />
                </View>

                {/* Personal Info Card */}
                <FadeInView delay={100}>
                    <ThemedCard variant="elevated" style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            <TouchableOpacity onPress={() => setEditing(!editing)}>
                                <Text style={styles.editLink}>
                                    {editing ? 'Cancel' : 'Edit'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {editing ? (
                            <View style={styles.editForm}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editData.name}
                                        onChangeText={(text) =>
                                            setEditData({ ...editData, name: text })
                                        }
                                        placeholder="Enter your name"
                                        placeholderTextColor={colors.text.muted}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editData.email}
                                        onChangeText={(text) =>
                                            setEditData({ ...editData, email: text })
                                        }
                                        placeholder="Enter your email"
                                        placeholderTextColor={colors.text.muted}
                                        keyboardType="email-address"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editData.mobileNo}
                                        onChangeText={(text) =>
                                            setEditData({ ...editData, mobileNo: text })
                                        }
                                        placeholder="Enter phone number"
                                        placeholderTextColor={colors.text.muted}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Address</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={editData.address}
                                        onChangeText={(text) =>
                                            setEditData({ ...editData, address: text })
                                        }
                                        placeholder="Enter your address"
                                        placeholderTextColor={colors.text.muted}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                                <ThemedButton
                                    title={saving ? 'Saving...' : 'Save Changes'}
                                    variant="gradient"
                                    onPress={handleSave}
                                    loading={saving}
                                    fullWidth
                                    style={{ marginTop: spacing.md }}
                                />
                            </View>
                        ) : (
                            <>
                                <InfoRow
                                    icon="👤"
                                    label="Full Name"
                                    value={customer?.name}
                                />
                                <InfoRow
                                    icon="📧"
                                    label="Email"
                                    value={customer?.email}
                                />
                                <InfoRow
                                    icon="📱"
                                    label="Phone"
                                    value={customer?.mobileNo}
                                />
                                <InfoRow
                                    icon="🏠"
                                    label="Address"
                                    value={customer?.address || `${customer?.district}, ${customer?.state}`}
                                />
                            </>
                        )}
                    </ThemedCard>
                </FadeInView>

                {/* Settings Card */}
                <FadeInView delay={200}>
                    <ThemedCard variant="elevated" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Preferences</Text>

                        <SettingsRow
                            icon="🔔"
                            label="Push Notifications"
                            value={settings.notifications}
                            onToggle={() =>
                                setSettings({ ...settings, notifications: !settings.notifications })
                            }
                        />
                        <SettingsRow
                            icon="📧"
                            label="Email Updates"
                            value={settings.emailUpdates}
                            onToggle={() =>
                                setSettings({ ...settings, emailUpdates: !settings.emailUpdates })
                            }
                        />
                        <SettingsRow
                            icon="📍"
                            label="Location Sharing"
                            value={settings.locationSharing}
                            onToggle={() =>
                                setSettings({ ...settings, locationSharing: !settings.locationSharing })
                            }
                        />
                    </ThemedCard>
                </FadeInView>

                {/* Security Card */}
                <FadeInView delay={300}>
                    <ThemedCard variant="elevated" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Security</Text>

                        <SettingsRow
                            icon="🔐"
                            label="Change Password"
                            type="arrow"
                            onToggle={() => Alert.alert('Coming Soon', 'Password change feature coming soon!')}
                        />
                        <SettingsRow
                            icon="🛡️"
                            label="Two-Factor Authentication"
                            type="arrow"
                            onToggle={() => Alert.alert('Coming Soon', '2FA feature coming soon!')}
                        />
                        <SettingsRow
                            icon="📋"
                            label="Privacy Policy"
                            type="arrow"
                            onToggle={() => Alert.alert('Privacy Policy', 'Your data is secure with us.')}
                        />
                    </ThemedCard>
                </FadeInView>

                {/* App Info */}
                <FadeInView delay={400}>
                    <View style={styles.appInfo}>
                        <Text style={styles.appName}>PeriSense</Text>
                        <Text style={styles.appVersion}>Version 2.0.0</Text>
                    </View>
                </FadeInView>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.light,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    verifiedIcon: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    userName: {
        ...typography.h2,
        color: colors.text.light,
    },
    userLocation: {
        ...typography.bodySmall,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: spacing.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.md,
        marginTop: -spacing.xl,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginHorizontal: spacing.xs,
        alignItems: 'center',
        ...shadows.md,
    },
    statIconContainer: {
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
        ...typography.h2,
    },
    statLabel: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: spacing.xxs,
    },
    sectionCard: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.text.primary,
    },
    editLink: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoIcon: {
        fontSize: 18,
        marginRight: spacing.md,
    },
    infoLabel: {
        ...typography.caption,
        color: colors.text.muted,
    },
    infoValue: {
        ...typography.body,
        color: colors.text.primary,
        marginTop: 2,
    },
    editButton: {
        padding: spacing.sm,
    },
    editIcon: {
        fontSize: 16,
    },
    editForm: {
        paddingTop: spacing.sm,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        ...typography.captionMedium,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        ...typography.body,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm + 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    settingsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 18,
        marginRight: spacing.md,
    },
    settingsLabel: {
        ...typography.body,
        color: colors.text.primary,
    },
    settingsArrow: {
        fontSize: 24,
        color: colors.text.muted,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    appName: {
        ...typography.h3,
        color: colors.primary,
    },
    appVersion: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: spacing.xs,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

export default CustomerProfile;

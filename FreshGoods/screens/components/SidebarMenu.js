/**
 * SidebarMenu - Unified sidebar component with logout functionality
 * Features: animated slide, menu items, logout button, consistent styling
 */
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const SIDEBAR_WIDTH = 240;

const SidebarMenu = ({
    isVisible,
    onClose,
    menuItems,
    activeItem,
    onItemPress,
    navigation,
    userName,
    userRole,
}) => {
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isVisible ? 0 : -SIDEBAR_WIDTH,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isVisible]);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear all stored auth data
                            await AsyncStorage.multiRemove(['token', 'userId', 'role']);

                            // Reset navigation stack and go to Login
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Home' }],
                                })
                            );
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleItemPress = (itemId) => {
        onItemPress(itemId);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isVisible && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
            )}

            {/* Sidebar */}
            <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
                {/* User info section */}
                {userName && (
                    <View style={styles.userSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.userName}>{userName}</Text>
                        {userRole && <Text style={styles.userRole}>{userRole}</Text>}
                    </View>
                )}

                {/* Menu items */}
                <View style={styles.menuSection}>
                    {menuItems.map(({ id, label, icon }) => (
                        <TouchableOpacity
                            key={id}
                            style={[
                                styles.menuItem,
                                activeItem === id && styles.activeMenuItem,
                            ]}
                            onPress={() => handleItemPress(id)}
                        >
                            <Text style={styles.menuIcon}>{icon}</Text>
                            <Text
                                style={[
                                    styles.menuLabel,
                                    activeItem === id && styles.activeMenuLabel,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutIcon}>🚪</Text>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 5,
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: colors.background.secondary,
        paddingTop: 60,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        borderRightWidth: 1,
        borderRightColor: colors.border.light,
        zIndex: 10,
        ...shadows.medium,
    },
    userSection: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        marginBottom: spacing.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatarText: {
        ...typography.h2,
        color: colors.text.light,
    },
    userName: {
        ...typography.h3,
        color: colors.text.dark,
    },
    userRole: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    menuSection: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    activeMenuItem: {
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
    },
    menuIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    menuLabel: {
        ...typography.body,
        color: colors.primary,
    },
    activeMenuLabel: {
        fontWeight: 'bold',
    },
    logoutSection: {
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        paddingTop: spacing.md,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    logoutText: {
        ...typography.body,
        color: colors.error,
        fontWeight: '600',
    },
});

export default SidebarMenu;

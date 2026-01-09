/**
 * AppHeader - Dynamic header component with page title and navigation
 * Features: back button, page title, breadcrumb support
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

const AppHeader = ({
    title,
    subtitle,
    showBack = false,
    onBack,
    rightComponent,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <StatusBar backgroundColor={colors.background.dark} barStyle="light-content" />

            <View style={styles.content}>
                {/* Left side - Back button or spacer */}
                <View style={styles.leftSection}>
                    {showBack && onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center - Title */}
                <View style={styles.centerSection}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    )}
                </View>

                {/* Right side - Optional component */}
                <View style={styles.rightSection}>
                    {rightComponent}
                </View>
            </View>
        </View>
    );
};

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.dark,
        paddingTop: STATUSBAR_HEIGHT,
        ...shadows.medium,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 56,
    },
    leftSection: {
        width: 48,
        alignItems: 'flex-start',
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
    },
    rightSection: {
        width: 48,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: spacing.xs,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text.light,
        fontWeight: 'bold',
    },
    title: {
        ...typography.h3,
        color: colors.text.light,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: 2,
    },
});

export default AppHeader;

/**
 * ThemedCard - Reusable card component with theme styling
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

const ThemedCard = ({
    children,
    style,
    variant = 'default', // 'default', 'elevated', 'outlined', 'glass'
    onPress,
    padded = true,
}) => {
    const cardStyles = [
        styles.base,
        padded && styles.padded,
        styles[variant],
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        backgroundColor: '#fff',
    },
    padded: {
        padding: spacing.md,
    },
    default: {
        backgroundColor: '#fff',
        ...shadows.small,
    },
    elevated: {
        backgroundColor: '#fff',
        ...shadows.medium,
    },
    outlined: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    glass: {
        backgroundColor: colors.background.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});

export default ThemedCard;

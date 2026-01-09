/**
 * ThemedButton - Reusable button component with theme styling
 */
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

const ThemedButton = ({
    title,
    onPress,
    variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger'
    size = 'medium', // 'small', 'medium', 'large'
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    textStyle,
}) => {
    const buttonStyles = [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`text_${variant}`],
        styles[`textSize_${size}`],
        disabled && styles.textDisabled,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'}
                    size="small"
                />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && <Text style={styles.icon}>{icon}</Text>}
                    <Text style={textStyles}>{title}</Text>
                    {icon && iconPosition === 'right' && <Text style={styles.icon}>{icon}</Text>}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.round,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    icon: {
        fontSize: 16,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: colors.error,
    },

    // Sizes
    size_small: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    size_medium: {
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.lg,
    },
    size_large: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },

    // Text styles
    text: {
        fontWeight: 'bold',
    },
    text_primary: {
        color: '#fff',
    },
    text_secondary: {
        color: '#fff',
    },
    text_outline: {
        color: colors.primary,
    },
    text_ghost: {
        color: colors.primary,
    },
    text_danger: {
        color: '#fff',
    },
    textDisabled: {
        opacity: 0.7,
    },

    // Text sizes
    textSize_small: {
        fontSize: 13,
    },
    textSize_medium: {
        fontSize: 15,
    },
    textSize_large: {
        fontSize: 17,
    },
});

export default ThemedButton;

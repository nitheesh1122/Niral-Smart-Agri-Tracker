/**
 * SplashScreen - Shown during authentication state check
 * Displays app branding while checking if user is logged in
 */
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography } from './theme';

const backgroundImage = require('../assets/image1.jpg');

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
                <BlurView intensity={90} tint="dark" style={styles.blurOverlay}>
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>🍃</Text>
                        </View>

                        <Text style={styles.title}>PeriSense</Text>
                        <Text style={styles.subtitle}>Smart Monitoring for Perishables</Text>

                        {/* Loading indicator */}
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.secondary} />
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    </View>
                </BlurView>
            </ImageBackground>
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
        width,
        height,
    },
    blurOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 206, 201, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    logoIcon: {
        fontSize: 50,
    },
    title: {
        fontSize: 42,
        fontWeight: '700',
        color: colors.text.primary,
        letterSpacing: 2,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.text.muted,
        marginBottom: spacing.xl * 2,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        ...typography.bodySmall,
        color: colors.text.muted,
        marginTop: spacing.md,
    },
});

export default SplashScreen;

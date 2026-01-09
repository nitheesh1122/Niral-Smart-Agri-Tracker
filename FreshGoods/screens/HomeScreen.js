import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from './theme';

const backgroundImage = require('../assets/image1.jpg');

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#000" translucent={false} />

            <ImageBackground
                source={backgroundImage}
                style={styles.background}
                resizeMode="cover"
            >
                <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
                    <View style={styles.card}>
                        {/* Logo/Brand Section */}
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>🍃</Text>
                        </View>

                        <Text style={styles.title}>PeriSense</Text>
                        <Text style={styles.subtitle}>Smart Monitoring for Perishables</Text>

                        <Text style={styles.description}>
                            PeriSense uses IoT and AI to track temperature, humidity and gas emissions during storage and transportation.
                            It empowers cold-chain logistics with real-time alerts, reducing waste and preserving food quality.
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.buttons}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('RoleSelection', { mode: 'login' })}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>Sign In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('RoleSelection', { mode: 'signup' })}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryButtonText}>Create Account</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            By continuing, you agree to our Terms & Privacy Policy
                        </Text>
                    </View>
                </BlurView>
            </ImageBackground>
        </View>
    );
}

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
        paddingHorizontal: spacing.lg,
    },
    card: {
        backgroundColor: 'rgba(20, 20, 20, 0.5)',
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 380,
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 206, 201, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logoIcon: {
        fontSize: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
        letterSpacing: 1,
    },
    subtitle: {
        ...typography.body,
        color: colors.secondary,
        marginBottom: spacing.lg,
        fontWeight: '500',
    },
    description: {
        ...typography.bodySmall,
        color: colors.text.muted,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    buttons: {
        width: '100%',
        gap: spacing.sm,
    },
    primaryButton: {
        backgroundColor: colors.secondary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.round,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    primaryButtonText: {
        ...typography.button,
        color: '#fff',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.round,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.secondary,
    },
    secondaryButtonText: {
        ...typography.button,
        color: colors.secondary,
    },
    footer: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
});

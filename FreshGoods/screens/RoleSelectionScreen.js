/**
 * RoleSelectionScreen - User selects their role before login/signup
 * Beautiful card-based UI with animated role cards
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius, shadows } from './theme';

const backgroundImage = require('../assets/image1.jpg');

const ROLES = [
    {
        id: 'Customer',
        icon: '🛒',
        title: 'Customer',
        description: 'Shop and order products',
        color: '#00CEC9',
    },
    {
        id: 'Vendor',
        icon: '🏪',
        title: 'Vendor',
        description: 'Manage your business',
        color: '#0984E3',
    },
    {
        id: 'Driver',
        icon: '🚚',
        title: 'Driver',
        description: 'Deliver goods',
        color: '#6C5CE7',
    },
];

const RoleCard = ({ role, onPress, isSelected }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.roleCard,
                    {
                        transform: [{ scale: scaleAnim }],
                        borderColor: isSelected ? role.color : 'rgba(255,255,255,0.2)',
                        borderWidth: isSelected ? 2 : 1,
                    },
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: role.color + '20' }]}>
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                </View>
                <View style={styles.roleInfo}>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
                <View style={[styles.arrow, isSelected && { backgroundColor: role.color }]}>
                    <Text style={styles.arrowText}>→</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function RoleSelectionScreen({ navigation, route }) {
    const { mode } = route.params || { mode: 'login' }; // 'login' or 'signup'
    const [selectedRole, setSelectedRole] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role.id);

        // Navigate to login or signup with selected role
        setTimeout(() => {
            if (mode === 'signup') {
                navigation.navigate('Signup', { selectedRole: role.id });
            } else {
                navigation.navigate('Login', { selectedRole: role.id });
            }
        }, 200);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#000" translucent={false} />

            <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
                <BlurView intensity={85} tint="dark" style={styles.blurOverlay}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {mode === 'signup' ? 'Join as' : 'Sign in as'}
                            </Text>
                            <Text style={styles.subtitle}>
                                Select your role to continue
                            </Text>
                        </View>

                        {/* Role Cards */}
                        <View style={styles.rolesContainer}>
                            {ROLES.map((role) => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    isSelected={selectedRole === role.id}
                                    onPress={() => handleRoleSelect(role)}
                                />
                            ))}
                        </View>

                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>← Back to Home</Text>
                        </TouchableOpacity>
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
        paddingHorizontal: spacing.lg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    header: {
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.text.muted,
    },
    rolesContainer: {
        gap: spacing.md,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    roleIcon: {
        fontSize: 28,
    },
    roleInfo: {
        flex: 1,
    },
    roleTitle: {
        ...typography.h3,
        color: colors.text.light,
        marginBottom: 2,
    },
    roleDescription: {
        ...typography.bodySmall,
        color: colors.text.muted,
    },
    arrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 18,
        color: colors.text.light,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: spacing.xl,
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    backButtonText: {
        ...typography.body,
        color: colors.text.muted,
    },
});

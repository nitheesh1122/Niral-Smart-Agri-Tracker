/**
 * CustomerTrackingScreen.js
 * Live shipment tracking with map and timeline
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Linking,
    Alert,
} from 'react-native';
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
    getStatusColor,
} from '../../theme';
import ThemedCard from '../../components/ThemedCard';
import ThemedButton from '../../components/ThemedButton';
import {
    SlideInView,
    FadeInView,
    PulseView,
    AnimatedProgressBar,
} from '../../components/AnimatedComponents';

// ═══════════════════════════════════════════════════════════════════
// TIMELINE STEP COMPONENT
// ═══════════════════════════════════════════════════════════════════
const TimelineStep = ({ step, isActive, isCompleted, isLast, delay = 0 }) => (
    <SlideInView delay={delay} style={styles.timelineStep}>
        <View style={styles.timelineLeft}>
            <View
                style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isActive && styles.timelineDotActive,
                ]}
            >
                {isCompleted && <Text style={styles.timelineCheck}>✓</Text>}
                {isActive && !isCompleted && (
                    <PulseView>
                        <View style={styles.timelineDotPulse} />
                    </PulseView>
                )}
            </View>
            {!isLast && (
                <View
                    style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                    ]}
                />
            )}
        </View>
        <View style={styles.timelineContent}>
            <Text
                style={[
                    styles.timelineTitle,
                    (isActive || isCompleted) && styles.timelineTitleActive,
                ]}
            >
                {step.title}
            </Text>
            <Text style={styles.timelineDescription}>{step.description}</Text>
            {step.time && (
                <Text style={styles.timelineTime}>{step.time}</Text>
            )}
        </View>
    </SlideInView>
);

// ═══════════════════════════════════════════════════════════════════
// INFO ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════
const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        </View>
    </View>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const CustomerTrackingScreen = ({ exportId, exportData, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [shipment, setShipment] = useState(exportData || null);
    const [driverLocation, setDriverLocation] = useState(null);

    // Default timeline steps
    const getTimelineSteps = (status) => {
        const steps = [
            {
                id: 'created',
                title: 'Order Created',
                description: 'Your order has been placed successfully',
                isCompleted: true,
                time: shipment?.createdAt
                    ? new Date(shipment.createdAt).toLocaleString()
                    : null,
            },
            {
                id: 'assigned',
                title: 'Driver Assigned',
                description: `Driver ${shipment?.driver?.name || 'TBD'} will deliver your order`,
                isCompleted: ['Assigned', 'Started', 'Completed'].includes(status),
                time: shipment?.assignedAt
                    ? new Date(shipment.assignedAt).toLocaleString()
                    : null,
            },
            {
                id: 'started',
                title: 'In Transit',
                description: 'Your order is on the way',
                isCompleted: ['Started', 'Completed'].includes(status),
                isActive: status === 'Started',
                time: shipment?.startDate
                    ? new Date(shipment.startDate).toLocaleString()
                    : null,
            },
            {
                id: 'delivered',
                title: 'Delivered',
                description: 'Order has been delivered',
                isCompleted: status === 'Completed',
                time: shipment?.endDate
                    ? new Date(shipment.endDate).toLocaleString()
                    : null,
            },
        ];
        return steps;
    };

    const fetchShipmentDetails = useCallback(async () => {
        if (!exportId && exportData) {
            setShipment(exportData);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(
                `http://${IPADD}:5000/api/customer/export/${exportId}`
            );
            setShipment(response.data);
        } catch (err) {
            console.error('Error fetching shipment:', err);
            if (exportData) {
                setShipment(exportData);
            }
        } finally {
            setLoading(false);
        }
    }, [exportId, exportData]);

    useEffect(() => {
        fetchShipmentDetails();

        // Simulate driver location updates
        const interval = setInterval(() => {
            // In real app, fetch from API
            setDriverLocation(prev => ({
                lat: (prev?.lat || 0) + 0.001,
                lng: (prev?.lng || 0) + 0.001,
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchShipmentDetails]);

    const handleCallDriver = () => {
        const phone = shipment?.driver?.mobileNo;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert('Unavailable', 'Driver contact not available');
        }
    };

    const handleViewOnMap = () => {
        Alert.alert('Map View', 'Opening map with delivery route...');
        // In real app, navigate to map screen
    };

    const getProgress = () => {
        const status = shipment?.status;
        switch (status) {
            case 'Pending': return 25;
            case 'Assigned': return 50;
            case 'Started': return 75;
            case 'Completed': return 100;
            default: return 0;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading shipment details...</Text>
            </View>
        );
    }

    const status = shipment?.status || 'Pending';
    const statusColor = getStatusColor(status);
    const timelineSteps = getTimelineSteps(status);
    const progress = getProgress();

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Card */}
                <FadeInView>
                    <LinearGradient
                        colors={gradients.forest}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerCard}
                    >
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={styles.headerLabel}>Tracking</Text>
                                <Text style={styles.orderId}>
                                    #{shipment?._id?.slice(-8).toUpperCase() || 'XXXXXXXX'}
                                </Text>
                            </View>
                            <View style={[styles.statusChip, { backgroundColor: statusColor + '30' }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <Text style={[styles.statusLabel, { color: '#fff' }]}>{status}</Text>
                            </View>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Delivery Progress</Text>
                                <Text style={styles.progressPercent}>{progress}%</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <AnimatedProgressBar
                                    progress={progress}
                                    color="#fff"
                                    backgroundColor="rgba(255,255,255,0.3)"
                                    height={6}
                                />
                            </View>
                        </View>

                        <View style={styles.etaContainer}>
                            <Text style={styles.etaLabel}>Estimated Delivery</Text>
                            <Text style={styles.etaValue}>
                                {shipment?.endDate
                                    ? new Date(shipment.endDate).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : 'Calculating...'}
                            </Text>
                        </View>
                    </LinearGradient>
                </FadeInView>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <ThemedButton
                        title="View Map"
                        variant="outline"
                        icon="🗺️"
                        onPress={handleViewOnMap}
                        style={styles.actionButton}
                    />
                    <ThemedButton
                        title="Call Driver"
                        variant="primary"
                        icon="📞"
                        onPress={handleCallDriver}
                        style={styles.actionButton}
                    />
                </View>

                {/* Timeline */}
                <SlideInView delay={200}>
                    <ThemedCard variant="elevated" style={styles.timelineCard}>
                        <Text style={styles.cardTitle}>Delivery Timeline</Text>
                        {timelineSteps.map((step, index) => (
                            <TimelineStep
                                key={step.id}
                                step={step}
                                isActive={step.isActive}
                                isCompleted={step.isCompleted}
                                isLast={index === timelineSteps.length - 1}
                                delay={index * 100}
                            />
                        ))}
                    </ThemedCard>
                </SlideInView>

                {/* Shipment Details */}
                <SlideInView delay={300}>
                    <ThemedCard variant="elevated" style={styles.detailsCard}>
                        <Text style={styles.cardTitle}>Shipment Details</Text>
                        <InfoRow
                            icon="📦"
                            label="Item"
                            value={shipment?.itemName}
                        />
                        <InfoRow
                            icon="📊"
                            label="Quantity"
                            value={shipment?.quantity}
                        />
                        <InfoRow
                            icon="🏪"
                            label="Vendor"
                            value={shipment?.vendorId?.name}
                        />
                        <InfoRow
                            icon="🚚"
                            label="Driver"
                            value={shipment?.driver?.name}
                        />
                        <InfoRow
                            icon="🚗"
                            label="Vehicle"
                            value={shipment?.vehicle?.vehicleNumber}
                        />
                    </ThemedCard>
                </SlideInView>

                {/* Route Info */}
                <SlideInView delay={400}>
                    <ThemedCard variant="elevated" style={styles.routeCard}>
                        <Text style={styles.cardTitle}>Route Information</Text>
                        <View style={styles.routePoints}>
                            <View style={styles.routePoint}>
                                <View style={[styles.routeMarker, { backgroundColor: colors.success }]}>
                                    <Text style={styles.routeMarkerText}>A</Text>
                                </View>
                                <View style={styles.routePointInfo}>
                                    <Text style={styles.routePointLabel}>Pickup</Text>
                                    <Text style={styles.routePointValue}>
                                        {shipment?.routes?.[0] || 'Origin Location'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.routeConnector}>
                                {[1, 2, 3, 4].map((_, i) => (
                                    <View key={i} style={styles.routeConnectorDot} />
                                ))}
                            </View>

                            <View style={styles.routePoint}>
                                <View style={[styles.routeMarker, { backgroundColor: colors.error }]}>
                                    <Text style={styles.routeMarkerText}>B</Text>
                                </View>
                                <View style={styles.routePointInfo}>
                                    <Text style={styles.routePointLabel}>Delivery</Text>
                                    <Text style={styles.routePointValue}>
                                        {shipment?.routes?.[shipment.routes.length - 1] || 'Destination'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ThemedCard>
                </SlideInView>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
    scrollView: {
        flex: 1,
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
    headerCard: {
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        ...shadows.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    headerLabel: {
        ...typography.caption,
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    orderId: {
        ...typography.h2,
        color: colors.text.light,
        marginTop: spacing.xs,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.round,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    statusLabel: {
        ...typography.captionMedium,
        textTransform: 'uppercase',
    },
    progressSection: {
        marginBottom: spacing.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    progressLabel: {
        ...typography.bodySmall,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    progressPercent: {
        ...typography.bodySmallMedium,
        color: colors.text.light,
    },
    progressBarContainer: {
        borderRadius: borderRadius.round,
        overflow: 'hidden',
    },
    etaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    etaLabel: {
        ...typography.bodySmall,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    etaValue: {
        ...typography.bodyMedium,
        color: colors.text.light,
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: spacing.xs,
    },
    timelineCard: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    cardTitle: {
        ...typography.h4,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    timelineStep: {
        flexDirection: 'row',
        minHeight: 70,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 32,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.border.light,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    timelineDotCompleted: {
        backgroundColor: colors.success,
    },
    timelineDotActive: {
        backgroundColor: colors.primary,
        borderWidth: 3,
        borderColor: colors.primaryLight,
    },
    timelineDotPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    timelineCheck: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border.light,
        marginTop: -2,
        marginBottom: -2,
    },
    timelineLineCompleted: {
        backgroundColor: colors.success,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: spacing.md,
        paddingBottom: spacing.md,
    },
    timelineTitle: {
        ...typography.bodyMedium,
        color: colors.text.muted,
    },
    timelineTitleActive: {
        color: colors.text.primary,
    },
    timelineDescription: {
        ...typography.bodySmall,
        color: colors.text.muted,
        marginTop: 2,
    },
    timelineTime: {
        ...typography.caption,
        color: colors.text.muted,
        marginTop: spacing.xs,
    },
    detailsCard: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    infoIcon: {
        fontSize: 18,
        marginRight: spacing.md,
    },
    infoContent: {
        flex: 1,
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
    routeCard: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    routePoints: {
        paddingLeft: spacing.sm,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    routeMarkerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    routePointInfo: {
        flex: 1,
    },
    routePointLabel: {
        ...typography.caption,
        color: colors.text.muted,
    },
    routePointValue: {
        ...typography.body,
        color: colors.text.primary,
    },
    routeConnector: {
        marginLeft: 15,
        paddingVertical: spacing.sm,
    },
    routeConnectorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border.medium,
        marginVertical: 3,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

export default CustomerTrackingScreen;

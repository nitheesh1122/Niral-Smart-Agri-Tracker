/**
 * DriverManagement.js
 * Premium driver management with modern UI
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { SlideInView, FadeInView, AnimatedPressable } from '../../components/AnimatedComponents';

// ═══════════════════════════════════════════════════════════════════
// DRIVER CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const DriverCard = ({ driver, onRemove, index }) => (
  <SlideInView delay={index * 80}>
    <ThemedCard variant="elevated" style={styles.driverCard}>
      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(driver._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.removeIcon}>×</Text>
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={gradients.forest}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {driver.name?.charAt(0).toUpperCase() || 'D'}
          </Text>
        </LinearGradient>
        <View style={styles.statusDot} />
      </View>

      {/* Driver Info */}
      <Text style={styles.driverName}>{driver.name}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📧</Text>
          <Text style={styles.infoText} numberOfLines={1}>{driver.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📱</Text>
          <Text style={styles.infoText}>{driver.mobileNo}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🪪</Text>
          <Text style={styles.infoText}>{driver.licenseNo}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{driver.district}, {driver.state}</Text>
        </View>
      </View>
    </ThemedCard>
  </SlideInView>
);

// ═══════════════════════════════════════════════════════════════════
// ADD DRIVER MODAL
// ═══════════════════════════════════════════════════════════════════
const AddDriverModal = ({ visible, onClose, allDrivers, onSelect, search, onSearch }) => {
  const filteredDrivers = allDrivers.filter(driver =>
    driver.name?.toLowerCase().includes(search.toLowerCase()) ||
    driver._id?.includes(search)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Driver</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or ID..."
              placeholderTextColor={colors.text.muted}
              value={search}
              onChangeText={onSearch}
            />
          </View>

          {/* Driver List */}
          <FlatList
            data={filteredDrivers}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <AnimatedPressable onPress={() => onSelect(item._id)}>
                <View style={styles.modalDriverItem}>
                  <View style={styles.modalDriverAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {item.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalDriverInfo}>
                    <Text style={styles.modalDriverName}>{item.name}</Text>
                    <Text style={styles.modalDriverSub}>{item.mobileNo}</Text>
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </View>
              </AnimatedPressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>No drivers found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [allDrivers, setAllDrivers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchDrivers = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setVendorId(id);
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/all?vendorId=${id}`);
      setDrivers(res.data || []);
    } catch (err) {
      console.error('Error fetching vendor drivers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAllDrivers = async () => {
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/available-drivers`);
      setAllDrivers(res.data || []);
    } catch (err) {
      console.error('Error fetching all drivers:', err);
    }
  };

  const handleAddDriver = async (driverId) => {
    try {
      await axios.post(`http://${IPADD}:5000/api/vendor/add-driver`, {
        vendorId,
        driverId,
      });
      setModalVisible(false);
      setSearch('');
      fetchDrivers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add driver';
      Alert.alert('Error', msg);
    }
  };

  const handleRemoveDriver = (driverId) => {
    Alert.alert(
      'Remove Driver',
      'Are you sure you want to remove this driver from your team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`http://${IPADD}:5000/api/vendor/remove-driver`, {
                vendorId,
                driverId,
              });
              fetchDrivers();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove driver');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <FadeInView>
        <LinearGradient
          colors={gradients.forest}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statsHeader}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{drivers.length}</Text>
            <Text style={styles.statLabel}>Total Drivers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{drivers.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </LinearGradient>
      </FadeInView>

      {/* Driver List */}
      <FlatList
        data={drivers}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <DriverCard
            driver={item}
            index={index}
            onRemove={handleRemoveDriver}
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
            <Text style={styles.emptyIcon}>👨‍✈️</Text>
            <Text style={styles.emptyTitle}>No Drivers Yet</Text>
            <Text style={styles.emptySubtext}>
              Add drivers to your team to manage deliveries
            </Text>
          </FadeInView>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          fetchAllDrivers();
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradients.primary}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Driver Modal */}
      <AddDriverModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSearch('');
        }}
        allDrivers={allDrivers}
        onSelect={handleAddDriver}
        search={search}
        onSearch={setSearch}
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.stat,
    color: colors.text.light,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  driverCard: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeIcon: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.light,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  driverName: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 28,
    color: colors.text.light,
    fontWeight: '300',
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
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    fontSize: 24,
    color: colors.text.muted,
    padding: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  modalDriverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalDriverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.light,
  },
  modalDriverInfo: {
    flex: 1,
  },
  modalDriverName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  modalDriverSub: {
    ...typography.caption,
    color: colors.text.muted,
  },
  addIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyList: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
  },
});

export default DriverManagement;

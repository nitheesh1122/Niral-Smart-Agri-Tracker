/**
 * DriverAssignedExports - Shows exports with Accept/Reject functionality
 * Displays pending, accepted, and scheduled exports
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const DriverAssignedExports = () => {
  const [exports, setExports] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loadingExportId, setLoadingExportId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'scheduled'

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectExportId, setRejectExportId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchExports = useCallback(async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) return;

      const res = await axios.get(`http://${IPADD}:5000/api/driver/export/driver/${driverId}`);
      setExports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned exports:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExports();
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isFuture = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAccept = async (exportId) => {
    setLoadingExportId(exportId);
    try {
      await axios.put(`http://${IPADD}:5000/api/driver/export/accept/${exportId}`);
      Alert.alert('Success', 'Export accepted!');
      setExports((prev) =>
        prev.map((exp) =>
          exp._id === exportId ? { ...exp, driverResponse: 'accepted' } : exp
        )
      );
    } catch (err) {
      console.error('Failed to accept export:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept export');
    } finally {
      setLoadingExportId(null);
    }
  };

  const openRejectModal = (exportId) => {
    setRejectExportId(exportId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectExportId) return;

    setLoadingExportId(rejectExportId);
    setShowRejectModal(false);

    try {
      await axios.put(`http://${IPADD}:5000/api/driver/export/reject/${rejectExportId}`, {
        reason: rejectReason || 'No reason provided',
      });
      Alert.alert('Rejected', 'Export has been rejected');
      setExports((prev) => prev.filter((exp) => exp._id !== rejectExportId));
    } catch (err) {
      console.error('Failed to reject export:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to reject export');
    } finally {
      setLoadingExportId(null);
      setRejectExportId(null);
    }
  };

  const handleStartExport = async (exportId) => {
    setLoadingExportId(exportId);
    try {
      await axios.put(`http://${IPADD}:5000/api/driver/export/start/${exportId}`, {
        status: 'Started',
      });
      Alert.alert('Success', 'Export marked as Started');
      setExports((prev) =>
        prev.map((exp) =>
          exp._id === exportId ? { ...exp, status: 'Started' } : exp
        )
      );
    } catch (err) {
      console.error('Failed to start export:', err);
      Alert.alert('Error', 'Failed to update export status');
    } finally {
      setLoadingExportId(null);
    }
  };

  const handleCompleteExport = async (exportId) => {
    setLoadingExportId(exportId);
    try {
      await axios.put(`http://${IPADD}:5000/api/driver/export/complete/${exportId}`);
      Alert.alert('Success', 'Export marked as Completed! 🎉');
      setExports((prev) =>
        prev.map((exp) =>
          exp._id === exportId ? { ...exp, status: 'Completed' } : exp
        )
      );
    } catch (err) {
      console.error('Failed to complete export:', err);
      Alert.alert('Error', 'Failed to complete export');
    } finally {
      setLoadingExportId(null);
    }
  };

  const getStatusColor = (item) => {
    if (item.status === 'Started') return colors.success;
    if (item.status === 'Completed') return '#6c757d';
    if (item.driverResponse === 'accepted') return colors.primary;
    return colors.warning;
  };

  const getStatusText = (item) => {
    if (item.status === 'Started') return '🚚 In Progress';
    if (item.status === 'Completed') return '✅ Completed';
    if (item.driverResponse === 'accepted') return '✓ Accepted';
    return '⏳ Pending Response';
  };

  const filteredExports = exports.filter((exp) => {
    if (filter === 'pending') return exp.driverResponse === 'pending' && exp.status === 'Pending';
    if (filter === 'accepted') return exp.driverResponse === 'accepted' && exp.status === 'Pending';
    if (filter === 'scheduled') return isFuture(exp.startDate);
    return true;
  });

  const renderExport = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getStatusColor(item) }]}
      onPress={() => toggleExpand(item._id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>📦 {item.itemName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.date}>📅 {formatDate(item.startDate)}</Text>
        {isFuture(item.startDate) && (
          <View style={styles.scheduledBadge}>
            <Text style={styles.scheduledText}>Scheduled</Text>
          </View>
        )}
      </View>

      {expandedId === item._id && (
        <View style={styles.details}>
          <Text style={styles.detailText}>🏪 Vendor: {item.vendorId?.name || 'N/A'}</Text>
          <Text style={styles.detailText}>📞 Contact: {item.vendorId?.mobileNo || 'N/A'}</Text>
          <Text style={styles.detailText}>📦 Quantity: {item.quantity}</Text>
          <Text style={styles.detailText}>💰 Cost: ₹{item.costPrice} | Sale: ₹{item.salePrice}</Text>

          {/* Action Buttons */}
          {item.driverResponse === 'pending' && item.status === 'Pending' && (
            <View style={styles.actionButtons}>
              {loadingExportId === item._id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item._id)}
                  >
                    <Text style={styles.buttonText}>✓ Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => openRejectModal(item._id)}
                  >
                    <Text style={styles.buttonText}>✕ Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Start Button - only for accepted exports on the day */}
          {item.driverResponse === 'accepted' &&
            item.status === 'Pending' &&
            isToday(item.startDate) && (
              loadingExportId === item._id ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#8A6D00" />
                  <Text style={styles.loadingText}>Fetching routes...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartExport(item._id)}
                >
                  <Text style={styles.buttonText}>▶ Start Export</Text>
                </TouchableOpacity>
              )
            )}

          {/* Future date notice */}
          {item.driverResponse === 'accepted' && isFuture(item.startDate) && (
            <View style={styles.futureNotice}>
              <Text style={styles.futureText}>
                🗓️ This export is scheduled for {formatDate(item.startDate)}
              </Text>
            </View>
          )}

          {/* Complete Button - for started exports */}
          {item.status === 'Started' && (
            loadingExportId === item._id ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompleteExport(item._id)}
              >
                <Text style={styles.buttonText}>✓ Mark as Completed</Text>
              </TouchableOpacity>
            )
          )}

          {/* Completed Badge */}
          {item.status === 'Completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✅ Delivery Completed</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assigned Exports</Text>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'scheduled', label: 'Scheduled' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterText, filter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredExports}
        keyExtractor={(item) => item._id}
        renderItem={renderExport}
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No exports found</Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Export</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason (optional):</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g., Schedule conflict, vehicle issue..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectButton}
                onPress={handleReject}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverAssignedExports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  header: {
    ...typography.h2,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: '#f0f0f0',
    borderRadius: borderRadius.round,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.text.dark,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  scheduledBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: '#e3f2fd',
    borderRadius: borderRadius.round,
  },
  scheduledText: {
    ...typography.caption,
    color: '#1976d2',
    fontWeight: '500',
  },
  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    ...typography.body,
  },
  loadingBox: {
    marginTop: spacing.md,
    backgroundColor: '#FFF3CD',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
    color: '#8A6D00',
    fontWeight: '500',
  },
  futureNotice: {
    marginTop: spacing.md,
    backgroundColor: '#e3f2fd',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  futureText: {
    ...typography.bodySmall,
    color: '#1976d2',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    ...typography.body,
    color: colors.text.dark,
    fontWeight: '600',
  },
  confirmRejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  completedBadge: {
    marginTop: spacing.md,
    backgroundColor: '#d4edda',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  completedText: {
    ...typography.body,
    color: '#155724',
    fontWeight: '600',
  },
});

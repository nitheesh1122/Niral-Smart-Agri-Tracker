/**
 * CustomerViewGoods - Browse vendors and their products
 * Fetches real data from the API
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import ThemedCard from '../../components/ThemedCard';

const VendorCard = ({ vendor, onPress }) => (
  <ThemedCard variant="elevated" style={styles.vendorCard} onPress={onPress}>
    <View style={styles.vendorHeader}>
      <View style={styles.vendorAvatar}>
        <Text style={styles.avatarText}>
          {vendor.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{vendor.name}</Text>
        <Text style={styles.vendorLocation}>
          📍 {vendor.district}, {vendor.state}
        </Text>
      </View>
    </View>
    <View style={styles.vendorFooter}>
      <Text style={styles.vendorContact}>📞 {vendor.mobileNo}</Text>
      <View style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View Details →</Text>
      </View>
    </View>
  </ThemedCard>
);

const CustomerViewGoods = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      const response = await axios.get(`http://${IPADD}:5000/api/customer/vendors`);
      setVendors(response.data);
      setFilteredVendors(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVendors(vendors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = vendors.filter(
        (v) =>
          v.name?.toLowerCase().includes(query) ||
          v.district?.toLowerCase().includes(query) ||
          v.state?.toLowerCase().includes(query)
      );
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVendors();
  }, [fetchVendors]);

  const handleVendorPress = (vendor) => {
    // Navigate to vendor details or start chat
    console.log('Selected vendor:', vendor._id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading vendors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVendors}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors, locations..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Vendor List */}
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VendorCard vendor={item} onPress={() => handleVendorPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No vendors found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default CustomerViewGoods;

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
    marginTop: spacing.md,
    color: colors.text.dark,
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.text.dark,
  },
  clearButton: {
    padding: spacing.sm,
  },
  clearText: {
    color: colors.text.muted,
    fontSize: 16,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  vendorCard: {
    marginBottom: spacing.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vendorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    ...typography.h3,
    color: colors.text.dark,
  },
  vendorLocation: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  vendorContact: {
    ...typography.bodySmall,
    color: colors.text.dark,
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.round,
  },
  viewButtonText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
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
    color: colors.text.dark,
    fontWeight: '500',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});

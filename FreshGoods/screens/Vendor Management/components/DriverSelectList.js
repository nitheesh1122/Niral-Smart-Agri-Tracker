// src/components/DriverSelectList.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPADD } from '../../ipadd';

const API_BASE = `http://${IPADD}:5000`;

/**
 * Props
 *   onSelect(id, name)   ← required
 *   vendorId?            ← optional (fallback to AsyncStorage('userId'))
 */
const DriverSelectList = ({ onSelect, vendorId: propVendorId }) => {
  const [vendorId,  setVendorId]  = useState(propVendorId);
  const [drivers,   setDrivers]   = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(true);

  /* 1️⃣ Get vendorId if not provided */
  useEffect(() => {
    if (vendorId) return;
    AsyncStorage.getItem('userId').then(id => setVendorId(id));
  }, [vendorId]);

  /* 2️⃣ Fetch vendor-specific drivers */
  useEffect(() => {
    if (!vendorId) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/chat/vendor-drivers`, {
          params: { vendorId },
        });
        setDrivers(data);
        setFiltered(data);
      } catch (err) {
        console.error('Failed to load vendor drivers:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  /* 3️⃣ Live search */
  useEffect(() => {
    if (!query.trim()) return setFiltered(drivers);
    const term = query.toLowerCase();
    setFiltered(drivers.filter(d => d.name.toLowerCase().includes(term)));
  }, [query, drivers]);

  /* 4️⃣ UI */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Driver to Chat</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search drivers…"
        style={styles.searchBox}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelect(item._id, item.name)}
          >
            <Text style={styles.name}>{item.name}</Text>
            {item.mobileNo && <Text style={styles.meta}>📱 {item.mobileNo}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40 }}>
            No drivers found
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default DriverSelectList;

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:    { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  searchBox: {
    padding: 10, backgroundColor: '#EEE',
    borderRadius: 10, marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 14, color: '#555' },
});

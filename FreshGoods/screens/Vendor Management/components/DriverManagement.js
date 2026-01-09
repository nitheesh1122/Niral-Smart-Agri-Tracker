import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, FlatList, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPADD } from '../../ipadd';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [allDrivers, setAllDrivers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchDrivers = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setVendorId(id);
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/all?vendorId=${id}`);
      setDrivers(res.data);
    } catch (err) {
      console.error('Error fetching vendor drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDrivers = async () => {
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/available-drivers`);
      setAllDrivers(res.data);
    } catch (err) {
      console.error('Error fetching all drivers:', err);
    }
  };

  const handleAddDriver = async (driverId) => {
    try {
      await axios.post(`http://${IPADD}:5000/api/vendor/add-driver`, {
        vendorId,
        driverId
      });
      setModalVisible(false);
      fetchDrivers();
    } catch (err) {
      console.error('Error adding driver to vendor:', err.response?.data || err.message);
    }
  };

  const handleRemoveDriver = async (driverId) => {
    Alert.alert(
      'Remove Driver',
      'Are you sure you want to remove this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`http://${IPADD}:5000/api/vendor/remove-driver`, {
                vendorId,
                driverId
              });
              fetchDrivers();
            } catch (err) {
              console.error('Error removing driver:', err);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = allDrivers.filter(driver =>
    driver.name.toLowerCase().includes(search.toLowerCase()) ||
    driver._id.includes(search)
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {drivers.map((driver) => (
          <View key={driver._id} style={styles.card}>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveDriver(driver._id)}
            >
              <Text style={styles.removeText}>❌</Text>
            </TouchableOpacity>
            <Text style={styles.name}>👨‍✈️ {driver.name}</Text>
            <Text style={styles.label}>Username: <Text style={styles.value}>{driver.username}</Text></Text>
            <Text style={styles.label}>Email: <Text style={styles.value}>{driver.email}</Text></Text>
            <Text style={styles.label}>Mobile: <Text style={styles.value}>{driver.mobileNo}</Text></Text>
            <Text style={styles.label}>License No: <Text style={styles.value}>{driver.licenseNo}</Text></Text>
            <Text style={styles.label}>State: <Text style={styles.value}>{driver.state}</Text></Text>
            <Text style={styles.label}>District: <Text style={styles.value}>{driver.district}</Text></Text>
          </View>
        ))}
      </ScrollView>

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          fetchAllDrivers();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal for Adding Driver */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Driver</Text>
          <TextInput
            placeholder="Search by name or ID"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <FlatList
            data={filteredDrivers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => handleAddDriver(item._id)}>
                <Text style={styles.name}>{item.name} ({item._id})</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default DriverManagement;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '90%',
    elevation: 3,
    position: 'relative',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    color: '#333',
  },
  value: {
    fontWeight: 'normal',
    color: '#555',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalItem: {
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  closeBtn: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#ccc',
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: '#333',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  removeText: {
    fontSize: 18,
    color: 'red',
  },
});

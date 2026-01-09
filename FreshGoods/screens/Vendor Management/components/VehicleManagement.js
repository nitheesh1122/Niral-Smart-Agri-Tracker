import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';


const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [form, setForm] = useState({
    _id: '',
    vehicleNumber: '',
    brand: '',
    capacity: '',
    deviceId: ''
  });

  const fetchVehicles = async () => {
    const vendorId = await AsyncStorage.getItem('userId');
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/vehicles?vendorId=${vendorId}`);
      setVehicles(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDevices = async () => {
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/available-devices`);
      setDeviceOptions(res.data);
    } catch (err) {
      console.error('Device fetch error:', err);
    }
  };

  const handleAddVehicle = async () => {
    try {
      const vendorId = await AsyncStorage.getItem('userId');
      await axios.post(`http://${IPADD}:5000/api/vendor/add-vehicle`, {
        ...form,
        vendorId
      });
      setModalVisible(false);
      setForm({ _id: '', vehicleNumber: '', brand: '', capacity: '', deviceId: '' });
      fetchVehicles();
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {vehicles.map((v) => (
          <View key={v._id} style={styles.card}>
            <Text style={styles.title}>🚗 {v.vehicleNumber}</Text>
            <Text>Brand: {v.brand}</Text>
            <Text>Capacity: {v.capacity}</Text>
            <Text>Device ID: {v.deviceId}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => {
        fetchAvailableDevices();
        setModalVisible(true);
      }}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Add Vehicle</Text>
          <TextInput placeholder="ID (number)" value={form._id} keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, _id: t })} style={styles.input} />
          <TextInput placeholder="Vehicle Number" value={form.vehicleNumber}
            onChangeText={(t) => setForm({ ...form, vehicleNumber: t })} style={styles.input} />
          <TextInput placeholder="Brand" value={form.brand}
            onChangeText={(t) => setForm({ ...form, brand: t })} style={styles.input} />
          <TextInput placeholder="Capacity" value={form.capacity}
            onChangeText={(t) => setForm({ ...form, capacity: t })} style={styles.input} />

          <Text style={{ fontWeight: 'bold' }}>Select Device</Text>
          <Picker
            selectedValue={form.deviceId}
            onValueChange={(val) => setForm({ ...form, deviceId: val })}
          >
            <Picker.Item label="-- Select Device --" value="" />
            {deviceOptions.map((d) => (
              <Picker.Item key={d._id} label={d.deviceName} value={d.deviceName} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleAddVehicle}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default VehicleManagement;

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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
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
});

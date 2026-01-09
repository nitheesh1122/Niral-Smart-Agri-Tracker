// VendorHomePlaceHolder.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { IPADD } from '../../ipadd';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MonitorHealthView from './vendorHomeComponents/monitorHealthView';
import ExportLocationView from './vendorHomeComponents/exportLocationView';

const VendorHomePlaceHolder = () => {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeView, setActiveView] = useState('main');
  const [selectedExport, setSelectedExport] = useState(null);

  useEffect(() => {
    const fetchExports = async () => {
      try {
        const vendorId = await AsyncStorage.getItem('userId');
        const res = await axios.get(`http://${IPADD}:5000/api/vendor/export/passedstatus/${vendorId}`);
        setExports(res.data);
      } catch (error) {
        console.error('Failed to fetch export data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExports();
  }, []);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleMonitorHealth = (exp) => {
    setSelectedExport(exp);
    setActiveView('monitor');
  };

  const handleViewLocation = (exp) => {
    setSelectedExport(exp);
    setActiveView('location');
  };

  const handleBack = () => {
    setSelectedExport(null);
    setActiveView('main');
  };

  const renderExportItem = ({ item, index }) => (
    <TouchableOpacity style={styles.card} onPress={() => toggleExpand(index)}>
      <Text style={styles.exportTitle}>📦 {item.itemName}</Text>
      <Text>Status: <Text style={styles.highlight}>{item.status}</Text></Text>
      <Text>Driver: {item.driver.name} ({item.driver.mobileNo})</Text>
      <Text>Vehicle: {item.vehicle.vehicleNumber} - {item.vehicle.brand}</Text>

      {expandedIndex === index && (
        <View style={styles.details}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📇 Vendor</Text>
            <Text>{item.vendorId.name} ({item.vendorId.mobileNo})</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Dates</Text>
            <Text>Start: {new Date(item.startDate).toLocaleString()}</Text>
            <Text>End: {new Date(item.endDate).toLocaleString()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Export Details</Text>
            <Text>Quantity: {item.quantity}</Text>
            <Text>Cost Price: ₹{item.costPrice}</Text>
            <Text>Sale Price: ₹{item.salePrice}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ Locations</Text>
            <Text>Start: {item.startLocation.latitude}, {item.startLocation.longitude}</Text>
            <Text>End: {item.endLocation.latitude}, {item.endLocation.longitude}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛣️ Route</Text>
            {item.routes.map((route, idx) => (
              <Text key={idx} style={styles.routeText}>• {route}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🆔 Export ID</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>{item._id}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleMonitorHealth(item)}>
              <Text style={styles.actionText}>📊 Monitor Health</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleViewLocation(item)}>
              <Text style={styles.actionText}>📍 View Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {activeView === 'main' && (
        <>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2920/2920061.png' }}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to Vendor Dashboard</Text>
          <Text style={styles.subtitle}>Tap on an export to view all details.</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={exports}
              renderItem={renderExportItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </>
      )}

      {activeView === 'monitor' && selectedExport && (
        <MonitorHealthView selectedExport={selectedExport} onBack={handleBack} />
      )}
      {activeView === 'location' && selectedExport && (
        <ExportLocationView selectedExport={selectedExport} onBack={handleBack} />
      )}
    </View>
  );
};

export default VendorHomePlaceHolder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  highlight: {
    fontWeight: '600',
    color: '#e67e22',
  },
  details: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#444',
    paddingLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
});
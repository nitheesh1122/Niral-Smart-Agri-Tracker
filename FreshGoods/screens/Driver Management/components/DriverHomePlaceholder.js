import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IPADD } from '../../ipadd';

import DriverExportHealth from './placeholdersubcomponents/DriverExportHealth';
import DriverRouteMap from './placeholdersubcomponents/DriverRouteMap';

const DriverHomePlaceholder = () => {
  const [loading, setLoading] = useState(true);
  const [endingTrip, setEndingTrip] = useState(false);
  const [ongoingExport, setOngoingExport] = useState(null);
  const [screen, setScreen] = useState('home'); // 🧭 "home" | "health" | "route"

  const fetchStartedExport = async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) return;

      const res = await axios.get(`http://${IPADD}:5000/api/driver/export/driver/${driverId}`);
      const started = res.data.find((exp) => exp.status === 'Started');
      setOngoingExport(started || null);
    } catch (err) {
      console.error('Error fetching ongoing export:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartedExport();
  }, []);

  const handleEndTrip = async () => {
    if (!ongoingExport) return;

    Alert.alert(
      'End Trip',
      'Are you sure you want to mark this delivery as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            setEndingTrip(true);
            try {
              await axios.put(`http://${IPADD}:5000/api/driver/export/complete/${ongoingExport._id}`);
              Alert.alert('Success! 🎉', 'Delivery completed successfully!');
              setOngoingExport(null);
            } catch (err) {
              console.error('Failed to end trip:', err);
              Alert.alert('Error', 'Failed to complete delivery');
            } finally {
              setEndingTrip(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔄 Checking for ongoing exports...</Text>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (screen === 'health') {
    return <DriverExportHealth exportId={ongoingExport._id} onBack={() => setScreen('home')} />;
  }

  if (screen === 'route') {
    return <DriverRouteMap exportId={ongoingExport._id} onBack={() => setScreen('home')} />;
  }

  if (!ongoingExport) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👋 Welcome, Driver!</Text>
        <Text style={styles.subtitle}>No ongoing works available right now.</Text>
        <TouchableOpacity
          style={[styles.button, { marginTop: 20, backgroundColor: '#4CAF50' }]}
          onPress={() => {
            setLoading(true);
            fetchStartedExport();
          }}
        >
          <Text style={styles.buttonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚚 Ongoing Export</Text>
      <View style={styles.exportCard}>
        <Text style={styles.itemText}>📦 {ongoingExport.itemName}</Text>
        <Text style={styles.infoText}>📅 Start: {new Date(ongoingExport.startDate).toLocaleDateString()}</Text>
        <Text style={styles.infoText}>📅 End: {new Date(ongoingExport.endDate).toLocaleDateString()}</Text>
        <Text style={styles.infoText}>📊 Quantity: {ongoingExport.quantity}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>🟢 {ongoingExport.status}</Text>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF7043' }]}
          onPress={() => setScreen('health')}
        >
          <Text style={styles.buttonText}>🍎 Monitor Health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setScreen('route')}
        >
          <Text style={styles.buttonText}>🗺 View Route</Text>
        </TouchableOpacity>
      </View>

      {/* End Trip Button */}
      <TouchableOpacity
        style={styles.endTripButton}
        onPress={handleEndTrip}
        disabled={endingTrip}
      >
        {endingTrip ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.endTripText}>🏁 End Trip</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default DriverHomePlaceholder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  exportCard: {
    marginTop: 12,
    backgroundColor: '#D6EAF8',
    padding: 16,
    borderRadius: 10,
    width: '90%',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2C3E50',
  },
  infoText: {
    fontSize: 14,
    color: '#34495E',
    marginVertical: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '90%',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  endTripButton: {
    marginTop: 24,
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  endTripText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// ExportManagement.js - Fixed version
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Button, Modal, Alert, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import { IPADD } from '../../ipadd';

const MAP_HTML = `
<!DOCTYPE html><html><head>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<style>
  #map { height: 100vh; width:100vw; }
  #searchBar { position: absolute; top: 10px; left: 10px; z-index: 1000; background: white; padding: 6px; border-radius: 4px; }
  #confirmBtn { position: absolute; bottom: 20px; right: 20px; z-index: 1000; background: #007AFF; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; display: none; }
  #confirmBtn:hover { background: #0056b3; }
</style>
</head>
<body>
<div id="searchBar"><input id="searchInput" placeholder="Search place..." style="width:200px; padding:4px;"/></div>
<div id="map"></div>
<button id="confirmBtn">Confirm Location</button>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([11.1271, 78.6569], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19
  }).addTo(map);
  let marker;
  let selectedLocation = null;
  
  const confirmBtn = document.getElementById('confirmBtn');
  
  map.on('click', e => {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    selectedLocation = e.latlng;
    confirmBtn.style.display = 'block';
  });
  
  confirmBtn.addEventListener('click', () => {
    if (selectedLocation) {
      window.ReactNativeWebView.postMessage(JSON.stringify(selectedLocation));
    }
  });
  
  document.getElementById('searchInput').addEventListener('keydown', async function(e){
    if (e.key === 'Enter') {
      const query = e.target.value;
      const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(query));
      const data = await res.json();
      if(data[0]) {
        const { lat, lon } = data[0];
        const latlng = {lat: parseFloat(lat), lng: parseFloat(lon)};
        map.setView(latlng, 14);
        if (marker) map.removeLayer(marker);
        marker = L.marker(latlng).addTo(map);
        selectedLocation = latlng;
        confirmBtn.style.display = 'block';
      }
    }
  });
</script></body></html>`

export default function ExportManagement() {
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    itemName:'', quantity:'', costPrice:'', salePrice:'', salary:'',
    startDate: null, endDate: null,
    driver:'', vehicle:'',
    startLat:'', startLon:'', endLat:'', endLon:''
  });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendorId, setVendorId] = useState('');

  const [datePicker, setDatePicker] = useState({show:false, target:'start'});
  const [mapModal, setMapModal] = useState({show:false, field:'start'});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const id = await AsyncStorage.getItem('userId');
      setVendorId(id);
      await fetchExports(id);
    };
    fetchData();
  }, []);

  // Fetch resources when both dates are selected
  useEffect(() => {
    if (form.startDate && form.endDate && vendorId) {
      fetchResources();
    }
  }, [form.startDate, form.endDate, vendorId]);

  async function fetchExports(id) {
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/exports?vendorId=${id}`);
      setExportsList(res.data);
    } catch(e) {
      console.error(e);
      Alert.alert('Error', 'Could not fetch exports');
    } finally {
      setLoading(false);
    }
  }

  async function fetchResources() {
    if(!form.startDate || !form.endDate) return;
    try {
      const res = await axios.get(`http://${IPADD}:5000/api/vendor/availableResources`, {
        params:{
          vendorId,
          startDate: form.startDate.toISOString(),
          endDate: form.endDate.toISOString()
        }
      });
      setDrivers(res.data.drivers || []);
      setVehicles(res.data.vehicles || []);
    } catch(e) {
      console.error(e);
      Alert.alert('Error', 'Could not fetch drivers/vehicles');
      setDrivers([]);
      setVehicles([]);
    }
  }

  function validateForm() {
    if (!form.itemName.trim()) return 'Item name is required';
    if (!form.quantity || isNaN(form.quantity) || parseInt(form.quantity) <= 0) return 'Valid quantity is required';
    if (!form.costPrice || isNaN(form.costPrice) || parseFloat(form.costPrice) <= 0) return 'Valid cost price is required';
    if (!form.salePrice || isNaN(form.salePrice) || parseFloat(form.salePrice) <= 0) return 'Valid sale price is required';
    if (!form.salary || isNaN(form.salary) || parseFloat(form.salary) <= 0) return 'Valid salary is required';
    if (!form.startDate) return 'Start date is required';
    if (!form.endDate) return 'End date is required';
    if (form.startDate >= form.endDate) return 'End date must be after start date';
    if (!form.driver) return 'Driver selection is required';
    if (!form.vehicle) return 'Vehicle selection is required';
    if (!form.startLat || !form.startLon) return 'Start location is required';
    if (!form.endLat || !form.endLon) return 'End location is required';
    return null;
  }

  async function handleSubmit() {
  const validationError = validateForm();
  if (validationError) {
    Alert.alert('Validation Error', validationError);
    return;
  }

  setSubmitting(true);

  const payload = {
    itemName: form.itemName.trim(),
    startDate: form.startDate.toISOString(),
    endDate: form.endDate.toISOString(),
    quantity: parseInt(form.quantity),
    costPrice: parseFloat(form.costPrice),
    salePrice: parseFloat(form.salePrice),
    driver: form.driver,
    vehicle: form.vehicle,
    salary: parseFloat(form.salary),
    startLocation: {
      latitude: parseFloat(form.startLat),
      longitude: parseFloat(form.startLon)
    },
    endLocation: {
      latitude: parseFloat(form.endLat),
      longitude: parseFloat(form.endLon)
    }
  };

  try {
    const id = await AsyncStorage.getItem('userId'); // vendorId
    await axios.post(`http://${IPADD}:5000/api/vendor/export/add/${id}`, payload);
    Alert.alert('Success', 'Export added successfully');
    resetForm();
    setShowForm(false);
    fetchExports(id);
  } catch (e) {
    console.error(e);
    const errorMessage = e.response?.data?.error || 'Submission failed';
    Alert.alert('Error', errorMessage);
  } finally {
    setSubmitting(false);
  }
}

  function resetForm() {
    setForm({
      itemName:'', quantity:'', costPrice:'', salePrice:'', salary:'',
      startDate: null, endDate: null,
      driver:'', vehicle:'',
      startLat:'', startLon:'', endLat:'', endLon:''
    });
    setDrivers([]);
    setVehicles([]);
  }

  function handleCancel() {
    resetForm();
    setShowForm(false);
  }

  if(loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {exportsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exports found</Text>
          </View>
        ) : (
          exportsList.map(item => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.title}>📦 {item.itemName}</Text>
              <Text>Start: {new Date(item.startDate).toLocaleDateString()}</Text>
              <Text>End: {new Date(item.endDate).toLocaleDateString()}</Text>
              <Text>Qty: {item.quantity}</Text>
              <Text>Status: {item.status}</Text>
              {item.driver && <Text>Driver: {item.driver.name}</Text>}
              {item.vehicle && <Text>Vehicle: {item.vehicle.vehicleNumber} ({item.vehicle.model})</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide">
        <ScrollView style={styles.form}>
          <Text style={styles.heading}>New Export</Text>
          
          <TextInput 
            placeholder="Item Name" 
            style={styles.input}
            value={form.itemName}
            onChangeText={v=>setForm(f=>({...f,itemName:v}))} 
          />
          
          <TextInput 
            placeholder="Quantity" 
            style={styles.input} 
            keyboardType="numeric"
            value={form.quantity}
            onChangeText={v=>setForm(f=>({...f,quantity:v}))} 
          />

          <TouchableOpacity 
            style={[styles.input, styles.dateInput]} 
            onPress={()=>setDatePicker({show:true,target:'start'})}
          >
            <Text style={form.startDate ? styles.dateText : styles.placeholderText}>
              {form.startDate ? form.startDate.toDateString() : 'Select Start Date'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.input, styles.dateInput]} 
            onPress={()=>setDatePicker({show:true,target:'end'})}
          >
            <Text style={form.endDate ? styles.dateText : styles.placeholderText}>
              {form.endDate ? form.endDate.toDateString() : 'Select End Date'}
            </Text>
          </TouchableOpacity>

          <TextInput 
            placeholder="Cost Price" 
            style={styles.input} 
            keyboardType="numeric"
            value={form.costPrice}
            onChangeText={v=>setForm(f=>({...f,costPrice:v}))}
          />
          
          <TextInput 
            placeholder="Sale Price" 
            style={styles.input} 
            keyboardType="numeric"
            value={form.salePrice}
            onChangeText={v=>setForm(f=>({...f,salePrice:v}))}
          />
          
          <TextInput 
            placeholder="Driver Salary" 
            style={styles.input} 
            keyboardType="numeric"
            value={form.salary}
            onChangeText={v=>setForm(f=>({...f,salary:v}))}
          />

          {drivers.length > 0 && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Driver:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.driver}
                  onValueChange={(value) => setForm(f => ({ ...f, driver: value }))}>
                  <Picker.Item label="Select Driver" value="" />
                  {drivers.map(d => (
                    <Picker.Item key={d._id} label={d.name} value={d._id} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {vehicles.length > 0 && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Vehicle:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.vehicle}
                  onValueChange={(value) => setForm(f => ({ ...f, vehicle: value }))}>
                  <Picker.Item label="Select Vehicle" value="" />
                  {vehicles.map(v => (
                    <Picker.Item key={v._id} label={`${v.vehicleNumber} (${v.model})`} value={v._id} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <Text style={styles.label}>Start Location:</Text>
          <TouchableOpacity 
            style={styles.mapBtn}
            onPress={()=>setMapModal({show:true,field:'start'})}
          >
            <Text style={form.startLat ? styles.locationText : styles.placeholderText}>
              {form.startLat ? `${parseFloat(form.startLat).toFixed(4)}, ${parseFloat(form.startLon).toFixed(4)}` : 'Pick on map'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>End Location:</Text>
          <TouchableOpacity 
            style={styles.mapBtn}
            onPress={()=>setMapModal({show:true,field:'end'})}
          >
            <Text style={form.endLat ? styles.locationText : styles.placeholderText}>
              {form.endLat ? `${parseFloat(form.endLat).toFixed(4)}, ${parseFloat(form.endLon).toFixed(4)}` : 'Pick on map'}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton, submitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <DateTimePickerModal
        isVisible={datePicker.show}
        mode="date"
        minimumDate={new Date()}
        onConfirm={date => {
          setDatePicker({ show:false, target:null });
          setForm(f=>({
            ...f,
            [datePicker.target==='start'?'startDate':'endDate']: date
          }));
        }}
        onCancel={()=>setDatePicker({ show:false, target:null })}
      />

      <Modal visible={mapModal.show}>
        <View style={{flex:1}}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              Select {mapModal.field === 'start' ? 'Start' : 'End'} Location
            </Text>
            <TouchableOpacity 
              style={styles.mapCancelButton}
              onPress={()=>setMapModal({ show:false })}
            >
              <Text style={styles.mapCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: MAP_HTML }}
            onMessage={e=>{
              try {
                const { lat, lng } = JSON.parse(e.nativeEvent.data);
                const field = mapModal.field;
                setForm(f=>({
                  ...f,
                  [`${field}Lat`]: lat.toString(),
                  [`${field}Lon`]: lng.toString()
                }));
                setMapModal({ show:false, field:null });
              } catch (error) {
                console.error('Error parsing map data:', error);
              }
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex:1, backgroundColor: '#f5f5f5' },
  container: { padding: 16, paddingBottom: 80 },
  center: { flex:1, justifyContent:'center', alignItems:'center' },
  card: { 
    backgroundColor:'#fff',
    padding:16,
    marginVertical:8,
    borderRadius:8,
    elevation:2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: { fontSize:16, fontWeight:'bold', marginBottom: 8 },
  fab: { 
    position:'absolute', 
    bottom:20, 
    right:20, 
    backgroundColor:'#007AFF',
    width:60,
    height:60,
    borderRadius:30,
    justifyContent:'center',
    alignItems:'center', 
    elevation:5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize:30, color:'#fff' },
  form: { padding:16, backgroundColor: '#fff' },
  heading:{ fontSize:20, fontWeight:'bold', marginBottom:20, textAlign: 'center' },
  input:{ 
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:8,
    padding:12,
    marginBottom:12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#000',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  mapBtn:{ 
    borderWidth:1, 
    borderColor:'#ddd', 
    borderRadius:8, 
    padding:12, 
    marginBottom:16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  locationText: {
    color: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#666',
  },
  mapCancelButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapCancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
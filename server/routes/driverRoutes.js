const express = require('express');
const router = express.Router();
const axios = require('axios');
const Vendor = require('../models/vendorModel');
const Driver = require('../models/driverModel');
const Vehicle = require('../models/VehicleModel');
const Device = require('../models/deviceModel');
const Export = require('../models/ExportModel');

router.get('/export/driver/:driverId', async (req, res) => {
    try {
        const exports = await Export.find({ driver: req.params.driverId })
            .populate('vendorId', 'name mobileNo'); // ✅ populate from vendorId

        res.json(exports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch exports' });
    }
});


// backend route

async function reverseGeocode(lat, lon, apiKey) {
  try {
    // Try ORS reverse geocoding first
    const orsRes = await axios.get('https://api.openrouteservice.org/geocode/reverse', {
      params: {
        api_key: apiKey,
        point: `${lon},${lat}`,
        size: 1,
      },
    });

    const locality =
      orsRes.data.features[0]?.properties?.locality ||
      orsRes.data.features[0]?.properties?.county ||
      orsRes.data.features[0]?.properties?.region;

    if (locality) return locality;
  } catch {
    // Ignore ORS failure
  }

  try {
    // Fallback: Try Nominatim reverse geocoding
    const nominatimRes = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'json',
        lat,
        lon,
        zoom: 10,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'FreshGoods/1.0 (tharunkumarm.23cse@kongu.edu)',
      },
    });

    const address = nominatimRes.data.address;
    return address?.county || address?.state || address?.region || address?.city;
  } catch {
    console.warn('Both ORS and Nominatim failed at', lat, lon);
    return null;
  }
}

async function getDistrictsBetween(start, end) {
  const apiKey = '5b3ce3597851110001cf62483bea92698c8542d186907fabf996b9cd';

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
  const coordinates = [[start.longitude, start.latitude], [end.longitude, end.latitude]];

  try {
    const res = await axios.post(
      url,
      { coordinates },
      {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const steps = res.data.features[0].geometry.coordinates;
    const names = [];

    for (const [lon, lat] of steps.filter((_, i) => i % 10 === 0)) { //if it i%5 more accurate but more timme and api 
      const name = await reverseGeocode(lat, lon, apiKey);
      if (name && !names.includes(name)) names.push(name);
    }

    return names;
  } catch (err) {
    console.error('ORS route error:', err.message);
    return [];
  }
}

router.put('/export/start/:id', async (req, res) => {
    console.log('Starting export with ID:', req.params.id);
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    const routes = await getDistrictsBetween(exp.startLocation, exp.endLocation);

    const updated = await Export.findByIdAndUpdate(
      req.params.id,
      { status: 'Started', routes },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Start export error:', err);
    res.status(500).json({ error: 'Failed to update export status' });
  }
});


// GET /api/device/sensor-data/:exportId
router.get('/device/sensor-data/:exportId', async (req, res) => {
  console.log('Fetching sensor data for export ID:', req.params.exportId);
  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    const vehicle = await Vehicle.findById(exp.vehicle);
    if (!vehicle || !vehicle.deviceId)
      return res.status(404).json({ error: 'Associated vehicle or device not found' });

    const device = await Device.findOne({deviceName : vehicle.deviceId});
    if (!device) return res.status(404).json({ error: 'Device not found' });

    return res.json(device.deviceData); // ✅ Only sensor data
  } catch (err) {
    console.error('Sensor data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});



//Driver Route Map endpoints 

//Live Location Data
// GET /api/device/location-data/:exportId
router.get('/device/location-data/:exportId', async (req, res) => {
  console.log('Fetching location data for export ID:', req.params.exportId);

  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    const vehicle = await Vehicle.findById(exp.vehicle);
    if (!vehicle || !vehicle.deviceId)
      return res.status(404).json({ error: 'Associated vehicle or device not found' });

    const device = await Device.findOne({ deviceName: vehicle.deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    return res.json(device.deviceLocation); // ✅ Only location data
  } catch (err) {
    console.error('Location data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

// routes/export.js
router.get('/map/export/:id', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
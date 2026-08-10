const express = require('express');
const router = express.Router();
const axios = require('axios');
const Vendor = require('../models/vendorModel');
const Driver = require('../models/driverModel');
const Vehicle = require('../models/VehicleModel');
const Device = require('../models/deviceModel');
const Export = require('../models/shipmentModel');
const { STATUSES, assertTransition } = require('../utils/shipmentStateMachine');
const logShipmentEvent = require('../utils/logShipmentEvent');
const { createNotification } = require('../services/notificationService');
const notifyEligibleCustomers = require('../utils/notifyEligibleCustomers');

router.get('/export/driver/:driverId', async (req, res) => {
  try {
    if (req.params.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your account.' });
    }
    const exports = await Export.find({ driver: req.params.driverId })
      .populate('vendorId', 'name mobileNo')
      .populate('customer', 'name'); // driver-facing job list — see DriverAssignedExports.js

    res.json(exports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

// Get driver profile
router.get('/profile/:driverId', async (req, res) => {
  try {
    if (req.params.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your account.' });
    }
    const driver = await Driver.findById(req.params.driverId).select('-password');
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error('Error fetching driver profile:', err);
    res.status(500).json({ error: 'Failed to fetch driver profile' });
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

// Driver-initiated start. Previously this endpoint had no check that the
// driver had actually accepted the job first (a real gap — a driver could
// start a shipment they'd never accepted); it now goes through the same
// ACCEPTED -> IN_TRANSIT transition as the vendor-initiated start endpoint.
router.put('/export/start/:id', async (req, res) => {
  console.log('Starting export with ID:', req.params.id);
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

    try {
      assertTransition(exp.status, STATUSES.IN_TRANSIT);
    } catch (transitionError) {
      return res.status(400).json({ error: transitionError.message });
    }

    const routes = await getDistrictsBetween(exp.startLocation, exp.endLocation);

    const updated = await Export.findByIdAndUpdate(
      req.params.id,
      { status: STATUSES.IN_TRANSIT, routes },
      { new: true }
    );

    await logShipmentEvent(exp._id, 'DELIVERY_STARTED', req.user.id, 'Driver');
    const vendorForStartPush = await Vendor.findById(exp.vendorId).select('expoPushToken');
    await createNotification({
      recipientId: exp.vendorId,
      recipientModel: 'Vendor',
      type: 'SHIPMENT_STATUS_CHANGED',
      title: 'Delivery started',
      message: `Your driver started the delivery for ${exp.itemName}.`,
      relatedEntityType: 'Shipment',
      relatedEntityId: exp._id,
      recipientPushToken: vendorForStartPush?.expoPushToken,
    });
    await notifyEligibleCustomers(exp, {
      type: 'SHIPMENT_STATUS_CHANGED',
      title: 'Your delivery is on the way',
      message: `${exp.itemName} is now in transit.`,
    });

    res.json(updated);
  } catch (err) {
    console.error('Start export error:', err);
    res.status(500).json({ error: 'Failed to update export status' });
  }
});

// Accept an export assignment
router.put('/export/accept/:id', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

    try {
      assertTransition(exp.status, STATUSES.ACCEPTED);
    } catch (transitionError) {
      return res.status(400).json({ error: transitionError.message });
    }

    const updated = await Export.findByIdAndUpdate(
      req.params.id,
      { status: STATUSES.ACCEPTED },
      { new: true }
    ).populate('vendorId', 'name mobileNo');

    await logShipmentEvent(exp._id, 'DRIVER_ACCEPTED', req.user.id, 'Driver');
    const vendorForPush = await Vendor.findById(exp.vendorId).select('expoPushToken');
    await createNotification({
      recipientId: exp.vendorId,
      recipientModel: 'Vendor',
      type: 'JOB_ACCEPTED',
      title: 'Shipment accepted',
      message: `Your driver accepted the shipment for ${exp.itemName}.`,
      relatedEntityType: 'Shipment',
      relatedEntityId: exp._id,
      recipientPushToken: vendorForPush?.expoPushToken,
    });

    res.json({ success: true, message: 'Export accepted', export: updated });
  } catch (err) {
    console.error('Accept export error:', err);
    res.status(500).json({ error: 'Failed to accept export' });
  }
});

// Reject an export assignment
router.put('/export/reject/:id', async (req, res) => {
  try {
    const { reason } = req.body;

    // A reason is mandatory (Stage 5 §3), not merely encouraged — a driver
    // must explain why a job is being unassigned so the vendor can act on
    // it (reassign, investigate a recurring issue, etc).
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A rejection reason is required.' });
    }

    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

    try {
      assertTransition(exp.status, STATUSES.REJECTED);
    } catch (transitionError) {
      return res.status(400).json({ error: transitionError.message });
    }

    const rejectingDriverId = req.user.id;

    const updated = await Export.findByIdAndUpdate(
      req.params.id,
      {
        status: STATUSES.REJECTED,
        rejectionReason: reason.trim(),
        driver: null  // Unassign driver so vendor can reassign
      },
      { new: true }
    );

    await logShipmentEvent(exp._id, 'DRIVER_REJECTED', rejectingDriverId, 'Driver', { reason: reason.trim() });
    await createNotification({
      recipientId: exp.vendorId,
      recipientModel: 'Vendor',
      type: 'JOB_REJECTED',
      title: 'Shipment rejected',
      message: `Your driver rejected the shipment for ${exp.itemName}.`,
      relatedEntityType: 'Shipment',
      relatedEntityId: exp._id,
    });

    res.json({ success: true, message: 'Export rejected', export: updated });
  } catch (err) {
    console.error('Reject export error:', err);
    res.status(500).json({ error: 'Failed to reject export' });
  }
});

// Complete an export
router.put('/export/complete/:id', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

    try {
      assertTransition(exp.status, STATUSES.COMPLETED);
    } catch (transitionError) {
      return res.status(400).json({ error: transitionError.message });
    }

    const updated = await Export.findByIdAndUpdate(
      req.params.id,
      { status: STATUSES.COMPLETED },
      { new: true }
    ).populate('vendorId', 'name mobileNo');

    await logShipmentEvent(exp._id, 'DELIVERY_COMPLETED', req.user.id, 'Driver');
    const vendorForCompletePush = await Vendor.findById(exp.vendorId).select('expoPushToken');
    await createNotification({
      recipientId: exp.vendorId,
      recipientModel: 'Vendor',
      type: 'SHIPMENT_STATUS_CHANGED',
      title: 'Delivery completed',
      message: `Your driver completed the delivery for ${exp.itemName}.`,
      relatedEntityType: 'Shipment',
      relatedEntityId: exp._id,
      recipientPushToken: vendorForCompletePush?.expoPushToken,
    });
    await notifyEligibleCustomers(exp, {
      type: 'SHIPMENT_STATUS_CHANGED',
      title: 'Delivery completed',
      message: `${exp.itemName} has been delivered.`,
    });

    res.json({ success: true, message: 'Export completed', export: updated });
  } catch (err) {
    console.error('Complete export error:', err);
    res.status(500).json({ error: 'Failed to complete export' });
  }
});

// GET /api/device/sensor-data/:exportId - with date filtering
router.get('/device/sensor-data/:exportId', async (req, res) => {
  console.log('Fetching sensor data for export ID:', req.params.exportId);
  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

    const vehicle = await Vehicle.findById(exp.vehicle);
    if (!vehicle || !vehicle.deviceId)
      return res.status(404).json({ error: 'Associated vehicle or device not found' });

    const device = await Device.findOne({ deviceName: vehicle.deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    let sensorData = device.deviceData || [];

    // Filter by date if provided
    const { date, startDate, endDate } = req.query;

    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      sensorData = sensorData.filter(d => {
        const timestamp = new Date(d.timestamp);
        return timestamp >= targetDate && timestamp < nextDate;
      });
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      sensorData = sensorData.filter(d => {
        const timestamp = new Date(d.timestamp);
        return timestamp >= start && timestamp <= end;
      });
    }

    return res.json(sensorData);
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
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }

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
    if (!exp.driver || exp.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Not your assigned export.' });
    }
    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
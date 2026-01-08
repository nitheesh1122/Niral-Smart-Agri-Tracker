const express = require('express');
const router = express.Router();
const Vendor = require('../models/vendorModel');
const Driver = require('../models/driverModel');
const Vehicle = require('../models/VehicleModel');
const Device = require('../models/deviceModel');
const Export = require('../models/ExportModel');

// Driver Management Routes For Vendor
// GET /api/vendor/all — Get all drivers for the vendor
router.get('/all', async (req, res) => {
  try {
    const vendorId = req.query.vendorId;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const vendor = await Vendor.findById(vendorId).populate('drivers');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor.drivers);
  } catch (err) {
    console.error('Error fetching vendor drivers:', err);
    res.status(500).json({ error: 'Failed to fetch drivers for vendor' });
  }
});

// Fetch all drivers (for selection)
router.get('/available-drivers', async (req, res) => {
  try {
    const drivers = await Driver.find({});
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Add a driver to vendor
router.post('/add-driver', async (req, res) => {
  const { vendorId, driverId } = req.body;

  if (!vendorId || !driverId) {
    return res.status(400).json({ error: 'Missing vendorId or driverId' });
  }

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    if (vendor.drivers.includes(driverId)) {
      return res.status(409).json({ error: 'Driver already assigned' });
    }

    vendor.drivers.push(driverId);
    await vendor.save();
    res.json({ success: true, message: 'Driver added to vendor' });
  } catch (err) {
    console.error('Add Driver Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/remove-driver', async (req, res) => {
  const { vendorId, driverId } = req.body;

  if (!vendorId || !driverId) {
    return res.status(400).json({ error: 'Missing vendorId or driverId' });
  }

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    vendor.drivers = vendor.drivers.filter(id => id.toString() !== driverId);
    await vendor.save();
    res.json({ success: true, message: 'Driver removed from vendor' });
  } catch (err) {
    console.error('Remove Driver Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//Vehicle Management Routes For Vendor


// ✅ Get all vehicles assigned to a vendor
router.get('/vehicles', async (req, res) => {
  const { vendorId } = req.query;

  try {
    const vendor = await Vendor.findById(vendorId).populate('vehicles');
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    res.json(vendor.vehicles || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching vehicles', error: err.message });
  }
});

// ✅ Get all available devices (not yet assigned)
router.get('/available-devices', async (req, res) => {
  try {
    const devices = await Device.find({ isAssigned: false });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching devices', error: err.message });
  }
});

// ✅ Add a vehicle and assign to vendor
router.post('/add-vehicle', async (req, res) => {
  const { _id, vehicleNumber, brand, capacity, deviceId, vendorId } = req.body;

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    // Ensure device is available
    const device = await Device.findOne({ deviceName: deviceId, isAssigned: false });
    if (!device) return res.status(400).json({ message: 'Device is already assigned or not found' });

    // Create vehicle
    const vehicle = new Vehicle({ _id, vehicleNumber, brand, capacity, deviceId });
    await vehicle.save();

    // Update vendor and device
    vendor.vehicles.push(vehicle._id);
    await vendor.save();

    device.isAssigned = true;
    await device.save();

    res.status(201).json({ message: 'Vehicle added and assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding vehicle', error: err.message });
  }
});

// Export Management for the vendor



// Assuming your models are imported
// const Driver = require('../models/Driver');
// const Vehicle = require('../models/Vehicle');
// const Export = require('../models/Export');

// GET /api/vendor/exports - Get all exports for a vendor
router.get('/exports', async (req, res) => {
  try {
    const { vendorId } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const exports = await Export.find({ vendorId })
      .populate('driver', 'name')
      .populate('vehicle', 'vehicleNumber model')
      .sort({ createdAt: -1 });

    res.json(exports);
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

router.get('/availableResources', async (req, res) => {
  try {
    const { vendorId, startDate, endDate } = req.query;

    if (!vendorId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vendor ID, start date, and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch vendor with list of drivers and vehicles
    const vendor = await Vendor.findById(vendorId).select('drivers vehicles');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get overlapping exports (those that clash with given date range)
    const overlappingExports = await Export.find({
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    // Extract busy drivers and vehicles
    const busyDriverIds = overlappingExports.map(exp => exp.driver?.toString());
    const busyVehicleIds = overlappingExports.map(exp => exp.vehicle?.toString());

    // Filter vendor's drivers who are NOT busy
    const availableDrivers = await Driver.find({
      _id: { $in: vendor.drivers, $nin: busyDriverIds }
    }).select('name _id');

    // Filter vendor's vehicles that are NOT busy
    const availableVehicles = await Vehicle.find({
      _id: { $in: vendor.vehicles, $nin: busyVehicleIds }
    }).select('vehicleNumber model _id');

    res.json({
      drivers: availableDrivers,
      vehicles: availableVehicles
    });
  } catch (error) {
    console.error('Error fetching available resources:', error);
    res.status(500).json({ error: 'Failed to fetch available resources' });
  }
});


router.post('/export/add/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      itemName, startDate, endDate, quantity, costPrice, salePrice,
      driver, vehicle, salary, startLocation, endLocation
    } = req.body;

    if (!itemName || !startDate || !endDate || !quantity || !costPrice ||
      !salePrice || !driver || !vehicle || !salary || !startLocation || !endLocation) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflict = await Export.find({
      $and: [
        { startDate: { $lte: end } },
        { endDate: { $gte: start } },
        { $or: [{ driver }, { vehicle }] }
      ]
    });

    if (conflict.length > 0) {
      return res.status(400).json({ error: 'Driver or vehicle is not available for selected dates' });
    }
    console.log(vendorId, "This is the vendor id at vendor routes line 248")
    const newExport = new Export({
      vendorId,
      itemName,
      startDate: start,
      endDate: end,
      quantity,
      costPrice,
      salePrice,
      driver,
      vehicle,
      startLocation,
      endLocation
    });

    await newExport.save();

    const dates = [];
    let curr = new Date(start);
    while (curr <= end) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    await Driver.findByIdAndUpdate(driver, {
      $push: {
        work: {
          vendorId,
          workDuration: [{ startDate: start, endDate: end }],
          salary,
          isPaid: false
        },
        workDates: { $each: dates }
      }
    });

    res.status(201).json({ message: 'Export created successfully', export: newExport });
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// GET /api/vendor/export/:id - Get single export details
router.get('/export/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const exportData = await Export.findById(id)
      .populate('driver', 'name email mobileNo')
      .populate('vehicle', 'vehicleNumber model brand capacity');

    if (!exportData) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json(exportData);
  } catch (error) {
    console.error('Error fetching export:', error);
    res.status(500).json({ error: 'Failed to fetch export' });
  }
});

// PUT /api/vendor/export/:id - Update export status
router.put('/export/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'Started', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const updatedExport = await Export.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('driver', 'name').populate('vehicle', 'vehicleNumber model');

    if (!updatedExport) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json({ message: 'Export updated successfully', export: updatedExport });
  } catch (error) {
    console.error('Error updating export:', error);
    res.status(500).json({ error: 'Failed to update export' });
  }
});

router.delete('/export/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const exportData = await Export.findById(id);

    if (!exportData) {
      return res.status(404).json({ error: 'Export not found' });
    }

    if (exportData.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot delete export that is not pending' });
    }

    // Remove work record from driver
    await Driver.findByIdAndUpdate(exportData.driver, {
      $pull: {
        work: { vendorId: exportData.vendorId },
        workDates: {
          $gte: exportData.startDate,
          $lte: exportData.endDate
        }
      }
    });

    await Export.findByIdAndDelete(id);

    res.json({ message: 'Export deleted successfully' });
  } catch (error) {
    console.error('Error deleting export:', error);
    res.status(500).json({ error: 'Failed to delete export' });
  }
});

// vendor Home placeholder

router.get('/export/passedstatus/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    const startedExports = await Export.find({
      vendorId: vendorId,
      status: 'Started'
    })
      .populate('driver', 'name mobileNo')
      .populate('vehicle')
      .populate('vendorId', 'name mobileNo');

    res.status(200).json(startedExports);
  } catch (error) {
    console.error('Error fetching started exports by vendor:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// get sensor data for export with optional date filtering
router.get('/device/sensor-data/:exportId', async (req, res) => {
  console.log('Fetching sensor data for export ID:', req.params.exportId);
  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    const vehicle = await Vehicle.findById(exp.vehicle);
    if (!vehicle || !vehicle.deviceId)
      return res.status(404).json({ error: 'Associated vehicle or device not found' });

    const device = await Device.findOne({ deviceName: vehicle.deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    let sensorData = device.deviceData || [];

    // Filter by date if provided
    const { date, startDate, endDate } = req.query;

    if (date) {
      // Filter for specific date (YYYY-MM-DD format)
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      sensorData = sensorData.filter(d => {
        const timestamp = new Date(d.timestamp);
        return timestamp >= targetDate && timestamp < nextDate;
      });
    } else if (startDate && endDate) {
      // Filter for date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date

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


// Live Location Data
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


// Push intermediate location
router.post('/export/intermediateLocation/push/:export_id', async (req, res) => {
  const { export_id } = req.params;
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  try {
    const updatedExport = await Export.findByIdAndUpdate(
      export_id,
      {
        $push: {
          intermediateLocations: { latitude, longitude }
        }
      },
      { new: true } // return the updated document
    );

    if (!updatedExport) {
      return res.status(404).json({ error: 'Export not found' });
    }

    return res.status(200).json({
      message: 'Intermediate location added successfully',
      updatedExport
    });
  } catch (error) {
    console.error('Error pushing intermediate location:', error);
    res.status(500).json({ error: 'Failed to update intermediate location' });
  }
});

// GET intermediate locations for an export
router.get('/export/intermediateLocation/get/:exportId', async (req, res) => {
  const { exportId } = req.params;

  try {
    const exp = await Export.findById(exportId);

    if (!exp) {
      return res.status(404).json({ error: 'Export not found' });
    }

    return res.json(exp.intermediateLocations);
  } catch (err) {
    console.error('Error fetching intermediate locations:', err);
    return res.status(500).json({ error: 'Server error while fetching intermediate locations' });
  }
});

// GET all exports for a vendor (with driver info)
router.get('/exports/:vendorId', async (req, res) => {
  try {
    const exports = await Export.find({ vendorId: req.params.vendorId })
      .populate('driver', 'name mobileNo')
      .populate('vehicle', 'vehicleNumber')
      .sort({ createdAt: -1 });
    res.json(exports);
  } catch (err) {
    console.error('Error fetching vendor exports:', err);
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

// Vendor starts an export (after driver accepts)
router.put('/export/start/:exportId', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    if (exp.driverResponse !== 'accepted') {
      return res.status(400).json({ error: 'Driver must accept the export first' });
    }

    if (exp.status !== 'Pending') {
      return res.status(400).json({ error: 'Export already started or completed' });
    }

    const updated = await Export.findByIdAndUpdate(
      req.params.exportId,
      { status: 'Started' },
      { new: true }
    ).populate('driver', 'name mobileNo');

    res.json({ success: true, message: 'Export started', export: updated });
  } catch (err) {
    console.error('Vendor start export error:', err);
    res.status(500).json({ error: 'Failed to start export' });
  }
});

// Vendor completes an export
router.put('/export/complete/:exportId', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.exportId);
    if (!exp) return res.status(404).json({ error: 'Export not found' });

    if (exp.status !== 'Started') {
      return res.status(400).json({ error: 'Export must be started before completing' });
    }

    const updated = await Export.findByIdAndUpdate(
      req.params.exportId,
      { status: 'Completed' },
      { new: true }
    ).populate('driver', 'name mobileNo');

    res.json({ success: true, message: 'Export completed', export: updated });
  } catch (err) {
    console.error('Vendor complete export error:', err);
    res.status(500).json({ error: 'Failed to complete export' });
  }
});

module.exports = router;

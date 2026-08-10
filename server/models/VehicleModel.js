// models/Vehicle.js
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
    unique: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Back-reference to the owning vendor. Vendor.vehicles already tracks the
  // forward direction; this lets a Vehicle be looked up without going
  // through its vendor first, and lets validation confirm the two agree.
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },

  // Direct ObjectId link to the Device, resolved at creation time from
  // deviceId (which stays authoritative for the external IoT writer that
  // matches on Device.deviceName — this field is a convenience, not a
  // replacement).
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', default: null },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {timestamps: true,
   collection: 'Vehicle' });

vehicleSchema.index({ vendor: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;

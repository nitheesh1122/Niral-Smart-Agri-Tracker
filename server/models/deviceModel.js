const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const sensorDataSchema = new mongoose.Schema({
  humidity: { type: Number, required: true },
  temperature: { type: Number, required: true },
  ethyleneLevel: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const deviceSchema = new mongoose.Schema({
  deviceName: { type: String, required: true, unique: true },

  deviceLocation: {
    type: [locationSchema],
    default: []
  },

  deviceData: {
    type: [sensorDataSchema],
    default: []
  },

  // ✅ New field: isAssigned (boolean)
  isAssigned: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  collection: 'Device'
});

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;

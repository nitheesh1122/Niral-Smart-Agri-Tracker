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
  }
}, {timestamps: true,
   collection: 'Vehicle' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;

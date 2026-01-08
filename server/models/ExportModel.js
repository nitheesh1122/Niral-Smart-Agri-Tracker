const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { _id: false });

const exportSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  itemName: { type: String, required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  quantity: { type: Number, required: true },

  // References
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicle: { type: Number, ref: 'Vehicle', required: true }, // since _id is Number in Vehicle model

  // Locations
  startLocation: {
    type: locationSchema,
    required: true,
  },
  endLocation: {
    type: locationSchema,
    required: true,
  },
  intermediateLocations: {
    type: [locationSchema],
    default: [],
  },

  routes: {
    type: [String],
    default: [],
  },

  status: {
    type: String,
    enum: ['Pending', 'Started', 'Completed'],
    default: 'Pending',
  },

  // Driver's response to the assignment
  driverResponse: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },

  // Rejection reason (if rejected)
  rejectionReason: {
    type: String,
    default: null,
  },

  costPrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },

}, {
  timestamps: true,
  collection: 'Export'
});

// Database indexes for faster queries
exportSchema.index({ vendorId: 1, status: 1 });
exportSchema.index({ startDate: 1, endDate: 1 });
exportSchema.index({ driver: 1 });
exportSchema.index({ vehicle: 1 });

const Export = mongoose.model('Export', exportSchema);
module.exports = Export;

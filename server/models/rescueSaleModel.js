const mongoose = require('mongoose');

/**
 * Data foundation only — Stage 4 does not implement Rescue Center
 * functionality (nearby buyer search, notifications, customer response).
 * No route currently reads or writes this model.
 */
const rescueSaleSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  itemName: { type: String, required: true },

  availableQuantity: { type: Number, required: true, min: 0 },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'ton', 'liter', 'ml', 'piece', 'box', 'crate', 'dozen'],
  },
  price: { type: Number, required: true, min: 0 },

  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },

  // Default belongs here, not on Shipment — Stage 4 does not implement the
  // nearby-buyer query that would use it.
  searchRadiusKm: { type: Number, default: 30, min: 0 },

  validUntil: { type: Date, required: true },

  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'SOLD', 'CANCELLED'],
    default: 'ACTIVE',
  },
}, {
  timestamps: true,
  collection: 'RescueSale',
});

rescueSaleSchema.index({ pickupLocation: '2dsphere' });
rescueSaleSchema.index({ vendor: 1, status: 1 });
rescueSaleSchema.index({ shipment: 1 });

const RescueSale = mongoose.model('RescueSale', rescueSaleSchema);
module.exports = RescueSale;

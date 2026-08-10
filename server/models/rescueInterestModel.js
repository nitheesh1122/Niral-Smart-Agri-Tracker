const mongoose = require('mongoose');

/**
 * Data foundation only — no route reads or writes this model in Stage 4.
 */
const rescueInterestSchema = new mongoose.Schema({
  rescueSale: { type: mongoose.Schema.Types.ObjectId, ref: 'RescueSale', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  response: {
    type: String,
    required: true,
    enum: ['INTERESTED', 'NOT_INTERESTED'],
  },

  // Only meaningful when response is INTERESTED.
  requestedQuantity: { type: Number, default: null, min: 0 },
}, {
  timestamps: true,
  collection: 'RescueInterest',
});

rescueInterestSchema.index({ rescueSale: 1, customer: 1 }, { unique: true });

const RescueInterest = mongoose.model('RescueInterest', rescueInterestSchema);
module.exports = RescueInterest;
